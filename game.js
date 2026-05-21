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
      const facingDot = dot(normalize(attacker.velocity), normalFromAttackerToDefender);
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
    attackDamage: 18,
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
    maxHp: 150,
    radius: 28,
    moveSpeed: 145,
    attackDamage: 10,
    attackCooldown: 0.8,
    weaponRange: 28,
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
    this.radius = this.config.radius;
    this.hp = this.config.maxHp;
    this.maxHp = this.config.maxHp;
    this.attackDamage = this.config.attackDamage;
    this.attackCooldown = this.config.attackCooldown;
    this.weaponRange = this.config.weaponRange;
    this.lastAttackTime = -Infinity;
    this.hitFlashTime = 0;
    this.cosmeticState = createCosmeticState();
  }

  update(deltaTime, currentTime) {
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
    return currentTime - this.lastAttackTime >= this.attackCooldown;
  }

  dealDamageTo(defender, currentTime, normalFromAttackerToDefender) {
    if (!this.canAttack(currentTime) || this.hp <= 0) {
      return 0;
    }

    const damage = this.config.getDamage(this, defender, normalFromAttackerToDefender);
    defender.hp = Math.max(0, defender.hp - damage);
    defender.hitFlashTime = 0.16;
    this.lastAttackTime = currentTime;
    return damage;
  }

  isSkillHit(defender, normalFromAttackerToDefender, damage) {
    return this.config.isSkillHit(this, defender, normalFromAttackerToDefender, damage);
  }

  draw(ctx, currentTime) {
    const facing = normalize(this.velocity);
    const weaponStart = add(this.position, scale(facing, this.radius * 0.72));
    const weaponEnd = add(this.position, scale(facing, this.radius + this.weaponRange));

    renderBallPendants(ctx, this, currentTime);

    ctx.save();
    ctx.lineCap = "round";
    ctx.strokeStyle = this.config.accentColor;
    ctx.lineWidth = this.profession === "spear" ? 5 : 10;
    ctx.globalAlpha = 0.9;
    ctx.beginPath();
    ctx.moveTo(weaponStart.x, weaponStart.y);
    ctx.lineTo(weaponEnd.x, weaponEnd.y);
    ctx.stroke();

    if (this.profession === "blade") {
      ctx.strokeStyle = "rgba(255, 240, 194, 0.45)";
      ctx.lineWidth = 7;
      ctx.beginPath();
      ctx.arc(this.position.x, this.position.y, this.radius + this.weaponRange, -0.8, 0.8);
      ctx.stroke();
    }
    ctx.restore();

    ctx.save();
    ctx.shadowColor = this.config.color;
    ctx.shadowBlur = 16;
    ctx.fillStyle = this.hitFlashTime > 0 ? "#ffffff" : this.config.color;
    ctx.beginPath();
    ctx.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.fillStyle = "#0f141b";
    ctx.font = canvasFont(16, 800);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(this.label, this.position.x, this.position.y);
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
let viewport = { width: 0, height: 0, dpr: 1 };
let layout = null;
let pointerDown = false;
let attackEffectInstances = [];

function createInitialBalls() {
  return [
    new Ball({
      label: "A",
      profession: "spear",
      x: 190,
      y: 210,
      direction: { x: 1, y: 0.64 },
    }),
    new Ball({
      label: "B",
      profession: "blade",
      x: 610,
      y: 590,
      direction: { x: -0.95, y: -0.48 },
    }),
  ];
}

function restartGame() {
  balls = createInitialBalls();
  attackEffectInstances = [];
  gameOver = false;
  resultMessage = "";
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
  const panelHeight = contentWidth < 430 ? 66 : 78;
  const hudHeight = titleHeight + panelHeight + gap;
  const arenaMaxHeight = Math.max(120, contentHeight - hudHeight - gap);
  const arenaSize = Math.min(ARENA_SIZE, contentWidth, arenaMaxHeight);
  const spareHeight = Math.max(0, arenaMaxHeight - arenaSize);
  const panelWidth = (contentWidth - gap) / 2;
  const arenaX = left + (contentWidth - arenaSize) / 2;
  const arenaY = top + hudHeight + gap + spareHeight * 0.25;

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
    panels: [
      { x: left, y: top + titleHeight, width: panelWidth, height: panelHeight, align: "left" },
      {
        x: left + panelWidth + gap,
        y: top + titleHeight,
        width: panelWidth,
        height: panelHeight,
        align: "right",
      },
    ],
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
  const { left, top, contentWidth, contentHeight, gap } = metrics;
  let sideWidth = clamp((contentWidth - contentHeight) / 2 - gap, 132, 220);
  let arenaSize = Math.min(ARENA_SIZE, contentHeight, contentWidth - (sideWidth + gap) * 2);

  if (arenaSize < 260) {
    sideWidth = Math.max(112, (contentWidth - 260) / 2 - gap);
    arenaSize = Math.max(240, Math.min(contentHeight, contentWidth - (sideWidth + gap) * 2));
  }

  const arenaX = left + (contentWidth - arenaSize) / 2;
  const arenaY = top + (contentHeight - arenaSize) / 2;
  const panelHeight = clamp(arenaSize * 0.22, 74, 104);
  const panelY = arenaY + Math.max(38, arenaSize * 0.12);

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
    panels: [
      { x: left, y: panelY, width: sideWidth, height: panelHeight, align: "left" },
      {
        x: left + contentWidth - sideWidth,
        y: panelY,
        width: sideWidth,
        height: panelHeight,
        align: "right",
      },
    ],
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
    update(deltaTime, elapsedTimeSeconds);
  }

  draw();
  requestAnimationFrame(gameLoop);
}

