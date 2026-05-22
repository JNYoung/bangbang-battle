import {
  ARENA_SIZE,
  ATTACK_COOLDOWN_MULTIPLIER,
  BALL_RADIUS_MULTIPLIER,
  ProfessionConfig,
  getAttackAnimationConfig,
  getSpeedMultiplier,
} from "../game-config.js";

const TARGET_MIN_SECONDS = 18;
const TARGET_MAX_SECONDS = 60;
const SIMULATION_LIMIT_SECONDS = 75;
const STEP_SECONDS = 1 / 60;

class SimulatedBall {
  constructor({ profession, x, y, direction }) {
    this.profession = profession;
    this.config = ProfessionConfig[profession];
    this.position = { x, y };
    this.velocity = scale(normalize(direction), this.config.moveSpeed);
    this.radius = this.config.radius * BALL_RADIUS_MULTIPLIER;
    this.hp = this.config.maxHp;
    this.attackCooldown = this.config.attackCooldown * ATTACK_COOLDOWN_MULTIPLIER;
    this.weaponRange = this.config.weaponRange;
    this.lastAttackTime = -Infinity;
    this.attackState = null;
    this.chainWeaponState = createChainWeaponState(this);
  }

  update(deltaTime, elapsedSeconds) {
    this.velocity = scale(normalize(this.velocity), getCurrentMoveSpeed(this, elapsedSeconds));
    this.position.x += this.velocity.x * deltaTime;
    this.position.y += this.velocity.y * deltaTime;
    this.bounceOffWalls();
  }

  bounceOffWalls() {
    if (this.position.x - this.radius < 0) {
      this.position.x = this.radius;
      this.velocity.x = Math.abs(this.velocity.x);
    } else if (this.position.x + this.radius > ARENA_SIZE) {
      this.position.x = ARENA_SIZE - this.radius;
      this.velocity.x = -Math.abs(this.velocity.x);
    }

    if (this.position.y - this.radius < 0) {
      this.position.y = this.radius;
      this.velocity.y = Math.abs(this.velocity.y);
    } else if (this.position.y + this.radius > ARENA_SIZE) {
      this.position.y = ARENA_SIZE - this.radius;
      this.velocity.y = -Math.abs(this.velocity.y);
    }
  }

  canAttack(currentTime) {
    return this.hp > 0 && !this.attackState && currentTime - this.lastAttackTime >= this.attackCooldown;
  }

  startAttack(defender, currentTime) {
    if (!this.canAttack(currentTime) || defender.hp <= 0) {
      return;
    }

    const attackConfig = getAttackAnimationConfig(this.profession);
    this.attackState = {
      defender,
      startTime: currentTime,
      duration: attackConfig.duration,
      hitFrame: attackConfig.hitFrame,
      direction: getAttackDirection(this, defender),
      variant: this.config.getAttackVariant?.(this, defender, currentTime) || null,
      didDealDamage: false,
    };
    this.lastAttackTime = currentTime;
  }

  dealAttackDamageTo(defender, normalFromAttackerToDefender) {
    if (this.hp <= 0 || defender.hp <= 0) {
      return 0;
    }

    const damage = this.config.getDamage(this, defender, normalFromAttackerToDefender);
    defender.hp = Math.max(0, defender.hp - damage);
    return damage;
  }
}

const results = [];
const professions = Object.keys(ProfessionConfig);

for (const aProfession of professions) {
  for (const bProfession of professions) {
    results.push(simulateMatch(aProfession, bProfession));
  }
}

printResults(results);

const failures = results.filter((result) => !isWithinCurve(result));

if (failures.length > 0) {
  process.exitCode = 1;
}

function createChainWeaponState(ball) {
  if (ball.config.attackMode !== "chainSpin") {
    return null;
  }

  return {
    rotationAngle: ball.position.x < ARENA_SIZE / 2 ? -0.42 : Math.PI + 0.42,
    spinDirection: ball.position.x < ARENA_SIZE / 2 ? 1 : -1,
    lastHitTime: -Infinity,
    wallContact: null,
  };
}

