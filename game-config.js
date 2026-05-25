export const ARENA_SIZE = 800;
export const MAX_DELTA_TIME = 1 / 30;
export const MAX_DEVICE_PIXEL_RATIO = 3;
export const BALL_RADIUS_MULTIPLIER = 1.5;
export const ATTACK_COOLDOWN_MULTIPLIER = 0.65;

export const SPEED_RAMP_CONFIG = {
  startMultiplier: 1,
  maxMultiplier: 3,
  secondsToMaxMultiplier: 20,
};

export const ATTACK_ANIMATION_CONFIG = {
  spear: {
    duration: 0.24,
    hitFrame: 0.48,
  },
  bat: {
    duration: 0.28,
    hitFrame: 0.42,
  },
  venom: {
    duration: 0.34,
    hitFrame: 0.52,
  },
  spider: {
    duration: 0.34,
    hitFrame: 0.5,
  },
  lava: {
    duration: 0.36,
    hitFrame: 0.54,
  },
  reaper: {
    duration: 0.72,
    hitFrame: 0.56,
    sweepAngle: (Math.PI * 118) / 180,
  },
  frost: {
    duration: 0.42,
    hitFrame: 0.58,
  },
  assassin: {
    duration: 0.22,
    hitFrame: 0.42,
    sweepAngle: (Math.PI * 105) / 180,
  },
  blade: {
    duration: 0.32,
    hitFrame: 0.55,
    sweepAngle: (Math.PI * 130) / 180,
  },
  archer: {
    duration: 0.42,
    hitFrame: 0.64,
  },
  chain: {
    duration: 0.46,
    hitFrame: 0.58,
  },
  mage: {
    duration: 0.48,
    hitFrame: 0.62,
  },
  staff: {
    duration: 0.38,
    hitFrame: 0.7,
    sweepAngle: (Math.PI * 148) / 180,
  },
  default: {
    duration: 0.24,
    hitFrame: 0.5,
  },
};

export const DEFAULT_SCENE_ID = "classic";
export const SUPER_SCENE_ID = "super";
export const ITEM_SCENE_ID = "items";
export const HERO_SCENE_ID = "heroes";

export const ItemModeBallConfig = {
  id: "item-runner",
  name: "道具球",
  maxHp: 100,
  radius: 24,
  moveSpeed: 198,
  attackDamage: 0,
  attackCooldown: 0.5,
  weaponRange: 0,
  getDamage(attacker, defender, normalFromAttackerToDefender, attackVariant) {
    return attackVariant?.damage || 0;
  },
  getKnockbackMultiplier(attacker, defender, normalFromAttackerToDefender, damage, attackVariant) {
    return attackVariant?.knockbackMultiplier || 0.9;
  },
  isSkillHit() {
    return false;
  },
};

export const ItemSpawnConfig = {
  initialCount: 2,
  maxActive: 3,
  spawnInterval: 3.15,
  pickupRadius: 28,
  edgePadding: 74,
  avoidBallRadius: 96,
  avoidItemRadius: 132,
  recentSpawnAvoidRadius: 154,
  recentSpawnAvoidDuration: 11,
  spawnAttempts: 48,
  retryInterval: 0.75,
};

export function getItemInitialCount(ballCount = 2) {
  const safeBallCount = normalizeItemBallCount(ballCount);
  return Math.max(ItemSpawnConfig.initialCount, Math.ceil(safeBallCount * 0.65));
}

export function getItemMaxActiveCount(ballCount = 2) {
  const safeBallCount = normalizeItemBallCount(ballCount);
  return Math.max(ItemSpawnConfig.maxActive, Math.min(8, safeBallCount + 1));
}

export function getItemSpawnInterval(ballCount = 2) {
  const safeBallCount = normalizeItemBallCount(ballCount);
  return Math.max(1.25, ItemSpawnConfig.spawnInterval - (safeBallCount - 2) * 0.28);
}

function normalizeItemBallCount(ballCount) {
  const parsedCount = Number.parseInt(ballCount, 10);
  if (!Number.isFinite(parsedCount)) {
    return 2;
  }

  return Math.min(Math.max(parsedCount, 2), 6);
}

