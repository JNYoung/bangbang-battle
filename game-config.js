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
  default: {
    duration: 0.24,
    hitFrame: 0.5,
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
    attackDamage: 20,
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
    maxHp: 140,
    radius: 28,
    moveSpeed: 170,
    attackDamage: 14,
    attackCooldown: 0.7,
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
    maxHp: 92,
    radius: 22,
    moveSpeed: 248,
    attackDamage: 9,
    attackCooldown: 0.46,
    weaponRange: 38,
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
      return closeEnough ? 13 : this.attackDamage;
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
    maxHp: 96,
    radius: 23,
    moveSpeed: 188,
    attackDamage: 5,
    attackCooldown: 1.2,
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
      speed: 620,
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
    maxHp: 118,
    radius: 30,
    moveSpeed: 178,
    attackDamage: 10,
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
      orbitRadius: 112,
      headRadius: 28,
      spinSpeed: 3.6,
      hitCooldown: 0.5,
    },
    getDamage(attacker, defender) {
      if (defender.profession === "chain") {
        return 24;
      }
      const distanceToTarget = length(subtract(defender.position, attacker.position));
      const sweetSpot = distanceToTarget >= attacker.radius + defender.radius + 82;
      return sweetSpot ? 13 : this.attackDamage;
    },
    getKnockbackMultiplier() {
      return 1.55;
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
    moveSpeed: 172,
    attackDamage: 8,
    attackCooldown: 1.18,
    weaponRange: 215,
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
