export const CosmeticTrigger = Object.freeze({
  ALWAYS: "always",
  ATTACK: "attack",
  SKILL: "skill",
});

export const PendantType = Object.freeze({
  TRAIL: "trail",
  HALO: "halo",
  SHOULDER: "shoulder",
  BACK: "back",
});

export const AttackEffectType = Object.freeze({
  IMPACT: "impact",
  SLASH: "slash",
  THRUST: "thrust",
  KNOCKBACK: "knockback",
  SKILL: "skill",
});

export const Rarity = Object.freeze({
  COMMON: "common",
  RARE: "rare",
  EPIC: "epic",
  LEGENDARY: "legendary",
  LIMITED: "limited",
});

export const ProfessionCosmeticConfig = {
  spear: {
    profession: "spear",
    skinPacks: ["default", "sky-guard"],
    pendants: [
      {
        id: "spear-wind-trail",
        name: "破风尾迹",
        type: PendantType.TRAIL,
        trigger: CosmeticTrigger.ALWAYS,
        effect: "motionTrail",
        color: "#49c5ff",
        duration: 0,
        rarity: Rarity.COMMON,
        skinPack: "default",
      },
      {
        id: "spear-focus-halo",
        name: "凝光环",
        type: PendantType.HALO,
        trigger: CosmeticTrigger.ALWAYS,
        effect: "softHalo",
        color: "#d8f4ff",
        duration: 0,
        rarity: Rarity.RARE,
        skinPack: "sky-guard",
      },
      {
        id: "spear-thrust-shoulders",
        name: "突刺肩光",
        type: PendantType.SHOULDER,
        trigger: CosmeticTrigger.SKILL,
        effect: "shoulderFlare",
        color: "#b9edff",
        duration: 0.28,
        rarity: Rarity.EPIC,
        skinPack: "sky-guard",
      },
    ],
    attackEffects: [
      {
        id: "spear-impact-spark",
        name: "矛尖撞光",
        type: AttackEffectType.IMPACT,
        trigger: CosmeticTrigger.ATTACK,
        effect: "impactBurst",
        color: "#87ddff",
        duration: 0.24,
        rarity: Rarity.COMMON,
        skinPack: "default",
      },
      {
        id: "spear-front-thrust",
        name: "正面突刺线",
        type: AttackEffectType.THRUST,
        trigger: CosmeticTrigger.SKILL,
        effect: "thrustLine",
        color: "#d8f4ff",
        duration: 0.22,
        rarity: Rarity.RARE,
        skinPack: "default",
      },
    ],
  },
  blade: {
    profession: "blade",
    skinPacks: ["default", "ember-feast"],
    pendants: [
      {
        id: "blade-ember-trail",
        name: "余烬尾迹",
        type: PendantType.TRAIL,
        trigger: CosmeticTrigger.ALWAYS,
        effect: "motionTrail",
        color: "#ff8a54",
        duration: 0,
        rarity: Rarity.COMMON,
        skinPack: "default",
      },
      {
        id: "blade-hit-shoulders",
        name: "战意肩饰",
        type: PendantType.SHOULDER,
        trigger: CosmeticTrigger.ATTACK,
        effect: "shoulderFlare",
        color: "#ffd37a",
        duration: 0.22,
        rarity: Rarity.RARE,
        skinPack: "default",
      },
      {
        id: "blade-heavy-back",
        name: "重斩背饰",
        type: PendantType.BACK,
        trigger: CosmeticTrigger.SKILL,
        effect: "backBanner",
        color: "#ffbd45",
        duration: 0.34,
        rarity: Rarity.EPIC,
        skinPack: "ember-feast",
      },
    ],
    attackEffects: [
      {
        id: "blade-slash-arc",
        name: "大刀挥砍",
        type: AttackEffectType.SLASH,
        trigger: CosmeticTrigger.ATTACK,
        effect: "slashArc",
        color: "#ffd37a",
        duration: 0.25,
        rarity: Rarity.COMMON,
        skinPack: "default",
      },
      {
        id: "blade-heavy-knockback",
        name: "重斩击退波",
        type: AttackEffectType.KNOCKBACK,
        trigger: CosmeticTrigger.SKILL,
        effect: "knockbackWave",
        color: "#ff7b54",
        duration: 0.36,
        rarity: Rarity.RARE,
        skinPack: "default",
      },
    ],
  },
  shield: {
    profession: "shield",
    skinPacks: ["default", "winter-guard"],
    pendants: [
      {
        id: "shield-guard-halo",
        name: "守护光环",
        type: PendantType.HALO,
        trigger: CosmeticTrigger.ALWAYS,
        effect: "softHalo",
        color: "#78f0a4",
        duration: 0,
        rarity: Rarity.COMMON,
        skinPack: "default",
      },
      {
        id: "shield-back-plate",
        name: "盾纹背饰",
        type: PendantType.BACK,
        trigger: CosmeticTrigger.ALWAYS,
        effect: "backBanner",
        color: "#83d99b",
        duration: 0,
        rarity: Rarity.RARE,
        skinPack: "default",
      },
      {
        id: "shield-festival-shoulders",
        name: "冰晶肩饰",
        type: PendantType.SHOULDER,
        trigger: CosmeticTrigger.SKILL,
        effect: "shoulderFlare",
        color: "#c6fff0",
        duration: 0.42,
        rarity: Rarity.LIMITED,
        skinPack: "winter-guard",
        limitedTag: "winter-festival",
      },
    ],
    attackEffects: [
      {
        id: "shield-impact-ring",
        name: "盾击震环",
        type: AttackEffectType.IMPACT,
        trigger: CosmeticTrigger.ATTACK,
        effect: "impactBurst",
        color: "#78f0a4",
        duration: 0.28,
        rarity: Rarity.COMMON,
        skinPack: "default",
      },
      {
        id: "shield-skill-wall",
        name: "盾墙脉冲",
        type: AttackEffectType.SKILL,
        trigger: CosmeticTrigger.SKILL,
        effect: "shieldPulse",
        color: "#c6fff0",
        duration: 0.45,
        rarity: Rarity.EPIC,
        skinPack: "winter-guard",
        limitedTag: "winter-festival",
      },
    ],
  },
};