export const ItemWeaponConfig = {
  sword: {
    id: "sword",
    nameKey: "items.sword.name",
    kind: "melee",
    sprite: "sword",
    damage: 9,
    cooldown: 0.45,
    range: 42,
    durability: 9,
    knockbackMultiplier: 0.9,
    animation: "blade",
    duration: 0.24,
    hitFrame: 0.48,
  },
  spear: {
    id: "spear",
    nameKey: "items.spear.name",
    kind: "melee",
    sprite: "spear",
    damage: 12,
    cooldown: 0.68,
    range: 78,
    durability: 6,
    knockbackMultiplier: 1.05,
    animation: "spear",
    duration: 0.28,
    hitFrame: 0.5,
  },
  bow: {
    id: "bow",
    nameKey: "items.bow.name",
    kind: "projectile",
    sprite: "bow",
    projectileKind: "arrow",
    damage: 7,
    cooldown: 0.92,
    range: Infinity,
    durability: 8,
    knockbackMultiplier: 0.76,
    duration: 0.38,
    hitFrame: 0.62,
    speed: 590,
    headRadius: 7,
    shaftLength: 42,
    shaftRadius: 3,
    spawnOffset: 34,
  },
  pistol: {
    id: "pistol",
    nameKey: "items.pistol.name",
    kind: "projectile",
    sprite: "pistol",
    projectileKind: "bullet",
    damage: 4,
    cooldown: 0.58,
    range: Infinity,
    durability: 12,
    knockbackMultiplier: 0.62,
    duration: 0.18,
    hitFrame: 0.36,
    speed: 860,
    headRadius: 5,
    shaftLength: 12,
    shaftRadius: 4,
    spawnOffset: 34,
  },
  rocket: {
    id: "rocket",
    nameKey: "items.rocket.name",
    kind: "rocket",
    sprite: "rocketLauncher",
    projectileKind: "rocket",
    damage: 14,
    explosionDamage: 10,
    explosionRadius: 72,
    cooldown: 1.55,
    range: Infinity,
    durability: 3,
    knockbackMultiplier: 1.42,
    duration: 0.42,
    hitFrame: 0.58,
    speed: 430,
    headRadius: 14,
    shaftLength: 46,
    shaftRadius: 10,
    spawnOffset: 42,
  },
  torch: {
    id: "torch",
    nameKey: "items.torch.name",
    kind: "projectile",
    sprite: "torch",
    projectileKind: "torch",
    damage: 5,
    cooldown: 1.22,
    range: Infinity,
    durability: 1,
    knockbackMultiplier: 0.36,
    duration: 0.34,
    hitFrame: 0.52,
    speed: 430,
    headRadius: 10,
    shaftLength: 30,
    shaftRadius: 8,
    spawnOffset: 34,
    throwDistance: 270,
    groundFire: {
      radius: 58,
      duration: 4.2,
      damage: 5,
      hitCooldown: 0.62,
    },
  },
  staff: {
    id: "staff",
    nameKey: "items.staff.name",
    kind: "spell",
    sprite: "staff",
    damage: 7,
    cooldown: 1.08,
    range: 255,
    durability: 6,
    knockbackMultiplier: 0.95,
    duration: 0.46,
    hitFrame: 0.62,
    spellBook: [
      {
        id: "fire",
        nameKey: "items.spells.fire",
        damage: 9,
        color: "#ff6b3d",
        knockbackMultiplier: 0.98,
        castType: "projectile",
        speed: 520,
        headRadius: 15,
        shaftLength: 32,
        spawnOffset: 22,
      },
      {
        id: "ice",
        nameKey: "items.spells.ice",
        damage: 5,
        color: "#9ff7ff",
        knockbackMultiplier: 0.52,
        castType: "projectile",
        speed: 700,
        headRadius: 10,
        shaftLength: 44,
        spawnOffset: 24,
      },
      {
        id: "lightning",
        nameKey: "items.spells.lightning",
        damage: 7,
        color: "#ffe66d",
        knockbackMultiplier: 1.18,
        castType: "trajectory",
        range: 255,
        collisionRadius: 13,
        duration: 0.17,
        segmentCount: 5,
      },
    ],
  },
};

export const ItemBuildingConfig = {
  prismTower: {
    id: "prismTower",
    nameKey: "items.prismTower.name",
    kind: "building",
    damage: 5,
    cooldown: 1.2,
    range: 280,
    radius: 26,
    duration: 14,
    knockbackMultiplier: 0.38,
    refractionRadius: 150,
    refractionCount: 3,
    color: "#7dd3fc",
    accentColor: "#f8fbff",
  },
  bunker: {
    id: "bunker",
    nameKey: "items.bunker.name",
    kind: "building",
    damage: 3,
    cooldown: 0.9,
    range: 235,
    radius: 28,
    duration: 13,
    knockbackMultiplier: 0.5,
    bulletCount: 6,
    projectileKind: "bullet",
    speed: 770,
    headRadius: 5,
    shaftLength: 12,
    shaftRadius: 4,
    color: "#a8b0a8",
    accentColor: "#ffe66d",
  },
  cannon: {
    id: "cannon",
    nameKey: "items.cannon.name",
    kind: "building",
    damage: 16,
    cooldown: 2.45,
    range: 360,
    radius: 30,
    duration: 15,
    knockbackMultiplier: 1.5,
    projectileKind: "cannon",
    speed: 360,
    headRadius: 16,
    shaftLength: 20,
    shaftRadius: 12,
    explosionDamage: 6,
    explosionRadius: 54,
    canTargetBuildings: true,
    destroyBuildingsOnHit: true,
    color: "#64748b",
    accentColor: "#ffb02e",
  },
  teslaCoil: {
    id: "teslaCoil",
    nameKey: "items.teslaCoil.name",
    kind: "building",
    damage: 7,
    cooldown: 1.18,
    range: 255,
    radius: 26,
    duration: 16,
    knockbackMultiplier: 0.32,
    maxAttacks: 3,
    paralyzeDuration: 1.05,
    color: "#2563eb",
    accentColor: "#fde047",
  },
  gasStation: {
    id: "gasStation",
    nameKey: "items.gasStation.name",
    kind: "building",
    supportKind: "heal",
    damage: 0,
    cooldown: 0,
    range: 0,
    radius: 27,
    duration: 1.65,
    knockbackMultiplier: 0,
    healAmount: 26,
    healDuration: 1.65,
    color: "#22c55e",
    accentColor: "#f8fafc",
  },
};

