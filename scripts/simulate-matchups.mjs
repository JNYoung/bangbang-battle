import {
  ARENA_SIZE,
  ATTACK_COOLDOWN_MULTIPLIER,
  BALL_RADIUS_MULTIPLIER,
  HeroConfig,
  ITEM_SCENE_ID,
  ItemBuildingConfig,
  ItemModePoolConfig,
  ItemModeBallConfig,
  ItemSpawnConfig,
  ItemWeaponConfig,
  ProfessionConfig,
  SceneConfig,
  getAttackAnimationConfig,
  getItemDropPool,
  getItemInitialCount,
  getItemMaxActiveCount,
  getItemSpawnInterval,
  getSpeedMultiplier,
} from "../game-config.js";

const TARGET_MIN_SECONDS = 18;
const TARGET_MAX_SECONDS = 75;
const SIMULATION_LIMIT_SECONDS = 120;
const STEP_SECONDS = 1 / 60;
const MATCHUP_SEED_COUNT = getPositiveIntegerEnv("MATCHUP_SEED_COUNT", 64);
const ITEM_MODE_SEED_COUNT = getPositiveIntegerEnv("ITEM_MODE_SEED_COUNT", MATCHUP_SEED_COUNT);
const MATCHUP_SEEDS = Array.from({ length: MATCHUP_SEED_COUNT }, (_, index) => index + 1);
const PROFESSION_MIN_WIN_RATE = 0.25;
const PROFESSION_MAX_WIN_RATE = 0.75;
const MIRROR_MATCHUP_MIN_SIDE_WIN_RATE = 0.3;
const MIRROR_MATCHUP_MAX_SIDE_WIN_RATE = 0.7;
const ITEM_MODE_BALL_COUNTS = [2, 3, 4, 5, 6];
const ITEM_MODE_SEEDS = Array.from({ length: ITEM_MODE_SEED_COUNT }, (_, index) => index + 1);
const ITEM_MODE_MAX_WINNER_SHARE = 0.75;
let simulationElapsedSeconds = 0;
let cryptBeetleCounter = 0;

const DUEL_STARTS = [
  {
    a: { x: 190, y: 210, direction: { x: 1, y: 0.64 } },
    b: { x: 610, y: 590, direction: { x: -0.95, y: -0.48 } },
  },
  {
    a: { x: 610, y: 210, direction: { x: -1, y: 0.58 } },
    b: { x: 190, y: 590, direction: { x: 0.95, y: -0.52 } },
  },
  {
    a: { x: 210, y: 610, direction: { x: 0.88, y: -0.7 } },
    b: { x: 590, y: 190, direction: { x: -0.74, y: 0.82 } },
  },
  {
    a: { x: 410, y: 150, direction: { x: 0.32, y: 1 } },
    b: { x: 390, y: 650, direction: { x: -0.36, y: -1 } },
  },
  {
    a: { x: 150, y: 410, direction: { x: 1, y: -0.28 } },
    b: { x: 650, y: 390, direction: { x: -1, y: 0.34 } },
  },
  {
    a: { x: 260, y: 260, direction: { x: 0.76, y: 0.98 } },
    b: { x: 540, y: 540, direction: { x: -0.84, y: -0.72 } },
  },
  {
    a: { x: 540, y: 260, direction: { x: -0.82, y: 0.92 } },
    b: { x: 260, y: 540, direction: { x: 0.78, y: -0.8 } },
  },
  {
    a: { x: 250, y: 400, direction: { x: 0.94, y: 0.22 } },
    b: { x: 550, y: 400, direction: { x: -0.92, y: -0.26 } },
  },
  {
    a: { x: 400, y: 250, direction: { x: -0.2, y: 0.98 } },
    b: { x: 400, y: 550, direction: { x: 0.24, y: -0.98 } },
  },
  {
    a: { x: 180, y: 520, direction: { x: 0.98, y: -0.44 } },
    b: { x: 620, y: 280, direction: { x: -0.9, y: 0.58 } },
  },
  {
    a: { x: 620, y: 520, direction: { x: -0.96, y: -0.5 } },
    b: { x: 180, y: 280, direction: { x: 0.92, y: 0.62 } },
  },
  {
    a: { x: 330, y: 150, direction: { x: 0.58, y: 1 } },
    b: { x: 470, y: 650, direction: { x: -0.54, y: -1 } },
  },
];

