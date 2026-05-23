import {
  ARENA_SIZE,
  ATTACK_COOLDOWN_MULTIPLIER,
  BALL_RADIUS_MULTIPLIER,
  ITEM_SCENE_ID,
  ItemModeBallConfig,
  ItemSpawnConfig,
  ItemWeaponConfig,
  ProfessionConfig,
  SceneConfig,
  getAttackAnimationConfig,
  getItemInitialCount,
  getItemMaxActiveCount,
  getItemSpawnInterval,
  getSpeedMultiplier,
} from "../game-config.js";

const TARGET_MIN_SECONDS = 18;
const TARGET_MAX_SECONDS = 75;
const SIMULATION_LIMIT_SECONDS = 120;
const STEP_SECONDS = 1 / 60;
const MATCHUP_SEEDS = Array.from({ length: 12 }, (_, index) => index + 1);
const PROFESSION_MIN_WIN_RATE = 0.25;
const PROFESSION_MAX_WIN_RATE = 0.75;
const ITEM_MODE_BALL_COUNTS = [2, 3, 4, 5, 6];
const ITEM_MODE_SEEDS = Array.from({ length: 20 }, (_, index) => index + 1);
const ITEM_MODE_MAX_WINNER_SHARE = 0.75;

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
    this.yoyoWeaponState = createYoyoWeaponState(this);
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

  dealAttackDamageTo(defender, normalFromAttackerToDefender, attackVariant = null) {
    if (this.hp <= 0 || defender.hp <= 0) {
      return 0;
    }

    const damage = this.config.getDamage(this, defender, normalFromAttackerToDefender, attackVariant);
    return damageBall(defender, damage);
  }
}