export const HeroConfig = {
  demon: {
    id: "demon",
    nameKey: "heroes.demon.name",
    maxHp: 98,
    maxMp: 96,
    manaRegen: 4.8,
    radius: 22,
    moveSpeed: 246,
    attackDamage: 10,
    attackCooldown: 0.46,
    weaponRange: 40,
    attackMode: "dualBlade",
    bodyPattern: "demon",
    color: "#7f1d37",
    accentColor: "#ff7a45",
    item: {
      nameKey: "heroes.demon.weapon",
      type: "dualBlade",
      animation: "双刀快斩",
    },
    skills: [
      {
        id: "dodge",
        nameKey: "heroes.demon.skills.dodge",
        type: "passiveDodge",
        manaCost: 16,
        cooldown: 2.8,
        chance: 0.34,
      },
      {
        id: "manaBurn",
        nameKey: "heroes.demon.skills.manaBurn",
        type: "aoeBurn",
        manaCost: 30,
        cooldown: 6.2,
        autoPriority: 1,
        range: 170,
        damage: 9,
        manaDamage: 24,
        effectColor: "#38bdf8",
        effectDuration: 0.56,
        effectSegments: 7,
        knockbackMultiplier: 0.58,
      },
    ],
    getDamage() {
      return this.attackDamage;
    },
    getKnockbackMultiplier(attacker, defender, normalFromAttackerToDefender, damage, attackVariant) {
      return attackVariant?.knockbackMultiplier || 0.72;
    },
    isSkillHit(attacker, defender, normalFromAttackerToDefender, damage, attackVariant) {
      return Boolean(attackVariant?.heroSkillId);
    },
  },
  dwarfKing: {
    id: "dwarfKing",
    nameKey: "heroes.dwarfKing.name",
    maxHp: 132,
    maxMp: 84,
    manaRegen: 3.7,
    radius: 27,
    moveSpeed: 176,
    attackDamage: 20,
    attackCooldown: 0.82,
    weaponRange: 44,
    attackMode: "hammer",
    bodyPattern: "dwarfKing",
    color: "#a16207",
    accentColor: "#fde68a",
    item: {
      nameKey: "heroes.dwarfKing.weapon",
      type: "hammer",
      animation: "重锤挥击",
    },
    skills: [
      {
        id: "thunderHammer",
        nameKey: "heroes.dwarfKing.skills.thunderHammer",
        type: "homingProjectile",
        manaCost: 34,
        cooldown: 6.8,
        autoPriority: 2,
        damage: 17,
        stunDuration: 1.05,
        speed: 520,
        headRadius: 18,
        shaftLength: 36,
        spawnOffset: 36,
        knockbackMultiplier: 1.18,
      },
      {
        id: "groundSlam",
        nameKey: "heroes.dwarfKing.skills.groundSlam",
        type: "groundSlam",
        manaCost: 34,
        cooldown: 7.5,
        autoPriority: 1,
        range: 165,
        damage: 8,
        slowMultiplier: 0.46,
        slowDuration: 2.7,
        knockbackMultiplier: 0.86,
      },
    ],
    getDamage() {
      return this.attackDamage;
    },
    getKnockbackMultiplier(attacker, defender, normalFromAttackerToDefender, damage, attackVariant) {
      return attackVariant?.knockbackMultiplier || 1.28;
    },
    isSkillHit(attacker, defender, normalFromAttackerToDefender, damage, attackVariant) {
      return Boolean(attackVariant?.heroSkillId);
    },
  },
  minotaur: {
    id: "minotaur",
    nameKey: "heroes.minotaur.name",
    maxHp: 148,
    maxMp: 74,
    manaRegen: 3.2,
    radius: 29,
    moveSpeed: 166,
    attackDamage: 17,
    attackCooldown: 1.06,
    weaponRange: 76,
    attackMode: "cone",
    coneAngle: Math.PI / 2,
    bodyPattern: "minotaur",
    color: "#7c2d12",
    accentColor: "#facc15",
    item: {
      nameKey: "heroes.minotaur.weapon",
      type: "totem",
      animation: "正面扇形挥击",
    },
    skills: [
      {
        id: "warStomp",
        nameKey: "heroes.minotaur.skills.warStomp",
        type: "warStomp",
        manaCost: 32,
        cooldown: 7.2,
        autoPriority: 1,
        range: 155,
        damage: 10,
        stunDuration: 1.15,
        knockbackMultiplier: 1.05,
      },
      {
        id: "rebirth",
        nameKey: "heroes.minotaur.skills.rebirth",
        type: "rebirth",
        manaCost: 0,
        cooldown: Infinity,
        oncePerMatch: true,
      },
    ],
    getDamage() {
      return this.attackDamage;
    },
    getKnockbackMultiplier(attacker, defender, normalFromAttackerToDefender, damage, attackVariant) {
      return attackVariant?.knockbackMultiplier || 1.18;
    },
    isSkillHit(attacker, defender, normalFromAttackerToDefender, damage, attackVariant) {
      return Boolean(attackVariant?.heroSkillId);
    },
  },
  elfKing: {
    id: "elfKing",
    nameKey: "heroes.elfKing.name",
    maxHp: 96,
    maxMp: 118,
    manaRegen: 5.4,
    radius: 23,
    moveSpeed: 192,
    attackDamage: 5,
    attackCooldown: 1.15,
    weaponRange: Infinity,
    attackMode: "projectile",
    bodyPattern: "elfKing",
    color: "#15803d",
    accentColor: "#bbf7d0",
    item: {
      nameKey: "heroes.elfKing.weapon",
      type: "bow",
      animation: "精准射击",
    },
    projectileWeapon: {
      speed: 640,
      headRadius: 7,
      shaftLength: 44,
      spawnOffset: 34,
    },
    skills: [
      {
        id: "fireArrow",
        nameKey: "heroes.elfKing.skills.fireArrow",
        type: "empoweredProjectile",
        manaCost: 14,
        cooldown: 0.9,
        damage: 10,
        speed: 650,
        headRadius: 10,
        shaftLength: 44,
        spawnOffset: 34,
        color: "#ff6b24",
        knockbackMultiplier: 0.92,
      },
      {
        id: "forestBlessing",
        nameKey: "heroes.elfKing.skills.forestBlessing",
        type: "heal",
        manaCost: 30,
        cooldown: 6.4,
        autoPriority: 1,
        heal: 15,
        triggerHpRatio: 0.72,
      },
    ],
    getDamage(attacker, defender, normalFromAttackerToDefender, attackVariant) {
      return attackVariant?.damage || this.attackDamage;
    },
    getKnockbackMultiplier(attacker, defender, normalFromAttackerToDefender, damage, attackVariant) {
      return attackVariant?.knockbackMultiplier || 0.78;
    },
    isSkillHit(attacker, defender, normalFromAttackerToDefender, damage, attackVariant) {
      return Boolean(attackVariant?.heroSkillId);
    },
  },
  wukong: {
    id: "wukong",
    nameKey: "heroes.wukong.name",
    maxHp: 122,
    maxMp: 104,
    manaRegen: 4.6,
    radius: 24,
    moveSpeed: 232,
    attackDamage: 9,
    attackCooldown: 0.54,
    weaponRange: 124,
    attackMode: "staff",
    bodyPattern: "wukong",
    color: "#b45309",
    accentColor: "#facc15",
    item: {
      nameKey: "heroes.wukong.weapon",
      type: "staff",
      animation: "金箍棒连击",
    },
    skills: [
      {
        id: "tripleStaff",
        nameKey: "heroes.wukong.skills.tripleStaff",
        type: "staffBuff",
        manaCost: 30,
        cooldown: 7.2,
        autoPriority: 1,
        exclusiveGroup: "wukongStaffForm",
        duration: 3.8,
        triggerRange: 138,
        staffCount: 3,
        spreadAngle: Math.PI / 7,
        damageMultiplier: 1,
        knockbackMultiplier: 0.74,
        color: "#f97316",
      },
      {
        id: "giantStaff",
        nameKey: "heroes.wukong.skills.giantStaff",
        type: "staffBuff",
        manaCost: 38,
        cooldown: 8.5,
        autoPriority: 2,
        exclusiveGroup: "wukongStaffForm",
        duration: 3.4,
        triggerRange: 760,
        rangeMultiplier: 5,
        damageMultiplier: 1.15,
        knockbackMultiplier: 1.08,
        color: "#facc15",
      },
    ],
    getDamage(attacker, defender, normalFromAttackerToDefender, attackVariant) {
      return attackVariant?.damage || this.attackDamage;
    },
    getKnockbackMultiplier(attacker, defender, normalFromAttackerToDefender, damage, attackVariant) {
      return attackVariant?.knockbackMultiplier || 0.86;
    },
    isSkillHit(attacker, defender, normalFromAttackerToDefender, damage, attackVariant) {
      return Boolean(attackVariant?.heroSkillId);
    },
  },
  cryptLord: {
    id: "cryptLord",
    nameKey: "heroes.cryptLord.name",
    maxHp: 128,
    maxMp: 96,
    manaRegen: 4,
    radius: 27,
    moveSpeed: 184,
    attackDamage: 14,
    attackCooldown: 0.68,
    weaponRange: 48,
    attackMode: "claw",
    bodyPattern: "cryptLord",
    color: "#3b2a1d",
    accentColor: "#a7f3d0",
    item: {
      nameKey: "heroes.cryptLord.weapon",
      type: "claws",
      animation: "虫王利爪",
    },
    skills: [
      {
        id: "impale",
        nameKey: "heroes.cryptLord.skills.impale",
        type: "impale",
        manaCost: 32,
        cooldown: 6.4,
        autoPriority: 1,
        range: 390,
        activeLength: 120,
        speed: 620,
        damage: 12,
        stunDuration: 0.72,
        collisionRadius: 24,
        spikeSpacing: 24,
        knockbackMultiplier: 0.9,
        color: "#d6a35f",
      },
      {
        id: "summonBeetle",
        nameKey: "heroes.cryptLord.skills.summonBeetle",
        type: "summonBeetle",
        manaCost: 24,
        cooldown: 4.8,
        autoPriority: 2,
        maxCount: 3,
        duration: 10,
        maxHp: 1,
        damage: 1,
        radius: 12,
        moveSpeed: 190,
        attackCooldown: 0.72,
        weaponRange: 18,
        knockbackMultiplier: 0.28,
        color: "#84cc16",
      },
    ],
    getDamage(attacker, defender, normalFromAttackerToDefender, attackVariant) {
      return attackVariant?.damage || this.attackDamage;
    },
    getKnockbackMultiplier(attacker, defender, normalFromAttackerToDefender, damage, attackVariant) {
      return attackVariant?.knockbackMultiplier || 0.86;
    },
    isSkillHit(attacker, defender, normalFromAttackerToDefender, damage, attackVariant) {
      return Boolean(attackVariant?.heroSkillId);
    },
  },
};