export function createCosmeticState() {
  return {
    triggeredPendants: [],
  };
}

export function getProfessionCosmetics(profession) {
  return ProfessionCosmeticConfig[profession] || {
    profession,
    skinPacks: [],
    pendants: [],
    attackEffects: [],
  };
}

export function triggerBallPendants(ball, trigger, currentTime) {
  const cosmetics = getProfessionCosmetics(ball.profession);
  const pendants = cosmetics.pendants.filter((pendant) => pendant.trigger === trigger);

  for (const pendant of pendants) {
    ball.cosmeticState.triggeredPendants.push({
      ...pendant,
      startTime: currentTime,
      duration: Math.max(0.01, pendant.duration),
    });
  }
}

export function updateBallCosmetics(ball, currentTime) {
  ball.cosmeticState.triggeredPendants = ball.cosmeticState.triggeredPendants.filter(
    (pendant) => currentTime - pendant.startTime <= pendant.duration,
  );
}

export function createAttackEffectInstances({ attacker, defender, normal, trigger, currentTime }) {
  const cosmetics = getProfessionCosmetics(attacker.profession);

  return cosmetics.attackEffects
    .filter((effect) => effect.trigger === trigger)
    .map((effect) => ({
      ...effect,
      startTime: currentTime,
      source: { ...attacker.position },
      origin: { ...defender.position },
      normal: normalize(normal),
      attackerRadius: attacker.radius,
      defenderRadius: defender.radius,
    }));
}

export function updateAttackEffectInstances(effectInstances, currentTime) {
  return effectInstances.filter((effect) => currentTime - effect.startTime <= effect.duration);
}

