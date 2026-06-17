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
  PROJECTILE: "projectile",
  MAGIC: "magic",
  CHAIN: "chain",
});

export const Rarity = Object.freeze({
  COMMON: "common",
  RARE: "rare",
  EPIC: "epic",
  LEGENDARY: "legendary",
  LIMITED: "limited",
});

export const ProfessionCosmeticConfig = {
  bat: {
    profession: "bat",
    skinPacks: ["default", "night-fang"],
    pendants: [
      {
        id: "bat-wing-shadow",
        name: "暗翼尾影",
        type: PendantType.TRAIL,
        trigger: CosmeticTrigger.ALWAYS,
        effect: "motionTrail",
        color: "#5f4bb6",
        duration: 0,
        rarity: Rarity.COMMON,
        skinPack: "default",
      },
      {
        id: "bat-drain-shoulders",
        name: "吸血肩光",
        type: PendantType.SHOULDER,
        trigger: CosmeticTrigger.ATTACK,
        effect: "shoulderFlare",
        color: "#ffd9f1",
        duration: 0.24,
        rarity: Rarity.RARE,
        skinPack: "night-fang",
      },
    ],
    attackEffects: [
      {
        id: "bat-fang-drain",
        name: "尖牙吸血",
        type: AttackEffectType.SKILL,
        trigger: CosmeticTrigger.ATTACK,
        effect: "dualSlashPixels",
        color: "#ffd9f1",
        duration: 0.24,
        rarity: Rarity.COMMON,
        skinPack: "default",
      },
    ],
  },
  venom: {
    profession: "venom",
    skinPacks: ["default", "toxic-spore"],
    pendants: [
      {
        id: "venom-toxic-trail",
        name: "毒液尾迹",
        type: PendantType.TRAIL,
        trigger: CosmeticTrigger.ALWAYS,
        effect: "motionTrail",
        color: "#39d353",
        duration: 0,
        rarity: Rarity.COMMON,
        skinPack: "default",
      },
    ],
    attackEffects: [
      {
        id: "venom-spike-pop",
        name: "毒刺爆点",
        type: AttackEffectType.IMPACT,
        trigger: CosmeticTrigger.ATTACK,
        effect: "impactBurst",
        color: "#caff70",
        duration: 0.26,
        rarity: Rarity.COMMON,
        skinPack: "default",
      },
    ],
  },
  spider: {
    profession: "spider",
    skinPacks: ["default", "web-lattice"],
    pendants: [
      {
        id: "spider-web-halo",
        name: "蛛网光环",
        type: PendantType.HALO,
        trigger: CosmeticTrigger.ALWAYS,
        effect: "softHalo",
        color: "#f0d7ff",
        duration: 0,
        rarity: Rarity.COMMON,
        skinPack: "default",
      },
    ],
    attackEffects: [
      {
        id: "spider-thread-hit",
        name: "蛛丝割线",
        type: AttackEffectType.SLASH,
        trigger: CosmeticTrigger.ATTACK,
        effect: "slashArc",
        color: "#f0d7ff",
        duration: 0.22,
        rarity: Rarity.COMMON,
        skinPack: "default",
      },
    ],
  },
  lava: {
    profession: "lava",
    skinPacks: ["default", "molten-core"],
    pendants: [
      {
        id: "lava-ember-trail",
        name: "熔火尾迹",
        type: PendantType.TRAIL,
        trigger: CosmeticTrigger.ALWAYS,
        effect: "motionTrail",
        color: "#ff6b24",
        duration: 0,
        rarity: Rarity.COMMON,
        skinPack: "default",
      },
    ],
    attackEffects: [
      {
        id: "lava-core-burst",
        name: "熔核爆点",
        type: AttackEffectType.MAGIC,
        trigger: CosmeticTrigger.ATTACK,
        effect: "spellBurstPixels",
        color: "#ffd166",
        duration: 0.28,
        rarity: Rarity.COMMON,
        skinPack: "default",
      },
    ],
  },
  reaper: {
    profession: "reaper",
    skinPacks: ["default", "last-harvest"],
    pendants: [
      {
        id: "reaper-night-halo",
        name: "死寂光环",
        type: PendantType.HALO,
        trigger: CosmeticTrigger.ALWAYS,
        effect: "softHalo",
        color: "#e6f0ff",
        duration: 0,
        rarity: Rarity.COMMON,
        skinPack: "default",
      },
    ],
    attackEffects: [
      {
        id: "reaper-scythe-cleave",
        name: "镰刃收割",
        type: AttackEffectType.SLASH,
        trigger: CosmeticTrigger.SKILL,
        effect: "dualSlashPixels",
        color: "#e6f0ff",
        duration: 0.34,
        rarity: Rarity.RARE,
        skinPack: "default",
      },
    ],
  },
  frost: {
    profession: "frost",
    skinPacks: ["default", "ice-orbit"],
    pendants: [
      {
        id: "frost-ice-halo",
        name: "冰轮光环",
        type: PendantType.HALO,
        trigger: CosmeticTrigger.ALWAYS,
        effect: "softHalo",
        color: "#8be8ff",
        duration: 0,
        rarity: Rarity.COMMON,
        skinPack: "default",
      },
    ],
    attackEffects: [
      {
        id: "frost-freeze-burst",
        name: "冻结爆点",
        type: AttackEffectType.MAGIC,
        trigger: CosmeticTrigger.SKILL,
        effect: "spellBurstPixels",
        color: "#f8fbff",
        duration: 0.3,
        rarity: Rarity.COMMON,
        skinPack: "default",
      },
    ],
  },
  yoyo: {
    profession: "yoyo",
    skinPacks: ["default", "pixel-loop"],
    pendants: [
      {
        id: "yoyo-pixel-trail",
        name: "回旋像素尾迹",
        type: PendantType.TRAIL,
        trigger: CosmeticTrigger.ALWAYS,
        effect: "motionTrail",
        color: "#ff7ab6",
        duration: 0,
        rarity: Rarity.COMMON,
        skinPack: "default",
      },
    ],
    attackEffects: [
      {
        id: "yoyo-line-snap",
        name: "像素线割击",
        type: AttackEffectType.CHAIN,
        trigger: CosmeticTrigger.SKILL,
        effect: "slashArc",
        color: "#fff1a8",
        duration: 0.24,
        rarity: Rarity.COMMON,
        skinPack: "default",
      },
    ],
  },
  static: {
    profession: "static",
    skinPacks: ["default", "charged-core"],
    pendants: [
      {
        id: "static-electric-halo",
        name: "静电光环",
        type: PendantType.HALO,
        trigger: CosmeticTrigger.ALWAYS,
        effect: "softHalo",
        color: "#fff7a3",
        duration: 0,
        rarity: Rarity.COMMON,
        skinPack: "default",
      },
    ],
    attackEffects: [
      {
        id: "static-discharge-burst",
        name: "静电放电",
        type: AttackEffectType.MAGIC,
        trigger: CosmeticTrigger.SKILL,
        effect: "spellBurstPixels",
        color: "#facc15",
        duration: 0.28,
        rarity: Rarity.COMMON,
        skinPack: "default",
      },
    ],
  },
  railgun: {
    profession: "railgun",
    skinPacks: ["default", "predictive-arc"],
    pendants: [
      {
        id: "railgun-charge-trail",
        name: "磁轨尾迹",
        type: PendantType.TRAIL,
        trigger: CosmeticTrigger.ALWAYS,
        effect: "motionTrail",
        color: "#99f6e4",
        duration: 0,
        rarity: Rarity.COMMON,
        skinPack: "default",
      },
      {
        id: "railgun-aim-halo",
        name: "预判准星",
        type: PendantType.HALO,
        trigger: CosmeticTrigger.ATTACK,
        effect: "softHalo",
        color: "#67e8f9",
        duration: 0.3,
        rarity: Rarity.RARE,
        skinPack: "predictive-arc",
      },
    ],
    attackEffects: [
      {
        id: "railgun-pulse-shot",
        name: "磁轨点射",
        type: AttackEffectType.PROJECTILE,
        trigger: CosmeticTrigger.ATTACK,
        effect: "arrowTrailPixels",
        color: "#67e8f9",
        duration: 0.28,
        rarity: Rarity.COMMON,
        skinPack: "default",
      },
    ],
  },
  summoner: {
    profession: "summoner",
    skinPacks: ["default", "bear-pact"],
    pendants: [
      {
        id: "summoner-rune-halo",
        name: "召唤符文",
        type: PendantType.HALO,
        trigger: CosmeticTrigger.ALWAYS,
        effect: "softHalo",
        color: "#fde68a",
        duration: 0,
        rarity: Rarity.COMMON,
        skinPack: "default",
      },
    ],
    attackEffects: [
      {
        id: "summoner-bear-impact",
        name: "熊灵冲撞",
        type: AttackEffectType.IMPACT,
        trigger: CosmeticTrigger.SKILL,
        effect: "impactBurst",
        color: "#fbbf24",
        duration: 0.26,
        rarity: Rarity.COMMON,
        skinPack: "default",
      },
    ],
  },
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
  assassin: {
    profession: "assassin",
    skinPacks: ["default", "shadow-cut"],
    pendants: [
      {
        id: "assassin-shadow-trail",
        name: "残影尾迹",
        type: PendantType.TRAIL,
        trigger: CosmeticTrigger.ALWAYS,
        effect: "motionTrail",
        color: "#c77dff",
        duration: 0,
        rarity: Rarity.COMMON,
        skinPack: "default",
      },
      {
        id: "assassin-dual-flare",
        name: "双刀闪光",
        type: PendantType.SHOULDER,
        trigger: CosmeticTrigger.SKILL,
        effect: "shoulderFlare",
        color: "#ffe5ff",
        duration: 0.18,
        rarity: Rarity.RARE,
        skinPack: "shadow-cut",
      },
    ],
    attackEffects: [
      {
        id: "assassin-cross-slash",
        name: "交叉斩痕",
        type: AttackEffectType.SLASH,
        trigger: CosmeticTrigger.ATTACK,
        effect: "dualSlashPixels",
        color: "#ffe5ff",
        duration: 0.2,
        rarity: Rarity.COMMON,
        skinPack: "default",
      },
    ],
  },
  archer: {
    profession: "archer",
    skinPacks: ["default", "leaf-string"],
    pendants: [
      {
        id: "archer-leaf-trail",
        name: "箭羽尾迹",
        type: PendantType.TRAIL,
        trigger: CosmeticTrigger.ALWAYS,
        effect: "motionTrail",
        color: "#7bd88f",
        duration: 0,
        rarity: Rarity.COMMON,
        skinPack: "default",
      },
    ],
    attackEffects: [
      {
        id: "archer-arrow-line",
        name: "穿云箭线",
        type: AttackEffectType.PROJECTILE,
        trigger: CosmeticTrigger.ATTACK,
        effect: "arrowTrailPixels",
        color: "#ecffd8",
        duration: 0.22,
        rarity: Rarity.COMMON,
        skinPack: "default",
      },
    ],
  },
  chain: {
    profession: "chain",
    skinPacks: ["default", "iron-swing"],
    pendants: [
      {
        id: "chain-iron-back",
        name: "铁链背饰",
        type: PendantType.BACK,
        trigger: CosmeticTrigger.ALWAYS,
        effect: "backBanner",
        color: "#a5a7b5",
        duration: 0,
        rarity: Rarity.COMMON,
        skinPack: "default",
      },
      {
        id: "chain-smash-flare",
        name: "重锤肩光",
        type: PendantType.SHOULDER,
        trigger: CosmeticTrigger.SKILL,
        effect: "shoulderFlare",
        color: "#f4f6ff",
        duration: 0.3,
        rarity: Rarity.RARE,
        skinPack: "iron-swing",
      },
    ],
    attackEffects: [
      {
        id: "chain-hammer-wave",
        name: "链锤震波",
        type: AttackEffectType.CHAIN,
        trigger: CosmeticTrigger.ATTACK,
        effect: "chainHammerPixels",
        color: "#f4f6ff",
        duration: 0.32,
        rarity: Rarity.COMMON,
        skinPack: "default",
      },
    ],
  },
  mage: {
    profession: "mage",
    skinPacks: ["default", "tri-spell"],
    pendants: [
      {
        id: "mage-rune-halo",
        name: "符文光环",
        type: PendantType.HALO,
        trigger: CosmeticTrigger.ALWAYS,
        effect: "softHalo",
        color: "#8d8cff",
        duration: 0,
        rarity: Rarity.COMMON,
        skinPack: "default",
      },
      {
        id: "mage-cast-shoulders",
        name: "施法肩光",
        type: PendantType.SHOULDER,
        trigger: CosmeticTrigger.ATTACK,
        effect: "shoulderFlare",
        color: "#f3e8ff",
        duration: 0.26,
        rarity: Rarity.RARE,
        skinPack: "tri-spell",
      },
    ],
    attackEffects: [
      {
        id: "mage-spell-burst",
        name: "三相爆点",
        type: AttackEffectType.MAGIC,
        trigger: CosmeticTrigger.ATTACK,
        effect: "spellBurstPixels",
        color: "#f3e8ff",
        duration: 0.28,
        rarity: Rarity.COMMON,
        skinPack: "default",
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
      color: attacker.attackState?.variant?.color || effect.color,
      variant: attacker.attackState?.variant || null,
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

export function renderAttackEffectInstances(ctx, effectInstances, currentTime, options = {}) {
  const stride = Math.max(1, Math.floor(options.stride || 1));
  for (let index = 0; index < effectInstances.length; index += stride) {
    renderAttackEffect(ctx, effectInstances[index], currentTime);
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
    case "dualSlashPixels":
      drawDualSlashPixels(ctx, effect, progress, alpha);
      break;
    case "arrowTrailPixels":
      drawArrowTrailPixels(ctx, effect, progress, alpha);
      break;
    case "chainHammerPixels":
      drawChainHammerPixels(ctx, effect, progress, alpha);
      break;
    case "spellBurstPixels":
      drawSpellBurstPixels(ctx, effect, progress, alpha);
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
    const size = Math.max(6, Math.round(ball.radius * (0.92 - i * 0.13) * pulse));
    ctx.fillRect(center.x - size / 2, center.y - size / 2, size, size);
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
  const size = (ball.radius + 9 + pulse) * 2;
  ctx.strokeRect(ball.position.x - size / 2, ball.position.y - size / 2, size, size);
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
    const size = 8 * pulse;
    ctx.fillRect(center.x - size / 2, center.y - size / 2, size, size);
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
  ctx.strokeRect(effect.source.x - radius, effect.source.y - radius, radius * 2, radius * 2);
  ctx.setLineDash([]);
  ctx.restore();
}

function drawDualSlashPixels(ctx, effect, progress, alpha) {
  const center = add(effect.origin, scale(effect.normal, -effect.defenderRadius * 0.35));
  const tangent = { x: -effect.normal.y, y: effect.normal.x };
  const length = effect.defenderRadius + 34 + progress * 14;
  const offset = 12 + progress * 10;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.lineCap = "butt";
  ctx.lineJoin = "miter";
  for (const sign of [-1, 1]) {
    const start = add(add(center, scale(tangent, -length * 0.5)), scale(effect.normal, sign * offset));
    const end = add(add(center, scale(tangent, length * 0.5)), scale(effect.normal, -sign * offset));
    drawPixelLine(ctx, start, end, 12, "#050711");
    drawPixelLine(ctx, start, end, 5, effect.color);
  }
  ctx.restore();
}

function drawArrowTrailPixels(ctx, effect, progress, alpha) {
  const end = add(effect.origin, scale(effect.normal, -effect.defenderRadius * 0.18));
  const start = add(end, scale(effect.normal, -(30 + progress * 14)));
  const side = { x: -effect.normal.y, y: effect.normal.x };
  const tip = add(end, scale(effect.normal, 12));

  ctx.save();
  ctx.globalAlpha = alpha;
  drawPixelLine(ctx, start, end, 10, "#050711");
  drawPixelLine(ctx, start, end, 4, effect.color);
  ctx.fillStyle = "#050711";
  ctx.fillRect(tip.x - 8, tip.y - 8, 16, 16);
  ctx.fillStyle = effect.color;
  ctx.fillRect(tip.x - 5, tip.y - 5, 10, 10);
  ctx.fillStyle = "#ffe66d";
  const feather = add(start, scale(side, 8));
  ctx.fillRect(feather.x - 4, feather.y - 4, 8, 8);
  for (const sign of [-1, 1]) {
    const shard = add(end, scale(side, sign * (12 + progress * 10)));
    ctx.fillRect(shard.x - 3, shard.y - 3, 6, 6);
  }
  ctx.restore();
}

function drawChainHammerPixels(ctx, effect, progress, alpha) {
  const center = add(effect.origin, scale(effect.normal, 10 + progress * 26));
  const size = effect.defenderRadius + 22 + progress * 18;

  ctx.save();
  ctx.globalAlpha = alpha * 0.82;
  ctx.strokeStyle = effect.color;
  ctx.lineWidth = 5;
  ctx.strokeRect(center.x - size / 2, center.y - size / 2, size, size);
  ctx.fillStyle = effect.color;
  for (const sign of [-1, 1]) {
    ctx.fillRect(center.x + sign * size * 0.44 - 4, center.y - 4, 8, 8);
    ctx.fillRect(center.x - 4, center.y + sign * size * 0.44 - 4, 8, 8);
  }
  ctx.restore();
}

function drawSpellBurstPixels(ctx, effect, progress, alpha) {
  const variant = effect.variant?.id || "fire";
  const radius = effect.defenderRadius + 12 + progress * 42;
  const side = { x: -effect.normal.y, y: effect.normal.x };

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = effect.color;

  if (variant === "lightning") {
    const a = add(effect.origin, scale(side, -radius * 0.6));
    const b = add(add(effect.origin, scale(effect.normal, -radius * 0.1)), scale(side, radius * 0.15));
    const c = add(add(effect.origin, scale(effect.normal, radius * 0.15)), scale(side, -radius * 0.12));
    const d = add(effect.origin, scale(side, radius * 0.58));
    drawPixelLine(ctx, a, b, 12, "#050711");
    drawPixelLine(ctx, b, c, 12, "#050711");
    drawPixelLine(ctx, c, d, 12, "#050711");
    drawPixelLine(ctx, a, b, 5, effect.color);
    drawPixelLine(ctx, b, c, 5, effect.color);
    drawPixelLine(ctx, c, d, 5, effect.color);
  } else if (variant === "ice") {
    for (const sign of [-1, 0, 1]) {
      const start = add(effect.origin, scale(side, sign * 12));
      const end = add(start, scale(effect.normal, -radius * 0.68));
      drawPixelLine(ctx, start, end, 10, "#050711");
      drawPixelLine(ctx, start, end, 4, effect.color);
      ctx.fillRect(end.x - 5, end.y - 5, 10, 10);
    }
  } else {
    const count = 8;
    for (let index = 0; index < count; index += 1) {
      const angle = (Math.PI * 2 * index) / count;
      const point = add(effect.origin, scale({ x: Math.cos(angle), y: Math.sin(angle) }, radius * 0.72));
      const size = index % 2 === 0 ? 12 : 8;
      ctx.fillStyle = "#050711";
      ctx.fillRect(point.x - size / 2 - 2, point.y - size / 2 - 2, size + 4, size + 4);
      ctx.fillStyle = effect.color;
      ctx.fillRect(point.x - size / 2, point.y - size / 2, size, size);
    }
  }
  ctx.restore();
}

function drawPixelLine(ctx, start, end, width, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = "butt";
  ctx.lineJoin = "miter";
  ctx.beginPath();
  moveToVector(ctx, start);
  lineToVector(ctx, end);
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
