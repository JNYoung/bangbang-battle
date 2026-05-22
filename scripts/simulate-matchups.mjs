const ARENA_SIZE = 800;
const BALL_RADIUS_MULTIPLIER = 1.5;
const ATTACK_COOLDOWN_MULTIPLIER = 0.65;
const TARGET_MIN_SECONDS = 18;
const TARGET_MAX_SECONDS = 60;
const SIMULATION_LIMIT_SECONDS = 75;
const STEP_SECONDS = 1 / 60;

const SPEED_RAMP_CONFIG = {
  startMultiplier: 1,
  maxMultiplier: 3,
  secondsToMaxMultiplier: 20,
};

const ATTACK_ANIMATION_CONFIG = {
  spear: {
    duration: 0.24,
    hitFrame: 0.48,
  },
  blade: {
    duration: 0.32,
    hitFrame: 0.55,
  },
  default: {
    duration: 0.24,
    hitFrame: 0.5,
  },
};

const ProfessionConfig = {
  spear: {
    maxHp: 100,
    radius: 24,
    moveSpeed: 210,
    attackDamage: 12,
    attackCooldown: 0.45,
    weaponRange: 50,
    getDamage(attacker, defender, normalFromAttackerToDefender) {
      const facingDot = dot(normalize(attacker.attackState?.direction || attacker.velocity), normalFromAttackerToDefender);
      return facingDot >= 0.72 ? 16 : this.attackDamage;
    },
    getKnockbackMultiplier() {
      return 1;
    },
  },
  blade: {
    maxHp: 120,
    radius: 26,
    moveSpeed: 180,
    attackDamage: 20,
    attackCooldown: 0.65,
    weaponRange: 32,
    getDamage() {
      return this.attackDamage;
    },
    getKnockbackMultiplier() {
      return 1.3;
    },
  },
  shield: {
    maxHp: 140,
    radius: 28,
    moveSpeed: 170,
    attackDamage: 14,
    attackCooldown: 0.7,
    weaponRange: 56,
    getDamage() {
      return this.attackDamage;
    },
    getKnockbackMultiplier() {
      return 0.85;
    },
  },
};

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

    const attackConfig = ATTACK_ANIMATION_CONFIG[this.profession] || ATTACK_ANIMATION_CONFIG.default;
    this.attackState = {
      defender,
      startTime: currentTime,
      duration: attackConfig.duration,
      hitFrame: attackConfig.hitFrame,
      direction: getDirectionBetween(this, defender),
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

function simulateMatch(aProfession, bProfession) {
  let elapsedSeconds = 0;
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
    updateAttackForPair(ballA, ballB, elapsedSeconds);
    updateAttackForPair(ballB, ballA, elapsedSeconds);

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

function updateAttackForPair(attacker, defender, currentTime) {
  updateAttackState(attacker, currentTime);

  if (!attacker.attackState && isInAttackRange(attacker, defender)) {
    attacker.startAttack(defender, currentTime);
  }
}

function updateAttackState(attacker, currentTime) {
  const attackState = attacker.attackState;

  if (!attackState) {
    return;
  }

  if (attacker.hp <= 0) {
    attacker.attackState = null;
    return;
  }

  const progress = clamp((currentTime - attackState.startTime) / attackState.duration, 0, 1);

  if (!attackState.didDealDamage && progress >= attackState.hitFrame) {
    const normal = normalize(attackState.direction);
    const damage = attacker.dealAttackDamageTo(attackState.defender, normal);
    attackState.didDealDamage = true;
    applyAttackKnockback(attacker, attackState.defender, normal, damage, currentTime);
  }

  if (currentTime - attackState.startTime >= attackState.duration) {
    attacker.attackState = null;
  }
}

function isInAttackRange(attacker, defender) {
  return (
    attacker.hp > 0 &&
    defender.hp > 0 &&
    length(subtract(defender.position, attacker.position)) <= attacker.radius + defender.radius + attacker.weaponRange
  );
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

  const push = 56 * attacker.config.getKnockbackMultiplier();
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

function getSpeedMultiplier(elapsedSeconds) {
  const progress = clamp(elapsedSeconds / SPEED_RAMP_CONFIG.secondsToMaxMultiplier, 0, 1);
  return (
    SPEED_RAMP_CONFIG.startMultiplier +
    (SPEED_RAMP_CONFIG.maxMultiplier - SPEED_RAMP_CONFIG.startMultiplier) * progress
  );
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
