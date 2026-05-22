import { createComplianceState, normalizeSelectedProfessions } from "./compliance-state.js";
import {
  ARENA_SIZE,
  ATTACK_ANIMATION_CONFIG,
  ATTACK_COOLDOWN_MULTIPLIER,
  BALL_RADIUS_MULTIPLIER,
  COLORS,
  MAX_DELTA_TIME,
  MAX_DEVICE_PIXEL_RATIO,
  ProfessionConfig,
  SceneConfig,
  SIDE_VISUAL_CONFIG,
  getAttackAnimationConfig,
  getSceneProfessionIds,
  getSpeedMultiplier,
} from "./game-config.js";
import { LegalConfig, getLegalDocument } from "./legal-config.js";
import { GamePlatform, initializePlatform } from "./platform.js";
import { ads, analytics, iap } from "./services.js";
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
import {
  getInitialLocale,
  getLocaleOptions,
  getTextDirection,
  isRtlLocale,
  normalizeLocale,
  saveLocale,
  translate,
} from "./i18n.js";

const Screen = Object.freeze({
  CONSENT: "consent",
  LEGAL_DOCUMENT: "legalDocument",
  MAIN_MENU: "mainMenu",
  PROFESSION_SELECT: "professionSelect",
  SETTINGS: "settings",
  PLAYING: "playing",
  RESULT: "result",
});

const canvas = document.querySelector("#gameCanvas");
const ctx = canvas.getContext("2d");
const complianceState = createComplianceState();
const sceneIds = Object.keys(SceneConfig);
const ARENA_TERRAIN_TILE_SIZE = 40;
const BACKDROP_TERRAIN_TILE_SIZE = 48;

let balls = [];
let gameOver = false;
let resultMessage = "";
let lastFrameTime = 0;
let elapsedTimeSeconds = 0;
let matchElapsedTimeSeconds = 0;
let viewport = { width: 0, height: 0, dpr: 1 };
let layout = null;
let screen = Screen.CONSENT;
let previousScreen = Screen.MAIN_MENU;
let activeLegalDocument = "privacy";
let legalScrollOffset = 0;
let hasCheckedLegalConsent = false;
let activeProfessionSide = "a";
let selectedProfessions = complianceState.getSelectedProfessions(getUrlProfessionOverrides());
let serviceMessage = "";
let pointerDownElementId = null;
let interactiveElements = [];
let attackEffectInstances = [];
let projectiles = [];
let spellTrajectories = [];
let arenaHazards = [];
let webLinks = [];
let flameTrails = [];
let terrainState = createTerrainState();
let currentLocale = getInitialLocale();
let settings = complianceState.getSettings();

const voxelAssets = createVoxelAssets();

function createVoxelAssets() {
  return {
    blocks: {
      grass: createVoxelBlockTexture("grass"),
      grassDark: createVoxelBlockTexture("grassDark"),
      dirt: createVoxelBlockTexture("dirt"),
      stone: createVoxelBlockTexture("stone"),
      deepslate: createVoxelBlockTexture("deepslate"),
      plank: createVoxelBlockTexture("plank"),
      obsidian: createVoxelBlockTexture("obsidian"),
      glowstone: createVoxelBlockTexture("glowstone"),
    },
    items: {
      bow: createVoxelSprite(
        [
          "......WWWW..............",
          "....WW....WW............",
          "...W........W...........",
          "..W..........W..........",
          ".W............W.........",
          ".W............SS........",
          "W..............S........",
          "W..............S........",
          ".W............SS........",
          ".W............W.........",
          "..W..........W..........",
          "...W........W...........",
          "....WW....WW............",
          "......WWWW..............",
        ],
        {
          W: "#8a552c",
          S: "#e8dfc8",
        },
      ),
      arrow: createVoxelSprite(
        [
          "..........................TT",
          "FF======================TTTT",
          "FFF====================TTTTT",
          "FF======================TTTT",
          "..........................TT",
        ],
        {
          F: "#d9f4c7",
          "=": "#b8844a",
          T: "#f1f4f0",
        },
      ),
      staff: createVoxelSprite(
        [
          "...............................GG....",
          "....B.....B.....B.....B.....BGGDDGG.",
          ".WWWWWWWWWWWWWWWWWWWWWWWWWWGGDDDDGG",
          ".WwWwWwWwWwWwWwWwWwWwWwWwWwGGDDDDGG",
          "....B.....B.....B.....B.....BGGDDGG.",
          "...............................GG....",
        ],
        {
          W: "#8d5a2e",
          w: "#b8793e",
          B: "#d3a957",
          G: "#463113",
          D: "#8be8ff",
        },
      ),
      fireball: createVoxelSprite(
        [
          ".....RRRR.......",
          "...RROOOOR......",
          "..ROOOYYYOR.....",
          ".ROOYYYYYYOR....",
          "ROOYYWWYYYYOR...",
          "ROYYYYYYYYYOOR..",
          "ROYYYYYYOOOOR...",
          ".ROOYYYYOOOR....",
          "..ROOOOOOR......",
          "...RROOR........",
          ".....R..........",
        ],
        {
          R: "#9f2d17",
          O: "#f26b24",
          Y: "#ffd84a",
          W: "#fff6cf",
        },
      ),
      iceShard: createVoxelSprite(
        [
          "................II......",
          "............IIIIIII.....",
          "........IIIIICCCIIII....",
          "....IIIIICCCCCCCIIIIII..",
          ".IIIICCCCCCCWWCCCCIIIII.",
          "....IIIIICCCCCCCIIIIII..",
          "........IIIIICCCIIII....",
          "............IIIIIII.....",
          "................II......",
        ],
        {
          I: "#6ccfe1",
          C: "#b8f7ff",
          W: "#ffffff",
        },
      ),
      lightning: createVoxelSprite(
        [
          "..........YY",
          "........YYY.",
          "......YYY...",
          ".....YYY....",
          "...YYYYYYY..",
          "......YYY...",
          ".....YYY....",
          "...YYY......",
          ".YYY........",
        ],
        {
          Y: "#ffe66d",
        },
      ),
      spear: createVoxelSprite(
        [
          "............................TTT.",
          "==========================TTTTTT",
          "========================TTTTTTTT",
          "==========================TTTTTT",
          "............................TTT.",
        ],
        {
          "=": "#8d5a2e",
          T: "#d9e3e5",
        },
      ),
      sword: createVoxelSprite(
        [
          "....................SSS.",
          ".................SSSSSS.",
          "..............SSSSSSS...",
          "...........SSSSSSS......",
          "....GG..SSSSSSS.........",
          "....GGSSSSSS............",
          "WWWWGGGG...............",
          "....GG..................",
        ],
        {
          S: "#d8e0e5",
          G: "#d4aa52",
          W: "#7b4d28",
        },
      ),
      dagger: createVoxelSprite(
        [
          ".............SS.",
          "..........SSSS..",
          ".......SSSSS....",
          "....GGSSS.......",
          "WWWWGG.........",
          "....GG..........",
        ],
        {
          S: "#f4d7ff",
          G: "#d4aa52",
          W: "#5d3762",
        },
      ),
      shield: createVoxelSprite(
        [
          "..SSSSSSSSSS..",
          ".SSSSSSSSSSSS.",
          "SSGGGGGGGGGGSS",
          "SSGGGGGGGGGGSS",
          "SSGGGDDDDGGGSS",
          "SSGGGDDDDGGGSS",
          ".SSGGGGGGGGSS.",
          "..SSGGGGGGSS..",
          "...SSGGGGSS...",
          "....SSGGSS....",
        ],
        {
          S: "#324529",
          G: "#7fc66a",
          D: "#d8f4b8",
        },
      ),
      flail: createVoxelSprite(
        [
          "....MMMM....",
          "..MMMMMMMM..",
          ".MMNNNNNNMM.",
          ".MMNNNNNNMM.",
          ".MMNNNNNNMM.",
          "..MMMMMMMM..",
          "....MMMM....",
        ],
        {
          M: "#525660",
          N: "#b8bdc7",
        },
      ),
    },
  };
}

function createVoxelBlockTexture(kind) {
  const texture = document.createElement("canvas");
  const size = 16;
  texture.width = size;
  texture.height = size;
  const textureContext = texture.getContext("2d");
  textureContext.imageSmoothingEnabled = false;

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      textureContext.fillStyle = getVoxelBlockPixel(kind, x, y);
      textureContext.fillRect(x, y, 1, 1);
    }
  }

  return texture;
}

function getVoxelBlockPixel(kind, x, y) {
  const hash = Math.abs((x * 37 + y * 61 + x * y * 13 + kind.length * 19) % 100);

  if (kind === "grass") {
    if (hash > 88) {
      return "#7fbf4f";
    }
    if (hash < 18) {
      return "#365f2a";
    }
    return "#5f963c";
  }

  if (kind === "grassDark") {
    if (hash > 86) {
      return "#5d8640";
    }
    if (hash < 20) {
      return "#263f22";
    }
    return "#3f6b31";
  }

  if (kind === "dirt") {
    if (hash > 82) {
      return "#8a5d32";
    }
    if (hash < 25) {
      return "#4a2f1e";
    }
    return "#6b4326";
  }

  if (kind === "stone") {
    if (hash > 80) {
      return "#818785";
    }
    if (hash < 22) {
      return "#3e4545";
    }
    return "#5c6462";
  }

  if (kind === "deepslate") {
    if (hash > 84) {
      return "#303844";
    }
    if (hash < 24) {
      return "#11171f";
    }
    return "#202834";
  }

  if (kind === "plank") {
    if (x % 8 === 0 || y % 5 === 0) {
      return "#5d361e";
    }
    if (hash > 82) {
      return "#bd7c3d";
    }
    return "#8a552c";
  }

  if (kind === "obsidian") {
    if (hash > 88) {
      return "#3d245f";
    }
    if (hash < 18) {
      return "#050711";
    }
    return "#171324";
  }

  if (hash > 72) {
    return "#ffe8a3";
  }
  if (hash < 24) {
    return "#9a6825";
  }
  return "#d6a94f";
}

function createVoxelSprite(rows, palette, pixelSize = 2) {
  const width = Math.max(...rows.map((row) => row.length));
  const height = rows.length;
  const sprite = document.createElement("canvas");
  sprite.width = width * pixelSize;
  sprite.height = height * pixelSize;
  const spriteContext = sprite.getContext("2d");
  spriteContext.imageSmoothingEnabled = false;

  rows.forEach((row, rowIndex) => {
    for (let column = 0; column < width; column += 1) {
      const color = palette[row[column]];
      if (color) {
        spriteContext.fillStyle = color;
        spriteContext.fillRect(column * pixelSize, rowIndex * pixelSize, pixelSize, pixelSize);
      }
    }
  });

  return sprite;
}

function createTerrainState(seed = Math.floor(Math.random() * 0xffffffff), sceneId = selectedProfessions?.scene) {
  const arenaBiome = sceneId === "super" ? "super" : terrainNoise(seed, 0, 0, 101) > 0.5 ? "grass" : "rock";
  const terrainColumns = Math.ceil(ARENA_SIZE / ARENA_TERRAIN_TILE_SIZE);
  const terrainRows = Math.ceil(ARENA_SIZE / ARENA_TERRAIN_TILE_SIZE);

  return {
    seed,
    arenaBiome,
    arenaTiles: Array.from({ length: terrainRows }, (_, row) =>
      Array.from({ length: terrainColumns }, (_, column) => createArenaTerrainTile(seed, arenaBiome, column, row)),
    ),
  };
}

function createArenaTerrainTile(seed, biome, column, row) {
  const detail = terrainNoise(seed, column, row, 7);
  const softPatch = getSoftTerrainNoise(seed, column, row, 17);
  const vein = getTerrainVein(seed, column, row);

  if (biome === "super") {
    if (vein > 0.82) {
      return { type: "obsidian", shade: 0.28 + detail * 0.14 };
    }
    if (softPatch > 0.78) {
      return { type: "glowstone", shade: 0.18 + detail * 0.12 };
    }
    if (softPatch < 0.2) {
      return { type: "deepslate", shade: 0.22 + detail * 0.12 };
    }
    return { type: "stone", shade: 0.12 + detail * 0.12 };
  }

  if (biome === "rock") {
    if (softPatch > 0.78 || vein > 0.88) {
      return { type: "deepslate", shade: 0.24 + detail * 0.16 };
    }
    if (softPatch < 0.18) {
      return { type: "dirt", shade: 0.16 + detail * 0.12 };
    }
    if (detail > 0.91) {
      return { type: "moss", shade: 0.2 };
    }
    return { type: "stone", shade: 0.08 + detail * 0.12 };
  }

  if (softPatch < 0.16 || vein > 0.9) {
    return { type: "dirt", shade: 0.14 + detail * 0.12 };
  }
  if (softPatch > 0.78) {
    return { type: "grassDark", shade: 0.1 + detail * 0.1 };
  }
  if (detail > 0.94) {
    return { type: "stone", shade: 0.18 };
  }
  return { type: "grass", shade: 0.03 + detail * 0.08 };
}

function getBackdropTerrainTile(seed, column, row) {
  const softPatch = getSoftTerrainNoise(seed, column, row, 203);
  const detail = terrainNoise(seed, column, row, 211);
  const vein = getTerrainVein(seed + 1301, column, row);

  if (vein > 0.9) {
    return { type: "obsidian", shade: 0.36 };
  }
  if (softPatch < 0.24) {
    return { type: "deepslate", shade: 0.28 + detail * 0.18 };
  }
  if (softPatch > 0.78) {
    return { type: "dirt", shade: 0.26 + detail * 0.14 };
  }
  return { type: detail > 0.72 ? "stone" : "deepslate", shade: 0.18 + detail * 0.16 };
}

function getSoftTerrainNoise(seed, column, row, salt) {
  return (
    terrainNoise(seed, Math.floor(column / 2), Math.floor(row / 2), salt) * 0.48 +
    terrainNoise(seed, column, row, salt + 11) * 0.32 +
    terrainNoise(seed, column + row, row - column, salt + 23) * 0.2
  );
}

function getTerrainVein(seed, column, row) {
  const waveA = Math.sin(column * 0.73 + row * 0.31 + seed * 0.000017);
  const waveB = Math.sin(column * -0.21 + row * 0.88 + seed * 0.000029);
  const jitter = terrainNoise(seed, column, row, 47) * 0.44;
  return Math.abs(waveA * 0.38 + waveB * 0.3 + jitter);
}