export function renderBallPendants(ctx, ball, currentTime) {
  const cosmetics = getProfessionCosmetics(ball.profession);
  const alwaysPendants = cosmetics.pendants.filter(
    (pendant) => pendant.trigger === CosmeticTrigger.ALWAYS,
  );
  const activePendants = [...alwaysPendants, ...ball.cosmeticState.triggeredPendants];

  for (const pendant of activePendants) {
    renderPendant(ctx, ball, pendant, currentTime);
  }
}

export function renderAttackEffectInstances(ctx, effectInstances, currentTime) {
  for (const effect of effectInstances) {
    renderAttackEffect(ctx, effect, currentTime);
  }
}

function renderPendant(ctx, ball, pendant, currentTime) {
  const progress = pendant.duration > 0 ? clamp((currentTime - pendant.startTime) / pendant.duration, 0, 1) : 0;
  const alpha = pendant.duration > 0 ? 1 - progress : 1;

  switch (pendant.effect) {
    case "motionTrail":
      drawMotionTrail(ctx, ball, pendant, currentTime, alpha);
      break;
    case "softHalo":
      drawSoftHalo(ctx, ball, pendant, currentTime, alpha);
      break;
    case "shoulderFlare":
      drawShoulderFlare(ctx, ball, pendant, currentTime, alpha);
      break;
    case "backBanner":
      drawBackBanner(ctx, ball, pendant, currentTime, alpha);
      break;
    default:
      drawSoftHalo(ctx, ball, pendant, currentTime, alpha);
      break;
  }
}

function renderAttackEffect(ctx, effect, currentTime) {
  const progress = clamp((currentTime - effect.startTime) / effect.duration, 0, 1);
  const alpha = 1 - progress;

  switch (effect.effect) {
    case "impactBurst":
      drawImpactBurst(ctx, effect, progress, alpha);
      break;
    case "slashArc":
      drawSlashArc(ctx, effect, progress, alpha);
      break;
    case "thrustLine":
      drawThrustLine(ctx, effect, progress, alpha);
      break;
    case "knockbackWave":
      drawKnockbackWave(ctx, effect, progress, alpha);
      break;
    case "shieldPulse":
      drawShieldPulse(ctx, effect, progress, alpha);
      break;
    default:
      drawImpactBurst(ctx, effect, progress, alpha);
      break;
  }
}

