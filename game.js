import { GamePlatform, initializePlatform } from "./platform.js";
import {
  CosmeticTrigger,
  createAttackEffectInstances,
  createCosmeticState,
  renderAttackEffectInstances,
  renderBallPendants,
  triggerBallPendants,
  updateAttackEffectInstances,
  updateBallCosmetics,
} from "./cosmetics.js";

const ARENA_SIZE = 800;
const MAX_DELTA_TIME = 1 / 30;
const MAX_DEVICE_PIXEL_RATIO = 3;
const BALL_RADIUS_MULTIPLIER = 1.5;
const ATTACK_COOLDOWN_MULTIPLIER = 0.65;
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
    sweepAngle: (Math.PI * 130) / 180,
  },
  default: {
    duration: 0.24,
    hitFrame: 0.5,
  },
};

const COLORS = {
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

const SIDE_VISUAL_CONFIG = {
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

const ProfessionConfig = {
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

class Ball {
  constructor({ label, profession, x, y, direction }) {
    this.label = label;
    this.profession = profession;
    this.config = ProfessionConfig[profession];
    this.position = { x, y };
    this.velocity = scale(normalize(direction), this.config.moveSpeed);
    this.radius = this.config.radius * BALL_RADIUS_MULTIPLIER;
    this.hp = this.config.maxHp;
    this.maxHp = this.config.maxHp;
    this.attackDamage = this.config.attackDamage;
    this.attackCooldown = this.config.attackCooldown * ATTACK_COOLDOWN_MULTIPLIER;
    this.weaponRange = this.config.weaponRange;
    this.visual = getSideVisualConfig(this.label);
    this.lastAttackTime = -Infinity;
    this.hitFlashTime = 0;
    this.attackState = null;
    this.cosmeticState = createCosmeticState();
  }

  update(deltaTime, currentTime) {
    this.velocity = scale(normalize(this.velocity), getCurrentMoveSpeed(this));
    this.position.x += this.velocity.x * deltaTime;
    this.position.y += this.velocity.y * deltaTime;
    this.hitFlashTime = Math.max(0, this.hitFlashTime - deltaTime);
    updateBallCosmetics(this, currentTime);
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
      return false;
    }

    const attackConfig = getAttackAnimationConfig(this.profession);
    const direction = getDirectionBetween(this, defender);
    this.attackState = {
      defender,
      startTime: currentTime,
      duration: attackConfig.duration,
      hitFrame: attackConfig.hitFrame,
      direction,
      didDealDamage: false,
    };
    this.lastAttackTime = currentTime;
    return true;
  }

  dealAttackDamageTo(defender, normalFromAttackerToDefender) {
    if (this.hp <= 0 || defender.hp <= 0) {
      return 0;
    }

    const damage = this.config.getDamage(this, defender, normalFromAttackerToDefender);
    defender.hp = Math.max(0, defender.hp - damage);
    defender.hitFlashTime = 0.16;
    return damage;
  }

  isSkillHit(defender, normalFromAttackerToDefender, damage) {
    return this.config.isSkillHit(this, defender, normalFromAttackerToDefender, damage);
  }

  draw(ctx, currentTime, target) {
    renderBallPendants(ctx, this, currentTime);
    drawWeapon(ctx, this, currentTime, target);
    drawBallBody(ctx, this);

    const hpText = String(Math.ceil(this.hp));
    const hpFontSize = clamp(this.radius * 0.58, 15, 20);

    ctx.save();
    ctx.fillStyle = COLORS.text;
    ctx.strokeStyle = "rgba(5, 8, 12, 0.92)";
    ctx.lineWidth = 5;
    ctx.font = canvasFont(hpFontSize, 900);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.strokeText(hpText, this.position.x, this.position.y);
    ctx.fillText(hpText, this.position.x, this.position.y);
    ctx.restore();
  }
}

const canvas = document.querySelector("#gameCanvas");
const ctx = canvas.getContext("2d");

let balls = [];
let gameOver = false;
let resultMessage = "";
let lastFrameTime = 0;
let elapsedTimeSeconds = 0;
let matchElapsedTimeSeconds = 0;
let viewport = { width: 0, height: 0, dpr: 1 };
let layout = null;
let pointerDown = false;
let attackEffectInstances = [];

function createInitialBalls() {
  const selectedProfessions = getSelectedProfessions();

  return [
    new Ball({
      label: "A",
      profession: selectedProfessions.a,
      x: 190,
      y: 210,
      direction: { x: 1, y: 0.64 },
    }),
    new Ball({
      label: "B",
      profession: selectedProfessions.b,
      x: 610,
      y: 590,
      direction: { x: -0.95, y: -0.48 },
    }),
  ];
}

function getSelectedProfessions() {
  const params = new URLSearchParams(window.location.search);

  return {
    a: getProfessionParam(params, "a", "spear"),
    b: getProfessionParam(params, "b", "blade"),
  };
}

function getProfessionParam(params, name, fallback) {
  const profession = params.get(name);
  return Object.hasOwn(ProfessionConfig, profession) ? profession : fallback;
}

function getSideVisualConfig(label) {
  return SIDE_VISUAL_CONFIG[label] || SIDE_VISUAL_CONFIG.A;
}

function restartGame() {
  balls = createInitialBalls();
  attackEffectInstances = [];
  gameOver = false;
  resultMessage = "";
  matchElapsedTimeSeconds = 0;
  lastFrameTime = performance.now();
  GamePlatform.setLoadingProgress(100);
}

function resizeCanvas() {
  const width = Math.max(320, Math.round(window.visualViewport?.width || window.innerWidth));
  const height = Math.max(320, Math.round(window.visualViewport?.height || window.innerHeight));
  const dpr = Math.min(window.devicePixelRatio || 1, MAX_DEVICE_PIXEL_RATIO);

  viewport = { width, height, dpr };
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  layout = createLayout(width, height);
}

function createLayout(width, height) {
  const safe = getSafeAreaInsets();
  const baseMargin = clamp(Math.min(width, height) * 0.035, 10, 24);
  const left = safe.left + baseMargin;
  const right = width - safe.right - baseMargin;
  const top = safe.top + baseMargin;
  const bottom = height - safe.bottom - baseMargin;
  const contentWidth = Math.max(280, right - left);
  const contentHeight = Math.max(280, bottom - top);
  const gap = clamp(Math.min(width, height) * 0.025, 8, 16);
  const isShortLandscape = contentWidth > contentHeight * 1.28 && contentHeight < 640;

  if (isShortLandscape) {
    return createLandscapeLayout({ left, right, top, bottom, contentWidth, contentHeight, gap });
  }

  return createTopHudLayout({ left, right, top, bottom, contentWidth, contentHeight, gap });
}

function createTopHudLayout(metrics) {
  const { left, top, contentWidth, contentHeight, gap } = metrics;
  const titleHeight = contentWidth < 430 ? 50 : 58;
  const hudHeight = titleHeight;
  const arenaMaxHeight = Math.max(120, contentHeight - hudHeight - gap);
  const arenaSize = Math.min(ARENA_SIZE, contentWidth, arenaMaxHeight);
  const spareHeight = Math.max(0, arenaMaxHeight - arenaSize);
  const arenaX = left + (contentWidth - arenaSize) / 2;
  const arenaY = top + hudHeight + gap + spareHeight * 0.5;

  return {
    mode: "top",
    title: {
      x: left + contentWidth / 2,
      y: top + titleHeight * 0.43,
      fontSize: contentWidth < 430 ? 21 : 26,
    },
    status: {
      x: left + contentWidth / 2,
      y: top + titleHeight * 0.82,
      fontSize: 13,
    },
    arena: {
      x: arenaX,
      y: arenaY,
      size: arenaSize,
      scale: arenaSize / ARENA_SIZE,
    },
    restartButton: null,
  };
}

function createLandscapeLayout(metrics) {
  const { left, top, contentWidth, contentHeight } = metrics;
  const arenaSize = Math.min(ARENA_SIZE, contentWidth, contentHeight);

  const arenaX = left + (contentWidth - arenaSize) / 2;
  const arenaY = top + (contentHeight - arenaSize) / 2;

  return {
    mode: "landscape",
    title: {
      x: arenaX + arenaSize / 2,
      y: arenaY + 24,
      fontSize: 20,
    },
    status: {
      x: arenaX + arenaSize / 2,
      y: arenaY + 48,
      fontSize: 12,
    },
    arena: {
      x: arenaX,
      y: arenaY,
      size: arenaSize,
      scale: arenaSize / ARENA_SIZE,
    },
    restartButton: null,
  };
}

function gameLoop(timestamp) {
  const deltaTime = Math.min((timestamp - lastFrameTime) / 1000, MAX_DELTA_TIME);
  lastFrameTime = timestamp;
  elapsedTimeSeconds = timestamp / 1000;

  if (!gameOver) {
    matchElapsedTimeSeconds += deltaTime;
    update(deltaTime, elapsedTimeSeconds);
  }

  draw();
  requestAnimationFrame(gameLoop);
}

function update(deltaTime, currentTime) {
  balls.forEach((ball) => ball.update(deltaTime, currentTime));
  attackEffectInstances = updateAttackEffectInstances(attackEffectInstances, currentTime);
  resolveBallCollision(balls[0], balls[1]);
  updateAttackForPair(balls[0], balls[1], currentTime);
  updateAttackForPair(balls[1], balls[0], currentTime);
  checkGameOver();
}

function resolveBallCollision(ballA, ballB) {
  const difference = subtract(ballB.position, ballA.position);
  let distance = length(difference);
  const minDistance = ballA.radius + ballB.radius;

  if (distance > minDistance) {
    return;
  }

  const normal = distance === 0 ? { x: 1, y: 0 } : scale(difference, 1 / distance);
  distance = Math.max(distance, 0.001);
  separateBalls(ballA, ballB, normal, minDistance - distance);
  bounceBalls(ballA, ballB, normal);
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

  const progress = getAttackProgressFromState(attackState, currentTime);

  if (!attackState.didDealDamage && progress >= attackState.hitFrame) {
    const defender = attackState.defender;
    const normal = normalize(attackState.direction);
    const damage = attacker.dealAttackDamageTo(defender, normal);
    attackState.didDealDamage = true;
    applyAttackKnockback(attacker, defender, normal, damage);
    playHitCosmetics(attacker, defender, normal, damage, currentTime);
  }

  if (currentTime - attackState.startTime >= attackState.duration) {
    attacker.attackState = null;
  }
}

function isInAttackRange(attacker, defender) {
  if (attacker.hp <= 0 || defender.hp <= 0) {
    return false;
  }

  const attackReach = attacker.radius + defender.radius + attacker.weaponRange;
  return length(subtract(defender.position, attacker.position)) <= attackReach;
}

function playHitCosmetics(attacker, defender, normalFromAttackerToDefender, damage, currentTime) {
  if (damage <= 0) {
    return;
  }

  triggerBallPendants(attacker, CosmeticTrigger.ATTACK, currentTime);
  attackEffectInstances.push(
    ...createAttackEffectInstances({
      attacker,
      defender,
      normal: normalFromAttackerToDefender,
      trigger: CosmeticTrigger.ATTACK,
      currentTime,
    }),
  );

  const isSkillHit = attacker.isSkillHit(defender, normalFromAttackerToDefender, damage);
  if (!isSkillHit) {
    return;
  }

  triggerBallPendants(attacker, CosmeticTrigger.SKILL, currentTime);
  attackEffectInstances.push(
    ...createAttackEffectInstances({
      attacker,
      defender,
      normal: normalFromAttackerToDefender,
      trigger: CosmeticTrigger.SKILL,
      currentTime,
    }),
  );
}

function separateBalls(ballA, ballB, normal, overlap) {
  const correction = scale(normal, overlap / 2 + 0.1);
  ballA.position = subtract(ballA.position, correction);
  ballB.position = add(ballB.position, correction);
  ballA.bounceOffWalls();
  ballB.bounceOffWalls();
}

function bounceBalls(ballA, ballB, normal) {
  const relativeVelocity = subtract(ballB.velocity, ballA.velocity);
  const speedAlongNormal = dot(relativeVelocity, normal);

  if (speedAlongNormal > 0) {
    return;
  }

  const impulse = -speedAlongNormal;
  ballA.velocity = subtract(ballA.velocity, scale(normal, impulse));
  ballB.velocity = add(ballB.velocity, scale(normal, impulse));
  keepSpeed(ballA);
  keepSpeed(ballB);
}

function applyAttackKnockback(attacker, defender, normalFromAttackerToDefender, damage) {
  if (damage <= 0) {
    return;
  }

  const push = 56 * attacker.config.getKnockbackMultiplier();
  defender.velocity = add(defender.velocity, scale(normalFromAttackerToDefender, push));
  keepSpeed(attacker);
  keepSpeed(defender);
}

function keepSpeed(ball) {
  ball.velocity = scale(normalize(ball.velocity), getCurrentMoveSpeed(ball));
}

function getCurrentMoveSpeed(ball) {
  return ball.config.moveSpeed * getSpeedMultiplier(matchElapsedTimeSeconds);
}

function getSpeedMultiplier(elapsedSeconds) {
  const rampSeconds = Math.max(0.001, SPEED_RAMP_CONFIG.secondsToMaxMultiplier);
  const progress = clamp(elapsedSeconds / rampSeconds, 0, 1);
  return (
    SPEED_RAMP_CONFIG.startMultiplier +
    (SPEED_RAMP_CONFIG.maxMultiplier - SPEED_RAMP_CONFIG.startMultiplier) * progress
  );
}

function getAttackAnimationConfig(profession) {
  return ATTACK_ANIMATION_CONFIG[profession] || ATTACK_ANIMATION_CONFIG.default;
}

function getAttackProgress(ball, currentTime) {
  if (!ball.attackState) {
    return null;
  }

  return getAttackProgressFromState(ball.attackState, currentTime);
}

function getAttackProgressFromState(attackState, currentTime) {
  return clamp((currentTime - attackState.startTime) / attackState.duration, 0, 1);
}

function getWeaponDirection(ball, target) {
  if (ball.attackState) {
    return normalize(ball.attackState.direction);
  }

  if (target && target.hp > 0) {
    return getDirectionBetween(ball, target);
  }

  return normalize(ball.velocity);
}

function getDirectionBetween(source, target) {
  return normalize(subtract(target.position, source.position));
}

function getThrustExtension(progress, hitFrame) {
  if (progress <= hitFrame) {
    return lerp(0.58, 1.34, easeOutCubic(progress / hitFrame));
  }

  return lerp(1.34, 0.88, easeInCubic((progress - hitFrame) / (1 - hitFrame)));
}

function checkGameOver() {
  const [ballA, ballB] = balls;
  if (ballA.hp > 0 && ballB.hp > 0) {
    return;
  }

  gameOver = true;
  resultMessage = getResultText(ballA, ballB);
}

function getResultText(ballA, ballB) {
  if (ballA.hp <= 0 && ballB.hp <= 0) {
    return "平局";
  }

  if (ballA.hp <= 0) {
    return `球 B（${ballB.config.name}）获胜`;
  }

  return `球 A（${ballA.config.name}）获胜`;
}

function draw() {
  ctx.clearRect(0, 0, viewport.width, viewport.height);
  drawBackground();
  drawHud();
  drawArenaScene();

  if (gameOver) {
    drawResultOverlay();
  }
}

function drawBackground() {
  const gradient = ctx.createLinearGradient(0, 0, 0, viewport.height);
  gradient.addColorStop(0, COLORS.backgroundTop);
  gradient.addColorStop(1, COLORS.backgroundBottom);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, viewport.width, viewport.height);

  drawGlow(viewport.width * 0.18, viewport.height * 0.12, viewport.width * 0.42, SIDE_VISUAL_CONFIG.A.backgroundGlow);
  drawGlow(viewport.width * 0.84, viewport.height * 0.14, viewport.width * 0.34, SIDE_VISUAL_CONFIG.B.backgroundGlow);
}

function drawGlow(x, y, radius, color) {
  const glow = ctx.createRadialGradient(x, y, 0, x, y, radius);
  glow.addColorStop(0, color);
  glow.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, viewport.width, viewport.height);
}