function terrainNoise(seed, column, row, salt = 0) {
  let value = (seed ^ (column * 374761393) ^ (row * 668265263) ^ (salt * 2246822519)) >>> 0;
  value = Math.imul(value ^ (value >>> 15), 2246822519);
  value = Math.imul(value ^ (value >>> 13), 3266489917);
  return ((value ^ (value >>> 16)) >>> 0) / 4294967295;
}

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
    this.visual = {
      ...getSideVisualConfig(this.label),
      color: this.config.color || getSideVisualConfig(this.label).color,
      accentColor: this.config.accentColor || getSideVisualConfig(this.label).accentColor,
    };
    this.lastAttackTime = -Infinity;
    this.hitFlashTime = 0;
    this.attackState = null;
    this.attackDisabledUntil = 0;
    this.frozenUntil = 0;
    this.poisonUntil = 0;
    this.poisonDamagePerSecond = 0;
    this.lastCollisionAbilityTime = -Infinity;
    this.lastHazardHitTime = -Infinity;
    this.lastWebHitTime = -Infinity;
    this.lastFlameHitTime = -Infinity;
    this.lastFrostHitTime = -Infinity;
    this.lastFlameDropTime = -Infinity;
    this.wallCollisionCount = 0;
    this.pendingWebNode = null;
    this.chainWeaponState = createChainWeaponState(this);
    this.frostOrbitState = createFrostOrbitState(this);
    this.cosmeticState = createCosmeticState();
  }

  update(deltaTime, currentTime) {
    this.velocity = scale(normalize(this.velocity), getCurrentMoveSpeed(this));
    if (!isBallFrozen(this, currentTime)) {
      this.position.x += this.velocity.x * deltaTime;
      this.position.y += this.velocity.y * deltaTime;
    }
    this.hitFlashTime = Math.max(0, this.hitFlashTime - deltaTime);
    updateBallCosmetics(this, currentTime);
    this.bounceOffWalls(currentTime);
    updateFlameTrailForBall(this, currentTime);
  }

  bounceOffWalls(currentTime = null) {
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

    if (contacts.length > 0 && currentTime !== null) {
      handleWallCollision(this, contacts[0], currentTime);
    }
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
      return false;
    }

    const attackConfig = getAttackAnimationConfig(this.profession);
    const variant = this.config.getAttackVariant?.(this, defender, currentTime) || null;
    const direction = getAttackDirection(this, defender, variant);
    this.attackState = {
      defender,
      startTime: currentTime,
      duration: attackConfig.duration,
      hitFrame: attackConfig.hitFrame,
      direction,
      variant,
      didDealDamage: false,
    };
    this.lastAttackTime = currentTime;
    return true;
  }

  dealAttackDamageTo(defender, normalFromAttackerToDefender, attackVariant = null) {
    if (this.hp <= 0 || defender.hp <= 0) {
      return 0;
    }

    const damage = this.config.getDamage(this, defender, normalFromAttackerToDefender, attackVariant);
    return damageBall(defender, damage);
  }

  isSkillHit(defender, normalFromAttackerToDefender, damage, attackVariant = null) {
    return this.config.isSkillHit(this, defender, normalFromAttackerToDefender, damage, attackVariant);
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

function createInitialBalls() {
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

function getUrlProfessionOverrides() {
  const params = new URLSearchParams(window.location.search);
  return {
    scene: params.get("scene"),
    a: params.get("a"),
    b: params.get("b"),
  };
}

function getActiveProfessionIds() {
  return getSceneProfessionIds(selectedProfessions.scene);
}

function setSelectedScene(sceneId) {
  selectedProfessions = normalizeSelectedProfessions(
    {
      ...selectedProfessions,
      scene: sceneId,
    },
    ProfessionConfig,
  );
  activeProfessionSide = "a";
  serviceMessage = t("messages.selectedScene", { scene: getSceneName(selectedProfessions.scene) });
}

function getSceneName(sceneId) {
  return t(SceneConfig[sceneId]?.nameKey || SceneConfig.classic.nameKey);
}

function getSceneDescription(sceneId) {
  return t(SceneConfig[sceneId]?.descriptionKey || SceneConfig.classic.descriptionKey);
}

function getSideVisualConfig(label) {
  return SIDE_VISUAL_CONFIG[label] || SIDE_VISUAL_CONFIG.A;
}

function t(key, replacements = {}) {
  return translate(currentLocale, key, replacements);
}

function setLocale(locale) {
  currentLocale = saveLocale(normalizeLocale(locale));
  legalScrollOffset = 0;
  serviceMessage = "";
  pointerDownElementId = null;
  applyLocaleToDocument();
}

function applyLocaleToDocument() {
  globalThis.document.documentElement.lang = currentLocale;
  globalThis.document.documentElement.dir = getTextDirection(currentLocale);
  globalThis.document.title = t("app.name");
  canvas.setAttribute("aria-label", t("app.name"));
}

function getProfessionName(professionId) {
  return t(`professions.${professionId}.name`) || ProfessionConfig[professionId]?.name || professionId;
}

function getSideLabel(side) {
  return side === "a" || side === "A" ? t("side.a") : t("side.b");
}

function getTextAlignStart() {
  return isRtlLocale(currentLocale) ? "right" : "left";
}

function getTextAlignEnd() {
  return isRtlLocale(currentLocale) ? "left" : "right";
}

function getTextStartX(x, width) {
  return isRtlLocale(currentLocale) ? x + width : x;
}

function getTextEndX(x, width) {
  return isRtlLocale(currentLocale) ? x : x + width;
}

function setCanvasDirection(context) {
  context.direction = getTextDirection(currentLocale);
}

function createChainWeaponState(ball) {
  if (ball.config.attackMode !== "chainSpin") {
    return null;
  }

  return {
    rotationAngle: ball.label === "A" ? -0.42 : Math.PI + 0.42,
    spinDirection: ball.label === "A" ? 1 : -1,
    lastHitTime: -Infinity,
    wallContact: null,
  };
}

function createFrostOrbitState(ball) {
  if (ball.config.attackMode !== "frostOrbit") {
    return null;
  }

  return {
    rotationAngle: ball.label === "A" ? 0 : Math.PI,
    lastHitTime: -Infinity,
  };
}

function setScreen(nextScreen) {
  screen = nextScreen;
  pointerDownElementId = null;
  legalScrollOffset = 0;
}

function openLegalDocument(type, returnScreen = screen) {
  activeLegalDocument = type;
  previousScreen = returnScreen;
  setScreen(Screen.LEGAL_DOCUMENT);
}

function acceptLegalAndEnterMenu() {
  if (!hasCheckedLegalConsent) {
    serviceMessage = t("messages.checkAgreement");
    return;
  }

  complianceState.acceptCurrentLegal();
  analytics.track("legal_accept", { version: LegalConfig.version });
  setScreen(Screen.MAIN_MENU);
}

function openMatchSetup() {
  activeProfessionSide = "a";
  serviceMessage = "";
  setScreen(Screen.PROFESSION_SELECT);
}

function startGame() {
  selectedProfessions = complianceState.saveSelectedProfessions(selectedProfessions);
  analytics.track("game_start", selectedProfessions);
  restartGame();
  setScreen(Screen.PLAYING);
}

function restartGame() {
  terrainState = createTerrainState(undefined, selectedProfessions.scene);
  balls = createInitialBalls();
  attackEffectInstances = [];
  projectiles = [];
  spellTrajectories = [];
  arenaHazards = [];
  webLinks = [];
  flameTrails = [];
  gameOver = false;
  resultMessage = "";
  matchElapsedTimeSeconds = 0;
  lastFrameTime = performance.now();
  GamePlatform.setLoadingProgress(100);
}

function returnToMenu() {
  balls = [];
  attackEffectInstances = [];
  projectiles = [];
  spellTrajectories = [];
  arenaHazards = [];
  webLinks = [];
  flameTrails = [];
  gameOver = false;
  resultMessage = "";
  setScreen(Screen.MAIN_MENU);
}

function withdrawConsent() {
  complianceState.withdrawConsent();
  hasCheckedLegalConsent = false;
  serviceMessage = t("messages.consentWithdrawn");
  setScreen(Screen.CONSENT);
}

async function restorePurchases() {
  const result = await iap.restorePurchases();
  serviceMessage = result.restored ? t("messages.purchaseRestored") : t("messages.purchaseUnavailable");
  analytics.track("restore_purchases", result);
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
  ctx.imageSmoothingEnabled = false;
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
    content: { x: left, y: top, width: contentWidth, height: contentHeight },
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
  };
}

function createLandscapeLayout(metrics) {
  const { left, top, contentWidth, contentHeight } = metrics;
  const arenaSize = Math.min(ARENA_SIZE, contentWidth, contentHeight);
  const arenaX = left + (contentWidth - arenaSize) / 2;
  const arenaY = top + (contentHeight - arenaSize) / 2;

  return {
    mode: "landscape",
    content: { x: left, y: top, width: contentWidth, height: contentHeight },
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
  };
}

function gameLoop(timestamp) {
  const deltaTime = Math.min((timestamp - lastFrameTime) / 1000, MAX_DELTA_TIME);
  lastFrameTime = timestamp;
  elapsedTimeSeconds = timestamp / 1000;

  if (screen === Screen.PLAYING && !gameOver) {
    matchElapsedTimeSeconds += deltaTime;
    update(deltaTime, elapsedTimeSeconds);
  }

  draw();
  requestAnimationFrame(gameLoop);
}

function update(deltaTime, currentTime) {
  balls.forEach((ball) => ball.update(deltaTime, currentTime));
  updateStatusEffects(deltaTime, currentTime);
  attackEffectInstances = updateAttackEffectInstances(attackEffectInstances, currentTime);
  spellTrajectories = updateSpellTrajectories(currentTime);
  arenaHazards = arenaHazards.filter((hazard) => hazard.expiresAt > currentTime);
  webLinks = webLinks.filter((web) => web.expiresAt > currentTime);
  flameTrails = flameTrails.filter((flame) => flame.expiresAt > currentTime);
  resolveBallCollision(balls[0], balls[1], currentTime);
  updateEnvironmentalHazards(currentTime);
  updateProjectiles(deltaTime, currentTime);
  updateChainWeapon(balls[0], deltaTime);
  updateChainWeapon(balls[1], deltaTime);
  updateChainWeaponForPair(balls[0], balls[1], currentTime);
  updateChainWeaponForPair(balls[1], balls[0], currentTime);
  updateFrostOrbit(balls[0], deltaTime);
  updateFrostOrbit(balls[1], deltaTime);
  updateFrostOrbitForPair(balls[0], balls[1], currentTime);
  updateFrostOrbitForPair(balls[1], balls[0], currentTime);
  updateAttackForPair(balls[0], balls[1], currentTime);
  updateAttackForPair(balls[1], balls[0], currentTime);
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
  resolveCollisionAbilities(ballA, ballB, normal, currentTime);
}

function updateAttackForPair(attacker, defender, currentTime) {
  if (attacker.config.attackMode === "chainSpin" || attacker.config.attackMode === "frostOrbit") {
    return;
  }

  if (isBallControlLocked(attacker, currentTime)) {
    attacker.attackState = null;
    return;
  }

  updateAttackState(attacker, currentTime);

  const canStartAttack = attacker.config.attackMode === "projectile" || isInAttackRange(attacker, defender);
  if (!attacker.attackState && canStartAttack) {
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

  if (attacker.config.attackMode === "projectile") {
    if (!attackState.didFireProjectile && progress >= attackState.hitFrame) {
      attackState.didFireProjectile = true;
      attackState.didDealDamage = true;
      fireProjectile(attacker, attackState.defender, currentTime);
    }
  } else if (attacker.config.attackMode === "spell") {
    if (!attackState.didCastSpell && progress >= attackState.hitFrame) {
      attackState.didCastSpell = true;
      attackState.didDealDamage = true;
      castMageSpell(attacker, attackState.defender, currentTime);
    }
  } else if (attacker.config.attackMode === "reaper") {
    if (!attackState.didDealDamage && progress >= attackState.hitFrame) {
      const defender = attackState.defender;
      const hit = getReaperBladeHit(attacker, defender, currentTime);
      attackState.didDealDamage = true;
      if (hit) {
        resolveAttackHit(attacker, defender, hit.normal, currentTime);
      }
    }
  } else if (!attackState.didDealDamage && progress >= attackState.hitFrame) {
    const defender = attackState.defender;
    const normal = normalize(attackState.direction);
    attackState.didDealDamage = true;
    resolveAttackHit(attacker, defender, normal, currentTime);
  }

  if (currentTime - attackState.startTime >= attackState.duration) {
    attacker.attackState = null;
  }
}

function fireProjectile(attacker, defender, currentTime) {
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
    kind: "arrow",
    position,
    previousPosition: { ...position },
    direction,
    speed: weapon.speed,
    headRadius: weapon.headRadius,
    collisionRadius: weapon.headRadius,
    shaftLength: weapon.shaftLength,
    shaftRadius: 3,
    color: attacker.visual.accentColor,
    darkColor: "#050711",
    featherColor: attacker.visual.color,
    variant: null,
  });
}

function castMageSpell(attacker, defender, currentTime) {
  const variant = attacker.attackState?.variant;
  if (attacker.hp <= 0 || defender.hp <= 0 || !variant) {
    return;
  }

  if (variant.castType === "trajectory") {
    castMageTrajectorySpell(attacker, defender, variant, currentTime);
    return;
  }

  castMageProjectileSpell(attacker, defender, variant, currentTime);
}

function castMageProjectileSpell(attacker, defender, variant, currentTime) {
  const firstAim = getProjectileAimDirection(attacker, defender, variant.speed);
  const firstTip = getMageStaffTip(attacker, firstAim);
  const direction = getProjectileAimDirection(attacker, defender, variant.speed, firstTip);
  const staffTip = getMageStaffTip(attacker, direction);
  const position = add(staffTip, scale(direction, variant.spawnOffset || 0));

  attacker.attackState.direction = direction;
  projectiles.push({
    owner: attacker,
    kind: variant.id,
    position,
    previousPosition: { ...position },
    direction,
    speed: variant.speed,
    headRadius: variant.headRadius,
    collisionRadius: variant.headRadius,
    shaftLength: variant.shaftLength,
    shaftRadius: variant.id === "ice" ? 5 : 8,
    color: variant.color,
    darkColor: "#050711",
    featherColor: attacker.visual.accentColor,
    variant,
  });
}

function castMageTrajectorySpell(attacker, defender, variant, currentTime) {
  const direction = getDirectionBetween(attacker, defender);
  const start = getMageStaffTip(attacker, direction);
  const maxDistance = Math.min(variant.range || attacker.weaponRange, getArenaRayDistance(start, direction));
  const end = add(start, scale(direction, maxDistance));
  const points = createLightningTrajectoryPoints(start, end, direction, variant, currentTime, attacker.label);
  const trajectory = {
    owner: attacker,
    kind: variant.id,
    points,
    collisionRadius: variant.collisionRadius,
    color: variant.color,
    darkColor: "#050711",
    createdAt: currentTime,
    expiresAt: currentTime + (variant.duration || 0.16),
    variant,
  };

  attacker.attackState.direction = direction;
  resolveSpellTrajectoryCollision(trajectory, currentTime);
  spellTrajectories.push(trajectory);
}

function updateProjectiles(deltaTime, currentTime) {
  projectiles = projectiles.filter((projectile) => {
    projectile.previousPosition = { ...projectile.position };
    projectile.position = add(projectile.position, scale(projectile.direction, projectile.speed * deltaTime));

    if (!isProjectileInArena(projectile)) {
      return false;
    }

    const defender = balls.find((ball) => ball !== projectile.owner && ball.hp > 0 && getProjectileTrajectoryHit(projectile, ball));
    if (!defender) {
      return true;
    }

    resolveAttackHit(projectile.owner, defender, projectile.direction, currentTime, projectile.variant);
    return false;
  });
}