class SimulatedItemBall {
  constructor({ label, x, y, direction }) {
    this.label = label;
    this.profession = null;
    this.config = ItemModeBallConfig;
    this.position = { x, y };
    this.velocity = scale(normalize(direction), this.config.moveSpeed);
    this.radius = this.config.radius * BALL_RADIUS_MULTIPLIER;
    this.hp = this.config.maxHp;
    this.equippedItem = null;
    this.lastAttackTime = -Infinity;
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
}

const matchupSummaries = [];
const matchupRuns = [];
for (const scene of Object.values(SceneConfig)) {
  if (scene.type !== "professions") {
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

  return {
    rotationAngle: ball.position.x < ARENA_SIZE / 2 ? 0 : Math.PI,
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

function simulateMatch(sceneId, aProfession, bProfession, seed = 1) {
  let elapsedSeconds = 0;
  let projectiles = [];
  let hazards = [];
  let webLinks = [];
  let flames = [];
  const start = getDuelStart(seed);
  const ballA = new SimulatedBall({
    profession: aProfession,
    ...start.a,
  });
  const ballB = new SimulatedBall({
    profession: bProfession,
    ...start.b,
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
    updateYoyoWeapon(ballA, STEP_SECONDS, elapsedSeconds);
    updateYoyoWeapon(ballB, STEP_SECONDS, elapsedSeconds);
    updateYoyoWeaponForPair(ballA, ballB, elapsedSeconds);
    updateYoyoWeaponForPair(ballB, ballA, elapsedSeconds);
    updateAttackForPair(ballA, ballB, elapsedSeconds, projectiles);
    updateAttackForPair(ballB, ballA, elapsedSeconds, projectiles);

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
  const stats = createItemModeStats();
  const spawnState = {
    counter: 0,
    nextSpawnTime: 0,
    maxActive: getItemMaxActiveCount(ballCount),
    spawnInterval: getItemSpawnInterval(ballCount),
  };
  const balls = createSimulatedItemBalls(seed, ballCount);

  for (let index = 0; index < getItemInitialCount(ballCount); index += 1) {
    droppedItems = spawnSimulatedItem(seed, elapsedSeconds, balls, droppedItems, spawnState);
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
    droppedItems = updateSimulatedItems(seed, elapsedSeconds, balls, droppedItems, spawnState, stats);
    forEachOrderedBallPair(balls, (attacker, defender) => {
      updateItemAttackForPair(attacker, defender, elapsedSeconds, seed, stats);
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

function forEachOrderedBallPair(balls, callback) {
  for (const attacker of balls) {
    if (attacker.hp <= 0) {
      continue;
    }

    for (const defender of balls) {
      if (defender !== attacker && defender.hp > 0) {
        callback(attacker, defender);
      }
    }
  }
}

function createItemModeStats() {
  return {
    pickups: 0,
    uses: 0,
    pickupByWeapon: Object.fromEntries(Object.keys(ItemWeaponConfig).map((id) => [id, 0])),
    usesByWeapon: Object.fromEntries(Object.keys(ItemWeaponConfig).map((id) => [id, 0])),
    spellsById: { fire: 0, ice: 0, lightning: 0 },
  };
}

function updateSimulatedItems(seed, currentTime, balls, droppedItems, spawnState, stats) {
  let nextDroppedItems = droppedItems;
  if (nextDroppedItems.length < spawnState.maxActive && currentTime >= spawnState.nextSpawnTime) {
    nextDroppedItems = spawnSimulatedItem(seed, currentTime, balls, nextDroppedItems, spawnState);
  }

  return resolveSimulatedItemPickups(currentTime, balls, nextDroppedItems, stats);
}

function spawnSimulatedItem(seed, currentTime, balls, droppedItems, spawnState) {
  if (droppedItems.length >= spawnState.maxActive) {
    return droppedItems;
  }

  const weaponIds = Object.keys(ItemWeaponConfig);
  const spawnIndex = spawnState.counter;
  const weaponNoise = seededNoise(seed, spawnIndex + 17, droppedItems.length + 23, 733);
  const weaponId = weaponIds[Math.floor(weaponNoise * weaponIds.length) % weaponIds.length];
  const position = createSimulatedItemPosition(seed, spawnIndex, balls);
  spawnState.counter += 1;
  spawnState.nextSpawnTime = currentTime + spawnState.spawnInterval;

  return [
    ...droppedItems,
    {
      id: `item-${seed}-${spawnIndex}`,
      weaponId,
      position,
    },
  ];
}

function createSimulatedItemPosition(seed, spawnIndex, balls) {
  const padding = ItemSpawnConfig.edgePadding;
  const span = ARENA_SIZE - padding * 2;

  for (let attempt = 0; attempt < 24; attempt += 1) {
    const position = {
      x: padding + seededNoise(seed, spawnIndex, attempt, 811) * span,
      y: padding + seededNoise(seed, spawnIndex, attempt, 823) * span,
    };
    const tooCloseToBall = balls.some((ball) => {
      return ball.hp > 0 && length(subtract(ball.position, position)) < ItemSpawnConfig.avoidBallRadius;
    });
    if (!tooCloseToBall) {
      return position;
    }
  }

  return {
    x: padding + seededNoise(seed, spawnIndex, 0, 839) * span,
    y: padding + seededNoise(seed, spawnIndex, 0, 853) * span,
  };
}

function resolveSimulatedItemPickups(currentTime, balls, droppedItems, stats) {
  return droppedItems.filter((item) => {
    const picker = balls.find((ball) => {
      return ball.hp > 0 && length(subtract(ball.position, item.position)) <= ball.radius + ItemSpawnConfig.pickupRadius;
    });

    if (!picker) {
      return true;
    }

    equipSimulatedItem(picker, item.weaponId, currentTime);
    stats.pickups += 1;
    stats.pickupByWeapon[item.weaponId] += 1;
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

function updateItemAttackForPair(attacker, defender, currentTime, seed, stats) {
  const weapon = attacker.equippedItem ? ItemWeaponConfig[attacker.equippedItem.weaponId] : null;
  if (!weapon || attacker.hp <= 0 || defender.hp <= 0 || currentTime - attacker.lastAttackTime < weapon.cooldown) {
    return;
  }

  if (!isSimulatedItemInRange(attacker, defender, weapon)) {
    return;
  }

  const attackVariant = getSimulatedItemAttackVariant(weapon, attacker, defender, currentTime, seed, stats);
  const normal = getDirectionBetween(attacker, defender);
  const damage = damageBall(defender, attackVariant.damage);
  applySimulatedItemKnockback(attacker, defender, normal, damage, attackVariant, currentTime);

  if (weapon.kind === "rocket" && weapon.explosionDamage > 0) {
    const explosionDamage = damageBall(defender, weapon.explosionDamage * 0.45);
    applySimulatedItemKnockback(attacker, defender, normal, explosionDamage, weapon, currentTime);
  }

  attacker.lastAttackTime = currentTime;
  attacker.equippedItem.durability -= 1;
  stats.uses += 1;
  stats.usesByWeapon[weapon.id] += 1;
  if (attacker.equippedItem.durability <= 0) {
    attacker.equippedItem = null;
  }
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

function updateAttackForPair(attacker, defender, currentTime, projectiles) {
  if (["chainSpin", "frostOrbit", "yoyo"].includes(attacker.config.attackMode)) {
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

function resolveAttackHit(attacker, defender, normalFromAttackerToDefender, currentTime, attackVariant = null) {
  const damage = attacker.dealAttackDamageTo(defender, normalFromAttackerToDefender, attackVariant);
  applyAttackKnockback(attacker, defender, normalFromAttackerToDefender, damage, currentTime, attackVariant);
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
    summary.averageSeconds <= TARGET_MAX_SECONDS
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
  console.log(`Profession matchup seeds per pair: ${MATCHUP_SEEDS.length}`);
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
  console.log(`Profession win-rate target: ${(PROFESSION_MIN_WIN_RATE * 100).toFixed(0)}%-${(PROFESSION_MAX_WIN_RATE * 100).toFixed(0)}%`);
  console.log("profession       wins/losses  winRate  status");
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