export const SceneConfig = {
  classic: {
    id: "classic",
    type: "professions",
    nameKey: "scenes.classic.name",
    descriptionKey: "scenes.classic.description",
    professionIds: ["spear", "blade", "shield", "assassin", "archer", "chain", "mage", "summoner"],
    defaultProfessions: {
      a: "spear",
      b: "blade",
    },
  },
  super: {
    id: "super",
    type: "professions",
    nameKey: "scenes.super.name",
    descriptionKey: "scenes.super.description",
    professionIds: ["bat", "venom", "spider", "lava", "reaper", "frost", "yoyo", "static"],
    defaultProfessions: {
      a: "bat",
      b: "venom",
    },
  },
  items: {
    id: "items",
    type: "items",
    nameKey: "scenes.items.name",
    descriptionKey: "scenes.items.description",
    professionIds: [],
    defaultProfessions: {
      a: null,
      b: null,
    },
    ballHp: 100,
  },
  heroes: {
    id: "heroes",
    type: "heroes",
    nameKey: "scenes.heroes.name",
    descriptionKey: "scenes.heroes.description",
    professionIds: ["demon", "dwarfKing", "minotaur", "elfKing", "wukong", "cryptLord"],
    defaultProfessions: {
      a: "demon",
      b: "dwarfKing",
    },
  },
};