function simulateMatch(aProfession, bProfession) {
  let elapsedSeconds = 0;
  let projectiles = [];
  const ballA = new SimulatedBall({
    profession: aProfession,
    x: 190,
    y: 210,
    direction: { x: 1, y: 0.64 },
  });
  const ballB = new SimulatedBall({
    profession: bProfession,
    x: 610,
    y: 590,
    direction: { x: -0.95, y: -0.48 },
  });

  for (let step = 0; step < SIMULATION_LIMIT_SECONDS / STEP_SECONDS; step += 1) {
    elapsedSeconds += STEP_SECONDS;
    ballA.update(STEP_SECONDS, elapsedSeconds);
    ballB.update(STEP_SECONDS, elapsedSeconds);
    resolveBallCollision(ballA, ballB, elapsedSeconds);
    projectiles = updateProjectiles(projectiles, STEP_SECONDS, elapsedSeconds, [ballA, ballB]);
    updateChainWeapon(ballA, STEP_SECONDS);
    updateChainWeapon(ballB, STEP_SECONDS);
    updateChainWeaponForPair(ballA, ballB, elapsedSeconds);
    updateChainWeaponForPair(ballB, ballA, elapsedSeconds);
    updateAttackForPair(ballA, ballB, elapsedSeconds, projectiles);
    updateAttackForPair(ballB, ballA, elapsedSeconds, projectiles);

    if (ballA.hp <= 0 || ballB.hp <= 0) {
      return getResult(aProfession, bProfession, elapsedSeconds, ballA, ballB);
    }
  }

  return {
    aProfession,
    bProfession,
    timeSeconds: elapsedSeconds,
    winner: "timeout",
    winnerProfession: "timeout",
    aHp: ballA.hp,
    bHp: ballB.hp,
  };
}

function getResult(aProfession, bProfession, elapsedSeconds, ballA, ballB) {
  const winner = ballA.hp <= 0 && ballB.hp <= 0 ? "draw" : ballA.hp <= 0 ? "B" : "A";

  return {
    aProfession,
    bProfession,
    timeSeconds: elapsedSeconds,
    winner,
    winnerProfession: winner === "A" ? aProfession : winner === "B" ? bProfession : "draw",
    aHp: ballA.hp,
    bHp: ballB.hp,
  };
}

function updateAttackForPair(attacker, defender, currentTime, projectiles) {
  if (attacker.config.attackMode === "chainSpin") {
    return;
  }

  updateAttackState(attacker, currentTime, projectiles);

  const canStartAttack = attacker.config.attackMode === "projectile" || isInAttackRange(attacker, defender);
  if (!attacker.attackState && canStartAttack) {
    attacker.startAttack(defender, currentTime);
  }
}

function updateAttackState(attacker, currentTime, projectiles) {
  const attackState = attacker.attackState;

  if (!attackState) {
    return;
  }

  if (attacker.hp <= 0) {
    attacker.attackState = null;
    return;
  }

  const progress = clamp((currentTime - attackState.startTime) / attackState.duration, 0, 1);

  if (attacker.config.attackMode === "projectile") {
    if (!attackState.didFireProjectile && progress >= attackState.hitFrame) {
      attackState.didFireProjectile = true;
      attackState.didDealDamage = true;
      fireProjectile(projectiles, attacker, attackState.defender, currentTime);
    }
  } else if (!attackState.didDealDamage && progress >= attackState.hitFrame) {
    const normal = normalize(attackState.direction);
    attackState.didDealDamage = true;
    resolveAttackHit(attacker, attackState.defender, normal, currentTime);
  }

  if (currentTime - attackState.startTime >= attackState.duration) {
    attacker.attackState = null;
  }
}

function fireProjectile(projectiles, attacker, defender, currentTime) {
  if (attacker.hp <= 0 || defender.hp <= 0 || !attacker.config.projectileWeapon) {
    return;
  }

  const weapon = attacker.config.projectileWeapon;
  const direction = getProjectileAimDirection(attacker, defender, weapon.speed);
  const position = add(attacker.position, scale(direction, attacker.radius + weapon.spawnOffset));
  attacker.attackState.direction = direction;
  attacker.lastAttackTime = currentTime;
  projectiles.push({
    owner: attacker,
    position,
    direction,
    speed: weapon.speed,
    headRadius: weapon.headRadius,
    shaftLength: weapon.shaftLength,
  });
}

function updateProjectiles(projectiles, deltaTime, currentTime, balls) {
  return projectiles.filter((projectile) => {
    projectile.position = add(projectile.position, scale(projectile.direction, projectile.speed * deltaTime));

    if (!isProjectileInArena(projectile)) {
      return false;
    }

    const defender = balls.find((ball) => ball !== projectile.owner && ball.hp > 0 && isProjectileHeadColliding(projectile, ball));
    if (!defender) {
      return true;
    }

    resolveAttackHit(projectile.owner, defender, projectile.direction, currentTime);
    return false;
  });
}