function updateSpellTrajectories(currentTime) {
  return spellTrajectories.filter((trajectory) => trajectory.expiresAt > currentTime);
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

function getProjectileTrajectoryHit(projectile, defender) {
  const sweepHit = getSegmentCircleHit(
    defender.position,
    defender.radius + (projectile.collisionRadius || projectile.headRadius),
    projectile.previousPosition,
    projectile.position,
  );

  if (sweepHit) {
    return sweepHit;
  }

  const tail = add(projectile.position, scale(projectile.direction, -(projectile.shaftLength || 0)));
  return getSegmentCircleHit(defender.position, defender.radius + (projectile.shaftRadius || 0), tail, projectile.position);
}

function resolveSpellTrajectoryCollision(trajectory, currentTime) {
  const defender = balls.find((ball) => {
    return ball !== trajectory.owner && ball.hp > 0 && getSpellTrajectoryHit(trajectory, ball);
  });

  if (!defender) {
    return;
  }

  const hit = getSpellTrajectoryHit(trajectory, defender);
  resolveAttackHit(trajectory.owner, defender, hit.normal, currentTime, trajectory.variant);
}

function getSpellTrajectoryHit(trajectory, defender) {
  const hitRadius = defender.radius + trajectory.collisionRadius;

  for (let index = 1; index < trajectory.points.length; index += 1) {
    const start = trajectory.points[index - 1];
    const end = trajectory.points[index];
    const hit = getSegmentCircleHit(defender.position, hitRadius, start, end);

    if (hit) {
      const normal = normalize(subtract(defender.position, trajectory.points[0]));
      return {
        ...hit,
        normal,
      };
    }
  }

  return null;
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
    ball.frostOrbitState.rotationAngle + ball.config.frostOrbit.spinSpeed * deltaTime,
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
  playHitCosmetics(attacker, defender, hit.normal, orbit.damage, currentTime);
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
  playHitCosmetics(attacker, defender, normalFromAttackerToDefender, damage, currentTime);
}

function handleWallCollision(ball, contact, currentTime) {
  if (ball.hp <= 0) {
    return;
  }

  if (ball.config.venomSpike) {
    createVenomSpike(ball, contact, currentTime);
  }

  if (ball.config.webLine) {
    createSpiderWebNode(ball, contact, currentTime);
  }
}

function createVenomSpike(ball, contact, currentTime) {
  const spike = ball.config.venomSpike;
  const offset = ball.radius + spike.radius * 0.2;
  const position = clampArenaPoint(add(contact.point, scale(getWallNormal(contact.wall), offset)));
  arenaHazards.push({
    type: "venomSpike",
    owner: ball,
    position,
    radius: spike.radius,
    damage: spike.damage,
    poisonDamagePerSecond: spike.poisonDamagePerSecond,
    poisonDuration: spike.poisonDuration,
    hitCooldown: spike.hitCooldown,
    createdAt: currentTime,
    expiresAt: currentTime + spike.duration,
  });
}

function createSpiderWebNode(ball, contact, currentTime) {
  const web = ball.config.webLine;
  const node = {
    x: clamp(contact.point.x, web.nodeRadius, ARENA_SIZE - web.nodeRadius),
    y: clamp(contact.point.y, web.nodeRadius, ARENA_SIZE - web.nodeRadius),
  };
  ball.wallCollisionCount += 1;

  if (ball.wallCollisionCount % 2 === 1 || !ball.pendingWebNode) {
    ball.pendingWebNode = node;
    return;
  }

  webLinks.push({
    owner: ball,
    start: ball.pendingWebNode,
    end: node,
    nodeRadius: web.nodeRadius,
    collisionRadius: web.collisionRadius,
    damage: web.damage,
    hitCooldown: web.hitCooldown,
    createdAt: currentTime,
    expiresAt: currentTime + web.duration,
  });
  ball.pendingWebNode = null;
}

function updateFlameTrailForBall(ball, currentTime) {
  const flame = ball.config.flameTrail;
  if (!flame || ball.hp <= 0 || currentTime - ball.lastFlameDropTime < flame.dropInterval) {
    return;
  }

  ball.lastFlameDropTime = currentTime;
  flameTrails.push({
    owner: ball,
    position: { ...ball.position },
    radius: flame.radius,
    damage: flame.damage,
    hitCooldown: flame.hitCooldown,
    createdAt: currentTime,
    expiresAt: currentTime + flame.duration,
  });
}

function updateStatusEffects(deltaTime, currentTime) {
  for (const ball of balls) {
    if (ball.hp <= 0) {
      continue;
    }

    if (ball.poisonUntil > currentTime && ball.poisonDamagePerSecond > 0) {
      damageBall(ball, ball.poisonDamagePerSecond * deltaTime);
    }
  }
}

function updateEnvironmentalHazards(currentTime) {
  for (const hazard of arenaHazards) {
    for (const ball of balls) {
      if (ball !== hazard.owner && ball.hp > 0 && length(subtract(ball.position, hazard.position)) <= ball.radius + hazard.radius) {
        applyVenomSpikeHit(hazard, ball, currentTime);
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

  for (const flame of flameTrails) {
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

function applyVenomSpikeHit(hazard, ball, currentTime) {
  if (currentTime - ball.lastHazardHitTime < hazard.hitCooldown) {
    return;
  }

  ball.lastHazardHitTime = currentTime;
  ball.poisonUntil = Math.max(ball.poisonUntil, currentTime + hazard.poisonDuration);
  ball.poisonDamagePerSecond = Math.max(ball.poisonDamagePerSecond, hazard.poisonDamagePerSecond);
  damageBall(ball, hazard.damage);
}

function resolveAttackHit(attacker, defender, normalFromAttackerToDefender, currentTime, attackVariant = null) {
  const damage = attacker.dealAttackDamageTo(defender, normalFromAttackerToDefender, attackVariant);
  applyAttackKnockback(attacker, defender, normalFromAttackerToDefender, damage, attackVariant);
  playHitCosmetics(attacker, defender, normalFromAttackerToDefender, damage, currentTime, attackVariant);
  return damage;
}

function isInAttackRange(attacker, defender) {
  if (attacker.hp <= 0 || defender.hp <= 0) {
    return false;
  }

  const attackReach = attacker.radius + defender.radius + attacker.weaponRange;
  return length(subtract(defender.position, attacker.position)) <= attackReach;
}

function playHitCosmetics(attacker, defender, normalFromAttackerToDefender, damage, currentTime, attackVariant = null) {
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

  const isSkillHit = attacker.isSkillHit(defender, normalFromAttackerToDefender, damage, attackVariant);
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

function applyAttackKnockback(attacker, defender, normalFromAttackerToDefender, damage, attackVariant = null) {
  if (damage <= 0) {
    return;
  }

  const push =
    56 * attacker.config.getKnockbackMultiplier(attacker, defender, normalFromAttackerToDefender, damage, attackVariant);
  defender.velocity = add(defender.velocity, scale(normalFromAttackerToDefender, push));
  keepSpeed(attacker);
  keepSpeed(defender);
}

function damageBall(ball, damage) {
  if (ball.hp <= 0 || damage <= 0) {
    return 0;
  }

  const appliedDamage = Math.min(ball.hp, damage);
  ball.hp = Math.max(0, ball.hp - appliedDamage);
  ball.hitFlashTime = 0.16;
  return appliedDamage;
}

function healBall(ball, amount) {
  if (ball.hp <= 0 || amount <= 0) {
    return 0;
  }

  const healed = Math.min(ball.maxHp - ball.hp, amount);
  ball.hp += healed;
  return healed;
}

function isBallFrozen(ball, currentTime) {
  return ball.frozenUntil > currentTime;
}

function isBallControlLocked(ball, currentTime) {
  return isBallFrozen(ball, currentTime) || ball.attackDisabledUntil > currentTime;
}

function keepSpeed(ball) {
  ball.velocity = scale(normalize(ball.velocity), getCurrentMoveSpeed(ball));
}

function getCurrentMoveSpeed(ball) {
  return ball.config.moveSpeed * getSpeedMultiplier(matchElapsedTimeSeconds);
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

function getChainWeaponGeometry(ball) {
  const weapon = ball.config.chainWeapon;
  const angle = ball.chainWeaponState?.rotationAngle || 0;
  const direction = vectorFromAngle(angle);
  const head = add(ball.position, scale(direction, weapon.orbitRadius));
  const start = add(ball.position, scale(direction, ball.radius * 0.64));

  return {
    direction,
    start,
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
      angle,
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

function getReaperBladeGeometry(ball, currentTime) {
  const direction = normalize(ball.attackState?.direction || ball.velocity);
  const progress = getAttackProgress(ball, currentTime);
  const attackConfig = getAttackAnimationConfig("reaper");
  const swingProgress = progress === null ? 0.55 : easeOutCubic(progress);
  const baseAngle = angleOf(direction);
  const bladeAngle = baseAngle - attackConfig.sweepAngle / 2 + attackConfig.sweepAngle * swingProgress;
  const bladeDirection = vectorFromAngle(bladeAngle);
  const side = vectorFromAngle(bladeAngle - Math.PI * 0.5);
  const socket = add(ball.position, scale(bladeDirection, ball.radius + ball.weaponRange * 0.72));
  const bladeHalf = ball.config.reaperBlade.edgeLength / 2;

  return {
    handleStart: add(ball.position, scale(bladeDirection, ball.radius * 0.48)),
    handleEnd: socket,
    bladeStart: add(socket, scale(side, -bladeHalf)),
    bladeEnd: add(socket, scale(side, bladeHalf)),
    normal: bladeDirection,
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
    return null;
  }

  return {
    ...hit,
    normal: normalize(subtract(defender.position, geometry.handleEnd)),
  };
}

function getMageStaffGeometry(ball, direction) {
  const safeDirection = normalize(direction);
  const side = { x: -safeDirection.y, y: safeDirection.x };
  const grip = add(ball.position, scale(safeDirection, ball.radius * 0.34));
  const base = subtract(grip, scale(safeDirection, ball.radius * 0.78));
  const tip = add(ball.position, scale(safeDirection, ball.radius + 28));

  return {
    direction: safeDirection,
    side,
    base,
    grip,
    tip,
  };
}

function getMageStaffTip(ball, direction) {
  return getMageStaffGeometry(ball, direction).tip;
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

function createLightningTrajectoryPoints(start, end, direction, variant, currentTime, ownerLabel) {
  const segmentCount = variant.segmentCount || 5;
  const side = { x: -direction.y, y: direction.x };
  const seed = currentTime * 97.13 + start.x * 0.19 + start.y * 0.11 + ownerLabel.charCodeAt(0) * 0.31;
  const points = [];

  for (let index = 0; index <= segmentCount; index += 1) {
    const progress = index / segmentCount;
    const base = add(start, scale(subtract(end, start), progress));
    const taper = Math.sin(Math.PI * progress);
    const jitter = Math.sin(seed + index * 2.41) * 22 * taper;
    points.push(add(base, scale(side, jitter)));
  }

  return points;
}

function getSegmentCircleHit(center, radius, start, end) {
  const segment = subtract(end, start);
  const segmentLengthSquared = dot(segment, segment);
  const progress =
    segmentLengthSquared <= 0.0001 ? 0 : clamp(dot(subtract(center, start), segment) / segmentLengthSquared, 0, 1);
  const closestPoint = add(start, scale(segment, progress));
  const difference = subtract(center, closestPoint);
  const distance = length(difference);

  if (distance > radius) {
    return null;
  }

  return {
    point: closestPoint,
    normal: distance <= 0.0001 ? normalize(segment) : scale(difference, 1 / distance),
  };
}

function getAttackDirection(attacker, defender, variant = null) {
  if (attacker.config.attackMode === "projectile" && attacker.config.projectileWeapon) {
    return getProjectileAimDirection(attacker, defender, attacker.config.projectileWeapon.speed);
  }

  if (attacker.config.attackMode === "spell" && variant?.castType === "projectile") {
    return getProjectileAimDirection(attacker, defender, variant.speed);
  }

  return getDirectionBetween(attacker, defender);
}

function getProjectileAimDirection(attacker, defender, projectileSpeed, origin = attacker.position) {
  const toDefender = subtract(defender.position, origin);
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
  analytics.track("game_result", {
    result: resultMessage,
    a: selectedProfessions.a,
    b: selectedProfessions.b,
  });
  setScreen(Screen.RESULT);
}

function getResultText(ballA, ballB) {
  if (ballA.hp <= 0 && ballB.hp <= 0) {
    return t("result.draw");
  }

  if (ballA.hp <= 0) {
    return t("result.winner", { side: getSideLabel("b"), profession: getProfessionName(ballB.profession) });
  }

  return t("result.winner", { side: getSideLabel("a"), profession: getProfessionName(ballA.profession) });
}

function draw() {
  interactiveElements = [];
  ctx.clearRect(0, 0, viewport.width, viewport.height);
  drawBackground();

  switch (screen) {
    case Screen.CONSENT:
      drawConsentScreen();
      break;
    case Screen.LEGAL_DOCUMENT:
      drawLegalDocumentScreen();
      break;
    case Screen.MAIN_MENU:
      drawMainMenuScreen();
      break;
    case Screen.PROFESSION_SELECT:
      drawProfessionSelectScreen();
      break;
    case Screen.SETTINGS:
      drawSettingsScreen();
      break;
    case Screen.PLAYING:
      drawHud(t("status.playing"));
      drawArenaScene();
      break;
    case Screen.RESULT:
      drawHud(resultMessage);
      drawArenaScene();
      drawResultOverlay();
      break;
    default:
      drawMainMenuScreen();
      break;
  }
}

function drawBackground() {
  const blockSize = BACKDROP_TERRAIN_TILE_SIZE;
  const columns = Math.ceil(viewport.width / blockSize) + 1;
  const rows = Math.ceil(viewport.height / blockSize) + 1;

  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const tile = getBackdropTerrainTile(terrainState.seed, column, row);
      drawTerrainBlock(ctx, tile, column * blockSize, row * blockSize, blockSize, {
        borderAlpha: 0.08,
        darkness: 0.42,
      });
    }
  }

  ctx.fillStyle = "rgba(18, 22, 28, 0.18)";
  ctx.fillRect(0, 0, viewport.width, viewport.height);
}

function drawHud(statusText) {
  ctx.save();
  setCanvasDirection(ctx);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = canvasFont(layout.title.fontSize, 900);
  ctx.fillStyle = "#050711";
  ctx.fillText(t("app.name"), layout.title.x + 3, layout.title.y + 3);
  ctx.fillStyle = COLORS.text;
  ctx.fillText(t("app.name"), layout.title.x, layout.title.y);

  ctx.fillStyle = COLORS.muted;
  ctx.font = canvasFont(layout.status.fontSize, 600);
  ctx.fillText(statusText, layout.status.x, layout.status.y);
  ctx.restore();
}

function drawConsentScreen() {
  const panel = getPanelRect(620, 590);
  drawAppTitle(panel.y - 22, t("consent.subtitle"));
  drawPanel(panel);

  let y = panel.y + 28;
  drawPanelTitle(t("settings.languageTitle"), panel.x + 28, y, panel.width - 56);
  y += 36;
  drawLanguageSelector(panel.x + 28, y, panel.width - 56);
  y += 52;
  drawPanelTitle(t("consent.title"), panel.x + 28, y, panel.width - 56);
  y += 46;
  y = drawWrappedText(
    t("consent.intro"),
    panel.x + 28,
    y,
    panel.width - 56,
    21,
    COLORS.text,
    15,
  );
  y += 16;

  drawButton(t("consent.privacy"), panel.x + 28, y, (panel.width - 68) / 2, 42, () => openLegalDocument("privacy", Screen.CONSENT), {
    id: "consent-privacy",
  });
  drawButton(
    t("consent.terms"),
    panel.x + 40 + (panel.width - 68) / 2,
    y,
    (panel.width - 68) / 2,
    42,
    () => openLegalDocument("terms", Screen.CONSENT),
    { id: "consent-terms" },
  );
  y += 68;

  drawCheckbox(
    t("consent.agree"),
    panel.x + 28,
    y,
    panel.width - 56,
    hasCheckedLegalConsent,
    () => {
      hasCheckedLegalConsent = !hasCheckedLegalConsent;
      serviceMessage = "";
    },
  );
  y += 64;

  drawButton(t("consent.enter"), panel.x + 28, y, panel.width - 56, 48, acceptLegalAndEnterMenu, {
    disabled: !hasCheckedLegalConsent,
    id: "consent-enter",
  });
  y += 66;
  drawSmallNotice(panel.x + 28, y, panel.width - 56, serviceMessage || t("consent.ageRating"));
}

function drawMainMenuScreen() {
  const panel = getPanelRect(620, 430);
  drawAppTitle(panel.y - 26, t("main.subtitle"));
  drawPanel(panel);

  const summary = t("main.summary", {
    sideA: getSideLabel("a"),
    sideB: getSideLabel("b"),
    professionA: getProfessionName(selectedProfessions.a),
    professionB: getProfessionName(selectedProfessions.b),
    scene: getSceneName(selectedProfessions.scene),
  });
  let y = panel.y + 34;
  drawPanelTitle(t("main.title"), panel.x + 28, y, panel.width - 56);
  y += 44;
  y = drawWrappedText(summary, panel.x + 28, y, panel.width - 56, 24, COLORS.text, 18);
  y += 22;
  drawButton(t("main.start"), panel.x + 28, y, panel.width - 56, 52, openMatchSetup, { id: "main-start" });
  y += 70;
  drawButton(t("main.settings"), panel.x + 28, y, panel.width - 56, 46, () => setScreen(Screen.SETTINGS), { id: "main-settings" });
  y += 72;
  drawSmallNotice(
    panel.x + 28,
    y,
    panel.width - 56,
    t("main.notice"),
  );
}

function drawProfessionSelectScreen() {
  const panel = getPanelRect(820, 610);
  drawAppTitle(panel.y - 22, t("setup.subtitle"));
  drawPanel(panel);

  let y = panel.y + 24;
  drawSetupSceneRow(panel.x + 28, y, panel.width - 56);
  y += 88;

  const tabWidth = (panel.width - 68) / 2;
  drawButton(`${getSideLabel("a")}: ${getProfessionName(selectedProfessions.a)}`, panel.x + 28, y, tabWidth, 42, () => {
    activeProfessionSide = "a";
  }, { active: activeProfessionSide === "a", id: "setup-side-a" });
  drawButton(`${getSideLabel("b")}: ${getProfessionName(selectedProfessions.b)}`, panel.x + 40 + tabWidth, y, tabWidth, 42, () => {
    activeProfessionSide = "b";
  }, { active: activeProfessionSide === "b", id: "setup-side-b" });
  y += 62;

  drawListHeader(t("setup.professionHeader", { side: getSideLabel(activeProfessionSide) }), panel.x + 28, y, panel.width - 56);
  y += 30;

  const actionY = panel.y + panel.height - 70;
  const gridGap = 12;
  const gridWidth = panel.width - 56;
  const gridBottom = actionY - 20;
  const columns = panel.width >= 520 ? 3 : 2;
  const activeProfessionIds = getActiveProfessionIds();
  const rows = Math.ceil(activeProfessionIds.length / columns);
  const cellWidth = (gridWidth - gridGap * (columns - 1)) / columns;
  const cellHeight = clamp((gridBottom - y - gridGap * (rows - 1)) / rows, 88, 142);

  activeProfessionIds.forEach((professionId, index) => {
    const column = index % columns;
    const row = Math.floor(index / columns);
    drawProfessionGridItem(
      panel.x + 28 + column * (cellWidth + gridGap),
      y + row * (cellHeight + gridGap),
      cellWidth,
      cellHeight,
      professionId,
    );
  });

  drawButton(t("setup.saveBack"), panel.x + 28, actionY, (panel.width - 68) / 2, 46, () => {
    selectedProfessions = complianceState.saveSelectedProfessions(selectedProfessions);
    setScreen(Screen.MAIN_MENU);
  }, { id: "setup-save-back" });
  drawButton(t("setup.start"), panel.x + 40 + (panel.width - 68) / 2, actionY, (panel.width - 68) / 2, 46, startGame, { id: "setup-start" });
}

function drawSettingsScreen() {
  const panel = getPanelRect(660, 620);
  drawAppTitle(panel.y - 22, t("settings.subtitle"));
  drawPanel(panel);

  let y = panel.y + 28;
  drawPanelTitle(t("settings.languageTitle"), panel.x + 28, y, panel.width - 56);
  y += 36;
  drawLanguageSelector(panel.x + 28, y, panel.width - 56);
  y += 52;
  drawPanelTitle(t("settings.legalTitle"), panel.x + 28, y, panel.width - 56);
  y += 42;
  y = drawWrappedText(
    t("settings.legalInfo", {
      version: LegalConfig.version,
      companyName: LegalConfig.companyName,
      contactEmail: LegalConfig.contactEmail,
    }),
    panel.x + 28,
    y,
    panel.width - 56,
    21,
    COLORS.text,
    15,
  );
  y += 18;

  drawButton(t("settings.privacy"), panel.x + 28, y, (panel.width - 68) / 2, 42, () => openLegalDocument("privacy", Screen.SETTINGS), {
    id: "settings-privacy",
  });
  drawButton(
    t("settings.terms"),
    panel.x + 40 + (panel.width - 68) / 2,
    y,
    (panel.width - 68) / 2,
    42,
    () => openLegalDocument("terms", Screen.SETTINGS),
    { id: "settings-terms" },
  );
  y += 60;

  drawButton(t("settings.restore"), panel.x + 28, y, (panel.width - 68) / 2, 42, restorePurchases, { id: "settings-restore" });
  drawButton(t("settings.withdraw"), panel.x + 40 + (panel.width - 68) / 2, y, (panel.width - 68) / 2, 42, withdrawConsent, {
    id: "settings-withdraw",
  });
  y += 60;

  y = drawWrappedText(
    t("settings.statsInfo", {
      analytics: analytics.enabled ? t("common.enabled") : t("common.unavailable"),
      ads: ads.isAvailable() ? t("common.enabled") : t("common.unavailable"),
      iap: t("common.iap"),
    }),
    panel.x + 28,
    y,
    panel.width - 56,
    21,
    COLORS.text,
    15,
  );
  y += 18;
  drawSmallNotice(panel.x + 28, y, panel.width - 56, serviceMessage || t("settings.sdkNotice"));
  drawButton(t("settings.backMain"), panel.x + 28, panel.y + panel.height - 70, panel.width - 56, 46, () => {
    serviceMessage = "";
    setScreen(Screen.MAIN_MENU);
  }, { id: "settings-back-main" });
}

function drawLegalDocumentScreen() {
  const legalDocument = getLegalDocument(activeLegalDocument, LegalConfig, currentLocale);
  const panel = getPanelRect(760, 620);
  drawAppTitle(panel.y - 22, legalDocument.title);
  drawPanel(panel);

  const headerY = panel.y + 24;
  drawPanelTitle(`${legalDocument.title} v${LegalConfig.version}`, panel.x + 28, headerY, panel.width - 180);
  const backButtonX = isRtlLocale(currentLocale) ? panel.x + 28 : panel.x + panel.width - 128;
  drawButton(t("legal.back"), backButtonX, headerY - 6, 100, 38, () => setScreen(previousScreen), {
    id: "legal-back",
  });

  const textArea = {
    x: panel.x + 28,
    y: panel.y + 78,
    width: panel.width - 56,
    height: panel.height - 172,
  };
  drawDocumentText(legalDocument, textArea);

  const footerY = panel.y + panel.height - 76;
  drawButton(t("legal.pageUp"), panel.x + 28, footerY, 110, 42, () => {
    legalScrollOffset = Math.max(0, legalScrollOffset - 140);
  }, { id: "legal-page-up" });
  drawButton(t("legal.pageDown"), panel.x + 150, footerY, 110, 42, () => {
    legalScrollOffset += 140;
  }, { id: "legal-page-down" });
  drawSmallNotice(panel.x + 280, footerY + 7, panel.width - 308, t("legal.scrollHint"));
}

function drawResultOverlay() {
  ctx.save();
  ctx.fillStyle = "rgba(8, 11, 15, 0.6)";
  ctx.fillRect(0, 0, viewport.width, viewport.height);

  const panelWidth = Math.min(390, viewport.width - 36);
  const panelHeight = 220;
  const panelX = (viewport.width - panelWidth) / 2;
  const panelY = (viewport.height - panelHeight) / 2;

  drawPanel({ x: panelX, y: panelY, width: panelWidth, height: panelHeight });
  ctx.fillStyle = COLORS.text;
  setCanvasDirection(ctx);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = canvasFont(getFittedFontSize(resultMessage, panelWidth - 56, 24, 14, 900), 900);
  ctx.fillText(resultMessage, panelX + panelWidth / 2, panelY + 48);

  const buttonX = panelX + 28;
  let buttonY = panelY + 84;
  drawButton(t("result.again"), buttonX, buttonY, panelWidth - 56, 42, startGame, { id: "result-again" });
  buttonY += 54;
  drawButton(t("result.setup"), buttonX, buttonY, panelWidth - 56, 42, openMatchSetup, { id: "result-setup" });
  buttonY += 54;
  drawButton(t("result.backMain"), buttonX, buttonY, panelWidth - 56, 42, returnToMenu, { id: "result-back-main" });
  ctx.restore();
}

function drawLanguageSelector(x, y, width) {
  const options = isRtlLocale(currentLocale) ? [...getLocaleOptions()].reverse() : getLocaleOptions();
  const gap = 8;
  const buttonWidth = (width - gap * (options.length - 1)) / options.length;

  options.forEach((option, index) => {
    drawButton(option.label, x + index * (buttonWidth + gap), y, buttonWidth, 34, () => setLocale(option.locale), {
      active: currentLocale === option.locale,
      id: `locale-${option.locale}`,
    });
  });
}

function drawSetupSceneRow(x, y, width) {
  const gap = 12;
  const cardWidth = (width - gap * (sceneIds.length - 1)) / sceneIds.length;

  sceneIds.forEach((sceneId, index) => {
    const cardX = x + index * (cardWidth + gap);
    const selected = selectedProfessions.scene === sceneId;
    const iconX = isRtlLocale(currentLocale) ? cardX + cardWidth - 48 : cardX + 16;
    const textX = isRtlLocale(currentLocale) ? cardX + cardWidth - 16 : cardX + 62;
    const textWidth = cardWidth - 78;

    ctx.save();
    drawPixelFrame(cardX, y, cardWidth, 68, {
      fill: selected ? "#12364b" : "#111a2f",
      border: selected ? "#4bcfff" : "#4b5f8a",
      shadow: "#050711",
      texture: selected ? voxelAssets.blocks.glowstone : voxelAssets.blocks.deepslate,
    });
    drawPixelArenaIcon(iconX, y + 18, 32, sceneId);

    ctx.fillStyle = COLORS.muted;
    ctx.font = canvasFont(12, 800);
    setCanvasDirection(ctx);
    ctx.textAlign = getTextAlignStart();
    ctx.textBaseline = "top";
    ctx.fillText(t("setup.sceneLabel"), textX, y + 10);

    ctx.fillStyle = COLORS.text;
    const sceneName = getSceneName(sceneId);
    ctx.font = canvasFont(getFittedFontSize(sceneName, textWidth, 16, 10, 900), 900);
    ctx.fillText(sceneName, textX, y + 26);

    ctx.fillStyle = COLORS.muted;
    ctx.font = canvasFont(12, 700);
    drawSingleLineText(getSceneDescription(sceneId), isRtlLocale(currentLocale) ? cardX + 16 : textX, y + 48, textWidth);
    ctx.restore();

    addInteractiveElement({
      id: `scene-${sceneId}`,
      rect: { x: cardX, y, width: cardWidth, height: 68 },
      action: () => setSelectedScene(sceneId),
    });
  });
}

function drawListHeader(text, x, y, width) {
  ctx.save();
  ctx.fillStyle = COLORS.text;
  ctx.font = canvasFont(getFittedFontSize(text, width, 17, 11, 900), 900);
  setCanvasDirection(ctx);
  ctx.textAlign = getTextAlignStart();
  ctx.textBaseline = "top";
  ctx.fillText(text, getTextStartX(x, width), y);

  ctx.restore();
}

function drawProfessionGridItem(x, y, width, height, professionId) {
  const isSelected = selectedProfessions[activeProfessionSide] === professionId;
  const sideLabel = getSideLabel(activeProfessionSide);
  const professionName = getProfessionName(professionId);

  ctx.save();
  drawPixelFrame(x, y, width, height, {
    fill: isSelected ? "#384f2b" : "#202834",
    border: isSelected ? "#d9aa55" : "#5c6462",
    shadow: "#050711",
    texture: isSelected ? voxelAssets.blocks.grassDark : voxelAssets.blocks.deepslate,
  });

  const iconSize = Math.min(64, Math.max(40, Math.min(height - 54, width * 0.42)));
  drawPixelProfessionIcon(x + (width - iconSize) / 2, y + 16, iconSize, professionId, isSelected);

  ctx.fillStyle = COLORS.text;
  ctx.font = canvasFont(getFittedFontSize(professionName, width - 18, width < 150 ? 15 : 17, 10, 900), 900);
  setCanvasDirection(ctx);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(professionName, x + width / 2, y + height - 24);

  if (isSelected) {
    ctx.fillStyle = "#d9aa55";
    ctx.fillRect(x + width - 22, y + 8, 12, 12);
    ctx.fillStyle = "#20160c";
    ctx.fillRect(x + width - 19, y + 11, 6, 6);
  }
  ctx.restore();

  addInteractiveElement({
    id: `profession-${activeProfessionSide}-${professionId}`,
    rect: { x, y, width, height },
    action: () => {
      selectedProfessions = {
        ...selectedProfessions,
        [activeProfessionSide]: professionId,
      };
      serviceMessage = t("messages.selectedProfession", { side: sideLabel, profession: professionName });
    },
  });
}

function drawPixelArenaIcon(x, y, size, sceneId = selectedProfessions.scene) {
  const cell = Math.max(2, Math.floor(size / 8));
  const iconSize = cell * 8;
  drawTiledVoxelTexture(ctx, sceneId === "super" ? voxelAssets.blocks.obsidian : voxelAssets.blocks.grass, x, y, iconSize, iconSize, cell * 4);
  ctx.strokeStyle = "#171324";
  ctx.lineWidth = cell;
  ctx.strokeRect(x + cell / 2, y + cell / 2, iconSize - cell, iconSize - cell);
  ctx.fillStyle = sceneId === "super" ? "rgba(75, 207, 255, 0.36)" : "rgba(52, 38, 20, 0.38)";
  for (let index = 2; index < 7; index += 2) {
    ctx.fillRect(x + index * cell, y + cell, cell, iconSize - cell * 2);
    ctx.fillRect(x + cell, y + index * cell, iconSize - cell * 2, cell);
  }
  ctx.fillStyle = sceneId === "super" ? "#ff6b24" : SIDE_VISUAL_CONFIG.A.color;
  ctx.fillRect(x + cell * 2, y + cell * 2, cell * 2, cell * 2);
  ctx.fillStyle = sceneId === "super" ? "#8be8ff" : SIDE_VISUAL_CONFIG.B.color;
  ctx.fillRect(x + cell * 5, y + cell * 5, cell * 2, cell * 2);
}

function drawPixelProfessionIcon(x, y, size, professionId, isSelected) {
  const config = ProfessionConfig[professionId];
  const cell = Math.max(3, Math.floor(size / 16));
  const iconSize = cell * 16;
  const left = Math.round(x + (size - iconSize) / 2);
  const top = Math.round(y + (size - iconSize) / 2);
  const body = config.color;
  const accent = config.accentColor;
  const outline = "#050711";

  ctx.fillStyle = isSelected ? "#26395f" : "#0d1427";
  ctx.fillRect(left, top, iconSize, iconSize);
  ctx.fillStyle = "#34466f";
  ctx.fillRect(left + cell, top + cell, iconSize - cell * 2, iconSize - cell * 2);
  ctx.fillStyle = "#0d1427";
  ctx.fillRect(left + cell * 2, top + cell * 2, iconSize - cell * 4, iconSize - cell * 4);

  drawPixelCells(left, top, cell, [
    ".....OOOOOO.....",
    "...OOOOOOOOOO...",
    "..OOOOOOOOOOOO..",
    ".OOOOOOOOOOOOOO.",
    ".OOOOOOOOOOOOOO.",
    "OOOOOOOOOOOOOOOO",
    "OOOOOOOOOOOOOOOO",
    "OOOOOOOOOOOOOOOO",
    "OOOOOOOOOOOOOOOO",
    ".OOOOOOOOOOOOOO.",
    ".OOOOOOOOOOOOOO.",
    "..OOOOOOOOOOOO..",
    "...OOOOOOOOOO...",
    ".....OOOOOO.....",
  ], {
    O: outline,
  });

  drawPixelCells(left, top, cell, [
    ".....BBBBBB.....",
    "...BBBBBBBBBB...",
    "..BBBBBBBBBBBB..",
    ".BBBBBBBBBBBBBB.",
    ".BBBBBBBBBBBBBB.",
    "BBBBBBBBBBBBBBBB",
    "BBBBBBBBBBBBBBBB",
    "BBBBBBBBBBBBBBBB",
    "BBBBBBBBBBBBBBBB",
    ".BBBBBBBBBBBBBB.",
    ".BBBBBBBBBBBBBB.",
    "..BBBBBBBBBBBB..",
    "...BBBBBBBBBB...",
    ".....BBBBBB.....",
  ], {
    B: body,
  });

  drawPixelCells(left, top, cell, [
    "....HHH.......",
    "...HHHH.......",
    "..HHH.........",
    "..HH..........",
  ], {
    H: accent,
  });

  if (professionId === "bat") {
    drawPixelCells(left, top, cell, [
      "................",
      "..WW........WW..",
      ".WWW........WWW.",
      "WWWW..FFFF..WWWW",
      ".WWW..F..F..WWW.",
      "..WW........WW..",
      "................",
    ], {
      W: "#ffd9f1",
      F: "#f8fbff",
    });
  } else if (professionId === "venom") {
    drawPixelCells(left, top, cell, [
      "................",
      "......SS........",
      "...S..SS..S.....",
      "..SS......SS....",
      ".....VVVV.......",
      "...VVVVVVVV.....",
    ], {
      S: "#caff70",
      V: "#145c2d",
    });
  } else if (professionId === "spider") {
    drawPixelCells(left, top, cell, [
      "................",
      "..L..L..L..L....",
      "...L.L..L.L.....",
      "....LLLLLL......",
      "...L.L..L.L.....",
      "..L..L..L..L....",
    ], {
      L: "#f0d7ff",
    });
  } else if (professionId === "lava") {
    drawPixelCells(left, top, cell, [
      "................",
      ".....FFFF.......",
      "....FOOOF.......",
      "...FOYYYYF......",
      "....FOOOF.......",
      ".....FFFF.......",
    ], {
      F: "#9f2d17",
      O: "#ff6b24",
      Y: "#ffd166",
    });
  } else if (professionId === "reaper") {
    drawPixelCells(left, top, cell, [
      "................",
      "..........SSSS..",
      "........SS......",
      "......SS........",
      "....SS..........",
      "...S............",
      "..S.............",
    ], {
      S: "#e6f0ff",
    });
  } else if (professionId === "frost") {
    drawPixelCells(left, top, cell, [
      "................",
      "....I......I....",
      "......IIII......",
      "...IIIIIIIIII...",
      "......IIII......",
      "....I......I....",
    ], {
      I: "#f8fbff",
    });
  } else if (professionId === "spear") {
    drawPixelCells(left, top, cell, [
      "................",
      "................",
      "................",
      ".............AAA",
      "...........AAAA.",
      ".........AAAA...",
      ".......AAAA.....",
      ".....AAAA.......",
      "...AAAA.........",
      ".AAAA...........",
      "AAA.............",
    ], {
      A: "#f8fbff",
    });
  } else if (professionId === "assassin") {
    drawPixelCells(left, top, cell, [
      "................",
      "................",
      "...AA......AA...",
      "..AAA......AAA..",
      "..AA........AA..",
      "...AA......AA...",
      "....AA....AA....",
      ".....AA..AA.....",
      "......AAAA......",
      "................",
    ], {
      A: "#ffe5ff",
    });
  } else if (professionId === "blade") {
    drawPixelCells(left, top, cell, [
      "................",
      "..........AAA...",
      ".........AAAA...",
      "........AAAA....",
      ".......AAAA.....",
      "......AAAA......",
      ".....AAAA.......",
      "....AAAA........",
      "...AAAA.........",
      "...AAA..........",
      "...AA...........",
    ], {
      A: "#ffe66d",
    });
  } else if (professionId === "archer") {
    drawPixelCells(left, top, cell, [
      "................",
      "..........AA....",
      "........A.AA....",
      "......A...AA....",
      "....A.....AA....",
      "..A.......AA....",
      "....A.....AA....",
      "......A...AA....",
      "........A.AA....",
      "..........AA....",
    ], {
      A: "#ecffd8",
    });
  } else if (professionId === "chain") {
    drawPixelCells(left, top, cell, [
      "................",
      "..C.............",
      "...C............",
      "....C...........",
      ".....C..........",
      "......C.........",
      ".......C........",
      "........HHH.....",
      "........HHH.....",
      "........HHH.....",
    ], {
      C: "#f4f6ff",
      H: "#c5c7d4",
    });
  } else if (professionId === "mage") {
    drawPixelCells(left, top, cell, [
      "................",
      "...M........F...",
      "....M......F....",
      ".....M....F.....",
      "......MMMM......",
      ".......MM.......",
      "......IIII......",
      ".....I....I.....",
      "....I......I....",
    ], {
      M: "#f3e8ff",
      F: "#ff6b3d",
      I: "#9ff7ff",
    });
  } else if (professionId === "shield") {
    drawPixelCells(left, top, cell, [
      "................",
      "................",
      "....SSSSSS......",
      "...SSSSSSSS.....",
      "...SSSSSSSS.....",
      "...SSSSSSSS.....",
      "....SSSSSS......",
      ".....SSSS.......",
      "......SS........",
    ], {
      S: "#b5ffd6",
    });
  }

  const itemSprite = getProfessionItemSprite(professionId);
  if (itemSprite) {
    drawVoxelSpriteCentered(ctx, itemSprite.sprite, { x: left + iconSize / 2, y: top + iconSize * 0.58 }, iconSize * itemSprite.scale, {
      angle: itemSprite.angle,
      shadowOffset: cell,
    });
  }
}

function getProfessionItemSprite(professionId) {
  const items = voxelAssets.items;
  const itemMap = {
    bat: null,
    venom: null,
    spider: null,
    lava: null,
    reaper: { sprite: items.sword, angle: -0.78, scale: 0.92 },
    frost: { sprite: items.iceShard, angle: -0.38, scale: 0.62 },
    spear: { sprite: items.spear, angle: -0.78, scale: 0.9 },
    assassin: { sprite: items.dagger, angle: -0.72, scale: 0.72 },
    blade: { sprite: items.sword, angle: -0.72, scale: 0.78 },
    archer: { sprite: items.bow, angle: 0, scale: 0.7 },
    shield: { sprite: items.shield, angle: 0, scale: 0.56 },
    chain: { sprite: items.flail, angle: 0, scale: 0.58 },
    mage: { sprite: items.staff, angle: -0.58, scale: 0.96 },
  };

  return itemMap[professionId] || null;
}

function drawPixelCells(x, y, cell, rows, palette) {
  rows.forEach((row, rowIndex) => {
    for (let column = 0; column < row.length; column += 1) {
      const color = palette[row[column]];
      if (color) {
        ctx.fillStyle = color;
        ctx.fillRect(x + column * cell, y + rowIndex * cell, cell, cell);
      }
    }
  });
}

function drawDocumentText(document, area) {
  const lines = [];
  const textWidth = area.width - 28;
  for (const section of document.sections) {
    lines.push({ text: section.title, title: true });
    lines.push(...wrapTextLines(section.body, textWidth, canvasFont(14, 600)).map((text) => ({ text })));
    lines.push({ text: "", spacer: true });
  }

  const lineHeight = 21;
  const maxScroll = Math.max(0, lines.length * lineHeight - area.height + 20);
  legalScrollOffset = clamp(legalScrollOffset, 0, maxScroll);

  ctx.save();
  ctx.rect(area.x, area.y, area.width, area.height);
  ctx.clip();
  ctx.fillStyle = "#0c1324";
  ctx.fillRect(area.x, area.y, area.width, area.height);
  ctx.strokeStyle = "#4b5f8a";
  ctx.lineWidth = 3;
  ctx.strokeRect(area.x + 1.5, area.y + 1.5, area.width - 3, area.height - 3);

  let y = area.y + 14 - legalScrollOffset;
  for (const line of lines) {
    if (y > area.y - lineHeight && y < area.y + area.height + lineHeight) {
      ctx.fillStyle = line.title ? COLORS.text : COLORS.muted;
      ctx.font = line.title ? canvasFont(15, 900) : canvasFont(14, 600);
      setCanvasDirection(ctx);
      ctx.textAlign = getTextAlignStart();
      ctx.textBaseline = "top";
      ctx.fillText(line.text, getTextStartX(area.x + 14, textWidth), y);
    }
    y += line.spacer ? 12 : lineHeight;
  }
  ctx.restore();
}

function drawAppTitle(y, subtitle) {
  ctx.save();
  setCanvasDirection(ctx);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#050711";
  ctx.font = canvasFont(clamp(viewport.width * 0.04, 24, 34), 900);
  ctx.fillText(t("app.name"), viewport.width / 2 + 3, Math.max(36, y) + 3);
  ctx.fillStyle = COLORS.text;
  ctx.fillText(t("app.name"), viewport.width / 2, Math.max(36, y));
  ctx.fillStyle = COLORS.muted;
  ctx.font = canvasFont(14, 700);
  ctx.fillText(subtitle, viewport.width / 2, Math.max(64, y + 30));
  ctx.restore();
}

function drawPanel(rect) {
  drawPixelFrame(rect.x, rect.y, rect.width, rect.height, {
    fill: COLORS.panel,
    border: COLORS.panelBorder,
    shadow: "#050711",
    texture: voxelAssets.blocks.stone,
  });
}

function drawPixelFrame(x, y, width, height, options = {}) {
  const fill = options.fill || COLORS.panel;
  const border = options.border || COLORS.panelBorder;
  const shadow = options.shadow || "#050711";
  const inset = options.inset || "rgba(255, 246, 214, 0.24)";

  ctx.save();
  ctx.fillStyle = shadow;
  ctx.fillRect(x + 6, y + 6, width, height);
  drawTiledVoxelTexture(ctx, options.texture || voxelAssets.blocks.deepslate, x, y, width, height, 28);
  ctx.globalAlpha = options.texture ? 0.76 : 1;
  ctx.fillStyle = fill;
  ctx.fillRect(x, y, width, height);
  ctx.globalAlpha = 1;
  ctx.lineWidth = 3;
  ctx.strokeStyle = "#050711";
  ctx.strokeRect(x + 1.5, y + 1.5, width - 3, height - 3);
  ctx.lineWidth = 2;
  ctx.strokeStyle = border;
  ctx.strokeRect(x + 5, y + 5, width - 10, height - 10);
  ctx.fillStyle = inset;
  ctx.fillRect(x + 8, y + 8, Math.max(0, width - 16), 2);
  ctx.fillRect(x + 8, y + 8, 2, Math.max(0, height - 16));
  ctx.restore();
}

function drawPanelTitle(text, x, y, width = 0) {
  const textX = width > 0 ? getTextStartX(x, width) : x;
  const align = width > 0 ? getTextAlignStart() : "left";

  ctx.save();
  setCanvasDirection(ctx);
  ctx.fillStyle = "#050711";
  ctx.font = canvasFont(getFittedFontSize(text, width || 360, 22, 13, 900), 900);
  ctx.textAlign = align;
  ctx.textBaseline = "top";
  ctx.fillText(text, textX + (isRtlLocale(currentLocale) && width > 0 ? -2 : 2), y + 2);
  ctx.fillStyle = COLORS.text;
  ctx.fillText(text, textX, y);
  ctx.restore();
}

function drawButton(label, x, y, width, height, action, options = {}) {
  const isPressed = pointerDownElementId === options.id || pointerDownElementId === label;
  const disabled = Boolean(options.disabled);
  const active = Boolean(options.active);

  ctx.save();
  const fill = disabled ? "#4d5575" : active ? "#1f4f70" : isPressed ? "#fff6d6" : COLORS.button;
  const border = active ? SIDE_VISUAL_CONFIG.A.accentColor : "#050711";
  drawPixelFrame(x, y, width, height, {
    fill,
    border,
    shadow: "#050711",
    inset: active ? "#37d7ff" : "#fff6d6",
    texture: active ? voxelAssets.blocks.glowstone : disabled ? voxelAssets.blocks.stone : voxelAssets.blocks.plank,
  });
  ctx.fillStyle = disabled || active ? COLORS.text : COLORS.buttonText;
  ctx.font = canvasFont(getFittedFontSize(label, width - 16, 16, 10, 900), 900);
  setCanvasDirection(ctx);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, x + width / 2, y + height / 2);
  ctx.restore();

  if (!disabled) {
    addInteractiveElement({
      id: options.id || label,
      rect: { x, y, width, height },
      action,
    });
  }
}

function drawCheckbox(label, x, y, width, checked, action) {
  const boxSize = 24;
  const boxX = isRtlLocale(currentLocale) ? x + width - boxSize : x;
  const textX = isRtlLocale(currentLocale) ? boxX - 12 : x + boxSize + 12;
  const textWidth = width - boxSize - 12;

  ctx.save();
  drawPixelFrame(boxX, y, boxSize, boxSize, {
    fill: checked ? SIDE_VISUAL_CONFIG.A.color : "#121a2f",
    border: checked ? SIDE_VISUAL_CONFIG.A.accentColor : "#4b5f8a",
    shadow: "#050711",
  });

  if (checked) {
    ctx.fillStyle = "#050711";
    ctx.fillRect(boxX + 6, y + 12, 4, 4);
    ctx.fillRect(boxX + 10, y + 16, 4, 4);
    ctx.fillRect(boxX + 14, y + 8, 4, 8);
    ctx.fillRect(boxX + 18, y + 4, 4, 4);
  }

  ctx.fillStyle = COLORS.text;
  ctx.font = canvasFont(getFittedFontSize(label, textWidth, 15, 10, 800), 800);
  setCanvasDirection(ctx);
  ctx.textAlign = getTextAlignStart();
  ctx.textBaseline = "middle";
  ctx.fillText(label, textX, y + boxSize / 2);
  ctx.restore();

  addInteractiveElement({
    id: `checkbox-${label}`,
    rect: { x, y: y - 8, width, height: boxSize + 16 },
    action,
  });
}

function drawSmallNotice(x, y, width, text) {
  drawWrappedText(text, x, y, width, 18, COLORS.muted, 12);
}

function drawWrappedText(text, x, y, maxWidth, lineHeight, color, fontSize) {
  const lines = wrapTextLines(text, maxWidth, canvasFont(fontSize, 700));

  ctx.save();
  ctx.fillStyle = color;
  ctx.font = canvasFont(fontSize, 700);
  setCanvasDirection(ctx);
  ctx.textAlign = getTextAlignStart();
  ctx.textBaseline = "top";
  for (const line of lines) {
    ctx.fillText(line, getTextStartX(x, maxWidth), y);
    y += lineHeight;
  }
  ctx.restore();

  return y;
}

function drawSingleLineText(text, x, y, maxWidth) {
  const ellipsis = "...";
  let visibleText = String(text);

  while (visibleText.length > 0 && ctx.measureText(visibleText).width > maxWidth) {
    visibleText = visibleText.slice(0, -1);
  }

  if (visibleText.length < String(text).length) {
    while (visibleText.length > 0 && ctx.measureText(`${visibleText}${ellipsis}`).width > maxWidth) {
      visibleText = visibleText.slice(0, -1);
    }
    visibleText = `${visibleText}${ellipsis}`;
  }

  setCanvasDirection(ctx);
  ctx.fillText(visibleText, getTextStartX(x, maxWidth), y);
}

function wrapTextLines(text, maxWidth, font) {
  ctx.save();
  ctx.font = font;
  const lines = [];
  const paragraphs = String(text).split("\n");

  for (const paragraph of paragraphs) {
    if (paragraph.includes(" ")) {
      lines.push(...wrapWords(paragraph, maxWidth));
      continue;
    }

    let line = "";
    for (const char of paragraph) {
      const nextLine = line + char;
      if (line && ctx.measureText(nextLine).width > maxWidth) {
        lines.push(line);
        line = char;
      } else {
        line = nextLine;
      }
    }
    lines.push(line);
  }

  ctx.restore();
  return lines;
}

function wrapWords(paragraph, maxWidth) {
  const words = paragraph.split(/(\s+)/).filter((word) => word.length > 0);
  const lines = [];
  let line = "";

  for (const word of words) {
    const nextLine = `${line}${word}`;
    if (line.trim() && ctx.measureText(nextLine).width > maxWidth) {
      lines.push(line.trimEnd());
      line = word.trimStart();
    } else {
      line = nextLine;
    }
  }

  lines.push(line.trimEnd());
  return lines;
}

function getPanelRect(maxWidth, maxHeight) {
  const content = layout.content;
  const width = Math.min(maxWidth, content.width);
  const height = Math.min(maxHeight, content.height - 8);
  return {
    x: content.x + (content.width - width) / 2,
    y: content.y + (content.height - height) / 2 + 18,
    width,
    height,
  };
}

function addInteractiveElement(element) {
  interactiveElements.push(element);
}

function getInteractiveElementAt(point) {
  for (let index = interactiveElements.length - 1; index >= 0; index -= 1) {
    const element = interactiveElements[index];
    if (isInsideRect(point, element.rect)) {
      return element;
    }
  }

  return null;
}

function drawBallBody(ctx, ball) {
  const cell = Math.max(4, Math.floor((ball.radius * 2) / 12));
  const spriteSize = cell * 12;
  const x = Math.round(ball.position.x - spriteSize / 2);
  const y = Math.round(ball.position.y - spriteSize / 2);

  ctx.save();
  drawPixelCells(x + cell, y + cell, cell, [
    "..OOOOOO..",
    ".OOOOOOOO.",
    "OOOOOOOOOO",
    "OOOOOOOOOO",
    "OOOOOOOOOO",
    "OOOOOOOOOO",
    "OOOOOOOOOO",
    "OOOOOOOOOO",
    ".OOOOOOOO.",
    "..OOOOOO..",
  ], {
    O: "#050711",
  });

  drawPixelCells(x, y, cell, [
    "...BBBBBB...",
    "..BBBBBBBB..",
    ".BBBBBBBBBB.",
    "BBBBBBBBBBBB",
    "BBBBBBBBBBBB",
    "BBBBBBBBBBBB",
    "BBBBBBBBBBBB",
    "BBBBBBBBBBBB",
    "BBBBBBBBBBBB",
    ".BBBBBBBBBB.",
    "..BBBBBBBB..",
    "...BBBBBB...",
  ], {
    B: ball.visual.color,
  });

  drawPixelCells(x, y, cell, [
    "...HHH......",
    "..HHHH......",
    ".HHH........",
    ".HH.........",
  ], {
    H: ball.visual.accentColor,
  });

  if (ball.hitFlashTime > 0) {
    ctx.globalAlpha = clamp(ball.hitFlashTime / 0.16, 0, 1) * 0.45;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(x + cell * 2, y + cell * 2, cell * 8, cell * 8);
  }
  drawProfessionBodyDetails(ctx, ball, x, y, cell);
  ctx.restore();
}

function drawProfessionBodyDetails(ctx, ball, x, y, cell) {
  if (ball.profession === "bat") {
    ctx.fillStyle = "#f8fbff";
    ctx.fillRect(x + cell * 5, y + cell * 7, cell, cell * 2);
    ctx.fillRect(x + cell * 7, y + cell * 7, cell, cell * 2);
    ctx.fillStyle = "#ffd9f1";
    ctx.fillRect(x + cell * 3, y + cell * 4, cell * 2, cell);
    ctx.fillRect(x + cell * 7, y + cell * 4, cell * 2, cell);
  } else if (ball.profession === "venom") {
    ctx.fillStyle = "#caff70";
    ctx.fillRect(x + cell * 4, y + cell * 3, cell, cell);
    ctx.fillRect(x + cell * 8, y + cell * 5, cell, cell);
    ctx.fillRect(x + cell * 5, y + cell * 8, cell * 2, cell);
  } else if (ball.profession === "lava") {
    ctx.fillStyle = "#ffd166";
    ctx.fillRect(x + cell * 5, y + cell * 3, cell, cell * 6);
    ctx.fillRect(x + cell * 3, y + cell * 6, cell * 6, cell);
  } else if (ball.profession === "reaper") {
    ctx.fillStyle = "#e6f0ff";
    ctx.fillRect(x + cell * 4, y + cell * 4, cell * 4, cell);
    ctx.fillStyle = "#050711";
    ctx.fillRect(x + cell * 5, y + cell * 5, cell * 2, cell * 2);
  } else if (ball.profession === "frost") {
    ctx.strokeStyle = "#f8fbff";
    ctx.lineWidth = Math.max(2, cell);
    ctx.strokeRect(x + cell * 3, y + cell * 3, cell * 6, cell * 6);
  }
}

function drawWeapon(ctx, ball, currentTime, target) {
  const direction = getWeaponDirection(ball, target);
  const progress = getAttackProgress(ball, currentTime);

  if (ball.profession === "bat") {
    drawBatWingWeapon(ctx, ball, direction, progress);
    return;
  }

  if (ball.profession === "venom") {
    drawVenomSpikeWeapon(ctx, ball, direction, progress);
    return;
  }

  if (ball.profession === "spider") {
    drawSpiderLegWeapon(ctx, ball, direction, progress);
    return;
  }

  if (ball.profession === "lava") {
    drawLavaCoreWeapon(ctx, ball, direction, progress);
    return;
  }

  if (ball.profession === "reaper") {
    drawReaperWeapon(ctx, ball, currentTime);
    return;
  }

  if (ball.profession === "frost") {
    drawFrostOrbits(ctx, ball);
    return;
  }

  if (ball.profession === "assassin") {
    drawDualBladeWeapon(ctx, ball, direction, progress);
    return;
  }

  if (ball.profession === "blade") {
    drawBladeWeapon(ctx, ball, direction, progress);
    return;
  }

  if (ball.profession === "archer") {
    drawBowWeapon(ctx, ball, direction, progress);
    return;
  }

  if (ball.profession === "shield") {
    drawShieldWeapon(ctx, ball, direction, progress);
    return;
  }

  if (ball.profession === "chain") {
    drawChainWeapon(ctx, ball, direction, progress);
    return;
  }

  if (ball.profession === "mage") {
    drawMageWeapon(ctx, ball, direction, progress);
    return;
  }

  drawSpearWeapon(ctx, ball, direction, progress);
}

function drawBatWingWeapon(ctx, ball, direction, progress) {
  const flap = progress === null ? 0.25 + Math.sin(elapsedTimeSeconds * 8) * 0.12 : 0.56;
  const side = { x: -direction.y, y: direction.x };
  const back = add(ball.position, scale(direction, -ball.radius * 0.25));

  ctx.save();
  for (const sign of [-1, 1]) {
    const root = add(back, scale(side, sign * ball.radius * 0.38));
    const wingTip = add(root, add(scale(side, sign * ball.radius * 1.3), scale(direction, -ball.radius * flap)));
    const wingBottom = add(root, add(scale(side, sign * ball.radius * 0.72), scale(direction, ball.radius * 0.55)));
    ctx.fillStyle = "#050711";
    ctx.beginPath();
    moveToVector(ctx, snapVector(root, 4));
    lineToVector(ctx, snapVector(wingTip, 4));
    lineToVector(ctx, snapVector(wingBottom, 4));
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "rgba(255, 217, 241, 0.76)";
    ctx.fillRect(wingTip.x - 5, wingTip.y - 5, 10, 10);
  }
  const fangBase = add(ball.position, scale(direction, ball.radius * 0.72));
  ctx.fillStyle = "#f8fbff";
  ctx.fillRect(fangBase.x - 9, fangBase.y - 4, 6, 12);
  ctx.fillRect(fangBase.x + 3, fangBase.y - 4, 6, 12);
  ctx.restore();
}

function drawVenomSpikeWeapon(ctx, ball, direction, progress) {
  const pulse = progress === null ? 0.4 : 0.8;
  ctx.save();
  ctx.fillStyle = "#caff70";
  for (let index = 0; index < 6; index += 1) {
    const angle = (index * Math.PI * 2) / 6 + elapsedTimeSeconds * 0.8;
    const spike = add(ball.position, scale(vectorFromAngle(angle), ball.radius * (0.92 + pulse * 0.18)));
    ctx.fillRect(spike.x - 4, spike.y - 4, 8, 8);
  }
  ctx.restore();
}

function drawSpiderLegWeapon(ctx, ball, direction, progress) {
  const baseAngle = angleOf(direction);
  const reach = ball.radius * (1.05 + (progress === null ? 0 : progress * 0.2));

  ctx.save();
  ctx.strokeStyle = "#050711";
  ctx.lineWidth = 7;
  for (const sign of [-1, 1]) {
    for (const offset of [0.65, 1.05, 1.45]) {
      const legDirection = vectorFromAngle(baseAngle + sign * offset);
      const start = add(ball.position, scale(legDirection, ball.radius * 0.45));
      const knee = add(ball.position, scale(legDirection, reach));
      const foot = add(knee, scale({ x: -legDirection.y, y: legDirection.x }, sign * 12));
      ctx.beginPath();
      moveToVector(ctx, snapVector(start, 4));
      lineToVector(ctx, snapVector(knee, 4));
      lineToVector(ctx, snapVector(foot, 4));
      ctx.stroke();
    }
  }
  ctx.strokeStyle = "#f0d7ff";
  ctx.lineWidth = 3;
  ctx.strokeRect(ball.position.x - ball.radius - 8, ball.position.y - ball.radius - 8, (ball.radius + 8) * 2, (ball.radius + 8) * 2);
  ctx.restore();
}

function drawLavaCoreWeapon(ctx, ball, direction, progress) {
  const heat = progress === null ? 0.35 + Math.sin(elapsedTimeSeconds * 9) * 0.14 : 0.72;

  ctx.save();
  ctx.globalAlpha = 0.5;
  ctx.fillStyle = "#ff2f16";
  ctx.fillRect(ball.position.x - ball.radius * heat, ball.position.y - ball.radius * heat, ball.radius * heat * 2, ball.radius * heat * 2);
  ctx.globalAlpha = 1;
  ctx.fillStyle = "#ffd166";
  const ember = add(ball.position, scale(direction, ball.radius * 0.96));
  ctx.fillRect(ember.x - 6, ember.y - 6, 12, 12);
  ctx.restore();
}

function drawDualBladeWeapon(ctx, ball, direction, progress) {
  const baseAngle = angleOf(direction);
  const swing = progress === null ? 0.34 : lerp(-0.72, 0.72, easeOutCubic(progress));

  ctx.save();
  ctx.lineCap = "butt";
  ctx.lineJoin = "miter";
  for (const side of [-1, 1]) {
    const angle = baseAngle + side * (0.55 + swing * 0.36);
    const bladeDirection = vectorFromAngle(angle);
    const sideVector = vectorFromAngle(baseAngle + side * Math.PI * 0.5);
    const start = snapVector(add(add(ball.position, scale(sideVector, ball.radius * 0.42)), scale(direction, ball.radius * 0.2)), 4);
    const end = snapVector(add(start, scale(bladeDirection, ball.radius + ball.weaponRange * 0.72)), 4);

    ctx.strokeStyle = "#050711";
    ctx.lineWidth = 11;
    ctx.beginPath();
    moveToVector(ctx, start);
    lineToVector(ctx, end);
    ctx.stroke();

    ctx.strokeStyle = ball.visual.accentColor;
    ctx.lineWidth = 5;
    ctx.beginPath();
    moveToVector(ctx, start);
    lineToVector(ctx, end);
    ctx.stroke();

    const guard = add(start, scale(sideVector, side * 6));
    ctx.fillStyle = "#ffe66d";
    ctx.fillRect(guard.x - 5, guard.y - 5, 10, 10);
    drawRotatedVoxelSprite(ctx, voxelAssets.items.dagger, start, length(subtract(end, start)) + 12, angle, {
      anchorX: 0,
      anchorY: 0.5,
      shadow: false,
    });
  }
  ctx.restore();
}

function drawSpearWeapon(ctx, ball, direction, progress) {
  const hitFrame = ball.attackState?.hitFrame || ATTACK_ANIMATION_CONFIG.default.hitFrame;
  const extension = progress === null ? 1 : getThrustExtension(progress, hitFrame);
  const weaponStart = snapVector(add(ball.position, scale(direction, ball.radius * 0.52)), 4);
  const weaponEnd = snapVector(add(ball.position, scale(direction, ball.radius + ball.weaponRange * extension)), 4);
  const spearTip = snapVector(add(weaponEnd, scale(direction, 10)), 4);
  const spearLength = length(subtract(spearTip, weaponStart));

  ctx.save();
  drawRotatedVoxelSprite(ctx, voxelAssets.items.spear, weaponStart, spearLength, angleOf(direction), {
    anchorX: 0,
    anchorY: 0.5,
    alpha: progress === null ? 0.9 : 1,
    shadowOffset: 4,
  });

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
  const weaponStart = snapVector(add(ball.position, scale(bladeDirection, ball.radius * 0.46)), 4);
  const weaponEnd = snapVector(add(ball.position, scale(bladeDirection, ball.radius + ball.weaponRange * 0.92)), 4);

  ctx.save();
  ctx.lineCap = "butt";
  ctx.lineJoin = "miter";
  ctx.strokeStyle = "#050711";
  ctx.lineWidth = 18;
  ctx.beginPath();
  moveToVector(ctx, weaponStart);
  lineToVector(ctx, weaponEnd);
  ctx.stroke();
  ctx.strokeStyle = ball.visual.accentColor;
  ctx.lineWidth = 12;
  ctx.globalAlpha = 0.9;
  ctx.beginPath();
  moveToVector(ctx, weaponStart);
  lineToVector(ctx, weaponEnd);
  ctx.stroke();

  const hilt = snapVector(add(ball.position, scale(bladeDirection, ball.radius * 0.34)), 4);
  ctx.fillStyle = "#050711";
  ctx.fillRect(hilt.x - 8, hilt.y - 8, 16, 16);
  ctx.fillStyle = "#ff7b54";
  ctx.fillRect(hilt.x - 5, hilt.y - 5, 10, 10);
  drawRotatedVoxelSprite(ctx, voxelAssets.items.sword, hilt, length(subtract(weaponEnd, hilt)) + 20, bladeAngle, {
    anchorX: 0,
    anchorY: 0.5,
    shadow: false,
  });

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

function drawShieldWeapon(ctx, ball, direction, progress) {
  const extension = progress === null ? 0.72 : lerp(0.72, 1.08, easeOutCubic(progress));
  const center = snapVector(add(ball.position, scale(direction, ball.radius * extension)), 4);
  const side = { x: -direction.y, y: direction.x };
  const shieldWidth = ball.radius * 1.35;

  ctx.save();
  drawVoxelSpriteCentered(ctx, voxelAssets.items.shield, center, shieldWidth, {
    angle: angleOf(direction),
    shadowOffset: 4,
  });

  if (progress !== null) {
    const edge = add(center, scale(direction, shieldWidth * 0.52));
    ctx.fillStyle = "rgba(198, 255, 240, 0.62)";
    ctx.fillRect(edge.x - side.x * shieldWidth * 0.38 - 5, edge.y - side.y * shieldWidth * 0.38 - 5, 10, 10);
    ctx.fillRect(edge.x + side.x * shieldWidth * 0.38 - 5, edge.y + side.y * shieldWidth * 0.38 - 5, 10, 10);
  }
  ctx.restore();
}

function drawBowWeapon(ctx, ball, direction, progress) {
  const hitFrame = ball.attackState?.hitFrame || ATTACK_ANIMATION_CONFIG.archer.hitFrame;
  const pullProgress = progress === null ? 0 : progress < hitFrame ? clamp(progress / hitFrame, 0, 1) : 0;
  const bowCenter = add(ball.position, scale(direction, ball.radius * 0.72));
  const drawPoint = snapVector(add(ball.position, scale(direction, ball.radius * lerp(0.08, -0.22, pullProgress))), 4);
  const arrowEnd = snapVector(add(ball.position, scale(direction, ball.radius + 42)), 4);
  const showNockedArrow = progress === null || progress < hitFrame;

  ctx.save();
  drawRotatedVoxelSprite(ctx, voxelAssets.items.bow, bowCenter, ball.radius * 1.75, angleOf(direction), {
    anchorX: 0.52,
    anchorY: 0.5,
    shadowOffset: 4,
  });

  if (showNockedArrow) {
    drawRotatedVoxelSprite(ctx, voxelAssets.items.arrow, arrowEnd, length(subtract(arrowEnd, drawPoint)), angleOf(direction), {
      anchorX: 1,
      anchorY: 0.5,
      shadowOffset: 3,
    });
  }
  ctx.restore();
}

function drawProjectiles(ctx) {
  for (const projectile of projectiles) {
    drawProjectile(ctx, projectile);
  }
}

function drawProjectile(ctx, projectile) {
  if (projectile.kind === "fire") {
    drawFireballProjectile(ctx, projectile);
    return;
  }

  if (projectile.kind === "ice") {
    drawIceShardProjectile(ctx, projectile);
    return;
  }

  drawArrowProjectile(ctx, projectile);
}

function drawArrowProjectile(ctx, projectile) {
  ctx.save();
  ctx.globalAlpha = 0.34;
  drawPixelLine(
    ctx,
    snapVector(projectile.previousPosition, 4),
    snapVector(add(projectile.position, scale(projectile.direction, -projectile.shaftLength)), 4),
    7,
    "#d9f4c7",
  );
  ctx.globalAlpha = 1;
  drawRotatedVoxelSprite(ctx, voxelAssets.items.arrow, projectile.position, projectile.shaftLength + 22, angleOf(projectile.direction), {
    anchorX: 1,
    anchorY: 0.5,
    shadowOffset: 3,
  });
  ctx.restore();
}

function drawFireballProjectile(ctx, projectile) {
  const head = snapVector(projectile.position, 4);
  const trailEnd = snapVector(add(projectile.position, scale(projectile.direction, -projectile.shaftLength * 1.6)), 4);

  ctx.save();
  drawRotatedVoxelSprite(ctx, voxelAssets.items.fireball, trailEnd, 31, angleOf(projectile.direction), {
    shadow: false,
    alpha: 0.32,
  });
  ctx.globalAlpha = 0.42;
  drawPixelLine(ctx, snapVector(projectile.previousPosition, 4), trailEnd, 16, "#9f2d17");
  ctx.globalAlpha = 1;
  drawVoxelSpriteCentered(ctx, voxelAssets.items.fireball, head, 38, {
    angle: angleOf(projectile.direction),
    shadowOffset: 4,
  });
  ctx.restore();
}

function drawIceShardProjectile(ctx, projectile) {
  const head = snapVector(projectile.position, 4);
  const tail = snapVector(add(projectile.position, scale(projectile.direction, -projectile.shaftLength)), 4);

  ctx.save();
  ctx.globalAlpha = 0.3;
  drawPixelLine(ctx, snapVector(projectile.previousPosition, 4), tail, 9, projectile.color);
  ctx.globalAlpha = 1;
  drawRotatedVoxelSprite(ctx, voxelAssets.items.iceShard, head, projectile.shaftLength + 18, angleOf(projectile.direction), {
    anchorX: 1,
    anchorY: 0.5,
    shadowOffset: 3,
  });
  ctx.restore();
}

function drawSpellTrajectories(ctx, currentTime) {
  for (const trajectory of spellTrajectories) {
    drawSpellTrajectory(ctx, trajectory, currentTime);
  }
}

function drawSpellTrajectory(ctx, trajectory, currentTime) {
  if (trajectory.kind !== "lightning" || trajectory.points.length < 2) {
    return;
  }

  const lifeProgress = clamp((trajectory.expiresAt - currentTime) / Math.max(0.001, trajectory.expiresAt - trajectory.createdAt), 0, 1);

  ctx.save();
  ctx.lineCap = "butt";
  ctx.lineJoin = "miter";
  ctx.globalAlpha = 0.25 + lifeProgress * 0.75;
  ctx.strokeStyle = trajectory.darkColor;
  ctx.lineWidth = 15;
  ctx.beginPath();
  moveToVector(ctx, snapVector(trajectory.points[0], 4));
  for (let index = 1; index < trajectory.points.length; index += 1) {
    lineToVector(ctx, snapVector(trajectory.points[index], 4));
  }
  ctx.stroke();

  ctx.strokeStyle = trajectory.color;
  ctx.lineWidth = 6;
  ctx.beginPath();
  moveToVector(ctx, snapVector(trajectory.points[0], 4));
  for (let index = 1; index < trajectory.points.length; index += 1) {
    lineToVector(ctx, snapVector(trajectory.points[index], 4));
  }
  ctx.stroke();

  ctx.strokeStyle = "#f8fbff";
  ctx.lineWidth = 2;
  ctx.beginPath();
  moveToVector(ctx, snapVector(trajectory.points[0], 4));
  for (let index = 1; index < trajectory.points.length; index += 1) {
    lineToVector(ctx, snapVector(trajectory.points[index], 4));
  }
  ctx.stroke();

  for (let index = 1; index < trajectory.points.length; index += 1) {
    const start = trajectory.points[index - 1];
    const end = trajectory.points[index];
    const segment = subtract(end, start);
    drawRotatedVoxelSprite(ctx, voxelAssets.items.lightning, add(start, scale(segment, 0.5)), Math.min(52, length(segment) * 0.72), angleOf(segment), {
      alpha: lifeProgress * 0.72,
      shadow: false,
    });
  }
  ctx.restore();
}

function drawArenaHazards(ctx, currentTime) {
  for (const hazard of arenaHazards) {
    const life = clamp((hazard.expiresAt - currentTime) / Math.max(0.001, hazard.expiresAt - hazard.createdAt), 0, 1);
    ctx.save();
    ctx.globalAlpha = 0.35 + life * 0.65;
    if (hazard.type === "venomSpike") {
      drawVenomSpike(ctx, hazard);
    }
    ctx.restore();
  }
}

function drawVenomSpike(ctx, hazard) {
  const center = snapVector(hazard.position, 4);
  const radius = hazard.radius;

  ctx.fillStyle = "#050711";
  ctx.fillRect(center.x - radius, center.y - radius, radius * 2, radius * 2);
  ctx.fillStyle = "#39d353";
  ctx.fillRect(center.x - radius + 4, center.y - radius + 4, radius * 2 - 8, radius * 2 - 8);
  ctx.fillStyle = "#caff70";
  ctx.fillRect(center.x - 4, center.y - radius - 8, 8, radius + 12);
  ctx.fillRect(center.x - radius - 8, center.y - 4, radius + 12, 8);
}

function drawWebLinks(ctx, currentTime) {
  ctx.save();
  for (const web of webLinks) {
    const life = clamp((web.expiresAt - currentTime) / Math.max(0.001, web.expiresAt - web.createdAt), 0, 1);
    ctx.globalAlpha = 0.25 + life * 0.65;
    drawPixelLine(ctx, snapVector(web.start, 4), snapVector(web.end, 4), 12, "#050711");
    drawPixelLine(ctx, snapVector(web.start, 4), snapVector(web.end, 4), 5, "#f0d7ff");
    ctx.fillStyle = "#f8fbff";
    ctx.fillRect(web.start.x - web.nodeRadius / 2, web.start.y - web.nodeRadius / 2, web.nodeRadius, web.nodeRadius);
    ctx.fillRect(web.end.x - web.nodeRadius / 2, web.end.y - web.nodeRadius / 2, web.nodeRadius, web.nodeRadius);
  }
  for (const ball of balls) {
    if (ball.pendingWebNode) {
      ctx.globalAlpha = 0.55;
      ctx.fillStyle = "#f0d7ff";
      ctx.fillRect(ball.pendingWebNode.x - 6, ball.pendingWebNode.y - 6, 12, 12);
    }
  }
  ctx.restore();
}

function drawFlameTrails(ctx, currentTime) {
  for (const flame of flameTrails) {
    const life = clamp((flame.expiresAt - currentTime) / Math.max(0.001, flame.expiresAt - flame.createdAt), 0, 1);
    const size = flame.radius * (0.8 + life * 0.4);
    ctx.save();
    ctx.globalAlpha = 0.18 + life * 0.52;
    ctx.fillStyle = "#9f2d17";
    ctx.fillRect(flame.position.x - size, flame.position.y - size, size * 2, size * 2);
    ctx.fillStyle = "#ff6b24";
    ctx.fillRect(flame.position.x - size * 0.65, flame.position.y - size * 0.65, size * 1.3, size * 1.3);
    ctx.fillStyle = "#ffd166";
    ctx.fillRect(flame.position.x - size * 0.25, flame.position.y - size * 0.25, size * 0.5, size * 0.5);
    ctx.restore();
  }
}

function drawChainWeapon(ctx, ball, direction, progress) {
  const geometry = getChainWeaponGeometry(ball);
  const start = snapVector(geometry.start, 4);
  const end = snapVector(geometry.head, 4);
  const headRadius = geometry.headRadius;

  ctx.save();
  ctx.strokeStyle = "#050711";
  ctx.lineWidth = 8;
  ctx.beginPath();
  moveToVector(ctx, start);
  lineToVector(ctx, end);
  ctx.stroke();

  const segmentCount = 6;
  for (let index = 0; index <= segmentCount; index += 1) {
    const point = add(start, scale(subtract(end, start), index / segmentCount));
    ctx.fillStyle = index % 2 === 0 ? ball.visual.accentColor : "#8890aa";
    ctx.fillRect(point.x - 4, point.y - 4, 8, 8);
  }

  ctx.fillStyle = "#050711";
  ctx.fillRect(end.x - headRadius - 3, end.y - headRadius - 3, headRadius * 2 + 6, headRadius * 2 + 6);
  ctx.fillStyle = ball.visual.color;
  ctx.fillRect(end.x - headRadius, end.y - headRadius, headRadius * 2, headRadius * 2);
  ctx.fillStyle = ball.visual.accentColor;
  ctx.fillRect(end.x - headRadius * 0.45, end.y - headRadius * 0.45, headRadius * 0.9, headRadius * 0.9);
  ctx.fillStyle = "#f4f6ff";
  ctx.fillRect(end.x - 4, end.y - headRadius - 8, 8, 10);
  ctx.fillRect(end.x - 4, end.y + headRadius - 2, 8, 10);
  ctx.fillRect(end.x - headRadius - 8, end.y - 4, 10, 8);
  ctx.fillRect(end.x + headRadius - 2, end.y - 4, 10, 8);
  drawVoxelSpriteCentered(ctx, voxelAssets.items.flail, end, headRadius * 2.25, {
    shadowOffset: 3,
  });
  ctx.restore();
}

function drawReaperWeapon(ctx, ball, currentTime) {
  const geometry = getReaperBladeGeometry(ball, currentTime);
  const handleStart = snapVector(geometry.handleStart, 4);
  const handleEnd = snapVector(geometry.handleEnd, 4);
  const bladeStart = snapVector(geometry.bladeStart, 4);
  const bladeEnd = snapVector(geometry.bladeEnd, 4);

  ctx.save();
  ctx.lineCap = "butt";
  ctx.lineJoin = "miter";
  drawPixelLine(ctx, handleStart, handleEnd, 13, "#050711");
  drawPixelLine(ctx, handleStart, handleEnd, 6, "#7a5368");
  drawPixelLine(ctx, bladeStart, bladeEnd, 18, "#050711");
  drawPixelLine(ctx, bladeStart, bladeEnd, 9, ball.visual.accentColor);
  ctx.fillStyle = "#bdefff";
  ctx.fillRect(handleEnd.x - 5, handleEnd.y - 5, 10, 10);
  ctx.restore();
}

function drawFrostOrbits(ctx, ball) {
  if (!ball.frostOrbitState) {
    return;
  }

  ctx.save();
  ctx.strokeStyle = "rgba(248, 251, 255, 0.34)";
  ctx.lineWidth = 4;
  ctx.strokeRect(
    ball.position.x - ball.config.frostOrbit.orbitRadius,
    ball.position.y - ball.config.frostOrbit.orbitRadius,
    ball.config.frostOrbit.orbitRadius * 2,
    ball.config.frostOrbit.orbitRadius * 2,
  );

  for (const orb of getFrostOrbitGeometry(ball)) {
    ctx.fillStyle = "#050711";
    ctx.fillRect(orb.center.x - orb.radius - 3, orb.center.y - orb.radius - 3, orb.radius * 2 + 6, orb.radius * 2 + 6);
    ctx.fillStyle = ball.visual.color;
    ctx.fillRect(orb.center.x - orb.radius, orb.center.y - orb.radius, orb.radius * 2, orb.radius * 2);
    ctx.fillStyle = "#f8fbff";
    ctx.fillRect(orb.center.x - 4, orb.center.y - orb.radius + 2, 8, 8);
  }
  ctx.restore();
}

function drawMageWeapon(ctx, ball, direction, progress) {
  const variant = ball.attackState?.variant;
  const spellColor = variant?.color || ball.visual.accentColor;
  const hitFrame = ball.attackState?.hitFrame || ATTACK_ANIMATION_CONFIG.mage.hitFrame;
  const chargeProgress = progress === null ? 0 : clamp(progress / hitFrame, 0, 1);
  const geometry = getMageStaffGeometry(ball, direction);
  const base = snapVector(geometry.base, 4);
  const grip = snapVector(geometry.grip, 4);
  const tip = snapVector(geometry.tip, 4);
  const side = geometry.side;
  const crystalSize = progress === null ? 12 : 12 + chargeProgress * 8;
  const runeOffset = 16 + chargeProgress * 8;
  const staffLength = length(subtract(tip, base)) + 12;

  ctx.save();
  drawRotatedVoxelSprite(ctx, voxelAssets.items.staff, base, staffLength, angleOf(geometry.direction), {
    anchorX: 0,
    anchorY: 0.5,
    shadowOffset: 4,
  });

  ctx.fillStyle = "#050711";
  ctx.fillRect(grip.x - 9, grip.y - 9, 18, 18);
  ctx.fillStyle = ball.visual.color;
  ctx.fillRect(grip.x - 5, grip.y - 5, 10, 10);
  ctx.fillStyle = "#050711";
  ctx.fillRect(tip.x - crystalSize / 2 - 4, tip.y - crystalSize / 2 - 4, crystalSize + 8, crystalSize + 8);
  ctx.fillStyle = spellColor;
  ctx.fillRect(tip.x - crystalSize / 2, tip.y - crystalSize / 2, crystalSize, crystalSize);
  ctx.fillStyle = "#f8fbff";
  ctx.fillRect(tip.x - 3, tip.y - 3, 6, 6);

  if (progress !== null) {
    const runeA = snapVector(add(tip, scale(side, runeOffset)), 4);
    const runeB = snapVector(add(tip, scale(side, -runeOffset)), 4);
    const wake = snapVector(subtract(tip, scale(geometry.direction, 18 + chargeProgress * 12)), 4);
    ctx.strokeStyle = "#050711";
    ctx.lineWidth = 9;
    ctx.beginPath();
    moveToVector(ctx, wake);
    lineToVector(ctx, tip);
    ctx.stroke();
    ctx.strokeStyle = spellColor;
    ctx.lineWidth = 4;
    ctx.beginPath();
    moveToVector(ctx, wake);
    lineToVector(ctx, tip);
    ctx.stroke();
    ctx.fillStyle = "#050711";
    ctx.fillRect(runeA.x - 5, runeA.y - 5, 10, 10);
    ctx.fillRect(runeB.x - 5, runeB.y - 5, 10, 10);
    ctx.fillStyle = spellColor;
    ctx.fillRect(runeA.x - 3, runeA.y - 3, 6, 6);
    ctx.fillRect(runeB.x - 3, runeB.y - 3, 6, 6);
  }
  ctx.restore();
}

function drawArenaScene() {
  ctx.save();
  ctx.translate(layout.arena.x, layout.arena.y);
  ctx.scale(layout.arena.scale, layout.arena.scale);
  drawArena();
  drawFlameTrails(ctx, elapsedTimeSeconds);
  drawWebLinks(ctx, elapsedTimeSeconds);
  drawArenaHazards(ctx, elapsedTimeSeconds);
  balls.forEach((ball, index) => ball.draw(ctx, elapsedTimeSeconds, balls[index === 0 ? 1 : 0]));
  drawProjectiles(ctx);
  drawSpellTrajectories(ctx, elapsedTimeSeconds);
  renderAttackEffectInstances(ctx, attackEffectInstances, elapsedTimeSeconds);
  ctx.restore();
}

function drawArena() {
  ctx.save();
  const tileSize = ARENA_TERRAIN_TILE_SIZE;
  const terrainRows = terrainState.arenaTiles.length;
  const terrainColumns = terrainState.arenaTiles[0]?.length || 0;

  for (let row = 0; row < terrainRows; row += 1) {
    for (let column = 0; column < terrainColumns; column += 1) {
      drawTerrainBlock(ctx, terrainState.arenaTiles[row][column], column * tileSize, row * tileSize, tileSize, {
        borderAlpha: terrainState.arenaBiome === "rock" ? 0.16 : 0.11,
        darkness: 0,
      });
    }
  }

  ctx.fillStyle = terrainState.arenaBiome === "super" ? "rgba(75, 207, 255, 0.06)" : terrainState.arenaBiome === "rock" ? "rgba(255, 244, 207, 0.035)" : "rgba(255, 244, 207, 0.045)";
  for (let row = 0; row < terrainRows; row += 1) {
    for (let column = 0; column < terrainColumns; column += 1) {
      const sparkle = terrainNoise(terrainState.seed, column, row, 401);
      if (sparkle > 0.86) {
        const chipSize = sparkle > 0.95 ? 10 : 6;
        const chipX = column * tileSize + 8 + Math.floor(terrainNoise(terrainState.seed, column, row, 409) * 18);
        const chipY = row * tileSize + 8 + Math.floor(terrainNoise(terrainState.seed, column, row, 419) * 18);
        ctx.fillRect(chipX, chipY, chipSize, chipSize);
      }
    }
  }

  const gridColor = terrainState.arenaBiome === "super" ? "rgba(75, 207, 255, 0.22)" : terrainState.arenaBiome === "rock" ? "rgba(5, 7, 17, 0.34)" : COLORS.grid;
  ctx.fillStyle = gridColor;
  for (let i = tileSize; i < ARENA_SIZE; i += tileSize) {
    ctx.fillRect(i - 1, 0, 2, ARENA_SIZE);
    ctx.fillRect(0, i - 1, ARENA_SIZE, 2);
  }
  ctx.restore();

  ctx.save();
  const border = 22;
  drawTiledVoxelTexture(ctx, voxelAssets.blocks.obsidian, 0, 0, ARENA_SIZE, border, border);
  drawTiledVoxelTexture(ctx, voxelAssets.blocks.obsidian, 0, ARENA_SIZE - border, ARENA_SIZE, border, border);
  drawTiledVoxelTexture(ctx, voxelAssets.blocks.obsidian, 0, 0, border, ARENA_SIZE, border);
  drawTiledVoxelTexture(ctx, voxelAssets.blocks.obsidian, ARENA_SIZE - border, 0, border, ARENA_SIZE, border);
  ctx.strokeStyle = "#050711";
  ctx.lineWidth = 6;
  ctx.strokeRect(4, 4, ARENA_SIZE - 8, ARENA_SIZE - 8);
  ctx.strokeStyle = terrainState.arenaBiome === "super" ? "#4bcfff" : "#9b7a3a";
  ctx.lineWidth = 3;
  ctx.strokeRect(border + 2, border + 2, ARENA_SIZE - border * 2 - 4, ARENA_SIZE - border * 2 - 4);
  ctx.restore();
}

function handlePointerDown(event) {
  const point = getPointerPoint(event);
  const element = getInteractiveElementAt(point);
  pointerDownElementId = element?.id || null;
}

function handlePointerUp(event) {
  const point = getPointerPoint(event);
  const element = getInteractiveElementAt(point);
  const shouldRunAction = element && pointerDownElementId === element.id;
  pointerDownElementId = null;

  if (shouldRunAction) {
    element.action();
  }
}

function handleWheel(event) {
  if (screen !== Screen.LEGAL_DOCUMENT) {
    return;
  }

  legalScrollOffset = Math.max(0, legalScrollOffset + event.deltaY);
  event.preventDefault();
}

function handleKeyDown(event) {
  if (event.key === "Escape") {
    if (screen === Screen.LEGAL_DOCUMENT) {
      setScreen(previousScreen);
    } else if (screen === Screen.PROFESSION_SELECT || screen === Screen.SETTINGS) {
      setScreen(Screen.MAIN_MENU);
    }
    return;
  }

  if (event.code === "Space" || event.code === "Enter") {
    if (screen === Screen.MAIN_MENU) {
      openMatchSetup();
    } else if (screen === Screen.RESULT) {
      startGame();
    }
  }

  if (event.key.toLowerCase() === "r" && screen === Screen.RESULT) {
    startGame();
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

function clampArenaPoint(point) {
  return {
    x: clamp(point.x, 0, ARENA_SIZE),
    y: clamp(point.y, 0, ARENA_SIZE),
  };
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
  return `${weight} ${size}px "Courier New", "Microsoft YaHei", monospace`;
}

function getFittedFontSize(text, maxWidth, desiredSize, minSize, weight = 700) {
  ctx.save();
  let fontSize = desiredSize;
  while (fontSize > minSize) {
    ctx.font = canvasFont(fontSize, weight);
    if (ctx.measureText(String(text)).width <= maxWidth) {
      ctx.restore();
      return fontSize;
    }
    fontSize -= 1;
  }
  ctx.restore();
  return minSize;
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

function drawPixelLine(context, start, end, width, color) {
  context.save();
  context.strokeStyle = color;
  context.lineWidth = width;
  context.lineCap = "butt";
  context.lineJoin = "miter";
  context.beginPath();
  moveToVector(context, start);
  lineToVector(context, end);
  context.stroke();
  context.restore();
}

function drawTiledVoxelTexture(context, texture, x, y, width, height, tileSize) {
  context.save();
  context.imageSmoothingEnabled = false;
  context.beginPath();
  context.rect(x, y, width, height);
  context.clip();

  for (let tileY = y; tileY < y + height; tileY += tileSize) {
    for (let tileX = x; tileX < x + width; tileX += tileSize) {
      context.drawImage(texture, Math.floor(tileX), Math.floor(tileY), tileSize, tileSize);
    }
  }

  context.restore();
}

function drawTerrainBlock(context, tile, x, y, size, options = {}) {
  const texture = getTerrainBlockTexture(tile.type);
  drawTiledVoxelTexture(context, texture, x, y, size, size, size);

  if (tile.type === "moss") {
    context.save();
    context.globalAlpha = 0.34;
    drawTiledVoxelTexture(context, voxelAssets.blocks.grassDark, x, y, size, size, size);
    context.restore();
  }

  if (tile.shade > 0 || options.darkness > 0) {
    context.fillStyle = `rgba(5, 7, 17, ${clamp(tile.shade + (options.darkness || 0), 0, 0.78)})`;
    context.fillRect(x, y, size, size);
  }

  const borderAlpha = options.borderAlpha ?? 0.12;
  if (borderAlpha > 0) {
    context.fillStyle = `rgba(5, 7, 17, ${borderAlpha})`;
    context.fillRect(x, y, size, 2);
    context.fillRect(x, y, 2, size);
    context.fillStyle = `rgba(255, 244, 207, ${borderAlpha * 0.45})`;
    context.fillRect(x + 2, y + 2, Math.max(0, size - 4), 1);
    context.fillRect(x + 2, y + 2, 1, Math.max(0, size - 4));
  }
}

function getTerrainBlockTexture(type) {
  if (type === "grass") {
    return voxelAssets.blocks.grass;
  }
  if (type === "grassDark") {
    return voxelAssets.blocks.grassDark;
  }
  if (type === "dirt") {
    return voxelAssets.blocks.dirt;
  }
  if (type === "stone" || type === "moss") {
    return voxelAssets.blocks.stone;
  }
  if (type === "obsidian") {
    return voxelAssets.blocks.obsidian;
  }
  return voxelAssets.blocks.deepslate;
}

function drawRotatedVoxelSprite(context, sprite, point, width, angle, options = {}) {
  const height = options.height || (width * sprite.height) / sprite.width;
  const anchorX = options.anchorX ?? 0.5;
  const anchorY = options.anchorY ?? 0.5;
  const shadowOffset = options.shadowOffset ?? 3;

  context.save();
  context.translate(point.x, point.y);
  context.rotate(angle);
  context.imageSmoothingEnabled = false;

  if (options.shadow !== false) {
    context.globalAlpha = (options.alpha ?? 1) * 0.38;
    context.fillStyle = "#050711";
    context.fillRect(-width * anchorX + shadowOffset, -height * anchorY + shadowOffset, width, height);
  }

  context.globalAlpha = options.alpha ?? 1;
  context.drawImage(sprite, -width * anchorX, -height * anchorY, width, height);
  context.restore();
}

function drawVoxelSpriteCentered(context, sprite, center, width, options = {}) {
  drawRotatedVoxelSprite(context, sprite, center, width, options.angle || 0, {
    ...options,
    anchorX: 0.5,
    anchorY: 0.5,
  });
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

function normalizeAngle(angle) {
  const fullTurn = Math.PI * 2;
  return ((angle % fullTurn) + fullTurn) % fullTurn;
}

function snapVector(vector, gridSize) {
  return {
    x: Math.round(vector.x / gridSize) * gridSize,
    y: Math.round(vector.y / gridSize) * gridSize,
  };
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
  applyLocaleToDocument();
  resizeCanvas();
  GamePlatform.setLoadingProgress(35);
  await initializePlatform();
  GamePlatform.setLoadingProgress(80);
  screen = complianceState.hasAcceptedCurrentLegal() ? Screen.MAIN_MENU : Screen.CONSENT;
  lastFrameTime = performance.now();
  requestAnimationFrame(gameLoop);
}

window.addEventListener("resize", resizeCanvas);
window.visualViewport?.addEventListener("resize", resizeCanvas);
canvas.addEventListener("pointerdown", handlePointerDown);
canvas.addEventListener("pointerup", handlePointerUp);
canvas.addEventListener("pointercancel", () => {
  pointerDownElementId = null;
});
canvas.addEventListener("wheel", handleWheel, { passive: false });
canvas.addEventListener("contextmenu", (event) => event.preventDefault());
window.addEventListener("keydown", handleKeyDown);

bootGame();