export const COLORS = {
  backgroundTop: "#263a24",
  backgroundBottom: "#12161c",
  panel: "#2f3328",
  panelBorder: "#9b7a3a",
  text: "#fff4cf",
  muted: "#b9c39d",
  arena: "#4f7132",
  grid: "rgba(52, 38, 20, 0.28)",
  button: "#d9aa55",
  buttonText: "#20160c",
};

export const SIDE_VISUAL_CONFIG = {
  A: {
    color: "#5ed8e6",
    accentColor: "#dffcff",
    bladeTrailIdle: "rgba(94, 216, 230, 0.38)",
    bladeTrailAttack: "rgba(223, 252, 255, 0.72)",
    backgroundGlow: "rgba(94, 216, 230, 0.13)",
  },
  B: {
    color: "#e5a43a",
    accentColor: "#ffe6a1",
    bladeTrailIdle: "rgba(229, 164, 58, 0.38)",
    bladeTrailAttack: "rgba(255, 230, 161, 0.72)",
    backgroundGlow: "rgba(229, 164, 58, 0.13)",
  },
  C: {
    color: "#c77dff",
    accentColor: "#ffe5ff",
    bladeTrailIdle: "rgba(199, 125, 255, 0.38)",
    bladeTrailAttack: "rgba(255, 229, 255, 0.72)",
    backgroundGlow: "rgba(199, 125, 255, 0.13)",
  },
  D: {
    color: "#78f0a4",
    accentColor: "#c6fff0",
    bladeTrailIdle: "rgba(120, 240, 164, 0.38)",
    bladeTrailAttack: "rgba(198, 255, 240, 0.72)",
    backgroundGlow: "rgba(120, 240, 164, 0.13)",
  },
  E: {
    color: "#ff6b7a",
    accentColor: "#ffd6dd",
    bladeTrailIdle: "rgba(255, 107, 122, 0.38)",
    bladeTrailAttack: "rgba(255, 214, 221, 0.72)",
    backgroundGlow: "rgba(255, 107, 122, 0.13)",
  },
  F: {
    color: "#ffe66d",
    accentColor: "#fff6d6",
    bladeTrailIdle: "rgba(255, 230, 109, 0.38)",
    bladeTrailAttack: "rgba(255, 246, 214, 0.72)",
    backgroundGlow: "rgba(255, 230, 109, 0.13)",
  },
};