function drawMotionTrail(ctx, ball, pendant, currentTime, alpha) {
  const facing = normalize(ball.velocity);
  const back = scale(facing, -1);
  const pulse = 1 + Math.sin(currentTime * 9) * 0.08;
  const trailColor = getBallPrimaryColor(ball, pendant.color);

  ctx.save();
  for (let i = 1; i <= 4; i += 1) {
    const center = add(ball.position, scale(back, ball.radius * (0.5 + i * 0.38)));
    ctx.globalAlpha = alpha * (0.18 / i);
    ctx.fillStyle = trailColor;
    ctx.beginPath();
    ctx.arc(center.x, center.y, ball.radius * (0.92 - i * 0.13) * pulse, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawSoftHalo(ctx, ball, pendant, currentTime, alpha) {
  const pulse = Math.sin(currentTime * 4) * 2;
  const haloColor = getBallAccentColor(ball, pendant.color);

  ctx.save();
  ctx.globalAlpha = alpha * 0.52;
  ctx.strokeStyle = haloColor;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(ball.position.x, ball.position.y, ball.radius + 9 + pulse, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawShoulderFlare(ctx, ball, pendant, currentTime, alpha) {
  const facing = normalize(ball.velocity);
  const side = { x: -facing.y, y: facing.x };
  const pulse = 1 + Math.sin(currentTime * 16) * 0.18;
  const flareColor = getBallAccentColor(ball, pendant.color);

  ctx.save();
  ctx.globalAlpha = alpha * 0.8;
  ctx.fillStyle = flareColor;
  for (const sign of [-1, 1]) {
    const center = add(ball.position, scale(side, sign * ball.radius * 0.88));
    ctx.beginPath();
    ctx.arc(center.x, center.y, 5.5 * pulse, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawBackBanner(ctx, ball, pendant, currentTime, alpha) {
  const facing = normalize(ball.velocity);
  const side = { x: -facing.y, y: facing.x };
  const backCenter = add(ball.position, scale(facing, -ball.radius * 1.08));
  const halfWidth = ball.radius * 0.48;
  const length = ball.radius * (0.78 + Math.sin(currentTime * 7) * 0.04);
  const bannerColor = getBallPrimaryColor(ball, pendant.color);

  ctx.save();
  ctx.globalAlpha = alpha * 0.74;
  ctx.fillStyle = bannerColor;
  ctx.beginPath();
  moveToVector(ctx, add(backCenter, scale(side, -halfWidth)));
  lineToVector(ctx, add(backCenter, scale(side, halfWidth)));
  lineToVector(ctx, add(add(backCenter, scale(side, halfWidth * 0.62)), scale(facing, -length)));
  lineToVector(ctx, add(add(backCenter, scale(side, -halfWidth * 0.62)), scale(facing, -length)));
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function getBallPrimaryColor(ball, fallbackColor) {
  return ball.visual?.color || fallbackColor;
}

function getBallAccentColor(ball, fallbackColor) {
  return ball.visual?.accentColor || fallbackColor;
}

function drawImpactBurst(ctx, effect, progress, alpha) {
  const radius = effect.defenderRadius + 12 + progress * 34;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = effect.color;
  ctx.lineWidth = 4 - progress * 2;
  ctx.beginPath();
  ctx.arc(effect.origin.x, effect.origin.y, radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawSlashArc(ctx, effect, progress, alpha) {
  const angle = Math.atan2(effect.normal.y, effect.normal.x);
  const radius = effect.defenderRadius + 28 + progress * 18;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = effect.color;
  ctx.lineWidth = 10 - progress * 5;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.arc(effect.origin.x, effect.origin.y, radius, angle - 1.05, angle + 1.05);
  ctx.stroke();
  ctx.restore();
}

function drawThrustLine(ctx, effect, progress, alpha) {
  const start = add(effect.source, scale(effect.normal, effect.attackerRadius));
  const end = add(effect.origin, scale(effect.normal, effect.defenderRadius * 0.4));
  const shimmer = 1 + progress * 0.2;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = effect.color;
  ctx.lineWidth = 7 * shimmer;
  ctx.lineCap = "round";
  ctx.beginPath();
  moveToVector(ctx, start);
  lineToVector(ctx, end);
  ctx.stroke();
  ctx.restore();
}

function drawKnockbackWave(ctx, effect, progress, alpha) {
  const center = add(effect.origin, scale(effect.normal, 18 + progress * 24));
  const radius = effect.defenderRadius + 18 + progress * 46;

  ctx.save();
  ctx.globalAlpha = alpha * 0.85;
  ctx.strokeStyle = effect.color;
  ctx.lineWidth = 8 - progress * 5;
  ctx.beginPath();
  ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawShieldPulse(ctx, effect, progress, alpha) {
  const radius = effect.attackerRadius + 24 + progress * 52;

  ctx.save();
  ctx.globalAlpha = alpha * 0.72;
  ctx.strokeStyle = effect.color;
  ctx.lineWidth = 5;
  ctx.setLineDash([14, 10]);
  ctx.beginPath();
  ctx.arc(effect.source.x, effect.source.y, radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function moveToVector(ctx, vector) {
  ctx.moveTo(vector.x, vector.y);
}

function lineToVector(ctx, vector) {
  ctx.lineTo(vector.x, vector.y);
}

function add(a, b) {
  return { x: a.x + b.x, y: a.y + b.y };
}

function scale(vector, scalar) {
  return { x: vector.x * scalar, y: vector.y * scalar };
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