function drawHud() {
  const statusText = gameOver ? resultMessage : "自动开战中";

  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = COLORS.text;
  ctx.font = canvasFont(layout.title.fontSize, 900);
  ctx.fillText("职业球球斗技场", layout.title.x, layout.title.y);

  ctx.fillStyle = COLORS.muted;
  ctx.font = canvasFont(layout.status.fontSize, 600);
  ctx.fillText(statusText, layout.status.x, layout.status.y);
  ctx.restore();
}

function drawBallBody(ctx, ball) {
  ctx.save();
  ctx.shadowColor = ball.visual.color;
  ctx.shadowBlur = 16;
  ctx.fillStyle = ball.visual.color;
  ctx.beginPath();
  ctx.arc(ball.position.x, ball.position.y, ball.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.globalAlpha = 0.5;
  ctx.strokeStyle = ball.visual.accentColor;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(ball.position.x, ball.position.y, ball.radius - 3, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  if (ball.hitFlashTime > 0) {
    ctx.save();
    ctx.globalAlpha = clamp(ball.hitFlashTime / 0.16, 0, 1) * 0.45;
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(ball.position.x, ball.position.y, ball.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawWeapon(ctx, ball, currentTime, target) {
  const direction = getWeaponDirection(ball, target);
  const progress = getAttackProgress(ball, currentTime);

  if (ball.profession === "blade") {
    drawBladeWeapon(ctx, ball, direction, progress);
    return;
  }

  drawSpearWeapon(ctx, ball, direction, progress);
}

function drawSpearWeapon(ctx, ball, direction, progress) {
  const hitFrame = ball.attackState?.hitFrame || ATTACK_ANIMATION_CONFIG.default.hitFrame;
  const extension = progress === null ? 1 : getThrustExtension(progress, hitFrame);
  const weaponStart = add(ball.position, scale(direction, ball.radius * 0.52));
  const weaponEnd = add(ball.position, scale(direction, ball.radius + ball.weaponRange * extension));

  ctx.save();
  ctx.lineCap = "round";
  ctx.strokeStyle = ball.visual.accentColor;
  ctx.lineWidth = 6;
  ctx.globalAlpha = progress === null ? 0.88 : 1;
  ctx.beginPath();
  moveToVector(ctx, weaponStart);
  lineToVector(ctx, weaponEnd);
  ctx.stroke();

  if (progress !== null) {
    ctx.globalAlpha = 0.26 * (1 - progress);
    ctx.lineWidth = 12;
    ctx.beginPath();
    moveToVector(ctx, add(ball.position, scale(direction, ball.radius * 0.34)));
    lineToVector(ctx, weaponEnd);
    ctx.stroke();
  }
  ctx.restore();
}

function drawBladeWeapon(ctx, ball, direction, progress) {
  const baseAngle = angleOf(direction);
  const bladeConfig = getAttackAnimationConfig("blade");
  const sweepAngle = bladeConfig.sweepAngle;
  const arcRadius = ball.radius + ball.weaponRange;
  const attackEase = progress === null ? null : easeOutCubic(progress);
  const bladeAngle = progress === null ? baseAngle : baseAngle - sweepAngle / 2 + sweepAngle * attackEase;
  const bladeDirection = vectorFromAngle(bladeAngle);
  const weaponStart = add(ball.position, scale(bladeDirection, ball.radius * 0.46));
  const weaponEnd = add(ball.position, scale(bladeDirection, ball.radius + ball.weaponRange * 0.92));

  ctx.save();
  ctx.lineCap = "round";
  ctx.strokeStyle = ball.visual.accentColor;
  ctx.lineWidth = 12;
  ctx.globalAlpha = 0.9;
  ctx.beginPath();
  moveToVector(ctx, weaponStart);
  lineToVector(ctx, weaponEnd);
  ctx.stroke();

  ctx.strokeStyle = progress === null ? ball.visual.bladeTrailIdle : ball.visual.bladeTrailAttack;
  ctx.lineWidth = progress === null ? 7 : 11;
  ctx.beginPath();

  if (progress === null) {
    ctx.arc(ball.position.x, ball.position.y, arcRadius, baseAngle - 0.42, baseAngle + 0.42);
  } else {
    const startAngle = baseAngle - sweepAngle / 2;
    ctx.arc(ball.position.x, ball.position.y, arcRadius, startAngle, bladeAngle);
  }

  ctx.stroke();
  ctx.restore();
}

function drawArenaScene() {
  ctx.save();
  ctx.translate(layout.arena.x, layout.arena.y);
  ctx.scale(layout.arena.scale, layout.arena.scale);
  drawArena();
  balls.forEach((ball, index) => ball.draw(ctx, elapsedTimeSeconds, balls[index === 0 ? 1 : 0]));
  renderAttackEffectInstances(ctx, attackEffectInstances, elapsedTimeSeconds);
  ctx.restore();
}

function drawArena() {
  ctx.fillStyle = COLORS.arena;
  ctx.fillRect(0, 0, ARENA_SIZE, ARENA_SIZE);

  ctx.save();
  ctx.strokeStyle = COLORS.grid;
  ctx.lineWidth = 1;
  for (let i = 40; i < ARENA_SIZE; i += 40) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, ARENA_SIZE);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(ARENA_SIZE, i);
    ctx.stroke();
  }
  ctx.restore();

  ctx.save();
  ctx.strokeStyle = "rgba(255, 255, 255, 0.18)";
  ctx.lineWidth = 4;
  ctx.strokeRect(2, 2, ARENA_SIZE - 4, ARENA_SIZE - 4);
  ctx.restore();
}

function drawResultOverlay() {
  ctx.save();
  ctx.fillStyle = "rgba(8, 11, 15, 0.6)";
  ctx.fillRect(0, 0, viewport.width, viewport.height);

  const panelWidth = Math.min(360, viewport.width - 36);
  const panelHeight = 154;
  const panelX = (viewport.width - panelWidth) / 2;
  const panelY = (viewport.height - panelHeight) / 2;
  const buttonWidth = 132;
  const buttonHeight = 42;
  const buttonX = panelX + (panelWidth - buttonWidth) / 2;
  const buttonY = panelY + panelHeight - 58;

  roundRect(ctx, panelX, panelY, panelWidth, panelHeight, 8);
  ctx.fillStyle = "rgba(21, 27, 35, 0.96)";
  ctx.fill();
  ctx.strokeStyle = COLORS.panelBorder;
  ctx.stroke();

  ctx.fillStyle = COLORS.text;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = canvasFont(24, 900);
  ctx.fillText(resultMessage, panelX + panelWidth / 2, panelY + 48);

  roundRect(ctx, buttonX, buttonY, buttonWidth, buttonHeight, 6);
  ctx.fillStyle = pointerDown ? "#dce6f2" : COLORS.button;
  ctx.fill();

  ctx.fillStyle = COLORS.buttonText;
  ctx.font = canvasFont(16, 900);
  ctx.fillText("重新开始", buttonX + buttonWidth / 2, buttonY + buttonHeight / 2);

  layout.restartButton = { x: buttonX, y: buttonY, width: buttonWidth, height: buttonHeight };
  ctx.restore();
}

function handlePointerDown(event) {
  const point = getPointerPoint(event);
  pointerDown = gameOver && isInsideRect(point, layout.restartButton);
}

function handlePointerUp(event) {
  const point = getPointerPoint(event);
  const shouldRestart = gameOver && pointerDown && isInsideRect(point, layout.restartButton);
  pointerDown = false;

  if (shouldRestart) {
    restartGame();
  }
}

function handleKeyDown(event) {
  if (event.code === "Space" || event.code === "Enter" || event.key.toLowerCase() === "r") {
    if (gameOver) {
      restartGame();
    }
  }
}

function getPointerPoint(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  };
}

function isInsideRect(point, rect) {
  if (!rect) {
    return false;
  }

  return (
    point.x >= rect.x &&
    point.x <= rect.x + rect.width &&
    point.y >= rect.y &&
    point.y <= rect.y + rect.height
  );
}

function getSafeAreaInsets() {
  const style = getComputedStyle(document.documentElement);
  return {
    top: parseCssPixel(style.getPropertyValue("--safe-top")),
    right: parseCssPixel(style.getPropertyValue("--safe-right")),
    bottom: parseCssPixel(style.getPropertyValue("--safe-bottom")),
    left: parseCssPixel(style.getPropertyValue("--safe-left")),
  };
}

function parseCssPixel(value) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function canvasFont(size, weight = 700) {
  return `${weight} ${size}px Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", "Microsoft YaHei", sans-serif`;
}

function roundRect(context, x, y, width, height, radius) {
  const safeRadius = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.moveTo(x + safeRadius, y);
  context.lineTo(x + width - safeRadius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + safeRadius);
  context.lineTo(x + width, y + height - safeRadius);
  context.quadraticCurveTo(x + width, y + height, x + width - safeRadius, y + height);
  context.lineTo(x + safeRadius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - safeRadius);
  context.lineTo(x, y + safeRadius);
  context.quadraticCurveTo(x, y, x + safeRadius, y);
  context.closePath();
}

function moveToVector(context, vector) {
  context.moveTo(vector.x, vector.y);
}

function lineToVector(context, vector) {
  context.lineTo(vector.x, vector.y);
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

function angleOf(vector) {
  return Math.atan2(vector.y, vector.x);
}

function vectorFromAngle(angle) {
  return { x: Math.cos(angle), y: Math.sin(angle) };
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

function lerp(start, end, progress) {
  return start + (end - start) * clamp(progress, 0, 1);
}

function easeOutCubic(progress) {
  const safeProgress = clamp(progress, 0, 1);
  return 1 - (1 - safeProgress) ** 3;
}

function easeInCubic(progress) {
  const safeProgress = clamp(progress, 0, 1);
  return safeProgress ** 3;
}

async function bootGame() {
  resizeCanvas();
  GamePlatform.setLoadingProgress(35);
  await initializePlatform();
  GamePlatform.setLoadingProgress(80);
  restartGame();
  requestAnimationFrame(gameLoop);
}

window.addEventListener("resize", resizeCanvas);
window.visualViewport?.addEventListener("resize", resizeCanvas);
canvas.addEventListener("pointerdown", handlePointerDown);
canvas.addEventListener("pointerup", handlePointerUp);
canvas.addEventListener("pointercancel", () => {
  pointerDown = false;
});
canvas.addEventListener("contextmenu", (event) => event.preventDefault());
window.addEventListener("keydown", handleKeyDown);

bootGame();