export const ProfessionConfig = {
  bat: {
    id: "bat",
    name: "蝙蝠球",
    maxHp: 86,
    radius: 23,
    moveSpeed: 220,
    attackDamage: 13,
    attackCooldown: 0.58,
    weaponRange: 34,
    color: "#5f4bb6",
    accentColor: "#ffd9f1",
    skillName: "尖牙吸血",
    item: {
      name: "暗翼尖牙",
      type: "fangWing",
      animation: "碰撞吸血",
    },
    collisionDrain: {
      damage: 12,
      heal: 0.46,
      disableDuration: 0.56,
      cooldown: 0.82,
    },
    getDamage() {
      return this.attackDamage;
    },
    getKnockbackMultiplier() {
      return 0.72;
    },
    isSkillHit() {
      return false;
    },
  },
  venom: {
    id: "venom",
    name: "毒液球",
    maxHp: 120,
    radius: 25,
    moveSpeed: 194,
    attackDamage: 10,
    attackCooldown: 0.78,
    weaponRange: 32,
    color: "#39d353",
    accentColor: "#caff70",
    skillName: "毒刺孢子",
    item: {
      name: "剧毒尖刺",
      type: "poisonSpike",
      animation: "撞墙产刺",
    },
    venomSpike: {
      radius: 22,
      duration: 7.5,
      damage: 4,
      poisonDamagePerSecond: 3.2,
      poisonDuration: 2.4,
      hitCooldown: 0.85,
    },
    getDamage() {
      return this.attackDamage;
    },
    getKnockbackMultiplier() {
      return 0.88;
    },
    isSkillHit() {
      return false;
    },
  },
  spider: {
    id: "spider",
    name: "蜘蛛球",
    maxHp: 104,
    radius: 23,
    moveSpeed: 204,
    attackDamage: 9,
    attackCooldown: 0.74,
    weaponRange: 34,
    color: "#6f42c1",
    accentColor: "#f0d7ff",
    skillName: "蛛丝结网",
    item: {
      name: "蛛丝节点",
      type: "webLine",
      animation: "奇偶撞墙连线",
    },
    webLine: {
      nodeRadius: 12,
      duration: 9,
      damage: 5,
      hitCooldown: 0.72,
      collisionRadius: 10,
    },
    getDamage() {
      return this.attackDamage;
    },
    getKnockbackMultiplier() {
      return 0.8;
    },
    isSkillHit() {
      return false;
    },
  },
  lava: {
    id: "lava",
    name: "熔岩球",
    maxHp: 124,
    radius: 26,
    moveSpeed: 184,
    attackDamage: 12,
    attackCooldown: 0.82,
    weaponRange: 34,
    color: "#ff6b24",
    accentColor: "#ffd166",
    skillName: "熔火路径",
    item: {
      name: "熔岩核心",
      type: "flameTrail",
      animation: "身后留火",
    },
    flameTrail: {
      radius: 24,
      duration: 2.8,
      dropInterval: 0.14,
      damage: 3,
      hitCooldown: 0.5,
    },
    getDamage() {
      return this.attackDamage;
    },
    getKnockbackMultiplier() {
      return 1.05;
    },
    isSkillHit() {
      return false;
    },
  },
  reaper: {
    id: "reaper",
    name: "死神球",
    maxHp: 108,
    radius: 24,
    moveSpeed: 205,
    attackDamage: 44,
    attackCooldown: 0.95,
    weaponRange: 135,
    color: "#202637",
    accentColor: "#e6f0ff",
    skillName: "镰刃收割",
    item: {
      name: "终末大镰刀",
      type: "scythe",
      animation: "慢速镰刃",
    },
    attackMode: "reaper",
    reaperBlade: {
      edgeLength: 230,
      collisionRadius: 36,
    },
    getDamage(attacker, defender) {
      return defender.profession === "reaper" ? 72 : this.attackDamage;
    },
    getKnockbackMultiplier() {
      return 1.05;
    },
    isSkillHit(attacker, defender, normalFromAttackerToDefender, damage) {
      return damage >= this.attackDamage;
    },
  },
  frost: {
    id: "frost",
    name: "冰冻球",
    maxHp: 96,
    radius: 24,
    moveSpeed: 176,
    attackDamage: 7,
    attackCooldown: 0.9,
    weaponRange: 74,
    color: "#8be8ff",
    accentColor: "#f8fbff",
    skillName: "冰轮冻结",
    item: {
      name: "环绕冰轮",
      type: "frostOrbit",
      animation: "冰轮冻结",
    },
    attackMode: "frostOrbit",
    frostOrbit: {
      orbitRadius: 76,
      orbRadius: 13,
      count: 3,
      spinSpeed: 2.7,
      damage: 14,
      freezeDuration: 0.55,
      hitCooldown: 0.5,
    },
    getDamage() {
      return this.attackDamage;
    },
    getKnockbackMultiplier() {
      return 0.58;
    },
    isSkillHit() {
      return true;
    },
  },
  yoyo: {
    id: "yoyo",
    name: "悠悠球",
    maxHp: 124,
    radius: 23,
    moveSpeed: 218,
    attackDamage: 8,
    attackCooldown: 0.82,
    weaponRange: 118,
    color: "#ff7ab6",
    accentColor: "#fff1a8",
    skillName: "像素回旋",
    item: {
      name: "像素悠悠球",
      type: "yoyo",
      animation: "定期甩出回旋",
    },
    attackMode: "yoyo",
    yoyoWeapon: {
      cooldown: 1,
      extendDuration: 0.2,
      activeDuration: 1.75,
      retractDuration: 0.28,
      orbitRadius: 138,
      headRadius: 18,
      lineRadius: 15,
      spinSpeed: 8.4,
      lineDamage: 17,
      headDamage: 24,
      hitCooldown: 0.2,
    },
    getDamage(attacker, defender, normalFromAttackerToDefender, attackVariant = null) {
      return attackVariant?.damage || this.attackDamage;
    },
    getKnockbackMultiplier(attacker, defender, normalFromAttackerToDefender, damage, attackVariant = null) {
      return attackVariant?.knockbackMultiplier || 0.68;
    },
    isSkillHit(attacker, defender, normalFromAttackerToDefender, damage, attackVariant = null) {
      return attackVariant?.yoyoHit === true;
    },
  },
  static: {
    id: "static",
    name: "静电球",
    maxHp: 112,
    radius: 24,
    moveSpeed: 210,
    attackDamage: 8,
    attackCooldown: 0.9,
    weaponRange: 72,
    color: "#facc15",
    accentColor: "#fff7a3",
    skillName: "静电充能",
    item: {
      name: "静电核心",
      type: "staticField",
      animation: "充能放电",
    },
    attackMode: "staticCharge",
    staticCharge: {
      chargeDuration: 1.45,
      fieldRadius: 78,
      impactDamage: 10,
      shockDamagePerSecond: 7.5,
      shockDuration: 2.2,
      paralyzeDuration: 1,
      hitCooldown: 0.25,
    },
    getDamage(attacker, defender, normalFromAttackerToDefender, attackVariant = null) {
      return attackVariant?.damage || this.attackDamage;
    },
    getKnockbackMultiplier(attacker, defender, normalFromAttackerToDefender, damage, attackVariant = null) {
      return attackVariant?.knockbackMultiplier || 0.62;
    },
    isSkillHit(attacker, defender, normalFromAttackerToDefender, damage, attackVariant = null) {
      return attackVariant?.staticDischarge === true;
    },
  },
  summoner: {
    id: "summoner",
    name: "召唤师",
    maxHp: 108,
    radius: 23,
    moveSpeed: 188,
    attackDamage: 0,
    attackCooldown: 1,
    weaponRange: 84,
    color: "#7c3aed",
    accentColor: "#fde68a",
    skillName: "熊灵契约",
    item: {
      name: "召熊图腾",
      type: "bearTotem",
      animation: "召唤熊灵",
    },
    attackMode: "summonBear",
    summonBear: {
      moveSpeed: 236,
      baseDamage: 23,
      damageGainPerOwnerHit: 3,
      radiusGainPerCollision: 2.4,
      maxRadiusMultiplier: 1.75,
      ownerBoostCooldown: 0,
      hitCooldown: 0.5,
      maxDamage: 58,
    },
    getDamage(attacker, defender, normalFromAttackerToDefender, attackVariant = null) {
      return attackVariant?.damage || 0;
    },
    getKnockbackMultiplier(attacker, defender, normalFromAttackerToDefender, damage, attackVariant = null) {
      return attackVariant?.knockbackMultiplier || 0.62;
    },
    isSkillHit(attacker, defender, normalFromAttackerToDefender, damage, attackVariant = null) {
      return attackVariant?.summonBearHit === true;
    },
  },
  spear: {
    id: "spear",
    name: "长矛球",
    maxHp: 100,
    radius: 24,
    moveSpeed: 210,
    attackDamage: 12,
    attackCooldown: 0.45,
    weaponRange: 50,
    color: "#49c5ff",
    accentColor: "#d8f4ff",
    skillName: "正面突刺",
    item: {
      name: "破风长矛",
      type: "spear",
      animation: "伸缩突刺",
    },
    getDamage(attacker, defender, normalFromAttackerToDefender) {
      const facingDot = dot(normalize(attacker.attackState?.direction || attacker.velocity), normalFromAttackerToDefender);
      const damage = facingDot >= 0.72 ? 16 : this.attackDamage;
      return defender.profession === "archer" ? Math.max(9, damage - 3) : damage;
    },
    getKnockbackMultiplier() {
      return 1;
    },
    isSkillHit(attacker, defender, normalFromAttackerToDefender, damage) {
      return damage > this.attackDamage;
    },
  },
  blade: {
    id: "blade",
    name: "大刀球",
    maxHp: 120,
    radius: 26,
    moveSpeed: 180,
    attackDamage: 19,
    attackCooldown: 0.65,
    weaponRange: 32,
    color: "#ffbd45",
    accentColor: "#fff0c2",
    skillName: "重斩",
    item: {
      name: "厚刃大刀",
      type: "blade",
      animation: "宽弧劈砍",
    },
    getDamage() {
      return this.attackDamage;
    },
    getKnockbackMultiplier() {
      return 1.3;
    },
    isSkillHit(attacker, defender, normalFromAttackerToDefender, damage) {
      return damage > 0;
    },
  },
  shield: {
    id: "shield",
    name: "盾牌球",
    maxHp: 130,
    radius: 28,
    moveSpeed: 170,
    attackDamage: 13,
    attackCooldown: 0.72,
    weaponRange: 56,
    color: "#78f0a4",
    accentColor: "#c6fff0",
    skillName: "盾墙反震",
    item: {
      name: "守卫方盾",
      type: "shield",
      animation: "盾面顶撞",
    },
    getDamage() {
      return this.attackDamage;
    },
    getKnockbackMultiplier() {
      return 0.85;
    },
    isSkillHit(attacker, defender, normalFromAttackerToDefender, damage) {
      const bracingDot = dot(normalize(attacker.velocity), normalFromAttackerToDefender);
      return damage > 0 && bracingDot < 0.25;
    },
  },
  assassin: {
    id: "assassin",
    name: "刺客球",
    maxHp: 108,
    radius: 22,
    moveSpeed: 248,
    attackDamage: 11,
    attackCooldown: 0.42,
    weaponRange: 44,
    color: "#c77dff",
    accentColor: "#ffe5ff",
    skillName: "双刀连斩",
    item: {
      name: "影牙双刀",
      type: "dualBlade",
      animation: "交错快斩",
    },
    getDamage(attacker, defender) {
      if (defender.profession === "chain") {
        return this.attackDamage;
      }
      const distanceToTarget = length(subtract(defender.position, attacker.position));
      const closeEnough = distanceToTarget <= attacker.radius + defender.radius + 24;
      return closeEnough ? 17 : this.attackDamage;
    },
    getKnockbackMultiplier() {
      return 0.72;
    },
    isSkillHit(attacker, defender, normalFromAttackerToDefender, damage) {
      return damage > this.attackDamage;
    },
  },
  archer: {
    id: "archer",
    name: "弓箭球",
    maxHp: 100,
    radius: 23,
    moveSpeed: 188,
    attackDamage: 7,
    attackCooldown: 1,
    weaponRange: Infinity,
    color: "#7bd88f",
    accentColor: "#ecffd8",
    skillName: "穿云箭",
    item: {
      name: "藤弦短弓",
      type: "bow",
      animation: "拉弦射箭",
    },
    attackMode: "projectile",
    projectileWeapon: {
      speed: 650,
      headRadius: 7,
      shaftLength: 44,
      spawnOffset: 34,
    },
    getDamage() {
      return this.attackDamage;
    },
    getKnockbackMultiplier() {
      return 0.78;
    },
    isSkillHit(attacker, defender, normalFromAttackerToDefender, damage) {
      return damage > 0;
    },
  },
  chain: {
    id: "chain",
    name: "链球",
    maxHp: 132,
    radius: 30,
    moveSpeed: 196,
    attackDamage: 16,
    attackCooldown: 1.08,
    weaponRange: 112,
    color: "#a5a7b5",
    accentColor: "#f4f6ff",
    skillName: "链锤重摆",
    item: {
      name: "铁星链锤",
      type: "flail",
      animation: "持续旋转",
    },
    attackMode: "chainSpin",
    chainWeapon: {
      orbitRadius: 120,
      headRadius: 38,
      spinSpeed: 5,
      hitCooldown: 0.32,
    },
    getDamage(attacker, defender) {
      if (defender.profession === "chain") {
        return 24;
      }
      const distanceToTarget = length(subtract(defender.position, attacker.position));
      const sweetSpot = distanceToTarget >= attacker.radius + defender.radius + 82;
      return sweetSpot ? 24 : this.attackDamage;
    },
    getKnockbackMultiplier() {
      return 1.2;
    },
    isSkillHit(attacker, defender, normalFromAttackerToDefender, damage) {
      return damage > this.attackDamage;
    },
  },
  mage: {
    id: "mage",
    name: "法师球",
    maxHp: 108,
    radius: 23,
    moveSpeed: 166,
    attackDamage: 8,
    attackCooldown: 1.32,
    weaponRange: 205,
    color: "#8d8cff",
    accentColor: "#f3e8ff",
    skillName: "三相法术",
    item: {
      name: "三相法杖",
      type: "staff",
      animation: "随机施法",
    },
    attackMode: "spell",
    spellBook: [
      {
        id: "fire",
        name: "火球",
        damage: 10,
        color: "#ff6b3d",
        knockbackMultiplier: 0.98,
        castType: "projectile",
        speed: 520,
        headRadius: 15,
        shaftLength: 32,
        spawnOffset: 22,
      },
      {
        id: "ice",
        name: "冰锥",
        damage: 6,
        color: "#9ff7ff",
        knockbackMultiplier: 0.52,
        castType: "projectile",
        speed: 700,
        headRadius: 10,
        shaftLength: 44,
        spawnOffset: 24,
      },
      {
        id: "lightning",
        name: "闪电",
        damage: 8,
        color: "#ffe66d",
        knockbackMultiplier: 1.18,
        castType: "trajectory",
        range: 255,
        collisionRadius: 13,
        duration: 0.17,
        segmentCount: 5,
      },
    ],
    getAttackVariant(attacker, defender, currentTime = 0) {
      const seed = Math.sin((currentTime + attacker.position.x * 0.17 + defender.position.y * 0.11) * 91.7) * 10000;
      const index = Math.abs(Math.floor(seed)) % this.spellBook.length;
      return this.spellBook[index];
    },
    getDamage(attacker, defender, normalFromAttackerToDefender, attackVariant) {
      return attackVariant?.damage || attacker.attackState?.variant?.damage || this.attackDamage;
    },
    getKnockbackMultiplier(attacker, defender, normalFromAttackerToDefender, damage, attackVariant) {
      return attackVariant?.knockbackMultiplier || attacker?.attackState?.variant?.knockbackMultiplier || 0.9;
    },
    isSkillHit(attacker, defender, normalFromAttackerToDefender, damage) {
      return damage > 0;
    },
  },
};

