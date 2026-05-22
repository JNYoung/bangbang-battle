import {
  ARENA_SIZE,
  ATTACK_COOLDOWN_MULTIPLIER,
  BALL_RADIUS_MULTIPLIER,
  ProfessionConfig,
  SceneConfig,
  getAttackAnimationConfig,
  getSpeedMultiplier,
} from "../game-config.js";

const TARGET_MIN_SECONDS = 18;
const TARGET_MAX_SECONDS = 75;
const SIMULATION_LIMIT_SECONDS = 90;
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
    this.frostOrbitState = createFrostOrbitState(this);
    this.attackDisabledUntil = 0;
    this.frozenUntil = 0;
    this.poisonUntil = 0;
    this.poisonDamagePerSecond = 0;
    this.lastCollisionAbilityTime = -Infinity;
    this.lastHazardHitTime = -Infinity;
    this.lastWebHitTime = -Infinity;
    this.lastFlameHitTime = -Infinity;
    this.lastFlameDropTime = -Infinity;
    this.wallCollisionCount = 0;
    this.pendingWebNode = null;
  }

  update(deltaTime, elapsedSeconds) {
    this.velocity = scale(normalize(this.velocity), getCurrentMoveSpeed(this, elapsedSeconds));
    if (!isBallFrozen(this, elapsedSeconds)) {
      this.position.x += this.velocity.x * deltaTime;
      this.position.y += this.velocity.y * deltaTime;
    }
    return this.bounceOffWalls();
  }

  bounceOffWalls() {
    const contacts = [];

    if (this.position.x - this.radius < 0) {
      this.position.x = this.radius;
      this.velocity.x = Math.abs(this.velocity.x);
      contacts.push({ wall: "left", point: { x: this.radius, y: this.position.y } });
    } else if (this.position.x + this.radius > ARENA_SIZE) {
      this.position.x = ARENA_SIZE - this.radius;
      this.velocity.x = -Math.abs(this.velocity.x);
      contacts.push({ wall: "right", point: { x: ARENA_SIZE - this.radius, y: this.position.y } });
    }

    if (this.position.y - this.radius < 0) {
      this.position.y = this.radius;
      this.velocity.y = Math.abs(this.velocity.y);
      contacts.push({ wall: "top", point: { x: this.position.x, y: this.radius } });
    } else if (this.position.y + this.radius > ARENA_SIZE) {
      this.position.y = ARENA_SIZE - this.radius;
      this.velocity.y = -Math.abs(this.velocity.y);
      contacts.push({ wall: "bottom", point: { x: this.position.x, y: ARENA_SIZE - this.radius } });
    }

    return contacts;
  }

  canAttack(currentTime) {
    return (
      this.hp > 0 &&
      !this.attackState &&
      !isBallControlLocked(this, currentTime) &&
      currentTime - this.lastAttackTime >= this.attackCooldown
    );
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
    return damageBall(defender, damage);
  }
}