function getPositiveIntegerEnv(name, fallback) {
  const value = Number.parseInt(process.env[name] || "", 10);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

class SimulatedBall {
  constructor({ label, profession, x, y, direction, config = null }) {
    this.kind = "ball";
    this.label = label;
    this.teamId = label;
    this.owner = null;
    this.isPrimaryCombatant = true;
    this.profession = profession;
    this.config = config || getCombatantConfig(profession);
    this.isHero = isHeroId(profession);
    this.position = { x, y };
    this.velocity = scale(normalize(direction), this.config.moveSpeed);
    this.radius = this.config.radius * BALL_RADIUS_MULTIPLIER;
    this.baseRadius = this.radius;
    this.maxHp = this.config.maxHp;
    this.hp = this.maxHp;
    this.attackDamage = this.config.attackDamage || 0;
    this.attackCooldown = this.config.attackCooldown * ATTACK_COOLDOWN_MULTIPLIER;
    this.weaponRange = this.config.weaponRange;
    this.maxMp = this.config.maxMp || 0;
    this.mp = this.maxMp;
    this.manaRegen = this.config.manaRegen || 0;
    this.lastAttackTime = -Infinity;
    this.attackState = null;
    this.heroSkillCooldowns = {};
    this.heroSkillEffects = {};
    this.rebirthUsed = false;
    this.chainWeaponState = createChainWeaponState(this);
    this.frostOrbitState = createFrostOrbitState(this);
    this.yoyoWeaponState = createYoyoWeaponState(this);
    this.staticChargeState = createStaticChargeState(this);
    this.summonedBearState = createSummonedBearState(this);
    this.attackDisabledUntil = 0;
    this.frozenUntil = 0;
    this.paralyzedUntil = 0;
    this.shockUntil = 0;
    this.shockDamagePerSecond = 0;
    this.shockOwner = null;
    this.poisonUntil = 0;
    this.poisonDamagePerSecond = 0;
    this.slowMultiplier = 1;
    this.slowUntil = 0;
    this.lastCollisionAbilityTime = -Infinity;
    this.stationHealState = null;
    this.lastHazardHitTime = -Infinity;
    this.lastWebHitTime = -Infinity;
    this.lastFlameHitTime = -Infinity;
    this.lastFlameDropTime = -Infinity;
    this.wallCollisionCount = 0;
    this.pendingWebNode = null;
  }

  update(deltaTime, elapsedSeconds) {
    regenerateHeroMana(this, deltaTime);
    this.velocity = scale(normalize(this.velocity), getCurrentMoveSpeed(this, elapsedSeconds));
    if (!isBallMovementLocked(this, elapsedSeconds)) {
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

    const attackConfig = getBallAttackAnimationConfig(this);
    this.attackState = {
      defender,
      startTime: currentTime,
      duration: attackConfig.duration,
      hitFrame: attackConfig.hitFrame,
      direction: getAttackDirection(this, defender),
      variant: getHeroAttackVariant(this, defender, currentTime) || this.config.getAttackVariant?.(this, defender, currentTime) || null,
      didDealDamage: false,
    };
    this.lastAttackTime = currentTime;
  }

  dealAttackDamageTo(defender, normalFromAttackerToDefender, attackVariant = null) {
    if (this.hp <= 0 || defender.hp <= 0) {
      return 0;
    }

    if (isHeroSkillDamageBlocked(defender, attackVariant)) {
      return 0;
    }

    const damage = this.config.getDamage(this, defender, normalFromAttackerToDefender, attackVariant);
    return damageBall(defender, damage);
  }
}

class SimulatedItemBall {
  constructor({ label, x, y, direction }) {
    this.kind = "ball";
    this.label = label;
    this.teamId = label;
    this.profession = null;
    this.config = ItemModeBallConfig;
    this.position = { x, y };
    this.velocity = scale(normalize(direction), this.config.moveSpeed);
    this.radius = this.config.radius * BALL_RADIUS_MULTIPLIER;
    this.hp = this.config.maxHp;
    this.equippedItem = null;
    this.lastAttackTime = -Infinity;
    this.attackDisabledUntil = 0;
    this.frozenUntil = 0;
    this.paralyzedUntil = 0;
    this.slowMultiplier = 1;
    this.slowUntil = 0;
    this.lastHazardHitTime = -Infinity;
    this.lastWebHitTime = -Infinity;
    this.lastFlameHitTime = -Infinity;
    this.stationHealState = null;
  }

  update(deltaTime, elapsedSeconds) {
    this.velocity = scale(normalize(this.velocity), getCurrentMoveSpeed(this, elapsedSeconds));
    if (!isBallMovementLocked(this, elapsedSeconds)) {
      this.position.x += this.velocity.x * deltaTime;
      this.position.y += this.velocity.y * deltaTime;
    }
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
}

const matchupSummaries = [];
const matchupRuns = [];
for (const scene of Object.values(SceneConfig)) {
  if (scene.type !== "professions" && scene.type !== "heroes") {
    continue;
  }

  for (const aProfession of scene.professionIds) {
    for (const bProfession of scene.professionIds) {
      const runs = MATCHUP_SEEDS.map((seed) => simulateMatch(scene.id, aProfession, bProfession, seed));
      matchupRuns.push(...runs);
      matchupSummaries.push(getMatchupSummary(scene.id, aProfession, bProfession, runs));
    }
  }
}

const professionSummaries = getProfessionBalanceSummaries(matchupRuns);
const itemResults = ITEM_MODE_BALL_COUNTS.flatMap((ballCount) => {
  return ITEM_MODE_SEEDS.map((seed) => simulateItemMode(seed, ballCount));
});
const itemSummaries = ITEM_MODE_BALL_COUNTS.map((ballCount) => {
  return getItemModeSummary(itemResults.filter((result) => result.ballCount === ballCount), ballCount);
});

printResults(matchupSummaries, professionSummaries);
printItemResults(itemSummaries);

const matchupFailures = matchupSummaries.filter((summary) => !isMatchupSummaryWithinCurve(summary));
const professionFailures = professionSummaries.filter((summary) => !isProfessionSummaryWithinCurve(summary));
const itemFailures = itemSummaries.filter((summary) => !isItemSummaryWithinCurve(summary));

if (matchupFailures.length > 0 || professionFailures.length > 0 || itemFailures.length > 0) {
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

  const leftSide = ball.position.x < ARENA_SIZE / 2;
  return {
    rotationAngle: leftSide ? 0 : Math.PI,
    spinDirection: leftSide ? 1 : -1,
    lastHitTime: -Infinity,
  };
}

function createYoyoWeaponState(ball) {
  if (ball.config.attackMode !== "yoyo") {
    return null;
  }

  const leftSide = ball.position.x < ARENA_SIZE / 2;
  return {
    phase: "idle",
    phaseStartedAt: 0,
    nextThrowTime: leftSide ? 0.52 : 1.08,
    rotationAngle: leftSide ? -0.36 : Math.PI + 0.36,
    spinDirection: leftSide ? 1 : -1,
    lastHitTime: -Infinity,
    wallContact: null,
  };
}

function createStaticChargeState(ball) {
  if (ball.config.attackMode !== "staticCharge") {
    return null;
  }

  return {
    charge: 0,
    active: false,
    lastDischargeTime: -Infinity,
  };
}

function createSummonedBearState(ball) {
  if (ball.config.attackMode !== "summonBear") {
    return null;
  }

  const bear = ball.config.summonBear;
  const spawnDirection = normalize(ball.position.x < ARENA_SIZE / 2 ? { x: 0.8, y: 0.42 } : { x: -0.8, y: -0.42 });
  const radius = ball.radius;
  const spawnDistance = ball.radius + radius + 22;
  const position = clampPointToArena(add(ball.position, scale(spawnDirection, spawnDistance)), radius);

  return {
    kind: "summonedBear",
    label: `${ball.label}-bear`,
    teamId: ball.teamId,
    owner: ball,
    isPrimaryCombatant: false,
    config: {
      moveSpeed: bear.moveSpeed,
    },
    position,
    velocity: scale(spawnDirection, bear.moveSpeed),
    radius,
    baseRadius: radius,
    maxRadius: radius * bear.maxRadiusMultiplier,
    hp: 1,
    damage: bear.baseDamage,
    lastOwnerBoostTime: -Infinity,
    lastHitTimesByLabel: {},
    touchingOwner: false,
    wasTouchingOwner: false,
  };
}

function getCombatantTeamId(combatant) {
  return combatant?.teamId || combatant?.owner?.teamId || combatant?.label || "";
}

function areAlliedCombatants(combatantA, combatantB) {
  const teamA = getCombatantTeamId(combatantA);
  const teamB = getCombatantTeamId(combatantB);
  return teamA && teamA === teamB;
}

function isPrimaryCombatant(combatant) {
  return combatant?.isPrimaryCombatant !== false;
}

function isSummonedBear(combatant) {
  return combatant?.kind === "summonedBear";
}

function isSummonedBearActive(bear) {
  return isSummonedBear(bear) && bear.owner?.hp > 0 && bear.hp > 0;
}

function getActiveSummonedBears(balls) {
  return balls
    .map((ball) => ball.summonedBearState)
    .filter((bear) => isSummonedBearActive(bear));
}

function getAliveCollisionCombatants(balls) {
  return [
    ...balls.filter((ball) => ball.hp > 0),
    ...getActiveSummonedBears(balls),
  ];
}

function simulateMatch(sceneId, aProfession, bProfession, seed = 1) {
  let elapsedSeconds = 0;
  cryptBeetleCounter = 0;
  let projectiles = [];
  let hazards = [];
  let webLinks = [];
  let flames = [];
  let spellTrajectories = [];
  let lightningStrikes = [];
  const start = getDuelStart(seed);
  const ballA = new SimulatedBall({
    label: "A",
    profession: aProfession,
    ...start.a,
  });
  const ballB = new SimulatedBall({
    label: "B",
    profession: bProfession,
    ...start.b,
  });
  let balls = [ballA, ballB];

  for (let step = 0; step < SIMULATION_LIMIT_SECONDS / STEP_SECONDS; step += 1) {
    elapsedSeconds += STEP_SECONDS;
    simulationElapsedSeconds = elapsedSeconds;
    balls = balls.filter((ball) => isPrimaryCombatant(ball) || (ball.hp > 0 && (!ball.expiresAt || ball.expiresAt > elapsedSeconds)));
    for (const ball of balls) {
      if (ball.hp <= 0) {
        continue;
      }
      for (const contact of ball.update(STEP_SECONDS, elapsedSeconds)) {
        ({ hazards, webLinks } = handleWallAbility(ball, contact, elapsedSeconds, hazards, webLinks));
      }
    }
    flames = updateFlameTrail(ballA, elapsedSeconds, flames);
    flames = updateFlameTrail(ballB, elapsedSeconds, flames);
    updateStatusEffects(balls, STEP_SECONDS, elapsedSeconds);
    ({ projectiles, spellTrajectories, lightningStrikes } = updateHeroMode(
      balls,
      elapsedSeconds,
      projectiles,
      spellTrajectories,
      lightningStrikes,
    ));
    updateSummonedBear(ballA, STEP_SECONDS, elapsedSeconds);
    updateSummonedBear(ballB, STEP_SECONDS, elapsedSeconds);
    updateStaticCharge(ballA, STEP_SECONDS);
    updateStaticCharge(ballB, STEP_SECONDS);
    forEachBallPair(getAliveCollisionCombatants(balls), (combatantA, combatantB) => {
      resolveBallCollision(combatantA, combatantB, elapsedSeconds);
    });
    hazards = hazards.filter((hazard) => hazard.expiresAt > elapsedSeconds);
    webLinks = webLinks.filter((web) => web.expiresAt > elapsedSeconds);
    flames = flames.filter((flame) => flame.expiresAt > elapsedSeconds);
    updateEnvironmentalHazards(hazards, webLinks, flames, balls, elapsedSeconds);
    spellTrajectories = updateSpellTrajectories(spellTrajectories, elapsedSeconds, balls);
    lightningStrikes = updateLightningStrikes(lightningStrikes, elapsedSeconds);
    projectiles = updateProjectiles(projectiles, STEP_SECONDS, elapsedSeconds, balls);
    updateChainWeapon(ballA, STEP_SECONDS);
    updateChainWeapon(ballB, STEP_SECONDS);
    updateFrostOrbit(ballA, STEP_SECONDS);
    updateFrostOrbit(ballB, STEP_SECONDS);
    updateYoyoWeapon(ballA, STEP_SECONDS, elapsedSeconds);
    updateYoyoWeapon(ballB, STEP_SECONDS, elapsedSeconds);
    forEachOrderedBallPair(balls, elapsedSeconds, (attacker, defender) => {
      if (areAlliedCombatants(attacker, defender)) {
        return;
      }
      updateChainWeaponForPair(attacker, defender, elapsedSeconds);
      updateFrostOrbitForPair(attacker, defender, elapsedSeconds);
      updateYoyoWeaponForPair(attacker, defender, elapsedSeconds);
      updateAttackForPair(attacker, defender, elapsedSeconds, projectiles);
    });

    if (ballA.hp <= 0 || ballB.hp <= 0) {
      return getResult(sceneId, aProfession, bProfession, seed, elapsedSeconds, ballA, ballB);
    }
  }

  return {
    sceneId,
    aProfession,
    bProfession,
    seed,
    timeSeconds: elapsedSeconds,
    winner: "timeout",
    winnerProfession: "timeout",
    aHp: ballA.hp,
    bHp: ballB.hp,
  };
}

function getDuelStart(seed) {
  const start = DUEL_STARTS[(seed - 1) % DUEL_STARTS.length];
  const aPosition = jitterDuelPosition(start.a, seed, 101);
  const bPosition = jitterDuelPosition(start.b, seed, 211);

  return {
    a: {
      ...aPosition,
      direction: getJitteredDuelDirection(aPosition, bPosition, seed, 101),
    },
    b: {
      ...bPosition,
      direction: getJitteredDuelDirection(bPosition, aPosition, seed, 211),
    },
  };
}

function jitterDuelPosition(slot, seed, salt) {
  return {
    x: clamp(slot.x + (seededNoise(seed, salt, 1, 557) - 0.5) * 28, 120, ARENA_SIZE - 120),
    y: clamp(slot.y + (seededNoise(seed, salt, 2, 563) - 0.5) * 28, 120, ARENA_SIZE - 120),
  };
}

function getJitteredDuelDirection(source, target, seed, salt) {
  const baseAngle = Math.atan2(target.y - source.y, target.x - source.x);
  return vectorFromAngle(baseAngle + (seededNoise(seed, salt, 0, 541) - 0.5) * 0.34);
}

function getResult(sceneId, aProfession, bProfession, seed, elapsedSeconds, ballA, ballB) {
  const winner = ballA.hp <= 0 && ballB.hp <= 0 ? "draw" : ballA.hp <= 0 ? "B" : "A";

  return {
    sceneId,
    aProfession,
    bProfession,
    seed,
    timeSeconds: elapsedSeconds,
    winner,
    winnerProfession: winner === "A" ? aProfession : winner === "B" ? bProfession : "draw",
    aHp: ballA.hp,
    bHp: ballB.hp,
  };
}

function simulateItemMode(seed, ballCount = 2) {
  let elapsedSeconds = 0;
  let droppedItems = [];
  let itemFlames = [];
  let itemBuildings = [];
  const itemDropPool = getItemDropPool(seed);
  const stats = createItemModeStats();
  const spawnState = {
    counter: 0,
    nextSpawnTime: 0,
    maxActive: getItemMaxActiveCount(ballCount),
    spawnInterval: getItemSpawnInterval(ballCount),
    dropEntries: itemDropPool,
    recentSpawnZones: [],
  };
  const balls = createSimulatedItemBalls(seed, ballCount);

  for (let index = 0; index < getItemInitialCount(ballCount); index += 1) {
    droppedItems = spawnSimulatedItem(seed, elapsedSeconds, balls, droppedItems, spawnState, itemBuildings);
  }
  spawnState.nextSpawnTime = spawnState.spawnInterval;

  for (let step = 0; step < SIMULATION_LIMIT_SECONDS / STEP_SECONDS; step += 1) {
    elapsedSeconds += STEP_SECONDS;
    for (const ball of balls) {
      if (ball.hp > 0) {
        ball.update(STEP_SECONDS, elapsedSeconds);
      }
    }
    forEachBallPair(balls, (ballA, ballB) => {
      resolveBallCollision(ballA, ballB, elapsedSeconds);
    });
    itemFlames = itemFlames.filter((flame) => flame.expiresAt > elapsedSeconds);
    itemBuildings = itemBuildings.filter((building) => building.expiresAt > elapsedSeconds && building.attacksRemaining > 0 && building.hp > 0);
    updateStatusEffects(balls, STEP_SECONDS, elapsedSeconds);
    updateEnvironmentalHazards([], [], itemFlames, balls, elapsedSeconds);
    updateSimulatedBuildings(itemBuildings, balls, elapsedSeconds, stats);
    droppedItems = updateSimulatedItems(seed, elapsedSeconds, balls, droppedItems, spawnState, stats, itemBuildings);
    forEachOrderedBallPair(balls, elapsedSeconds, (attacker, defender) => {
      updateItemAttackForPair(attacker, defender, elapsedSeconds, seed, stats, itemFlames);
    });

    if (balls.filter((ball) => ball.hp > 0).length <= 1) {
      return getItemModeResult(seed, ballCount, elapsedSeconds, balls, stats);
    }
  }

  return {
    sceneId: ITEM_SCENE_ID,
    seed,
    ballCount,
    timeSeconds: elapsedSeconds,
    winner: "timeout",
    winnerProfession: "timeout",
    aHp: balls[0]?.hp || 0,
    bHp: balls[1]?.hp || 0,
    remainingHp: getRemainingHpByLabel(balls),
    stats,
  };
}

function createSimulatedItemBalls(seed, ballCount) {
  return Array.from({ length: ballCount }, (_, index) => {
    const start = getItemBallStart(seed, index, ballCount);
    return new SimulatedItemBall({
      label: getBallLabel(index),
      ...start,
    });
  });
}

function getItemBallStart(seed, index, ballCount) {
  const rotation = seededNoise(seed, ballCount, 0, 401) * Math.PI * 2;
  const angleJitter = (seededNoise(seed, index, ballCount, 421) - 0.5) * 0.22;
  const angle = -Math.PI / 2 + rotation + (index * Math.PI * 2) / ballCount + angleJitter;
  const spawnRadius = ballCount <= 2 ? 285 : 255;
  const x = ARENA_SIZE / 2 + Math.cos(angle) * spawnRadius;
  const y = ARENA_SIZE / 2 + Math.sin(angle) * spawnRadius;
  const inward = normalize(subtract({ x: ARENA_SIZE / 2, y: ARENA_SIZE / 2 }, { x, y }));
  const tangent = vectorFromAngle(angle + Math.PI / 2);
  const tangentBias = index % 2 === 0 ? 0.34 : -0.34;

  return {
    x,
    y,
    direction: normalize(add(inward, scale(tangent, tangentBias))),
  };
}

function getBallLabel(index) {
  return String.fromCharCode("A".charCodeAt(0) + index);
}

function forEachBallPair(balls, callback) {
  for (let aIndex = 0; aIndex < balls.length; aIndex += 1) {
    const ballA = balls[aIndex];
    if (ballA.hp <= 0) {
      continue;
    }

    for (let bIndex = aIndex + 1; bIndex < balls.length; bIndex += 1) {
      const ballB = balls[bIndex];
      if (ballB.hp > 0) {
        callback(ballA, ballB);
      }
    }
  }
}

function forEachOrderedBallPair(balls, currentTime, callback) {
  const orderedAttackers = getFrameOrderedAliveBalls(balls, currentTime);
  for (const attacker of orderedAttackers) {

    for (const defender of balls) {
      if (defender !== attacker && defender.hp > 0) {
        callback(attacker, defender);
      }
    }
  }
}

function getFrameOrderedAliveBalls(balls, currentTime) {
  const aliveBalls = balls.filter((ball) => ball.hp > 0);
  if (aliveBalls.length <= 1) {
    return aliveBalls;
  }

  const frameIndex = Math.max(0, Math.floor(currentTime / STEP_SECONDS + 0.0001));
  const firstIndex = frameIndex % aliveBalls.length;
  return [...aliveBalls.slice(firstIndex), ...aliveBalls.slice(0, firstIndex)];
}

function createItemModeStats() {
  const itemIds = [...Object.keys(ItemWeaponConfig), ...Object.keys(ItemBuildingConfig)];
  return {
    pickups: 0,
    uses: 0,
    pickupByWeapon: Object.fromEntries(itemIds.map((id) => [id, 0])),
    usesByWeapon: Object.fromEntries(itemIds.map((id) => [id, 0])),
    spellsById: { fire: 0, ice: 0, lightning: 0 },
  };
}

function updateSimulatedItems(seed, currentTime, balls, droppedItems, spawnState, stats, itemBuildings) {
  let nextDroppedItems = droppedItems;
  if (nextDroppedItems.length < spawnState.maxActive && currentTime >= spawnState.nextSpawnTime) {
    nextDroppedItems = spawnSimulatedItem(seed, currentTime, balls, nextDroppedItems, spawnState, itemBuildings);
  }

  return resolveSimulatedItemPickups(currentTime, balls, nextDroppedItems, stats, itemBuildings);
}

function spawnSimulatedItem(seed, currentTime, balls, droppedItems, spawnState, itemBuildings = []) {
  if (droppedItems.length >= spawnState.maxActive) {
    return droppedItems;
  }

  const dropEntries = spawnState.dropEntries || getSimulatedItemDropEntries(seed);
  const spawnIndex = spawnState.counter;
  const weaponNoise = seededNoise(seed, spawnIndex + 17, droppedItems.length + 23, 733);
  const dropEntry = dropEntries[Math.floor(weaponNoise * dropEntries.length) % dropEntries.length];
  const position = createSimulatedItemPosition(seed, spawnIndex, balls, droppedItems, itemBuildings, spawnState, currentTime);
  spawnState.counter += 1;
  if (!position) {
    spawnState.nextSpawnTime = currentTime + ItemSpawnConfig.retryInterval;
    return droppedItems;
  }

  spawnState.nextSpawnTime = currentTime + spawnState.spawnInterval;
  rememberSimulatedItemSpawnZone(spawnState, position, currentTime);

  return [
    ...droppedItems,
    {
      id: `item-${seed}-${spawnIndex}`,
      itemId: dropEntry.id,
      itemType: dropEntry.type,
      weaponId: dropEntry.type === "weapon" ? dropEntry.id : null,
      buildingId: dropEntry.type === "building" ? dropEntry.id : null,
      position,
    },
  ];
}

function getSimulatedItemDropEntries(seed = 1) {
  return getItemDropPool(seed);
}

function createSimulatedItemPosition(seed, spawnIndex, balls, droppedItems, itemBuildings, spawnState, currentTime) {
  pruneSimulatedItemSpawnZones(spawnState, currentTime);
  const padding = ItemSpawnConfig.edgePadding;
  const span = ARENA_SIZE - padding * 2;

  for (let attempt = 0; attempt < ItemSpawnConfig.spawnAttempts; attempt += 1) {
    const position = {
      x: padding + seededNoise(seed, spawnIndex, attempt, 811) * span,
      y: padding + seededNoise(seed, spawnIndex, attempt, 823) * span,
    };
    if (!isSimulatedItemSpawnPositionBlocked(position, balls, droppedItems, itemBuildings, spawnState.recentSpawnZones)) {
      return position;
    }
  }

  return null;
}

function isSimulatedItemSpawnPositionBlocked(position, balls, droppedItems, itemBuildings, recentSpawnZones) {
  const tooCloseToBall = balls.some((ball) => {
    return ball.hp > 0 && length(subtract(ball.position, position)) < ItemSpawnConfig.avoidBallRadius;
  });
  if (tooCloseToBall) {
    return true;
  }

  const tooCloseToDroppedItem = droppedItems.some((item) => {
    return length(subtract(item.position, position)) < ItemSpawnConfig.avoidItemRadius;
  });
  if (tooCloseToDroppedItem) {
    return true;
  }

  const tooCloseToBuilding = itemBuildings.some((building) => {
    return length(subtract(building.position, position)) < ItemSpawnConfig.avoidItemRadius + building.radius;
  });
  if (tooCloseToBuilding) {
    return true;
  }

  return recentSpawnZones.some((zone) => {
    return length(subtract(zone.position, position)) < ItemSpawnConfig.recentSpawnAvoidRadius;
  });
}

function rememberSimulatedItemSpawnZone(spawnState, position, currentTime) {
  spawnState.recentSpawnZones.push({
    position: { ...position },
    expiresAt: currentTime + ItemSpawnConfig.recentSpawnAvoidDuration,
  });
  pruneSimulatedItemSpawnZones(spawnState, currentTime);
}

function pruneSimulatedItemSpawnZones(spawnState, currentTime) {
  spawnState.recentSpawnZones = spawnState.recentSpawnZones.filter((zone) => zone.expiresAt > currentTime);
}

function resolveSimulatedItemPickups(currentTime, balls, droppedItems, stats, itemBuildings) {
  return droppedItems.filter((item) => {
    const picker = balls.find((ball) => {
      return ball.hp > 0 && length(subtract(ball.position, item.position)) <= ball.radius + ItemSpawnConfig.pickupRadius;
    });

    if (!picker) {
      return true;
    }

    const itemType = item.itemType || (item.buildingId ? "building" : "weapon");
    const itemId = item.itemId || item.weaponId || item.buildingId;
    if (itemType === "building") {
      deploySimulatedBuilding(picker, itemId, item.position, currentTime, itemBuildings, stats);
    } else {
      equipSimulatedItem(picker, itemId, currentTime);
    }
    stats.pickups += 1;
    stats.pickupByWeapon[itemId] += 1;
    return false;
  });
}

function equipSimulatedItem(ball, weaponId, currentTime) {
  const weapon = ItemWeaponConfig[weaponId];
  if (!weapon) {
    return;
  }

  ball.equippedItem = {
    weaponId,
    durability: weapon.durability,
  };
  ball.lastAttackTime = Math.min(ball.lastAttackTime, currentTime - weapon.cooldown * 0.5);
}

function deploySimulatedBuilding(owner, buildingId, position, currentTime, itemBuildings, stats) {
  const config = ItemBuildingConfig[buildingId];
  if (!config) {
    return;
  }

  const building = {
    kind: "itemBuilding",
    buildingId,
    owner,
    teamId: owner.teamId,
    position: clampPointToArena(position, config.radius),
    radius: config.radius,
    hp: 1,
    config,
    lastAttackTime: currentTime - config.cooldown * 0.72,
    attacksRemaining: config.maxAttacks || Infinity,
    expiresAt: currentTime + config.duration,
  };
  itemBuildings.push(building);

  if (config.supportKind === "heal") {
    startSimulatedGasStationHeal(owner, building, currentTime);
    stats.uses += 1;
    stats.usesByWeapon[buildingId] += 1;
  }
}

function startSimulatedGasStationHeal(ball, station, currentTime) {
  const config = station.config;
  const healableAmount = Math.min(config.healAmount || 0, Math.max(0, ball.config.maxHp - ball.hp));
  station.healingTarget = ball;
  station.healingStartedAt = currentTime;
  station.healingUntil = currentTime + config.healDuration;
  station.healingAmount = healableAmount;

  if (healableAmount <= 0) {
    station.expiresAt = Math.min(station.expiresAt, currentTime + 0.55);
    return;
  }

  ball.attackState = null;
  ball.stationHealState = {
    station,
    expiresAt: currentTime + config.healDuration,
    lockUntil: currentTime + config.healDuration,
    lastTickAt: currentTime,
    remainingHeal: healableAmount,
    healRate: healableAmount / Math.max(0.001, config.healDuration),
  };
  ball.attackDisabledUntil = Math.max(ball.attackDisabledUntil, currentTime + config.healDuration);
}

function updateSimulatedBuildings(itemBuildings, balls, currentTime, stats) {
  for (const building of itemBuildings) {
    const config = building.config;
    if (building.hp <= 0 || currentTime - building.lastAttackTime < config.cooldown || building.attacksRemaining <= 0) {
      continue;
    }

    if (config.supportKind === "heal") {
      continue;
    }

    const targets =
      building.buildingId === "cannon"
        ? getSimulatedBuildingTargets(building, balls, itemBuildings, { includeBuildings: true })
        : getSimulatedBuildingTargets(building, balls, itemBuildings);
    if (targets.length === 0) {
      continue;
    }

    if (building.buildingId === "prismTower") {
      applySimulatedBuildingHit(building, targets[0], currentTime);
      const chainedTargets = targets
        .filter((target) => target !== targets[0] && length(subtract(target.position, targets[0].position)) <= config.refractionRadius + target.radius)
        .slice(0, config.refractionCount);
      for (const chainedTarget of chainedTargets) {
        applySimulatedBuildingHit(building, chainedTarget, currentTime, targets[0].position);
      }
    } else if (building.buildingId === "bunker") {
      const targetLimit = Math.max(1, Math.floor((config.bulletCount || 6) / 3));
      for (const target of targets.slice(0, targetLimit)) {
        applySimulatedBuildingHit(building, target, currentTime);
      }
    } else if (building.buildingId === "cannon") {
      applySimulatedBuildingHit(building, targets.at(-1), currentTime, null, config.explosionDamage);
    } else if (building.buildingId === "teslaCoil") {
      const target = targets[0];
      applySimulatedBuildingHit(building, target, currentTime);
      target.paralyzedUntil = Math.max(target.paralyzedUntil, currentTime + config.paralyzeDuration);
    }

    building.lastAttackTime = currentTime;
    stats.uses += 1;
    stats.usesByWeapon[building.buildingId] += 1;
    if (Number.isFinite(building.attacksRemaining)) {
      building.attacksRemaining -= 1;
      if (building.attacksRemaining <= 0) {
        building.expiresAt = Math.min(building.expiresAt, currentTime + 0.22);
      }
    }
  }
}

function getSimulatedBuildingTargets(building, balls, itemBuildings, options = {}) {
  return [
    ...balls.filter((ball) => {
      return (
        ball.hp > 0 &&
        ball.teamId !== building.teamId &&
        length(subtract(ball.position, building.position)) <= building.config.range + building.radius + ball.radius
      );
    }),
    ...(options.includeBuildings
      ? itemBuildings.filter((targetBuilding) => {
          return (
            targetBuilding !== building &&
            targetBuilding.hp > 0 &&
            targetBuilding.teamId !== building.teamId &&
            length(subtract(targetBuilding.position, building.position)) <=
              building.config.range + building.radius + targetBuilding.radius
          );
        })
      : []),
  ].sort((targetA, targetB) => {
    return length(subtract(targetA.position, building.position)) - length(subtract(targetB.position, building.position));
  });
}

function applySimulatedBuildingHit(building, target, currentTime, origin = null, bonusSplashDamage = 0) {
  if (!target || target.hp <= 0) {
    return;
  }

  if (target.kind === "itemBuilding") {
    target.hp = 0;
    target.attacksRemaining = 0;
    target.expiresAt = Math.min(target.expiresAt, currentTime);
    return;
  }

  const attackOrigin = origin || building.position;
  const normal = normalize(subtract(target.position, attackOrigin));
  const damage = damageBall(target, building.config.damage + (bonusSplashDamage || 0) * 0.45);
  if (damage > 0) {
    target.velocity = add(target.velocity, scale(normal, 56 * (building.config.knockbackMultiplier || 0.45)));
    keepSpeed(target, currentTime);
  }
}

function updateItemAttackForPair(attacker, defender, currentTime, seed, stats, itemFlames) {
  const weapon = attacker.equippedItem ? ItemWeaponConfig[attacker.equippedItem.weaponId] : null;
  if (!weapon || attacker.hp <= 0 || defender.hp <= 0 || currentTime - attacker.lastAttackTime < weapon.cooldown) {
    return;
  }

  if (!isSimulatedItemInRange(attacker, defender, weapon)) {
    return;
  }

  const attackVariant = getSimulatedItemAttackVariant(weapon, attacker, defender, currentTime, seed, stats);
  const normal = getDirectionBetween(attacker, defender);
  if (weapon.projectileKind === "torch" && weapon.groundFire) {
    spawnSimulatedTorchFire(attacker, defender, weapon, normal, currentTime, itemFlames);
  } else {
    const coneHit = weapon.kind === "cone" ? getSimulatedItemConeHit(attacker, defender, weapon) : null;
    const resolvedVariant = coneHit ? { ...attackVariant, damage: coneHit.damage, knockbackMultiplier: coneHit.knockbackMultiplier } : attackVariant;
    const damage = damageBall(defender, resolvedVariant.damage);
    applySimulatedItemKnockback(attacker, defender, normal, damage, resolvedVariant, currentTime);

    if (weapon.kind === "rocket" && weapon.explosionDamage > 0) {
      const explosionDamage = damageBall(defender, weapon.explosionDamage * 0.45);
      applySimulatedItemKnockback(attacker, defender, normal, explosionDamage, weapon, currentTime);
    }
  }

  attacker.lastAttackTime = currentTime;
  attacker.equippedItem.durability -= 1;
  stats.uses += 1;
  stats.usesByWeapon[weapon.id] += 1;
  if (attacker.equippedItem.durability <= 0) {
    attacker.equippedItem = null;
  }
}

function spawnSimulatedTorchFire(attacker, defender, weapon, direction, currentTime, itemFlames) {
  const fire = weapon.groundFire;
  const distanceToDefender = length(subtract(defender.position, attacker.position));
  const landingDistance = clamp(distanceToDefender, attacker.radius + 74, weapon.throwDistance || distanceToDefender);
  const position = clampPointToArena(add(attacker.position, scale(direction, landingDistance)), fire.radius);
  itemFlames.push({
    owner: attacker,
    position,
    radius: fire.radius,
    damage: fire.damage,
    hitCooldown: fire.hitCooldown,
    expiresAt: currentTime + fire.duration,
  });
}

function isSimulatedItemInRange(attacker, defender, weapon) {
  return length(subtract(defender.position, attacker.position)) <= attacker.radius + defender.radius + weapon.range;
}

function getSimulatedItemAttackVariant(weapon, attacker, defender, currentTime, seed, stats) {
  if (weapon.kind !== "spell") {
    return weapon;
  }

  const spellNoise = seededNoise(seed, Math.floor(currentTime * 11), attacker.label.charCodeAt(0), 919);
  const spell = weapon.spellBook[Math.floor(spellNoise * weapon.spellBook.length) % weapon.spellBook.length];
  stats.spellsById[spell.id] += 1;
  return spell;
}

function getSimulatedItemConeHit(attacker, defender, weapon) {
  const centerDistance = length(subtract(defender.position, attacker.position));
  const edgeDistance = Math.max(0, centerDistance - attacker.radius - defender.radius);
  const distanceProgress = clamp(edgeDistance / Math.max(1, weapon.range), 0, 1);
  const closeDamage = weapon.damage || 1;
  const farDamage = weapon.minDamage || Math.max(1, Math.round(closeDamage * 0.42));
  return {
    damage: Math.max(1, Math.round(lerp(closeDamage, farDamage, distanceProgress))),
    knockbackMultiplier: lerp(weapon.knockbackMultiplier || 0.58, (weapon.knockbackMultiplier || 0.58) * 0.72, distanceProgress),
  };
}

function applySimulatedItemKnockback(attacker, defender, normalFromAttackerToDefender, damage, attackVariant, elapsedSeconds) {
  if (damage <= 0) {
    return;
  }

  const push = 56 * (attackVariant.knockbackMultiplier || 0.9);
  defender.velocity = add(defender.velocity, scale(normalFromAttackerToDefender, push));
  keepSpeed(attacker, elapsedSeconds);
  keepSpeed(defender, elapsedSeconds);
}

function getItemModeResult(seed, ballCount, elapsedSeconds, balls, stats) {
  const aliveBalls = balls.filter((ball) => ball.hp > 0);
  const winner = aliveBalls.length === 0 ? "draw" : aliveBalls[0].label;

  return {
    sceneId: ITEM_SCENE_ID,
    seed,
    ballCount,
    timeSeconds: elapsedSeconds,
    winner,
    winnerProfession: winner === "draw" ? "draw" : `Ball ${winner}`,
    aHp: balls[0]?.hp || 0,
    bHp: balls[1]?.hp || 0,
    remainingHp: getRemainingHpByLabel(balls),
    stats,
  };
}

function getRemainingHpByLabel(balls) {
  return Object.fromEntries(balls.map((ball) => [ball.label, Math.ceil(ball.hp)]));
}

function updateHeroMode(balls, currentTime, projectiles, spellTrajectories, lightningStrikes) {
  for (const hero of getFrameOrderedAliveBalls(balls, currentTime)) {
    expireHeroSkillEffects(hero, currentTime);
    useHeroAutoSkills(hero, balls, currentTime, projectiles, spellTrajectories, lightningStrikes);
  }

  return { projectiles, spellTrajectories, lightningStrikes };
}

function useHeroAutoSkills(hero, balls, currentTime, projectiles, spellTrajectories, lightningStrikes) {
  if (!hero.isHero || hero.hp <= 0 || isBallControlLocked(hero, currentTime)) {
    return false;
  }

  const skills = [...(hero.config.skills || [])].sort(getHeroAutoSkillPriority);
  for (const skill of skills) {
    const handler = getHeroAutoSkillHandler(skill);
    if (handler && handler(hero, skill, balls, currentTime, projectiles, spellTrajectories, lightningStrikes)) {
      return true;
    }
  }

  return false;
}

function getHeroAutoSkillPriority(skillA, skillB) {
  return (skillA.autoPriority ?? 99) - (skillB.autoPriority ?? 99);
}

function getHeroAutoSkillHandler(skill) {
  if (skill.type === "aoeBurn") {
    return useHeroManaBurn;
  }
  if (skill.type === "homingProjectile") {
    return useHeroThunderHammer;
  }
  if (skill.type === "groundSlam" || skill.type === "warStomp") {
    return useHeroAreaControlSkill;
  }
  if (skill.type === "impale") {
    return useCryptLordImpale;
  }
  if (skill.type === "summonBeetle") {
    return useCryptLordSummonBeetle;
  }
  if (skill.type === "heal") {
    return useHeroForestBlessing;
  }
  if (skill.type === "staffBuff") {
    return useHeroStaffBuff;
  }
  if (skill.type === "delayedLightning") {
    return useHeroDelayedLightning;
  }
  if (skill.type === "divineDescent") {
    return useHeroDivineDescent;
  }
  return null;
}

function regenerateHeroMana(ball, deltaTime) {
  if (!ball.maxMp || ball.hp <= 0) {
    return;
  }

  ball.mp = Math.min(ball.maxMp, ball.mp + ball.manaRegen * deltaTime);
}

function useHeroManaBurn(hero, skill, balls, currentTime) {
  if (!skill || !canUseHeroSkill(hero, skill, currentTime)) {
    return false;
  }

  const enemy = getNearestHeroSkillTargetInRange(hero, balls, skill);
  if (!enemy) {
    return false;
  }

  spendHeroSkill(hero, skill, currentTime);
  const manaBurned = drainMana(enemy, skill.manaDamage);
  resolveAttackHit(
    hero,
    enemy,
    getDirectionBetween(hero, enemy),
    currentTime,
    createHeroSkillVariant(hero, skill, {
      damage: skill.damage + Math.floor(manaBurned * 0.25),
      knockbackMultiplier: skill.knockbackMultiplier,
    }),
  );
  return true;
}

function useHeroThunderHammer(hero, skill, balls, currentTime, projectiles) {
  if (!skill || !canUseHeroSkill(hero, skill, currentTime)) {
    return false;
  }

  const enemy = getNearestAliveOpponent(hero, balls);
  if (!enemy) {
    return false;
  }

  spendHeroSkill(hero, skill, currentTime);
  const direction = getProjectileAimDirection(hero, enemy, skill.speed);
  const position = add(hero.position, scale(direction, hero.radius + skill.spawnOffset));
  projectiles.push({
    owner: hero,
    target: enemy,
    kind: "thunderHammer",
    position,
    previousPosition: { ...position },
    direction,
    speed: skill.speed,
    headRadius: skill.headRadius,
    collisionRadius: skill.headRadius,
    shaftLength: skill.shaftLength,
    shaftRadius: 12,
    homingStrength: 0.12,
    variant: createHeroSkillVariant(hero, skill, {
      damage: skill.damage,
      stunDuration: skill.stunDuration,
      knockbackMultiplier: skill.knockbackMultiplier,
    }),
  });
  return true;
}

function useHeroAreaControlSkill(hero, skill, balls, currentTime) {
  if (!skill || !canUseHeroSkill(hero, skill, currentTime)) {
    return false;
  }

  const targets = getHeroSkillTargetsInRange(hero, balls, skill);
  if (targets.length === 0) {
    return false;
  }

  spendHeroSkill(hero, skill, currentTime);
  for (const enemy of targets) {
    resolveAttackHit(
      hero,
      enemy,
      getDirectionBetween(hero, enemy),
      currentTime,
      createHeroSkillVariant(hero, skill, {
        damage: skill.damage,
        slowMultiplier: skill.slowMultiplier,
        slowDuration: skill.slowDuration,
        stunDuration: skill.stunDuration,
        knockbackMultiplier: skill.knockbackMultiplier,
      }),
    );
  }
  return true;
}

function useCryptLordImpale(hero, skill, balls, currentTime, projectiles, spellTrajectories) {
  if (!skill || !canUseHeroSkill(hero, skill, currentTime)) {
    return false;
  }

  const enemy = getNearestHeroSkillTargetInRange(hero, balls, skill);
  if (!enemy) {
    return false;
  }

  spendHeroSkill(hero, skill, currentTime);
  const direction = getDirectionBetween(hero, enemy);
  const start = add(hero.position, scale(direction, hero.radius * 0.92));
  const maxDistance = Math.min(skill.range, getArenaRayDistance(start, direction));
  spellTrajectories.push({
    owner: hero,
    kind: "impale",
    start,
    direction,
    maxDistance,
    activeLength: skill.activeLength || 120,
    speed: skill.speed,
    collisionRadius: skill.collisionRadius,
    createdAt: currentTime,
    expiresAt: currentTime + maxDistance / Math.max(1, skill.speed) + 0.28,
    hitLabels: {},
    variant: createHeroSkillVariant(hero, skill, {
      damage: skill.damage,
      stunDuration: skill.stunDuration,
      knockbackMultiplier: skill.knockbackMultiplier,
    }),
  });
  hero.lastAttackTime = Math.min(hero.lastAttackTime, currentTime - getBallAttackCooldown(hero) * 0.42);
  return true;
}

function useCryptLordSummonBeetle(hero, skill, balls, currentTime) {
  if (!skill || !canUseHeroSkill(hero, skill, currentTime)) {
    return false;
  }

  const enemy = getNearestAliveOpponent(hero, balls);
  if (!enemy || getActiveCryptBeetles(hero, balls, currentTime).length >= skill.maxCount) {
    return false;
  }

  spendHeroSkill(hero, skill, currentTime);
  balls.push(createCryptBeetle(hero, skill, enemy, currentTime));
  return true;
}

function createCryptBeetle(owner, skill, enemy, currentTime) {
  cryptBeetleCounter += 1;
  const enemyDirection = normalize(subtract(enemy.position, owner.position));
  const side = vectorFromAngle(angleOf(enemyDirection) + Math.PI / 2);
  const sideSign = cryptBeetleCounter % 2 === 0 ? 1 : -1;
  const spawnDirection = normalize(add(enemyDirection, scale(side, 0.42 * sideSign)));
  const radius = skill.radius * BALL_RADIUS_MULTIPLIER;
  const spawnDistance = owner.radius + radius + 18;
  const position = clampPointToArena(add(owner.position, scale(spawnDirection, spawnDistance)), radius);
  const config = createCryptBeetleConfig(skill);
  const beetle = new SimulatedBall({
    label: `${owner.label}-beetle-${cryptBeetleCounter}`,
    profession: "cryptBeetle",
    x: position.x,
    y: position.y,
    direction: spawnDirection,
    config,
  });

  beetle.kind = "cryptBeetle";
  beetle.owner = owner;
  beetle.teamId = owner.teamId;
  beetle.isPrimaryCombatant = false;
  beetle.radius = radius;
  beetle.baseRadius = radius;
  beetle.hp = skill.maxHp;
  beetle.maxHp = skill.maxHp;
  beetle.expiresAt = currentTime + skill.duration;
  return beetle;
}

function createCryptBeetleConfig(skill) {
  return {
    id: "cryptBeetle",
    name: "小甲虫",
    maxHp: skill.maxHp,
    radius: skill.radius,
    moveSpeed: skill.moveSpeed,
    attackDamage: skill.damage,
    attackCooldown: skill.attackCooldown,
    weaponRange: skill.weaponRange,
    attackMode: "beetle",
    item: {
      name: "小甲虫利齿",
      type: "mandibles",
      animation: "啃咬",
    },
    getDamage() {
      return this.attackDamage;
    },
    getKnockbackMultiplier(attacker, defender, normalFromAttackerToDefender, damage, attackVariant) {
      return attackVariant?.knockbackMultiplier || skill.knockbackMultiplier || 0.28;
    },
    isSkillHit() {
      return false;
    },
  };
}

function getActiveCryptBeetles(hero, balls, currentTime) {
  return balls.filter((ball) => ball.kind === "cryptBeetle" && ball.owner === hero && ball.hp > 0 && ball.expiresAt > currentTime);
}

function useHeroForestBlessing(hero, skill, balls, currentTime) {
  if (!skill || !canUseHeroSkill(hero, skill, currentTime) || hero.hp / hero.maxHp > skill.triggerHpRatio) {
    return false;
  }

  spendHeroSkill(hero, skill, currentTime);
  healBall(hero, skill.heal);
  return true;
}

function useHeroStaffBuff(hero, skill, balls, currentTime) {
  if (!skill || !canUseHeroSkill(hero, skill, currentTime)) {
    return false;
  }

  const enemy = getNearestAliveOpponent(hero, balls);
  if (!enemy || !isInHeroSkillRange(hero, enemy, skill.triggerRange) || !canUseWukongStaffBuffAtDistance(hero, enemy, skill)) {
    return false;
  }

  spendHeroSkill(hero, skill, currentTime);
  activateHeroSkillEffect(hero, skill, currentTime);
  hero.lastAttackTime = Math.min(hero.lastAttackTime, currentTime - getBallAttackCooldown(hero) * 0.58);
  return true;
}

function useHeroDelayedLightning(hero, skill, balls, currentTime, projectiles, spellTrajectories, lightningStrikes) {
  if (!skill || !canUseHeroSkill(hero, skill, currentTime)) {
    return false;
  }

  const enemy = getNearestHeroSkillTargetInRange(hero, balls, skill);
  if (!enemy) {
    return false;
  }

  spendHeroSkill(hero, skill, currentTime);
  const warningDuration = skill.warningDuration || 0.6;
  const predictionTime = skill.predictionTime || warningDuration;
  lightningStrikes.push({
    owner: hero,
    target: enemy,
    targetPosition: clampPointToArena(add(enemy.position, scale(enemy.velocity, predictionTime)), skill.radius),
    targetVelocity: { ...enemy.velocity },
    targetStartPosition: { ...enemy.position },
    impactAt: currentTime + warningDuration,
    expiresAt: currentTime + warningDuration + 0.38,
    radius: skill.radius,
    resolved: false,
    variant: createHeroSkillVariant(hero, skill, {
      damage: skill.damage,
      knockbackMultiplier: skill.knockbackMultiplier,
    }),
    predictionTime,
    velocityChangeTolerance: skill.velocityChangeTolerance || 72,
    positionChangeTolerance: skill.positionChangeTolerance || 40,
  });
  return true;
}

function useHeroDivineDescent(hero, skill, balls, currentTime) {
  if (!skill || !canUseHeroSkill(hero, skill, currentTime)) {
    return false;
  }

  const enemy = getNearestAliveOpponent(hero, balls);
  const shouldDefend = hero.hp / hero.maxHp <= (skill.triggerHpRatio || 1);
  const shouldEngage = enemy && isInHeroSkillRange(hero, enemy, skill.triggerRange || 0);
  if (!shouldDefend && !shouldEngage) {
    return false;
  }

  spendHeroSkill(hero, skill, currentTime);
  hero.hp = Math.min(hero.maxHp, hero.hp + Math.max(1, Math.ceil(hero.hp * (skill.healthMultiplier || 0.1))));
  activateHeroSkillEffect(hero, skill, currentTime);
  return true;
}

function getHeroSkillTargetsInRange(hero, balls, skill) {
  return getAliveOpponents(hero, balls)
    .filter((enemy) => isInHeroSkillRange(hero, enemy, skill.range))
    .sort((enemyA, enemyB) => length(subtract(enemyA.position, hero.position)) - length(subtract(enemyB.position, hero.position)));
}

function getNearestHeroSkillTargetInRange(hero, balls, skill) {
  return getHeroSkillTargetsInRange(hero, balls, skill)[0] || null;
}

function getNearestAliveOpponent(hero, balls) {
  return getAliveOpponents(hero, balls).sort((enemyA, enemyB) => {
    return length(subtract(enemyA.position, hero.position)) - length(subtract(enemyB.position, hero.position));
  })[0] || null;
}

function getAliveOpponents(ball, balls) {
  return balls.filter((candidate) => candidate !== ball && candidate.hp > 0 && !areAlliedCombatants(ball, candidate));
}

function isInHeroSkillRange(hero, enemy, range) {
  return Number.isFinite(range) && length(subtract(enemy.position, hero.position)) <= range + hero.radius + enemy.radius;
}

function getHeroSkill(hero, skillId) {
  return hero.config.skills?.find((skill) => skill.id === skillId) || null;
}

function canUseHeroSkill(hero, skill, currentTime) {
  if (hero.mp < skill.manaCost) {
    return false;
  }

  if (skill.exclusiveGroup && hasActiveHeroSkillInGroup(hero, skill.exclusiveGroup, currentTime)) {
    return false;
  }

  const lastUsedAt = hero.heroSkillCooldowns[skill.id] ?? -Infinity;
  return currentTime - lastUsedAt >= skill.cooldown;
}

function spendHeroSkill(hero, skill, currentTime) {
  hero.mp = Math.max(0, hero.mp - skill.manaCost);
  hero.heroSkillCooldowns[skill.id] = currentTime;
}

function createHeroSkillVariant(hero, skill, extra = {}) {
  return {
    heroSkillId: skill.id,
    heroId: hero.profession,
    isSkillHit: true,
    ...skill,
    ...extra,
  };
}

function activateHeroSkillEffect(hero, skill, currentTime) {
  if (!skill.duration || skill.duration <= 0) {
    return;
  }

  hero.heroSkillEffects[skill.id] = {
    id: skill.id,
    type: skill.type,
    exclusiveGroup: skill.exclusiveGroup || null,
    expiresAt: currentTime + skill.duration,
    staffCount: skill.staffCount || 1,
    spreadAngle: skill.spreadAngle || 0,
    rangeMultiplier: skill.rangeMultiplier || 1,
    damageMultiplier: skill.damageMultiplier || 1,
    knockbackMultiplier: skill.knockbackMultiplier || null,
    radiusMultiplier: skill.radiusMultiplier || 1,
  };

  if (skill.type === "divineDescent") {
    hero.radius = hero.baseRadius * (skill.radiusMultiplier || 1);
    hero.position = clampPointToArena(hero.position, hero.radius);
  }
}

function expireHeroSkillEffects(hero, currentTime) {
  if (!hero.heroSkillEffects) {
    return;
  }

  for (const [skillId, effect] of Object.entries(hero.heroSkillEffects)) {
    if (effect.expiresAt <= currentTime) {
      delete hero.heroSkillEffects[skillId];
      expireHeroSkillEffect(hero, effect);
    }
  }
}

function getActiveHeroSkillEffect(hero, skillId, currentTime = simulationElapsedSeconds) {
  const effect = hero.heroSkillEffects?.[skillId] || null;
  if (!effect) {
    return null;
  }

  if (effect.expiresAt <= currentTime) {
    delete hero.heroSkillEffects[skillId];
    expireHeroSkillEffect(hero, effect);
    return null;
  }

  return effect;
}

function expireHeroSkillEffect(hero, effect) {
  if (effect.type === "divineDescent") {
    hero.radius = hero.baseRadius;
    hero.position = clampPointToArena(hero.position, hero.radius);
  }
}

function hasActiveHeroSkillInGroup(hero, exclusiveGroup, currentTime) {
  expireHeroSkillEffects(hero, currentTime);
  return Object.values(hero.heroSkillEffects || {}).some((effect) => effect.exclusiveGroup === exclusiveGroup);
}

function drainMana(ball, amount) {
  if (!ball.maxMp || amount <= 0) {
    return 0;
  }

  const drained = Math.min(ball.mp, amount);
  ball.mp = Math.max(0, ball.mp - drained);
  return drained;
}

function applySlow(ball, slowMultiplier, slowDuration, currentTime) {
  ball.slowMultiplier = Math.min(ball.slowMultiplier || 1, slowMultiplier);
  ball.slowUntil = Math.max(ball.slowUntil || 0, currentTime + slowDuration);
  keepSpeed(ball, currentTime);
}

function canUseWukongStaffBuffAtDistance(hero, enemy, skill) {
  if (hero.profession !== "wukong") {
    return true;
  }

  const distanceToEnemy = length(subtract(enemy.position, hero.position));
  const baseReach = hero.radius + enemy.radius + hero.weaponRange;
  if (skill.id === "tripleStaff") {
    return distanceToEnemy <= baseReach + 58;
  }
  if (skill.id === "giantStaff") {
    return distanceToEnemy > baseReach + 24;
  }
  return true;
}

function getBallAttackCooldown(ball) {
  return ball.attackCooldown;
}

function updateSpellTrajectories(spellTrajectories, currentTime, balls) {
  return spellTrajectories.filter((trajectory) => {
    if (trajectory.expiresAt <= currentTime) {
      return false;
    }
    if (trajectory.kind === "impale") {
      resolveImpaleTrajectoryCollisions(trajectory, currentTime, balls);
    }
    return true;
  });
}

function resolveImpaleTrajectoryCollisions(trajectory, currentTime, balls) {
  const segment = getImpaleActiveSegment(trajectory, currentTime);
  if (!segment) {
    return;
  }

  for (const defender of balls) {
    const hitKey = defender.label || defender.id;
    if (
      !hitKey ||
      defender.hp <= 0 ||
      trajectory.hitLabels[hitKey] ||
      areAlliedCombatants(trajectory.owner, defender)
    ) {
      continue;
    }

    const hit = getSegmentCircleHit(defender.position, defender.radius + trajectory.collisionRadius, segment.start, segment.end);
    if (!hit) {
      continue;
    }

    trajectory.hitLabels[hitKey] = true;
    resolveAttackHit(trajectory.owner, defender, trajectory.direction, currentTime, trajectory.variant);
  }
}

function getImpaleActiveSegment(trajectory, currentTime) {
  const travel = Math.min(trajectory.maxDistance, Math.max(0, (currentTime - trajectory.createdAt) * trajectory.speed));
  if (travel <= 0) {
    return null;
  }

  const activeStart = Math.max(0, travel - trajectory.activeLength);
  const activeEnd = Math.min(trajectory.maxDistance, travel);
  if (activeEnd <= activeStart) {
    return null;
  }

  return {
    start: add(trajectory.start, scale(trajectory.direction, activeStart)),
    end: add(trajectory.start, scale(trajectory.direction, activeEnd)),
  };
}

function updateLightningStrikes(lightningStrikes, currentTime) {
  return lightningStrikes.filter((strike) => {
    if (!strike.resolved && currentTime >= strike.impactAt) {
      strike.resolved = true;
      resolveLightningStrike(strike, currentTime);
    }
    return strike.expiresAt > currentTime;
  });
}

function resolveLightningStrike(strike, currentTime) {
  const defender = strike.target;
  if (!defender || defender.hp <= 0 || areAlliedCombatants(strike.owner, defender)) {
    return;
  }

  const expectedPosition = add(strike.targetStartPosition, scale(strike.targetVelocity, strike.predictionTime));
  const velocityDelta = length(subtract(defender.velocity, strike.targetVelocity));
  const positionDelta = length(subtract(defender.position, expectedPosition));
  const distanceToStrike = length(subtract(defender.position, strike.targetPosition));
  const stillCommitted =
    velocityDelta <= strike.velocityChangeTolerance &&
    positionDelta <= strike.positionChangeTolerance &&
    distanceToStrike <= strike.radius + defender.radius;

  if (stillCommitted) {
    resolveAttackHit(strike.owner, defender, normalize(subtract(defender.position, strike.targetPosition)), currentTime, strike.variant);
  }
}

function updateAttackForPair(attacker, defender, currentTime, projectiles) {
  if (areAlliedCombatants(attacker, defender)) {
    return;
  }

  if (["chainSpin", "frostOrbit", "yoyo", "summonBear", "staticCharge"].includes(attacker.config.attackMode)) {
    return;
  }

  if (isBallControlLocked(attacker, currentTime)) {
    attacker.attackState = null;
    return;
  }

  updateAttackState(attacker, currentTime, projectiles);

  const canStartAttack =
    attacker.config.attackMode === "projectile" ||
    (attacker.config.attackMode === "cone" && isInHeroConeRange(attacker, defender)) ||
    isInAttackRange(attacker, defender);
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
  } else if (attacker.config.attackMode === "cone") {
    if (!attackState.didDealDamage && progress >= attackState.hitFrame) {
      attackState.didDealDamage = true;
      resolveHeroConeAttack(attacker, attackState.defender, currentTime);
    }
  } else if (attacker.config.attackMode === "staff") {
    if (!attackState.didDealDamage && progress >= attackState.hitFrame) {
      attackState.didDealDamage = true;
      resolveHeroStaffAttack(attacker, attackState.defender, currentTime);
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

  const variant = attacker.attackState?.variant || null;
  const weapon = variant?.heroSkillId === "fireArrow" ? variant : attacker.config.projectileWeapon;
  const direction = getProjectileAimDirection(attacker, defender, weapon.speed);
  const position = add(attacker.position, scale(direction, attacker.radius + weapon.spawnOffset));
  attacker.attackState.direction = direction;
  attacker.lastAttackTime = currentTime;
  projectiles.push({
    owner: attacker,
    kind: variant?.heroSkillId === "fireArrow" ? "fireArrow" : "projectile",
    position,
    previousPosition: { ...position },
    direction,
    speed: weapon.speed,
    headRadius: weapon.headRadius,
    collisionRadius: weapon.headRadius,
    shaftLength: weapon.shaftLength,
    shaftRadius: weapon.shaftRadius || 4,
    variant,
  });
}

function updateProjectiles(projectiles, deltaTime, currentTime, balls) {
  return projectiles.filter((projectile) => {
    projectile.previousPosition = { ...projectile.position };
    updateHomingProjectileDirection(projectile);
    projectile.position = add(projectile.position, scale(projectile.direction, projectile.speed * deltaTime));

    if (!isProjectileInArena(projectile)) {
      return false;
    }

    const defender = balls.find((ball) => {
      const hit = projectile.owner?.isHero ? getProjectileTrajectoryHit(projectile, ball) : isProjectileHeadColliding(projectile, ball);
      return ball.hp > 0 && !areAlliedCombatants(projectile.owner, ball) && hit;
    });
    if (!defender) {
      return true;
    }

    resolveAttackHit(projectile.owner, defender, projectile.direction, currentTime, projectile.variant);
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

function updateHomingProjectileDirection(projectile) {
  if (!projectile.homingStrength || !projectile.target || projectile.target.hp <= 0) {
    return;
  }

  const desiredDirection = normalize(subtract(projectile.target.position, projectile.position));
  projectile.direction = normalize(lerpVector(projectile.direction, desiredDirection, projectile.homingStrength));
}

function getProjectileTrajectoryHit(projectile, defender) {
  const sweepHit = getSegmentCircleHit(
    defender.position,
    defender.radius + (projectile.collisionRadius || projectile.headRadius),
    projectile.previousPosition || projectile.position,
    projectile.position,
  );

  if (sweepHit) {
    return sweepHit;
  }

  const tail = add(projectile.position, scale(projectile.direction, -(projectile.shaftLength || 0)));
  return getSegmentCircleHit(defender.position, defender.radius + (projectile.shaftRadius || 0), tail, projectile.position);
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

  ball.frostOrbitState.rotationAngle = normalizeAngle(
    ball.frostOrbitState.rotationAngle + ball.config.frostOrbit.spinSpeed * ball.frostOrbitState.spinDirection * deltaTime,
  );
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

function updateYoyoWeapon(ball, deltaTime, currentTime) {
  const state = ball.yoyoWeaponState;
  if (!state || ball.hp <= 0) {
    return;
  }

  const weapon = ball.config.yoyoWeapon;
  if (state.phase === "idle") {
    if (currentTime >= state.nextThrowTime && !isBallControlLocked(ball, currentTime)) {
      state.phase = "out";
      state.phaseStartedAt = currentTime;
      state.rotationAngle = Math.atan2(ball.velocity.y, ball.velocity.x);
      state.wallContact = null;
    }
    return;
  }

  state.rotationAngle = normalizeAngle(state.rotationAngle + weapon.spinSpeed * state.spinDirection * deltaTime);

  const contact = getYoyoWeaponWallContact(ball, currentTime);
  if (contact && contact !== state.wallContact) {
    state.spinDirection *= -1;
    state.rotationAngle = normalizeAngle(state.rotationAngle + weapon.spinSpeed * state.spinDirection * deltaTime * 1.4);
  }
  state.wallContact = contact;

  const phaseElapsed = currentTime - state.phaseStartedAt;
  if (phaseElapsed < getYoyoPhaseDuration(weapon, state.phase)) {
    return;
  }

  if (state.phase === "out") {
    state.phase = "spin";
    state.phaseStartedAt = currentTime;
    return;
  }

  if (state.phase === "spin") {
    state.phase = "in";
    state.phaseStartedAt = currentTime;
    return;
  }

  state.phase = "idle";
  state.phaseStartedAt = currentTime;
  state.nextThrowTime = currentTime + weapon.cooldown;
  state.wallContact = null;
}

function updateYoyoWeaponForPair(attacker, defender, currentTime) {
  if (!attacker.yoyoWeaponState || attacker.hp <= 0 || defender.hp <= 0) {
    return;
  }

  const weapon = attacker.config.yoyoWeapon;
  if (currentTime - attacker.yoyoWeaponState.lastHitTime < weapon.hitCooldown) {
    return;
  }

  const hit = getYoyoWeaponHit(attacker, defender, currentTime);
  if (!hit) {
    return;
  }

  attacker.yoyoWeaponState.lastHitTime = currentTime;
  resolveAttackHit(attacker, defender, hit.normal, currentTime, hit.variant);
}

function updateStaticCharge(ball, deltaTime) {
  const state = ball.staticChargeState;
  const charge = ball.config.staticCharge;
  if (!state || !charge || ball.hp <= 0 || state.active) {
    return;
  }

  state.charge = Math.min(charge.chargeDuration, state.charge + deltaTime);
  if (state.charge >= charge.chargeDuration) {
    state.active = true;
  }
}

function resolveStaticCharge(attacker, defender, normalFromAttackerToDefender, currentTime) {
  const charge = attacker.config?.staticCharge;
  const state = attacker.staticChargeState;
  if (
    !charge ||
    !state?.active ||
    attacker.hp <= 0 ||
    defender.hp <= 0 ||
    currentTime - state.lastDischargeTime < charge.hitCooldown
  ) {
    return;
  }

  state.active = false;
  state.charge = 0;
  state.lastDischargeTime = currentTime;
  defender.paralyzedUntil = Math.max(defender.paralyzedUntil, currentTime + charge.paralyzeDuration);
  defender.shockUntil = Math.max(defender.shockUntil, currentTime + charge.shockDuration);
  defender.shockDamagePerSecond = Math.max(defender.shockDamagePerSecond, charge.shockDamagePerSecond);
  defender.shockOwner = attacker;
  defender.attackState = null;
  resolveAttackHit(attacker, defender, normalFromAttackerToDefender, currentTime, {
    damage: charge.impactDamage,
    knockbackMultiplier: 0.7,
    staticDischarge: true,
  });
}

function updateSummonedBear(owner, deltaTime, currentTime) {
  const bear = owner.summonedBearState;
  if (!bear || owner.hp <= 0) {
    return;
  }

  bear.velocity = scale(normalize(bear.velocity), owner.config.summonBear.moveSpeed);
  bear.position = add(bear.position, scale(bear.velocity, deltaTime));
  bounceSummonedBearOffWalls(bear);
  bear.wasTouchingOwner = bear.touchingOwner;
  bear.touchingOwner = false;
}

function resolveSummonedBearOwnerCollision(owner, bear, currentTime) {
  if (!bear.wasTouchingOwner && currentTime - bear.lastOwnerBoostTime >= owner.config.summonBear.ownerBoostCooldown) {
    bear.damage = Math.min(owner.config.summonBear.maxDamage, bear.damage + owner.config.summonBear.damageGainPerOwnerHit);
    growSummonedBear(owner, bear);
    bear.lastOwnerBoostTime = currentTime;
  }

  bear.touchingOwner = true;
}

function growSummonedBear(owner, bear) {
  const growth = owner.config.summonBear.radiusGainPerCollision;
  if (!growth || bear.radius >= bear.maxRadius) {
    return;
  }

  bear.radius = Math.min(bear.maxRadius, bear.radius + growth);
  bear.position = clampPointToArena(bear.position, bear.radius);
}

function resolveSummonedBearHit(owner, bear, defender, normalFromBearToDefender, currentTime) {
  if (areAlliedCombatants(bear, defender)) {
    return;
  }

  const lastHitTime = bear.lastHitTimesByLabel[defender.label] ?? -Infinity;
  if (currentTime - lastHitTime < owner.config.summonBear.hitCooldown) {
    return;
  }

  bear.lastHitTimesByLabel[defender.label] = currentTime;
  resolveAttackHit(owner, defender, normalFromBearToDefender, currentTime, {
    damage: bear.damage,
    knockbackMultiplier: 0.82,
    summonBearHit: true,
  });
}

function bounceSummonedBearOffWalls(bear) {
  if (bear.position.x - bear.radius < 0) {
    bear.position.x = bear.radius;
    bear.velocity.x = Math.abs(bear.velocity.x);
  } else if (bear.position.x + bear.radius > ARENA_SIZE) {
    bear.position.x = ARENA_SIZE - bear.radius;
    bear.velocity.x = -Math.abs(bear.velocity.x);
  }

  if (bear.position.y - bear.radius < 0) {
    bear.position.y = bear.radius;
    bear.velocity.y = Math.abs(bear.velocity.y);
  } else if (bear.position.y + bear.radius > ARENA_SIZE) {
    bear.position.y = ARENA_SIZE - bear.radius;
    bear.velocity.y = -Math.abs(bear.velocity.y);
  }
}

function resolveSummonedBearCollisionEffects(ballA, ballB, normalFromAToB, currentTime) {
  if (isSummonedBear(ballA)) {
    resolveSummonedBearCombatantCollision(ballA, ballB, normalFromAToB, currentTime);
  }

  if (isSummonedBear(ballB)) {
    resolveSummonedBearCombatantCollision(ballB, ballA, scale(normalFromAToB, -1), currentTime);
  }
}

function resolveSummonedBearCombatantCollision(bear, other, normalFromBearToOther, currentTime) {
  const owner = bear.owner;
  if (!owner || owner.hp <= 0 || isSummonedBear(other)) {
    return;
  }

  if (other === owner) {
    resolveSummonedBearOwnerCollision(owner, bear, currentTime);
    return;
  }

  if (other.hp > 0) {
    resolveSummonedBearHit(owner, bear, other, normalFromBearToOther, currentTime);
  }
}

function resolveCollisionAbilities(ballA, ballB, normalFromAToB, currentTime) {
  if (!isPrimaryCombatant(ballA) || !isPrimaryCombatant(ballB) || areAlliedCombatants(ballA, ballB)) {
    return;
  }

  if (shouldResolveForwardCollisionAbilityFirst(currentTime)) {
    resolveOneWayCollisionAbilities(ballA, ballB, normalFromAToB, currentTime);
    resolveOneWayCollisionAbilities(ballB, ballA, scale(normalFromAToB, -1), currentTime);
  } else {
    resolveOneWayCollisionAbilities(ballB, ballA, scale(normalFromAToB, -1), currentTime);
    resolveOneWayCollisionAbilities(ballA, ballB, normalFromAToB, currentTime);
  }
}

function shouldResolveForwardCollisionAbilityFirst(currentTime) {
  const frameIndex = Math.max(0, Math.floor(currentTime / STEP_SECONDS + 0.0001));
  return frameIndex % 2 === 0;
}

function resolveOneWayCollisionAbilities(attacker, defender, normalFromAttackerToDefender, currentTime) {
  resolveBatDrain(attacker, defender, normalFromAttackerToDefender, currentTime);
  resolveStaticCharge(attacker, defender, normalFromAttackerToDefender, currentTime);
}

function resolveBatDrain(attacker, defender, normalFromAttackerToDefender, currentTime) {
  const drain = attacker.config?.collisionDrain;
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
    if (ball.hp > 0) {
      updateSimulatedGasStationHealing(ball, currentTime);
    }

    if (ball.slowUntil <= currentTime) {
      ball.slowMultiplier = 1;
    }

    if (ball.hp > 0 && ball.poisonUntil > currentTime && ball.poisonDamagePerSecond > 0) {
      damageBall(ball, ball.poisonDamagePerSecond * deltaTime);
    }

    if (ball.hp > 0 && ball.shockUntil > currentTime && ball.shockDamagePerSecond > 0) {
      damageBall(ball, ball.shockDamagePerSecond * deltaTime);
    } else if (ball.shockUntil <= currentTime) {
      ball.shockDamagePerSecond = 0;
      ball.shockOwner = null;
    }
  }
}

function updateSimulatedGasStationHealing(ball, currentTime) {
  const state = ball.stationHealState;
  if (!state) {
    return;
  }

  const station = state.station;
  if (!station || station.hp <= 0 || state.remainingHeal <= 0 || ball.hp >= ball.config.maxHp) {
    finishSimulatedGasStationHeal(ball, currentTime);
    return;
  }

  const tickEnd = Math.min(currentTime, state.expiresAt, station.expiresAt);
  const elapsed = Math.max(0, tickEnd - state.lastTickAt);
  state.lastTickAt = currentTime;
  const healed = healBall(ball, Math.min(state.remainingHeal, state.healRate * elapsed));
  state.remainingHeal = Math.max(0, state.remainingHeal - healed);
  if (healed > 0) {
    station.lastAttackTime = currentTime;
  }

  if (state.remainingHeal <= 0 || currentTime >= state.expiresAt || station.expiresAt <= currentTime || ball.hp >= ball.config.maxHp) {
    finishSimulatedGasStationHeal(ball, currentTime);
  }
}

function finishSimulatedGasStationHeal(ball, currentTime) {
  const state = ball.stationHealState;
  if (!state) {
    return;
  }

  const station = state.station;
  if (station && station.hp > 0) {
    station.expiresAt = Math.min(station.expiresAt, currentTime + 0.22);
  }
  if (ball.attackDisabledUntil <= state.lockUntil + 0.001) {
    ball.attackDisabledUntil = Math.min(ball.attackDisabledUntil, currentTime);
  }
  ball.stationHealState = null;
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

function resolveAttackHit(attacker, defender, normalFromAttackerToDefender, currentTime, attackVariant = null) {
  if (tryHeroDodge(defender, attacker, currentTime, attackVariant)) {
    return 0;
  }

  const damage = attacker.dealAttackDamageTo(defender, normalFromAttackerToDefender, attackVariant);
  if (damage > 0) {
    applyHeroAttackVariantEffects(defender, attackVariant, currentTime);
  }
  applyAttackKnockback(attacker, defender, normalFromAttackerToDefender, damage, currentTime, attackVariant);
  return damage;
}

function isHeroSkillDamageBlocked(defender, attackVariant) {
  return Boolean(attackVariant?.heroSkillId && getActiveHeroSkillEffect(defender, "divineDescent"));
}

function tryHeroDodge(defender, attacker, currentTime, attackVariant = null) {
  if (defender.profession !== "demon" || attackVariant?.heroSkillId === "manaBurn") {
    return false;
  }

  const skill = getHeroSkill(defender, "dodge");
  if (!skill || !canUseHeroSkill(defender, skill, currentTime)) {
    return false;
  }

  const dodgeRoll = seededNoise(Math.floor(currentTime * 100), defender.label.charCodeAt(0), attacker.label.charCodeAt(0), 991);
  if (dodgeRoll > skill.chance) {
    return false;
  }

  spendHeroSkill(defender, skill, currentTime);
  const sidestep = normalize({ x: -attacker.velocity.y, y: attacker.velocity.x });
  defender.velocity = add(defender.velocity, scale(sidestep, defender.config.moveSpeed * 0.62));
  keepSpeed(defender, currentTime);
  return true;
}

function applyHeroAttackVariantEffects(defender, attackVariant, currentTime) {
  if (!attackVariant?.heroSkillId) {
    return;
  }

  if (attackVariant.stunDuration > 0) {
    defender.frozenUntil = Math.max(defender.frozenUntil, currentTime + attackVariant.stunDuration);
    defender.attackState = null;
  }

  if (attackVariant.slowDuration > 0 && attackVariant.slowMultiplier > 0) {
    applySlow(defender, attackVariant.slowMultiplier, attackVariant.slowDuration, currentTime);
  }
}

function isInAttackRange(attacker, defender) {
  return (
    attacker.hp > 0 &&
    defender.hp > 0 &&
    length(subtract(defender.position, attacker.position)) <= attacker.radius + defender.radius + getBallWeaponRange(attacker)
  );
}

function isInHeroConeRange(attacker, defender) {
  if (attacker.hp <= 0 || defender.hp <= 0) {
    return false;
  }

  const toDefender = subtract(defender.position, attacker.position);
  if (length(toDefender) > attacker.radius + defender.radius + attacker.weaponRange) {
    return false;
  }

  const facing = normalize(attacker.attackState?.direction || attacker.velocity);
  const targetDirection = normalize(toDefender);
  const minDot = Math.cos((attacker.config.coneAngle || Math.PI / 2) / 2);
  return dot(facing, targetDirection) >= minDot;
}

function resolveHeroConeAttack(attacker, defender, currentTime) {
  if (!isInHeroConeRange(attacker, defender)) {
    return 0;
  }

  return resolveAttackHit(attacker, defender, getDirectionBetween(attacker, defender), currentTime, {
    damage: attacker.attackDamage,
    knockbackMultiplier: attacker.config.getKnockbackMultiplier(),
  });
}

function resolveHeroStaffAttack(attacker, defender, currentTime) {
  if (attacker.hp <= 0 || defender.hp <= 0) {
    return 0;
  }

  let totalDamage = 0;
  for (const staff of getWukongStaffSwingHits(attacker, defender, currentTime)) {
    if (defender.hp <= 0) {
      break;
    }

    totalDamage += resolveAttackHit(attacker, defender, staff.hit.normal, currentTime, createWukongStaffAttackVariant(attacker, staff.effect));
  }
  return totalDamage;
}

function createWukongStaffAttackVariant(attacker, effect) {
  if (!effect) {
    return null;
  }

  return {
    heroSkillId: effect.id,
    heroId: attacker.profession,
    isSkillHit: true,
    damage: Math.max(1, Math.round(attacker.attackDamage * effect.damageMultiplier)),
    knockbackMultiplier: effect.knockbackMultiplier || attacker.config.getKnockbackMultiplier(),
  };
}

function getWukongStaffSwingHits(attacker, defender, currentTime) {
  const attackState = attacker.attackState;
  const currentProgress = attackState ? getAttackProgressFromState(attackState, currentTime) : 1;
  const sampleCount = 7;
  const hitsByStaff = new Map();

  for (let index = 0; index <= sampleCount; index += 1) {
    const sampleProgress = lerp(0, clamp(currentProgress, 0, 1), index / sampleCount);
    for (const staff of getWukongStaffSegments(attacker, currentTime, attackState?.direction, sampleProgress)) {
      if (hitsByStaff.has(staff.index)) {
        continue;
      }

      const hit = getSegmentCircleHit(defender.position, defender.radius + staff.hitRadius, staff.start, staff.end);
      if (hit) {
        hitsByStaff.set(staff.index, { ...staff, hit });
      }
    }
  }

  return [...hitsByStaff.values()];
}

function getWukongStaffSegments(ball, currentTime, renderDirection = null, renderProgress = null) {
  const effect = getActiveWukongStaffEffect(ball, currentTime);
  const direction = normalize(renderDirection || ball.attackState?.direction || ball.velocity);
  const progress = renderProgress ?? 0.55;
  const staffCount = effect?.staffCount || 1;
  const spreadAngle = effect?.spreadAngle || 0;
  const baseAngle = angleOf(direction);
  const staffConfig = getAttackAnimationConfig("staff");
  const swingProgress = easeOutCubic(progress);
  const swingAngle = baseAngle - staffConfig.sweepAngle / 2 + staffConfig.sweepAngle * swingProgress;
  const side = vectorFromAngle(swingAngle + Math.PI * 0.5);
  const offsets = staffCount === 3 ? [-spreadAngle, 0, spreadAngle] : [0];
  const range = getWukongStaffRange(ball, currentTime);

  return offsets.map((angleOffset, index) => {
    const staffDirection = vectorFromAngle(swingAngle + angleOffset);
    const sideOffset = staffCount === 3 ? (index - 1) * ball.radius * 0.48 : 0;
    const base = add(ball.position, scale(side, sideOffset));
    return {
      index,
      effect,
      start: subtract(base, scale(staffDirection, ball.radius * 0.72)),
      end: add(base, scale(staffDirection, ball.radius + range)),
      hitRadius: effect?.id === "giantStaff" ? 14 : 10,
    };
  });
}

function getActiveWukongStaffEffect(ball, currentTime = simulationElapsedSeconds) {
  return getActiveHeroSkillEffect(ball, "tripleStaff", currentTime) || getActiveHeroSkillEffect(ball, "giantStaff", currentTime);
}

function getWukongStaffRange(ball, currentTime = simulationElapsedSeconds) {
  const effect = getActiveHeroSkillEffect(ball, "giantStaff", currentTime);
  return ball.weaponRange * (effect?.rangeMultiplier || 1);
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

function getYoyoWeaponGeometry(ball, currentTime) {
  const weapon = ball.config.yoyoWeapon;
  const state = ball.yoyoWeaponState;
  const direction = state && state.phase !== "idle" ? vectorFromAngle(state.rotationAngle) : normalize(ball.velocity);
  const extension = getYoyoWeaponExtension(ball, currentTime);
  const distance = lerp(ball.radius + weapon.headRadius * 0.55, weapon.orbitRadius, extension);

  return {
    start: add(ball.position, scale(direction, ball.radius * 0.68)),
    head: add(ball.position, scale(direction, distance)),
    headRadius: weapon.headRadius,
    lineRadius: weapon.lineRadius,
  };
}

function getYoyoWeaponExtension(ball, currentTime) {
  const state = ball.yoyoWeaponState;
  const weapon = ball.config.yoyoWeapon;
  if (!state || state.phase === "idle") {
    return 0;
  }

  const phaseElapsed = currentTime - state.phaseStartedAt;
  if (state.phase === "out") {
    return easeOutCubic(clamp(phaseElapsed / weapon.extendDuration, 0, 1));
  }

  if (state.phase === "in") {
    return 1 - easeInCubic(clamp(phaseElapsed / weapon.retractDuration, 0, 1));
  }

  return 1;
}

function getYoyoPhaseDuration(weapon, phase) {
  if (phase === "out") {
    return weapon.extendDuration;
  }
  if (phase === "spin") {
    return weapon.activeDuration;
  }
  if (phase === "in") {
    return weapon.retractDuration;
  }
  return weapon.cooldown;
}

function getYoyoWeaponHit(attacker, defender, currentTime) {
  if (attacker.yoyoWeaponState?.phase === "idle") {
    return null;
  }

  const geometry = getYoyoWeaponGeometry(attacker, currentTime);
  const headToDefender = subtract(defender.position, geometry.head);
  if (length(headToDefender) <= geometry.headRadius + defender.radius) {
    return {
      normal: normalize(headToDefender),
      variant: {
        damage: attacker.config.yoyoWeapon.headDamage,
        knockbackMultiplier: 0.78,
        yoyoHit: true,
        yoyoPart: "head",
      },
    };
  }

  const lineHit = getSegmentCircleHit(
    defender.position,
    defender.radius + geometry.lineRadius,
    geometry.start,
    geometry.head,
  );
  if (!lineHit) {
    return null;
  }

  return {
    normal: lineHit.normal,
    variant: {
      damage: attacker.config.yoyoWeapon.lineDamage,
      knockbackMultiplier: 0.52,
      yoyoHit: true,
      yoyoPart: "line",
    },
  };
}

function getYoyoWeaponWallContact(ball, currentTime) {
  const geometry = getYoyoWeaponGeometry(ball, currentTime);
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

function getReaperBladeGeometry(ball, currentTime) {
  const direction = normalize(ball.attackState?.direction || ball.velocity);
  const progress = ball.attackState ? clamp((currentTime - ball.attackState.startTime) / ball.attackState.duration, 0, 1) : 0.55;
  const attackConfig = getAttackAnimationConfig("reaper");
  const baseAngle = Math.atan2(direction.y, direction.x);
  const bladeAngle = baseAngle - attackConfig.sweepAngle / 2 + attackConfig.sweepAngle * easeOutCubic(progress);
  const bladeDirection = vectorFromAngle(bladeAngle);
  const side = vectorFromAngle(bladeAngle - Math.PI * 0.5);
  const socket = add(ball.position, scale(bladeDirection, ball.radius + ball.weaponRange * 0.48));
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
    const closeRangeMultiplier = defender.profession === "reaper" ? 0.85 : 0.45;
    const closeRange = length(subtract(defender.position, attacker.position)) <=
      attacker.radius + defender.radius + attacker.weaponRange * closeRangeMultiplier;
    return closeRange
      ? {
          point: defender.position,
          normal: normalize(subtract(defender.position, attacker.position)),
        }
      : null;
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
  resolveSummonedBearCollisionEffects(ballA, ballB, normal, elapsedSeconds);
}

function separateBalls(ballA, ballB, normal, overlap) {
  const correction = scale(normal, overlap / 2 + 0.1);
  ballA.position = subtract(ballA.position, correction);
  ballB.position = add(ballB.position, correction);
  bounceCombatantOffWalls(ballA);
  bounceCombatantOffWalls(ballB);
}

function bounceCombatantOffWalls(combatant) {
  if (isSummonedBear(combatant)) {
    bounceSummonedBearOffWalls(combatant);
    return;
  }

  combatant.bounceOffWalls();
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

function applyAttackKnockback(attacker, defender, normalFromAttackerToDefender, damage, elapsedSeconds, attackVariant = null) {
  if (damage <= 0) {
    return;
  }

  const push =
    56 * attacker.config.getKnockbackMultiplier(attacker, defender, normalFromAttackerToDefender, damage, attackVariant);
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
  tryHeroRebirth(ball, simulationElapsedSeconds);
  return appliedDamage;
}

function tryHeroRebirth(ball, currentTime) {
  if (ball.hp > 0 || ball.profession !== "minotaur" || ball.rebirthUsed) {
    return false;
  }

  const skill = getHeroSkill(ball, "rebirth");
  if (!skill) {
    return false;
  }

  ball.rebirthUsed = true;
  ball.hp = ball.maxHp;
  ball.mp = Math.min(ball.maxMp, Math.max(ball.mp, ball.maxMp * 0.35));
  ball.frozenUntil = 0;
  ball.paralyzedUntil = 0;
  ball.shockUntil = 0;
  ball.shockDamagePerSecond = 0;
  ball.shockOwner = null;
  ball.attackDisabledUntil = currentTime + 0.35;
  return true;
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

function isBallParalyzed(ball, currentTime) {
  return ball.paralyzedUntil > currentTime;
}

function isBallHealingAtStation(ball, currentTime) {
  const state = ball.stationHealState;
  return Boolean(state && state.expiresAt > currentTime && state.remainingHeal > 0);
}

function isBallMovementLocked(ball, currentTime) {
  return isBallFrozen(ball, currentTime) || isBallParalyzed(ball, currentTime) || isBallHealingAtStation(ball, currentTime);
}

function isBallControlLocked(ball, currentTime) {
  return isBallMovementLocked(ball, currentTime) || ball.attackDisabledUntil > currentTime;
}

function keepSpeed(ball, elapsedSeconds) {
  ball.velocity = scale(normalize(ball.velocity), getCurrentMoveSpeed(ball, elapsedSeconds));
}

function getCurrentMoveSpeed(ball, elapsedSeconds) {
  const slowMultiplier = ball.slowUntil > elapsedSeconds ? ball.slowMultiplier || 1 : 1;
  return ball.config.moveSpeed * getSpeedMultiplier(elapsedSeconds) * slowMultiplier;
}

function getMatchupSummary(sceneId, aProfession, bProfession, runs) {
  const winsA = runs.filter((result) => result.winner === "A").length;
  const winsB = runs.filter((result) => result.winner === "B").length;
  const draws = runs.filter((result) => result.winner === "draw").length;
  const timeouts = runs.filter((result) => result.winner === "timeout").length;
  const averageSeconds = getAverageSeconds(runs);
  const decisiveRuns = winsA + winsB;

  return {
    sceneId,
    aProfession,
    bProfession,
    runs: runs.length,
    winsA,
    winsB,
    draws,
    timeouts,
    averageSeconds,
    minSeconds: Math.min(...runs.map((result) => result.timeSeconds)),
    maxSeconds: Math.max(...runs.map((result) => result.timeSeconds)),
    aWinRate: decisiveRuns > 0 ? winsA / decisiveRuns : 0,
  };
}

function getProfessionBalanceSummaries(runs) {
  const summariesByKey = new Map();

  for (const result of runs) {
    if (result.winner === "timeout") {
      addProfessionResult(summariesByKey, result.sceneId, result.aProfession, "timeout");
      addProfessionResult(summariesByKey, result.sceneId, result.bProfession, "timeout");
      continue;
    }

    if (result.winner === "draw") {
      addProfessionResult(summariesByKey, result.sceneId, result.aProfession, "draw");
      addProfessionResult(summariesByKey, result.sceneId, result.bProfession, "draw");
      continue;
    }

    addProfessionResult(summariesByKey, result.sceneId, result.aProfession, result.winner === "A" ? "win" : "loss");
    addProfessionResult(summariesByKey, result.sceneId, result.bProfession, result.winner === "B" ? "win" : "loss");
  }

  return [...summariesByKey.values()].map((summary) => {
    const decisiveGames = summary.wins + summary.losses;
    return {
      ...summary,
      winRate: decisiveGames > 0 ? summary.wins / decisiveGames : 0,
    };
  });
}

function addProfessionResult(summariesByKey, sceneId, profession, result) {
  const key = `${sceneId}:${profession}`;
  if (!summariesByKey.has(key)) {
    summariesByKey.set(key, {
      sceneId,
      profession,
      wins: 0,
      losses: 0,
      draws: 0,
      timeouts: 0,
    });
  }

  const summary = summariesByKey.get(key);
  if (result === "win") {
    summary.wins += 1;
  } else if (result === "loss") {
    summary.losses += 1;
  } else if (result === "draw") {
    summary.draws += 1;
  } else {
    summary.timeouts += 1;
  }
}

function isMatchupSummaryWithinCurve(summary) {
  return (
    summary.averageSeconds >= TARGET_MIN_SECONDS &&
    summary.averageSeconds <= TARGET_MAX_SECONDS &&
    isMirrorMatchupSideBalanceWithinCurve(summary)
  );
}

function isMirrorMatchupSideBalanceWithinCurve(summary) {
  if (summary.aProfession !== summary.bProfession) {
    return true;
  }

  return (
    summary.aWinRate >= MIRROR_MATCHUP_MIN_SIDE_WIN_RATE &&
    summary.aWinRate <= MIRROR_MATCHUP_MAX_SIDE_WIN_RATE
  );
}

function isProfessionSummaryWithinCurve(summary) {
  return (
    summary.winRate >= PROFESSION_MIN_WIN_RATE &&
    summary.winRate <= PROFESSION_MAX_WIN_RATE
  );
}

function printResults(matchupSummaries, professionSummaries) {
  console.log(`Target curve: ${TARGET_MIN_SECONDS}-${TARGET_MAX_SECONDS}s`);
  console.log(`Combat matchup seeds per pair: ${MATCHUP_SEEDS.length}`);
  console.log(
    `Mirror side-balance target: ${(MIRROR_MATCHUP_MIN_SIDE_WIN_RATE * 100).toFixed(0)}%-${(
      MIRROR_MATCHUP_MAX_SIDE_WIN_RATE * 100
    ).toFixed(0)}% A-side wins`,
  );
  console.log("matchup          avg    min/max      A/B     status");

  for (const summary of matchupSummaries) {
    const status = isMatchupSummaryWithinCurve(summary) ? "PASS" : "FAIL";
    console.log(
      `${formatMatchup(summary).padEnd(16)} ${summary.averageSeconds.toFixed(1).padStart(5)}s  ${formatSecondsRange(
        summary,
      ).padEnd(11)} ${String(summary.winsA).padStart(2)}/${String(summary.winsB).padEnd(2)}  ${status}`,
    );
  }

  console.log("");
  console.log(`Combatant win-rate target: ${(PROFESSION_MIN_WIN_RATE * 100).toFixed(0)}%-${(PROFESSION_MAX_WIN_RATE * 100).toFixed(0)}%`);
  console.log("combatant        wins/losses  winRate  status");
  for (const summary of professionSummaries) {
    const status = isProfessionSummaryWithinCurve(summary) ? "PASS" : "FAIL";
    console.log(
      `${`${summary.sceneId}:${summary.profession}`.padEnd(16)} ${String(summary.wins).padStart(3)}/${String(summary.losses).padEnd(
        3,
      )}      ${(summary.winRate * 100).toFixed(1).padStart(5)}%  ${status}`,
    );
  }
}

function getItemModeSummary(itemModeResults, ballCount) {
  const completed = itemModeResults.filter((result) => result.winner !== "timeout");
  const winnerCounts = {};
  for (const result of itemModeResults) {
    winnerCounts[result.winner] = (winnerCounts[result.winner] || 0) + 1;
  }
  const averageSeconds = getAverageSeconds(itemModeResults);
  const totals = itemModeResults.reduce(
    (summary, result) => {
      summary.pickups += result.stats.pickups;
      summary.uses += result.stats.uses;
      for (const [weaponId, count] of Object.entries(result.stats.pickupByWeapon)) {
        summary.pickupByWeapon[weaponId] += count;
      }
      for (const [weaponId, count] of Object.entries(result.stats.usesByWeapon)) {
        summary.usesByWeapon[weaponId] += count;
      }
      for (const [spellId, count] of Object.entries(result.stats.spellsById)) {
        summary.spellsById[spellId] += count;
      }
      return summary;
    },
    createItemModeStats(),
  );

  return {
    ballCount,
    runs: itemModeResults.length,
    completed: completed.length,
    timeouts: itemModeResults.length - completed.length,
    averageSeconds,
    draws: itemModeResults.filter((result) => result.winner === "draw").length,
    minSeconds: Math.min(...itemModeResults.map((result) => result.timeSeconds)),
    maxSeconds: Math.max(...itemModeResults.map((result) => result.timeSeconds)),
    winnerCounts,
    maxWinnerShare: Math.max(...Object.values(winnerCounts)) / Math.max(1, itemModeResults.length),
    totals,
  };
}

function isItemSummaryWithinCurve(summary) {
  return (
    summary.timeouts === 0 &&
    summary.averageSeconds >= TARGET_MIN_SECONDS &&
    summary.averageSeconds <= TARGET_MAX_SECONDS &&
    summary.maxWinnerShare <= ITEM_MODE_MAX_WINNER_SHARE
  );
}

function printItemResults(itemSummaries) {
  console.log("");
  console.log(`Item mode seeds per ball count: ${ITEM_MODE_SEEDS.length}`);
  console.log(
    `Item mode active pool: ${ItemModePoolConfig.weaponCount} weapons + ${ItemModePoolConfig.buildingCount} buildings; required buildings: ${ItemModePoolConfig.requiredBuildingIds.join(", ")}`,
  );
  console.log("balls  avg    min/max      winners             items       status");

  for (const summary of itemSummaries) {
    const status = isItemSummaryWithinCurve(summary) ? "PASS" : "FAIL";
    console.log(
      `${String(summary.ballCount).padStart(5)}  ${summary.averageSeconds.toFixed(1).padStart(5)}s  ${formatSecondsRange(
        summary,
      ).padEnd(11)} ${formatCountMap(summary.winnerCounts).padEnd(19)} ${String(summary.totals.pickups).padStart(4)}/${String(
        summary.totals.uses,
      ).padEnd(4)}  ${status}`,
    );
    console.log(`       pickups: ${formatCountMap(summary.totals.pickupByWeapon)}`);
    console.log(`       uses:    ${formatCountMap(summary.totals.usesByWeapon)}`);
    console.log(`       spells:  ${formatCountMap(summary.totals.spellsById)}`);
  }
}

function getAverageSeconds(results) {
  return results.reduce((total, result) => total + result.timeSeconds, 0) / Math.max(1, results.length);
}

function formatMatchup(result) {
  return `${result.sceneId}:${result.aProfession}>${result.bProfession}`;
}

function formatSecondsRange(summary) {
  return `${summary.minSeconds.toFixed(1)}-${summary.maxSeconds.toFixed(1)}s`;
}

function formatHp(result) {
  return `${Math.ceil(result.aHp)}/${Math.ceil(result.bHp)}`;
}

function formatCountMap(countMap) {
  return Object.entries(countMap)
    .map(([key, value]) => `${key}:${value}`)
    .join(", ");
}

function lerp(start, end, progress) {
  return start + (end - start) * progress;
}

function lerpVector(start, end, progress) {
  return {
    x: lerp(start.x, end.x, progress),
    y: lerp(start.y, end.y, progress),
  };
}

function getCombatantConfig(profession) {
  return HeroConfig[profession] || ProfessionConfig[profession];
}

function isHeroId(profession) {
  return Object.hasOwn(HeroConfig, profession);
}

function getBallAttackAnimationConfig(ball) {
  if (!ball.isHero) {
    return getAttackAnimationConfig(ball.profession);
  }

  if (ball.config.attackMode === "projectile") {
    return getAttackAnimationConfig("archer");
  }
  if (ball.config.attackMode === "dualBlade") {
    return getAttackAnimationConfig("assassin");
  }
  if (ball.config.attackMode === "hammer" || ball.config.attackMode === "cone") {
    return getAttackAnimationConfig("blade");
  }
  if (ball.config.attackMode === "staff") {
    return getAttackAnimationConfig("staff");
  }
  if (ball.config.attackMode === "spear") {
    return getAttackAnimationConfig("spear");
  }
  return getAttackAnimationConfig("default");
}

function getHeroAttackVariant(attacker, defender, currentTime) {
  if (attacker.profession !== "elfKing") {
    return null;
  }

  const skill = getHeroSkill(attacker, "fireArrow");
  if (!skill || !canUseHeroSkill(attacker, skill, currentTime)) {
    return null;
  }

  spendHeroSkill(attacker, skill, currentTime);
  return createHeroSkillVariant(attacker, skill, {
    id: "fire",
    damage: skill.damage,
    castType: "projectile",
    speed: skill.speed,
    headRadius: skill.headRadius,
    shaftLength: skill.shaftLength,
    spawnOffset: skill.spawnOffset,
    knockbackMultiplier: skill.knockbackMultiplier,
  });
}

function getBallWeaponRange(ball) {
  if (ball.config.attackMode === "staff") {
    return getWukongStaffRange(ball);
  }

  return ball.weaponRange;
}

function getAttackProgressFromState(attackState, currentTime) {
  return clamp((currentTime - attackState.startTime) / attackState.duration, 0, 1);
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

function getArenaRayDistance(start, direction) {
  const distances = [];
  if (direction.x > 0) {
    distances.push((ARENA_SIZE - start.x) / direction.x);
  } else if (direction.x < 0) {
    distances.push((0 - start.x) / direction.x);
  }
  if (direction.y > 0) {
    distances.push((ARENA_SIZE - start.y) / direction.y);
  } else if (direction.y < 0) {
    distances.push((0 - start.y) / direction.y);
  }

  return Math.max(0, Math.min(...distances.filter((distance) => distance >= 0)));
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

function angleOf(vector) {
  return Math.atan2(vector.y, vector.x);
}

function normalizeAngle(angle) {
  const fullTurn = Math.PI * 2;
  return ((angle % fullTurn) + fullTurn) % fullTurn;
}

function clampPointToArena(point, radius = 0) {
  return {
    x: clamp(point.x, radius, ARENA_SIZE - radius),
    y: clamp(point.y, radius, ARENA_SIZE - radius),
  };
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

function seededNoise(seed, x, y, salt = 0) {
  const value = Math.sin(seed * 92821.91 + x * 127.1 + y * 311.7 + salt * 74.7) * 43758.5453;
  return value - Math.floor(value);
}

function easeOutCubic(value) {
  return 1 - (1 - value) ** 3;
}

function easeInCubic(value) {
  return value ** 3;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}