function isProjectileInArena(projectile) {
  const margin = projectile.shaftLength + projectile.headRadius + 16;
  return (
    projectile.position.x >= -margin &&
    projectile.position.x <= ARENA_SIZE + margin &&
    projectile.position.y >= -margin &&
    projectile.position.y <= ARENA_SIZE + margin
  );
}

function isProjectileHeadColliding(projectile, defender) {
  const headToDefender = subtract(defender.position, projectile.position);
  return length(headToDefender) <= projectile.headRadius + defender.radius;
}

function updateChainWeapon(ball, deltaTime) {
  if (!ball.chainWeaponState || ball.hp <= 0) {
    return;
  }

  const weapon = ball.config.chainWeapon;
  const state = ball.chainWeaponState;
  state.rotationAngle = normalizeAngle(state.rotationAngle + weapon.spinSpeed * state.spinDirection * deltaTime);

  const contact = getChainWeaponWallContact(ball);
  if (contact && contact !== state.wallContact) {
    state.spinDirection *= -1;
    state.rotationAngle = normalizeAngle(state.rotationAngle + weapon.spinSpeed * state.spinDirection * deltaTime * 1.5);
  }

  state.wallContact = contact;
}

function updateChainWeaponForPair(attacker, defender, currentTime) {
  if (!attacker.chainWeaponState || attacker.hp <= 0 || defender.hp <= 0) {
    return;
  }

  const weapon = attacker.config.chainWeapon;
  if (currentTime - attacker.chainWeaponState.lastHitTime < weapon.hitCooldown) {
    return;
  }

  const hit = getChainWeaponHit(attacker, defender);
  if (!hit) {
    return;
  }

  attacker.chainWeaponState.lastHitTime = currentTime;
  resolveAttackHit(attacker, defender, hit.normal, currentTime);
}

function resolveAttackHit(attacker, defender, normalFromAttackerToDefender, currentTime) {
  const damage = attacker.dealAttackDamageTo(defender, normalFromAttackerToDefender);
  applyAttackKnockback(attacker, defender, normalFromAttackerToDefender, damage, currentTime);
  return damage;
}

function isInAttackRange(attacker, defender) {
  return (
    attacker.hp > 0 &&
    defender.hp > 0 &&
    length(subtract(defender.position, attacker.position)) <= attacker.radius + defender.radius + attacker.weaponRange
  );
}

function getChainWeaponGeometry(ball) {
  const weapon = ball.config.chainWeapon;
  const direction = vectorFromAngle(ball.chainWeaponState?.rotationAngle || 0);
  const head = add(ball.position, scale(direction, weapon.orbitRadius));

  return {
    head,
    headRadius: weapon.headRadius,
  };
}

function getChainWeaponHit(attacker, defender) {
  const geometry = getChainWeaponGeometry(attacker);
  const headToDefender = subtract(defender.position, geometry.head);
  const hitDistance = geometry.headRadius + defender.radius;

  if (length(headToDefender) > hitDistance) {
    return null;
  }

  return {
    normal: normalize(headToDefender),
  };
}

function getChainWeaponWallContact(ball) {
  const geometry = getChainWeaponGeometry(ball);
  const head = geometry.head;
  const radius = geometry.headRadius;

  if (head.x - radius <= 0) {
    return "left";
  }
  if (head.x + radius >= ARENA_SIZE) {
    return "right";
  }
  if (head.y - radius <= 0) {
    return "top";
  }
  if (head.y + radius >= ARENA_SIZE) {
    return "bottom";
  }

  return null;
}

function resolveBallCollision(ballA, ballB, elapsedSeconds) {
  const difference = subtract(ballB.position, ballA.position);
  let distance = length(difference);
  const minDistance = ballA.radius + ballB.radius;

  if (distance > minDistance) {
    return;
  }

  const normal = distance === 0 ? { x: 1, y: 0 } : scale(difference, 1 / distance);
  distance = Math.max(distance, 0.001);
  separateBalls(ballA, ballB, normal, minDistance - distance);
  bounceBalls(ballA, ballB, normal, elapsedSeconds);
}

function separateBalls(ballA, ballB, normal, overlap) {
  const correction = scale(normal, overlap / 2 + 0.1);
  ballA.position = subtract(ballA.position, correction);
  ballB.position = add(ballB.position, correction);
  ballA.bounceOffWalls();
  ballB.bounceOffWalls();
}

function bounceBalls(ballA, ballB, normal, elapsedSeconds) {
  const relativeVelocity = subtract(ballB.velocity, ballA.velocity);
  const speedAlongNormal = dot(relativeVelocity, normal);

  if (speedAlongNormal > 0) {
    return;
  }

  const impulse = -speedAlongNormal;
  ballA.velocity = subtract(ballA.velocity, scale(normal, impulse));
  ballB.velocity = add(ballB.velocity, scale(normal, impulse));
  keepSpeed(ballA, elapsedSeconds);
  keepSpeed(ballB, elapsedSeconds);
}

