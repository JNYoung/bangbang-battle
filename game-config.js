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
  blade: {
    duration: 0.32,
    hitFrame: 0.55,
    sweepAngle: (Math.PI * 130) / 180,
  },
  default: {
    duration: 0.24,
    hitFrame: 0.5,
  },
};

export const COLORS = {
  backgroundTop: "#111722",
  backgroundBottom: "#0d1118",
  panel: "rgba(25, 32, 42, 0.9)",
  panelBorder: "rgba(169, 186, 211, 0.25)",
  text: "#f4f7fb",
  muted: "#9aa8b9",
  arena: "#151b23",
  grid: "rgba(255, 255, 255, 0.055)",
  button: "#f2f6fb",
  buttonText: "#101318",
};

export const SIDE_VISUAL_CONFIG = {
  A: {
    color: "#49c5ff",
    accentColor: "#d8f4ff",
    bladeTrailIdle: "rgba(216, 244, 255, 0.34)",
    bladeTrailAttack: "rgba(216, 244, 255, 0.68)",
    backgroundGlow: "rgba(73, 197, 255, 0.13)",
  },
  B: {
    color: "#ffbd45",
    accentColor: "#fff0c2",
    bladeTrailIdle: "rgba(255, 240, 194, 0.34)",
    bladeTrailAttack: "rgba(255, 240, 194, 0.68)",
    backgroundGlow: "rgba(255, 189, 69, 0.13)",
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
    getDamage(attacker, defender, normalFromAttackerToDefender) {
      const facingDot = dot(normalize(attacker.attackState?.direction || attacker.velocity), normalFromAttackerToDefender);
      return facingDot >= 0.72 ? 16 : this.attackDamage;
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