export function getAttackAnimationConfig(profession) {
  return ATTACK_ANIMATION_CONFIG[profession] || ATTACK_ANIMATION_CONFIG.default;
}

export function getSceneConfig(sceneId) {
  return SceneConfig[sceneId] || SceneConfig[DEFAULT_SCENE_ID];
}

export function isItemScene(sceneId) {
  return getSceneConfig(sceneId).type === "items";
}

export function isHeroScene(sceneId) {
  return getSceneConfig(sceneId).type === "heroes";
}

export function getSceneProfessionIds(sceneId) {
  return getSceneConfig(sceneId).professionIds;
}

export function getSceneDefaultProfessions(sceneId) {
  return getSceneConfig(sceneId).defaultProfessions;
}

export function getSpeedMultiplier(elapsedSeconds) {
  const rampSeconds = Math.max(0.001, SPEED_RAMP_CONFIG.secondsToMaxMultiplier);
  const progress = clamp(elapsedSeconds / rampSeconds, 0, 1);
  return (
    SPEED_RAMP_CONFIG.startMultiplier +
    (SPEED_RAMP_CONFIG.maxMultiplier - SPEED_RAMP_CONFIG.startMultiplier) * progress
  );
}

function dot(a, b) {
  return a.x * b.x + a.y * b.y;
}

function length(vector) {
  return Math.hypot(vector.x, vector.y);
}

function subtract(a, b) {
  return { x: a.x - b.x, y: a.y - b.y };
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