function update(deltaTime, currentTime) {
  balls.forEach((ball) => ball.update(deltaTime, currentTime));
  attackEffectInstances = updateAttackEffectInstances(attackEffectInstances, currentTime);
  resolveBallCollision(balls[0], balls[1], currentTime);
  checkGameOver();
}

function resolveBallCollision(ballA, ballB, currentTime) {
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

  const damageFromA = ballA.dealDamageTo(ballB, currentTime, normal);
  const damageFromB = ballB.dealDamageTo(ballA, currentTime, scale(normal, -1));

  applySkillKnockback(ballA, ballB, normal, damageFromA, damageFromB);
  playHitCosmetics(ballA, ballB, normal, damageFromA, currentTime);
  playHitCosmetics(ballB, ballA, scale(normal, -1), damageFromB, currentTime);
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

  if (!attacker.isSkillHit(defender, normalFromAttackerToDefender, damage)) {
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

function applySkillKnockback(ballA, ballB, normal, damageFromA, damageFromB) {
  if (damageFromA > 0) {
    const push = 56 * ballA.config.getKnockbackMultiplier();
    ballB.velocity = add(ballB.velocity, scale(normal, push));
  }

  if (damageFromB > 0) {
    const push = 56 * ballB.config.getKnockbackMultiplier();
    ballA.velocity = add(ballA.velocity, scale(normal, -push));
  }

  keepSpeed(ballA);
  keepSpeed(ballB);
}

function keepSpeed(ball) {
  ball.velocity = scale(normalize(ball.velocity), ball.config.moveSpeed);
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

  drawGlow(viewport.width * 0.18, viewport.height * 0.12, viewport.width * 0.42, "rgba(73, 197, 255, 0.13)");
  drawGlow(viewport.width * 0.84, viewport.height * 0.14, viewport.width * 0.34, "rgba(255, 189, 69, 0.13)");
}

function drawGlow(x, y, radius, color) {
  const glow = ctx.createRadialGradient(x, y, 0, x, y, radius);
  glow.addColorStop(0, color);
  glow.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, viewport.width, viewport.height);
}

function drawHud() {
  const [ballA, ballB] = balls;
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

  drawFighterPanel(layout.panels[0], ballA);
  drawFighterPanel(layout.panels[1], ballB);
}

function drawFighterPanel(panel, ball) {
  ctx.save();
  roundRect(ctx, panel.x, panel.y, panel.width, panel.height, 8);
  ctx.fillStyle = COLORS.panel;
  ctx.fill();
  ctx.strokeStyle = COLORS.panelBorder;
  ctx.lineWidth = 1;
  ctx.stroke();

  const padding = Math.max(9, panel.width * 0.07);
  const textX = panel.align === "right" ? panel.x + panel.width - padding : panel.x + padding;
  const hpRatio = Math.max(0, ball.hp / ball.maxHp);
  const compact = panel.width < 160;

  ctx.textAlign = panel.align;
  ctx.textBaseline = "top";
  ctx.fillStyle = COLORS.muted;
  ctx.font = canvasFont(compact ? 11 : 12, 700);
  ctx.fillText(`球 ${ball.label}`, textX, panel.y + padding);

  ctx.fillStyle = COLORS.text;
  ctx.font = canvasFont(compact ? 14 : 16, 900);
  ctx.fillText(ball.config.name, textX, panel.y + padding + (compact ? 16 : 18));

  const barWidth = Math.max(62, panel.width - padding * 2);
  const barHeight = compact ? 9 : 11;
  const barX = panel.x + padding;
  const barY = panel.y + panel.height - padding - barHeight - (compact ? 14 : 16);
  drawHpBar(barX, barY, barWidth, barHeight, hpRatio, ball.config.color);

  ctx.fillStyle = COLORS.muted;
  ctx.font = canvasFont(compact ? 11 : 12, 700);
  ctx.textBaseline = "bottom";
  ctx.fillText(`${Math.ceil(ball.hp)} / ${ball.maxHp}`, textX, panel.y + panel.height - padding + 1);
  ctx.restore();
}

function drawHpBar(x, y, width, height, ratio, color) {
  roundRect(ctx, x, y, width, height, height / 2);
  ctx.fillStyle = "#2a3340";
  ctx.fill();

  if (ratio > 0) {
    roundRect(ctx, x, y, width * ratio, height, height / 2);
    const gradient = ctx.createLinearGradient(x, y, x + width, y);
    gradient.addColorStop(0, color);
    gradient.addColorStop(1, "#ffffff");
    ctx.fillStyle = gradient;
    ctx.globalAlpha = 0.9;
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

function drawArenaScene() {
  ctx.save();
  ctx.translate(layout.arena.x, layout.arena.y);
  ctx.scale(layout.arena.scale, layout.arena.scale);
  drawArena();
  balls.forEach((ball) => ball.draw(ctx, elapsedTimeSeconds));
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