const results = [];
for (const scene of Object.values(SceneConfig)) {
  for (const aProfession of scene.professionIds) {
    for (const bProfession of scene.professionIds) {
      results.push(simulateMatch(scene.id, aProfession, bProfession));
    }
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

function createFrostOrbitState(ball) {
  if (ball.config.attackMode !== "frostOrbit") {
    return null;
  }

  return {
    rotationAngle: ball.position.x < ARENA_SIZE / 2 ? 0 : Math.PI,
    lastHitTime: -Infinity,
  };
}

function simulateMatch(sceneId, aProfession, bProfession) {
  let elapsedSeconds = 0;
  let projectiles = [];
  let hazards = [];
  let webLinks = [];
  let flames = [];
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
    for (const contact of ballA.update(STEP_SECONDS, elapsedSeconds)) {
      ({ hazards, webLinks } = handleWallAbility(ballA, contact, elapsedSeconds, hazards, webLinks));
    }
    for (const contact of ballB.update(STEP_SECONDS, elapsedSeconds)) {
      ({ hazards, webLinks } = handleWallAbility(ballB, contact, elapsedSeconds, hazards, webLinks));
    }
    flames = updateFlameTrail(ballA, elapsedSeconds, flames);
    flames = updateFlameTrail(ballB, elapsedSeconds, flames);
    updateStatusEffects([ballA, ballB], STEP_SECONDS, elapsedSeconds);
    resolveBallCollision(ballA, ballB, elapsedSeconds);
    hazards = hazards.filter((hazard) => hazard.expiresAt > elapsedSeconds);
    webLinks = webLinks.filter((web) => web.expiresAt > elapsedSeconds);
    flames = flames.filter((flame) => flame.expiresAt > elapsedSeconds);
    updateEnvironmentalHazards(hazards, webLinks, flames, [ballA, ballB], elapsedSeconds);
    projectiles = updateProjectiles(projectiles, STEP_SECONDS, elapsedSeconds, [ballA, ballB]);
    updateChainWeapon(ballA, STEP_SECONDS);
    updateChainWeapon(ballB, STEP_SECONDS);
    updateChainWeaponForPair(ballA, ballB, elapsedSeconds);
    updateChainWeaponForPair(ballB, ballA, elapsedSeconds);
    updateFrostOrbit(ballA, STEP_SECONDS);
    updateFrostOrbit(ballB, STEP_SECONDS);
    updateFrostOrbitForPair(ballA, ballB, elapsedSeconds);
    updateFrostOrbitForPair(ballB, ballA, elapsedSeconds);
    updateAttackForPair(ballA, ballB, elapsedSeconds, projectiles);
    updateAttackForPair(ballB, ballA, elapsedSeconds, projectiles);

    if (ballA.hp <= 0 || ballB.hp <= 0) {
      return getResult(sceneId, aProfession, bProfession, elapsedSeconds, ballA, ballB);
    }
  }

  return {
    sceneId,
    aProfession,
    bProfession,
    timeSeconds: elapsedSeconds,
    winner: "timeout",
    winnerProfession: "timeout",
    aHp: ballA.hp,
    bHp: ballB.hp,
  };
}

function getResult(sceneId, aProfession, bProfession, elapsedSeconds, ballA, ballB) {
  const winner = ballA.hp <= 0 && ballB.hp <= 0 ? "draw" : ballA.hp <= 0 ? "B" : "A";

  return {
    sceneId,
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
  if (attacker.config.attackMode === "chainSpin" || attacker.config.attackMode === "frostOrbit") {
    return;
  }

  if (isBallControlLocked(attacker, currentTime)) {
    attacker.attackState = null;
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
  } else if (attacker.config.attackMode === "reaper") {
    if (!attackState.didDealDamage && progress >= attackState.hitFrame) {
      attackState.didDealDamage = true;
      const hit = getReaperBladeHit(attacker, attackState.defender, currentTime);
      if (hit) {
        resolveAttackHit(attacker, attackState.defender, hit.normal, currentTime);
      }
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

function updateFrostOrbit(ball, deltaTime) {
  if (!ball.frostOrbitState || ball.hp <= 0) {
    return;
  }

  ball.frostOrbitState.rotationAngle = normalizeAngle(ball.frostOrbitState.rotationAngle + ball.config.frostOrbit.spinSpeed * deltaTime);
}

function updateFrostOrbitForPair(attacker, defender, currentTime) {
  if (!attacker.frostOrbitState || attacker.hp <= 0 || defender.hp <= 0) {
    return;
  }

  const orbit = attacker.config.frostOrbit;
  if (currentTime - attacker.frostOrbitState.lastHitTime < orbit.hitCooldown) {
    return;
  }

  const hit = getFrostOrbitHit(attacker, defender);
  if (!hit) {
    return;
  }

  attacker.frostOrbitState.lastHitTime = currentTime;
  defender.frozenUntil = Math.max(defender.frozenUntil, currentTime + orbit.freezeDuration);
  defender.attackState = null;
  damageBall(defender, orbit.damage);
}

function resolveCollisionAbilities(ballA, ballB, normalFromAToB, currentTime) {
  resolveBatDrain(ballA, ballB, normalFromAToB, currentTime);
  resolveBatDrain(ballB, ballA, scale(normalFromAToB, -1), currentTime);
}

function resolveBatDrain(attacker, defender, normalFromAttackerToDefender, currentTime) {
  const drain = attacker.config.collisionDrain;
  if (!drain || attacker.hp <= 0 || defender.hp <= 0 || currentTime - attacker.lastCollisionAbilityTime < drain.cooldown) {
    return;
  }

  attacker.lastCollisionAbilityTime = currentTime;
  defender.attackState = null;
  defender.attackDisabledUntil = Math.max(defender.attackDisabledUntil, currentTime + drain.disableDuration);
  const damage = damageBall(defender, drain.damage);
  healBall(attacker, drain.heal);
  applyAttackKnockback(attacker, defender, normalFromAttackerToDefender, damage, currentTime);
}

function handleWallAbility(ball, contact, currentTime, hazards, webLinks) {
  if (ball.config.venomSpike) {
    const spike = ball.config.venomSpike;
    hazards = [
      ...hazards,
      {
        owner: ball,
        wall: contact.wall,
        position: getWallAnchoredPoint(contact.wall, contact.point, spike.radius),
        radius: spike.radius,
        damage: spike.damage,
        poisonDamagePerSecond: spike.poisonDamagePerSecond,
        poisonDuration: spike.poisonDuration,
        hitCooldown: spike.hitCooldown,
        expiresAt: currentTime + spike.duration,
      },
    ];
  }

  if (ball.config.webLine) {
    const web = ball.config.webLine;
    const node = getWallAnchoredPoint(contact.wall, contact.point, web.nodeRadius);
    ball.wallCollisionCount += 1;
    if (ball.wallCollisionCount % 2 === 1 || !ball.pendingWebNode) {
      ball.pendingWebNode = node;
    } else {
      webLinks = [
        ...webLinks,
        {
          owner: ball,
          start: ball.pendingWebNode,
          end: node,
          collisionRadius: web.collisionRadius,
          damage: web.damage,
          hitCooldown: web.hitCooldown,
          expiresAt: currentTime + web.duration,
        },
      ];
      ball.pendingWebNode = null;
    }
  }

  return { hazards, webLinks };
}

function getPendingWebSegment(ball) {
  const web = ball.config.webLine;
  if (ball.hp <= 0 || !web || !ball.pendingWebNode) {
    return null;
  }

  const toNode = subtract(ball.pendingWebNode, ball.position);
  const distanceToNode = length(toNode);
  const edgeDistance = Math.min(distanceToNode, ball.radius * 0.78);
  const ballAnchor = add(ball.position, scale(normalize(toNode), edgeDistance));

  return {
    owner: ball,
    start: ball.pendingWebNode,
    end: ballAnchor,
    collisionRadius: web.collisionRadius,
    damage: web.damage,
    hitCooldown: web.hitCooldown,
  };
}

function updateFlameTrail(ball, currentTime, flames) {
  const flame = ball.config.flameTrail;
  if (!flame || ball.hp <= 0 || currentTime - ball.lastFlameDropTime < flame.dropInterval) {
    return flames;
  }

  ball.lastFlameDropTime = currentTime;
  return [
    ...flames,
    {
      owner: ball,
      position: { ...ball.position },
      radius: flame.radius,
      damage: flame.damage,
      hitCooldown: flame.hitCooldown,
      expiresAt: currentTime + flame.duration,
    },
  ];
}

function updateStatusEffects(balls, deltaTime, currentTime) {
  for (const ball of balls) {
    if (ball.hp > 0 && ball.poisonUntil > currentTime && ball.poisonDamagePerSecond > 0) {
      damageBall(ball, ball.poisonDamagePerSecond * deltaTime);
    }
  }
}

function updateEnvironmentalHazards(hazards, webLinks, flames, balls, currentTime) {
  for (const hazard of hazards) {
    for (const ball of balls) {
      if (ball === hazard.owner || ball.hp <= 0 || length(subtract(ball.position, hazard.position)) > ball.radius + hazard.radius) {
        continue;
      }
      if (currentTime - ball.lastHazardHitTime >= hazard.hitCooldown) {
        ball.lastHazardHitTime = currentTime;
        ball.poisonUntil = Math.max(ball.poisonUntil, currentTime + hazard.poisonDuration);
        ball.poisonDamagePerSecond = Math.max(ball.poisonDamagePerSecond, hazard.poisonDamagePerSecond);
        damageBall(ball, hazard.damage);
      }
    }
  }

  for (const web of webLinks) {
    for (const ball of balls) {
      const hit = ball !== web.owner && ball.hp > 0
        ? getSegmentCircleHit(ball.position, ball.radius + web.collisionRadius, web.start, web.end)
        : null;
      if (hit && currentTime - ball.lastWebHitTime >= web.hitCooldown) {
        ball.lastWebHitTime = currentTime;
        damageBall(ball, web.damage);
      }
    }
  }

  for (const webOwner of balls) {
    const pendingWeb = getPendingWebSegment(webOwner);
    if (!pendingWeb) {
      continue;
    }

    for (const ball of balls) {
      const hit = ball !== pendingWeb.owner && ball.hp > 0
        ? getSegmentCircleHit(ball.position, ball.radius + pendingWeb.collisionRadius, pendingWeb.start, pendingWeb.end)
        : null;
      if (hit && currentTime - ball.lastWebHitTime >= pendingWeb.hitCooldown) {
        ball.lastWebHitTime = currentTime;
        damageBall(ball, pendingWeb.damage);
      }
    }
  }

  for (const flame of flames) {
    for (const ball of balls) {
      if (ball !== flame.owner && ball.hp > 0 && length(subtract(ball.position, flame.position)) <= ball.radius + flame.radius) {
        if (currentTime - ball.lastFlameHitTime >= flame.hitCooldown) {
          ball.lastFlameHitTime = currentTime;
          damageBall(ball, flame.damage);
        }
      }
    }
  }
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

function getFrostOrbitGeometry(ball) {
  const orbit = ball.config.frostOrbit;
  const rotation = ball.frostOrbitState?.rotationAngle || 0;

  return Array.from({ length: orbit.count }, (_, index) => {
    const angle = rotation + (index * Math.PI * 2) / orbit.count;
    return {
      center: add(ball.position, scale(vectorFromAngle(angle), orbit.orbitRadius)),
      radius: orbit.orbRadius,
    };
  });
}

function getFrostOrbitHit(attacker, defender) {
  for (const orb of getFrostOrbitGeometry(attacker)) {
    const orbToDefender = subtract(defender.position, orb.center);
    if (length(orbToDefender) <= orb.radius + defender.radius) {
      return {
        normal: normalize(orbToDefender),
      };
    }
  }

  return null;
}

function getReaperBladeGeometry(ball, currentTime) {
  const direction = normalize(ball.attackState?.direction || ball.velocity);
  const progress = ball.attackState ? clamp((currentTime - ball.attackState.startTime) / ball.attackState.duration, 0, 1) : 0.55;
  const attackConfig = getAttackAnimationConfig("reaper");
  const baseAngle = Math.atan2(direction.y, direction.x);
  const bladeAngle = baseAngle - attackConfig.sweepAngle / 2 + attackConfig.sweepAngle * easeOutCubic(progress);
  const bladeDirection = vectorFromAngle(bladeAngle);
  const side = vectorFromAngle(bladeAngle - Math.PI * 0.5);
  const socket = add(ball.position, scale(bladeDirection, ball.radius + ball.weaponRange * 0.72));
  const bladeHalf = ball.config.reaperBlade.edgeLength / 2;

  return {
    handleEnd: socket,
    bladeStart: add(socket, scale(side, -bladeHalf)),
    bladeEnd: add(socket, scale(side, bladeHalf)),
  };
}

function getReaperBladeHit(attacker, defender, currentTime) {
  const geometry = getReaperBladeGeometry(attacker, currentTime);
  const hit = getSegmentCircleHit(
    defender.position,
    defender.radius + attacker.config.reaperBlade.collisionRadius,
    geometry.bladeStart,
    geometry.bladeEnd,
  );

  if (!hit) {
    return null;
  }

  return {
    ...hit,
    normal: normalize(subtract(defender.position, geometry.handleEnd)),
  };
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
  resolveCollisionAbilities(ballA, ballB, normal, elapsedSeconds);
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

function damageBall(ball, damage) {
  if (ball.hp <= 0 || damage <= 0) {
    return 0;
  }

  const appliedDamage = Math.min(ball.hp, damage);
  ball.hp = Math.max(0, ball.hp - appliedDamage);
  return appliedDamage;
}

function healBall(ball, amount) {
  if (ball.hp <= 0 || amount <= 0) {
    return 0;
  }

  const healed = Math.min(ball.config.maxHp - ball.hp, amount);
  ball.hp += healed;
  return healed;
}

function isBallFrozen(ball, currentTime) {
  return ball.frozenUntil > currentTime;
}

function isBallControlLocked(ball, currentTime) {
  return isBallFrozen(ball, currentTime) || ball.attackDisabledUntil > currentTime;
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
  return `${result.sceneId}:${result.aProfession}>${result.bProfession}`;
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

function getSegmentCircleHit(center, radius, start, end) {
  const segment = subtract(end, start);
  const segmentLengthSquared = dot(segment, segment);
  if (segmentLengthSquared === 0) {
    return length(subtract(center, start)) <= radius ? { point: start, normal: normalize(subtract(center, start)) } : null;
  }

  const t = clamp(dot(subtract(center, start), segment) / segmentLengthSquared, 0, 1);
  const closest = add(start, scale(segment, t));
  const difference = subtract(center, closest);
  if (length(difference) > radius) {
    return null;
  }

  return {
    point: closest,
    normal: normalize(difference),
  };
}

function getWallNormal(wall) {
  if (wall === "left") {
    return { x: 1, y: 0 };
  }
  if (wall === "right") {
    return { x: -1, y: 0 };
  }
  if (wall === "top") {
    return { x: 0, y: 1 };
  }
  return { x: 0, y: -1 };
}

function getWallAnchoredPoint(wall, point, inset) {
  if (wall === "left") {
    return { x: inset, y: clamp(point.y, inset, ARENA_SIZE - inset) };
  }
  if (wall === "right") {
    return { x: ARENA_SIZE - inset, y: clamp(point.y, inset, ARENA_SIZE - inset) };
  }
  if (wall === "top") {
    return { x: clamp(point.x, inset, ARENA_SIZE - inset), y: inset };
  }
  return { x: clamp(point.x, inset, ARENA_SIZE - inset), y: ARENA_SIZE - inset };
}

function easeOutCubic(value) {
  return 1 - (1 - value) ** 3;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}