function applyAttackKnockback(attacker, defender, normalFromAttackerToDefender, damage, elapsedSeconds) {
  if (damage <= 0) {
    return;
  }

  const push = 56 * attacker.config.getKnockbackMultiplier(attacker, defender, normalFromAttackerToDefender, damage);
  defender.velocity = add(defender.velocity, scale(normalFromAttackerToDefender, push));
  keepSpeed(attacker, elapsedSeconds);
  keepSpeed(defender, elapsedSeconds);
}

function keepSpeed(ball, elapsedSeconds) {
  ball.velocity = scale(normalize(ball.velocity), getCurrentMoveSpeed(ball, elapsedSeconds));
}

function getCurrentMoveSpeed(ball, elapsedSeconds) {
  return ball.config.moveSpeed * getSpeedMultiplier(elapsedSeconds);
}

function isWithinCurve(result) {
  return (
    result.winner !== "timeout" &&
    result.timeSeconds >= TARGET_MIN_SECONDS &&
    result.timeSeconds <= TARGET_MAX_SECONDS
  );
}

function printResults(matchupResults) {
  console.log(`Target curve: ${TARGET_MIN_SECONDS}-${TARGET_MAX_SECONDS}s`);
  console.log("matchup          time   winner  hp(A/B)  status");

  for (const result of matchupResults) {
    const status = isWithinCurve(result) ? "PASS" : "FAIL";
    console.log(
      `${formatMatchup(result).padEnd(16)} ${result.timeSeconds.toFixed(1).padStart(5)}s  ${result.winnerProfession.padEnd(
        7,
      )}  ${formatHp(result).padEnd(7)}  ${status}`,
    );
  }
}

function formatMatchup(result) {
  return `${result.aProfession}>${result.bProfession}`;
}

function formatHp(result) {
  return `${Math.ceil(result.aHp)}/${Math.ceil(result.bHp)}`;
}

function getDirectionBetween(source, target) {
  return normalize(subtract(target.position, source.position));
}

function getAttackDirection(attacker, defender) {
  if (attacker.config.attackMode === "projectile" && attacker.config.projectileWeapon) {
    return getProjectileAimDirection(attacker, defender, attacker.config.projectileWeapon.speed);
  }

  return getDirectionBetween(attacker, defender);
}

function getProjectileAimDirection(attacker, defender, projectileSpeed) {
  const toDefender = subtract(defender.position, attacker.position);
  const targetVelocity = defender.velocity || { x: 0, y: 0 };
  const velocityDot = dot(targetVelocity, targetVelocity) - projectileSpeed ** 2;
  const distanceVelocityDot = 2 * dot(toDefender, targetVelocity);
  const distanceDot = dot(toDefender, toDefender);
  const discriminant = distanceVelocityDot ** 2 - 4 * velocityDot * distanceDot;

  if (Math.abs(velocityDot) > 0.0001 && discriminant >= 0) {
    const root = Math.sqrt(discriminant);
    const times = [(-distanceVelocityDot - root) / (2 * velocityDot), (-distanceVelocityDot + root) / (2 * velocityDot)].filter(
      (time) => time > 0,
    );
    const interceptTime = Math.min(...times);

    if (Number.isFinite(interceptTime)) {
      return normalize(add(toDefender, scale(targetVelocity, interceptTime)));
    }
  }

  return normalize(toDefender);
}

function add(a, b) {
  return { x: a.x + b.x, y: a.y + b.y };
}

function subtract(a, b) {
  return { x: a.x - b.x, y: a.y - b.y };
}

function scale(vector, scalar) {
  return { x: vector.x * scalar, y: vector.y * scalar };
}

function dot(a, b) {
  return a.x * b.x + a.y * b.y;
}

function length(vector) {
  return Math.hypot(vector.x, vector.y);
}

function vectorFromAngle(angle) {
  return { x: Math.cos(angle), y: Math.sin(angle) };
}

function normalizeAngle(angle) {
  const fullTurn = Math.PI * 2;
  return ((angle % fullTurn) + fullTurn) % fullTurn;
}

function normalize(vector) {
  const vectorLength = length(vector);
  if (vectorLength === 0) {
    return { x: 1, y: 0 };
  }

  return { x: vector.x / vectorLength, y: vector.y / vectorLength };
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}
