import { createComplianceState, normalizeSelectedProfessions } from "./compliance-state.js";
import {
  ARENA_SIZE,
  ATTACK_ANIMATION_CONFIG,
  ATTACK_COOLDOWN_MULTIPLIER,
  BALL_RADIUS_MULTIPLIER,
  COLORS,
  HERO_SCENE_ID,
  HeroConfig,
  ITEM_SCENE_ID,
  ItemModeBallConfig,
  ItemSpawnConfig,
  ItemWeaponConfig,
  MAX_DELTA_TIME,
  MAX_DEVICE_PIXEL_RATIO,
  ProfessionConfig,
  SceneConfig,
  SIDE_VISUAL_CONFIG,
  getAttackAnimationConfig,
  getItemInitialCount,
  getItemMaxActiveCount,
  getItemSpawnInterval,
  getSceneProfessionIds,
  getSpeedMultiplier,
  isHeroScene,
  isItemScene,
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
const PROFESSION_SCROLL_DRAG_THRESHOLD = 6;
const DAMAGE_TEXT_DURATION = 0.86;
const DAMAGE_TEXT_MERGE_WINDOW = 0.22;
const SCENE_DROPDOWN_BREAKPOINT = 560;

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
let professionScrollOffset = 0;
let professionScrollArea = null;
let professionScrollInputArea = null;
let professionScrollPointer = null;
let sceneDropdownOpen = false;
let sceneDropdownLayout = null;
let attackEffectInstances = [];
let projectiles = [];
let spellTrajectories = [];
let arenaHazards = [];
let webLinks = [];
let flameTrails = [];
let damageIndicators = [];
let droppedItems = [];
let itemExplosions = [];
let heroEffectInstances = [];
let nextItemSpawnTime = 0;
let itemSpawnCounter = 0;
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
      yoyo: createVoxelSprite(
        [
          "....PPPP....",
          "..PPYYYYPP..",
          ".PPYYWWYYPP.",
          ".PYYWYYWYYP.",
          ".PPYYWWYYPP.",
          "..PPYYYYPP..",
          "....PPPP....",
        ],
        {
          P: "#ff7ab6",
          Y: "#fff1a8",
          W: "#ffffff",
        },
      ),
      hammer: createVoxelSprite(
        [
          "........HHHHHHHH....",
          ".......HHSSSSSSHH...",
          "......HHSSSSSSSSHH..",
          ".......HHSSSSSSHH...",
          "........HHHHHHHH....",
          "............WW......",
          "...........WW.......",
          "..........WW........",
          ".........WW.........",
          "........WW..........",
          ".......WW...........",
        ],
        {
          H: "#050711",
          S: "#b8bdc7",
          W: "#8d5a2e",
        },
      ),
      totem: createVoxelSprite(
        [
          "......BBBBBB......",
          ".....BWWWWWWB.....",
          ".....BWRRYYWB.....",
          ".....BWYYYYWB.....",
          ".....BWRRYYWB.....",
          ".....BWWWWWWB.....",
          "......BBBBBB......",
          "........WW........",
          "........WW........",
          "........WW........",
          "........WW........",
        ],
        {
          B: "#050711",
          W: "#8d5a2e",
          R: "#7c2d12",
          Y: "#facc15",
        },
      ),
      goldStaff: createVoxelSprite(
        [
          "RRRYYYYYYYYYYYYYYYYRRR",
          "RRRYYYYYYYYYYYYYYYYRRR",
          "RRRYYYYYYYYYYYYYYYYRRR",
        ],
        {
          R: "#dc2626",
          Y: "#facc15",
        },
      ),
      pistol: createVoxelSprite(
        [
          "................",
          "..BBBBBBBBB.....",
          ".BSSSSSSSSB.....",
          ".BSSBBBBBBBTT...",
          "..BBB....BBTT...",
          ".........BB.....",
          "........BBS.....",
          ".......BBS......",
          "......BBS.......",
        ],
        {
          B: "#050711",
          S: "#b8bdc7",
          T: "#ffe66d",
        },
      ),
      rocketLauncher: createVoxelSprite(
        [
          "....................",
          "..GGGGGGGGGGGGG.....",
          ".GBBBBBBBBBBBBGTT...",
          "GBBSSSSSSSSSSBBTTT..",
          ".GBBBBBBBBBBBBGTT...",
          "..GGGGGGGGGGGGG.....",
          "......HHHH..........",
          ".....HHHH...........",
          "....HHHH............",
        ],
        {
          G: "#3f6b31",
          B: "#050711",
          S: "#8a9a87",
          T: "#ff6b24",
          H: "#6b4326",
        },
      ),
      bullet: createVoxelSprite(
        [
          "YYYY",
          "YWWY",
          "YYYY",
        ],
        {
          Y: "#ffe66d",
          W: "#fff6d6",
        },
      ),
      rocket: createVoxelSprite(
        [
          "............RR",
          "..........RRRO",
          "GGGGGGGGGRRROO",
          "GBBBBBBBBRRROO",
          "GGGGGGGGGRRROO",
          "..........RRRO",
          "............RR",
        ],
        {
          G: "#5f963c",
          B: "#050711",
          R: "#d8e0e5",
          O: "#ff6b24",
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
    this.hp = this.config.maxHp;
    this.maxHp = this.config.maxHp;
    this.mp = this.config.maxMp || 0;
    this.maxMp = this.config.maxMp || 0;
    this.manaRegen = this.config.manaRegen || 0;
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
    this.slowUntil = 0;
    this.slowMultiplier = 1;
    this.lastCollisionAbilityTime = -Infinity;
    this.lastHazardHitTime = -Infinity;
    this.lastWebHitTime = -Infinity;
    this.lastFlameHitTime = -Infinity;
    this.lastFrostHitTime = -Infinity;
    this.lastFlameDropTime = -Infinity;
    this.wallCollisionCount = 0;
    this.pendingWebNode = null;
    this.equippedItem = null;
    this.heroSkillCooldowns = {};
    this.heroSkillEffects = {};
    this.rebirthUsed = false;
    this.chainWeaponState = createChainWeaponState(this);
    this.frostOrbitState = createFrostOrbitState(this);
    this.yoyoWeaponState = createYoyoWeaponState(this);
    this.summonedBearState = createSummonedBearState(this);
    this.cosmeticState = createCosmeticState();
  }

  update(deltaTime, currentTime) {
    regenerateHeroMana(this, deltaTime);
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
    if (isCurrentItemMode() && !this.equippedItem) {
      return false;
    }

    return (
      this.hp > 0 &&
      !this.attackState &&
      !isBallControlLocked(this, currentTime) &&
      currentTime - this.lastAttackTime >= getBallAttackCooldown(this)
    );
  }

  startAttack(defender, currentTime) {
    if (!this.canAttack(currentTime) || defender.hp <= 0) {
      return false;
    }

    const itemWeapon = getEquippedItemWeapon(this);
    const variant = itemWeapon
      ? getItemAttackVariant(itemWeapon, this, defender, currentTime)
      : getHeroAttackVariant(this, defender, currentTime) || this.config.getAttackVariant?.(this, defender, currentTime) || null;
    const attackConfig = itemWeapon ? getItemAttackAnimationConfig(itemWeapon) : getBallAttackAnimationConfig(this);
    const direction = getAttackDirection(this, defender, variant);
    this.attackState = {
      defender,
      startTime: currentTime,
      duration: attackConfig.duration,
      hitFrame: attackConfig.hitFrame,
      direction,
      variant,
      itemWeaponId: itemWeapon?.id || null,
      didDealDamage: false,
    };
    this.lastAttackTime = currentTime;
    if (itemWeapon) {
      consumeEquippedItemDurability(this);
    }
    return true;
  }

  dealAttackDamageTo(defender, normalFromAttackerToDefender, attackVariant = null) {
    if (this.hp <= 0 || defender.hp <= 0) {
      return 0;
    }

    const damage = attackVariant?.damage || this.config.getDamage(this, defender, normalFromAttackerToDefender, attackVariant);
    return damageBall(defender, damage);
  }

  isSkillHit(defender, normalFromAttackerToDefender, damage, attackVariant = null) {
    if (this.attackState?.itemWeaponId || attackVariant?.itemWeaponId) {
      return Boolean(attackVariant?.castType || attackVariant?.isSkillHit);
    }

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

    if (this.equippedItem) {
      drawEquippedItemDurability(ctx, this);
    }
    if (this.maxMp > 0) {
      drawHeroManaBar(ctx, this);
    }
  }
}

function createInitialBalls() {
  if (isCurrentItemMode()) {
    return createInitialItemModeBalls();
  }

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

function createInitialItemModeBalls() {
  const ballCount = selectedProfessions.ballCount || 2;
  return Array.from({ length: ballCount }, (_, index) => {
    const slot = getItemModeBallStart(index, ballCount);
    return new Ball({
      label: getBallLabel(index),
      profession: null,
      config: ItemModeBallConfig,
      x: slot.x,
      y: slot.y,
      direction: slot.direction,
    });
  });
}

function getItemModeBallStart(index, ballCount) {
  const angle = -Math.PI / 2 + (index * Math.PI * 2) / ballCount;
  const spawnRadius = ballCount <= 2 ? 285 : 255;
  const x = ARENA_SIZE / 2 + Math.cos(angle) * spawnRadius;
  const y = ARENA_SIZE / 2 + Math.sin(angle) * spawnRadius;
  const tangent = vectorFromAngle(angle + Math.PI / 2);
  const inward = normalize(subtract({ x: ARENA_SIZE / 2, y: ARENA_SIZE / 2 }, { x, y }));
  return {
    x,
    y,
    direction: normalize(add(inward, scale(tangent, index % 2 === 0 ? 0.32 : -0.32))),
  };
}

function getBallLabel(index) {
  return String.fromCharCode("A".charCodeAt(0) + index);
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

function isCurrentItemMode() {
  return isItemScene(selectedProfessions.scene);
}

function isCurrentHeroMode() {
  return isHeroScene(selectedProfessions.scene);
}

function isHeroId(id) {
  return Object.hasOwn(HeroConfig, id);
}

function getCombatantConfig(id) {
  return HeroConfig[id] || ProfessionConfig[id] || null;
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

function getActiveSummonedBears() {
  return balls
    .map((ball) => ball.summonedBearState)
    .filter((bear) => isSummonedBearActive(bear));
}

function getAliveCollisionCombatants() {
  return [
    ...balls.filter((ball) => ball.hp > 0),
    ...getActiveSummonedBears(),
  ];
}

function resetProfessionScroll() {
  professionScrollOffset = 0;
  professionScrollInputArea = null;
  professionScrollPointer = null;
}

function setActiveProfessionSide(side) {
  if (activeProfessionSide === side) {
    return;
  }

  activeProfessionSide = side;
  resetProfessionScroll();
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
  resetProfessionScroll();
  sceneDropdownOpen = false;
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
  if (isHeroId(professionId)) {
    return t(HeroConfig[professionId].nameKey);
  }

  return t(`professions.${professionId}.name`) || ProfessionConfig[professionId]?.name || professionId;
}

function getSideLabel(side) {
  if (side === "a" || side === "A") {
    return t("side.a");
  }
  if (side === "b" || side === "B") {
    return t("side.b");
  }

  const label = String(side).toUpperCase();
  return currentLocale === "zh-CN" ? `球 ${label}` : `Ball ${label}`;
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

function createYoyoWeaponState(ball) {
  if (ball.config.attackMode !== "yoyo") {
    return null;
  }

  const throwDelay = ball.label === "A" ? 0.52 : 1.08;
  return {
    phase: "idle",
    phaseStartedAt: elapsedTimeSeconds,
    nextThrowTime: elapsedTimeSeconds + throwDelay,
    rotationAngle: ball.label === "A" ? -0.36 : Math.PI + 0.36,
    spinDirection: ball.label === "A" ? 1 : -1,
    lastHitTime: -Infinity,
    wallContact: null,
  };
}

function createSummonedBearState(ball) {
  if (ball.config.attackMode !== "summonBear") {
    return null;
  }

  const bear = ball.config.summonBear;
  const spawnDirection = normalize(ball.label === "A" ? { x: 0.8, y: 0.42 } : { x: -0.8, y: -0.42 });
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
    boostFlashTime: 0,
    hitFlashTime: 0,
  };
}

function setScreen(nextScreen) {
  screen = nextScreen;
  pointerDownElementId = null;
  legalScrollOffset = 0;
  sceneDropdownOpen = false;
  sceneDropdownLayout = null;
  if (nextScreen !== Screen.PROFESSION_SELECT) {
    resetProfessionScroll();
  }
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
  resetProfessionScroll();
  sceneDropdownOpen = false;
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
  damageIndicators = [];
  droppedItems = [];
  itemExplosions = [];
  heroEffectInstances = [];
  itemSpawnCounter = 0;
  nextItemSpawnTime = 0;
  gameOver = false;
  resultMessage = "";
  matchElapsedTimeSeconds = 0;
  lastFrameTime = performance.now();
  if (isCurrentItemMode()) {
    spawnInitialItems(lastFrameTime / 1000);
  }
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
  damageIndicators = [];
  droppedItems = [];
  itemExplosions = [];
  heroEffectInstances = [];
  nextItemSpawnTime = 0;
  itemSpawnCounter = 0;
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

  damageIndicators = updateDamageIndicators(damageIndicators, elapsedTimeSeconds);
  draw();
  requestAnimationFrame(gameLoop);
}

function update(deltaTime, currentTime) {
  balls.forEach((ball) => {
    if (ball.hp > 0) {
      ball.update(deltaTime, currentTime);
    }
  });
  if (isCurrentItemMode()) {
    updateItemMode(deltaTime, currentTime);
  }
  if (isCurrentHeroMode()) {
    updateHeroMode(currentTime);
  }
  updateStatusEffects(deltaTime, currentTime);
  attackEffectInstances = updateAttackEffectInstances(attackEffectInstances, currentTime);
  spellTrajectories = updateSpellTrajectories(currentTime);
  arenaHazards = arenaHazards.filter((hazard) => hazard.expiresAt > currentTime);
  webLinks = webLinks.filter((web) => web.expiresAt > currentTime);
  flameTrails = flameTrails.filter((flame) => flame.expiresAt > currentTime);
  itemExplosions = itemExplosions.filter((explosion) => explosion.expiresAt > currentTime);
  heroEffectInstances = updateHeroEffectInstances(heroEffectInstances, currentTime);
  for (const ball of balls) {
    if (ball.hp > 0) {
      updateSummonedBear(ball, deltaTime, currentTime);
    }
  }
  forEachAliveCollisionCombatantPair((ballA, ballB) => {
    resolveBallCollision(ballA, ballB, currentTime);
  });
  updateEnvironmentalHazards(currentTime);
  updateProjectiles(deltaTime, currentTime);
  for (const ball of balls) {
    if (ball.hp > 0) {
      updateChainWeapon(ball, deltaTime);
      updateFrostOrbit(ball, deltaTime);
      updateYoyoWeapon(ball, deltaTime, currentTime);
    }
  }
  forEachOrderedAliveBallPair((attacker, defender) => {
    updateChainWeaponForPair(attacker, defender, currentTime);
    updateFrostOrbitForPair(attacker, defender, currentTime);
    updateYoyoWeaponForPair(attacker, defender, currentTime);
    updateAttackForPair(attacker, defender, currentTime);
  });
  checkGameOver();
}

function forEachAliveCollisionCombatantPair(callback) {
  const combatants = getAliveCollisionCombatants();
  for (let aIndex = 0; aIndex < combatants.length; aIndex += 1) {
    const ballA = combatants[aIndex];

    for (let bIndex = aIndex + 1; bIndex < combatants.length; bIndex += 1) {
      const ballB = combatants[bIndex];
      callback(ballA, ballB);
    }
  }
}

function forEachOrderedAliveBallPair(callback) {
  for (const attacker of balls) {
    if (attacker.hp <= 0) {
      continue;
    }

    for (const defender of balls) {
      if (defender !== attacker && defender.hp > 0 && !areAlliedCombatants(attacker, defender)) {
        callback(attacker, defender);
      }
    }
  }
}

function updateDamageIndicators(indicators, currentTime) {
  return indicators.filter((indicator) => indicator.expiresAt > currentTime);
}

function updateHeroMode(currentTime) {
  for (const hero of balls) {
    expireHeroSkillEffects(hero, currentTime);
    useHeroAutoSkills(hero, currentTime);
  }
}

function useHeroAutoSkills(hero, currentTime) {
  if (!hero.isHero || hero.hp <= 0 || isBallControlLocked(hero, currentTime)) {
    return false;
  }

  const skills = [...(hero.config.skills || [])].sort(getHeroAutoSkillPriority);
  for (const skill of skills) {
    const handler = getHeroAutoSkillHandler(skill);
    if (handler && handler(hero, skill, currentTime)) {
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

  if (skill.type === "heal") {
    return useHeroForestBlessing;
  }

  if (skill.type === "staffBuff") {
    return useHeroStaffBuff;
  }

  return null;
}

function regenerateHeroMana(ball, deltaTime) {
  if (!ball.maxMp || ball.hp <= 0) {
    return;
  }

  ball.mp = Math.min(ball.maxMp, ball.mp + ball.manaRegen * deltaTime);
}

function useHeroManaBurn(hero, skill, currentTime) {
  if (!skill || !canUseHeroSkill(hero, skill, currentTime)) {
    return false;
  }

  const targets = getHeroSkillTargetsInRange(hero, skill);
  if (targets.length === 0) {
    return false;
  }

  spendHeroSkill(hero, skill, currentTime);
  for (const enemy of targets) {
    const manaBurned = drainMana(enemy, skill.manaDamage);
    const variant = createHeroSkillVariant(hero, skill, {
      damage: skill.damage + Math.floor(manaBurned * 0.25),
      knockbackMultiplier: skill.knockbackMultiplier,
    });
    resolveAttackHit(hero, enemy, getDirectionBetween(hero, enemy), currentTime, variant);
  }
  pushHeroEffect("manaBurn", hero.position, skill.range, currentTime, hero.visual.accentColor);
  return true;
}

function useHeroThunderHammer(hero, skill, currentTime) {
  if (!skill || !canUseHeroSkill(hero, skill, currentTime)) {
    return false;
  }

  const enemy = getNearestAliveOpponent(hero);
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
    color: "#fde68a",
    darkColor: "#050711",
    featherColor: hero.visual.color,
    homingStrength: 0.12,
    variant: createHeroSkillVariant(hero, skill, {
      damage: skill.damage,
      stunDuration: skill.stunDuration,
      knockbackMultiplier: skill.knockbackMultiplier,
    }),
  });
  pushHeroEffect("cast", hero.position, 90, currentTime, skill.color || hero.visual.accentColor);
  return true;
}

function useHeroAreaControlSkill(hero, skill, currentTime) {
  if (!skill || !canUseHeroSkill(hero, skill, currentTime)) {
    return false;
  }

  const targets = getHeroSkillTargetsInRange(hero, skill);
  if (targets.length === 0) {
    return false;
  }

  spendHeroSkill(hero, skill, currentTime);
  for (const enemy of targets) {
    const normal = getDirectionBetween(hero, enemy);
    const variant = createHeroSkillVariant(hero, skill, {
      damage: skill.damage,
      slowMultiplier: skill.slowMultiplier,
      slowDuration: skill.slowDuration,
      stunDuration: skill.stunDuration,
      knockbackMultiplier: skill.knockbackMultiplier,
    });
    resolveAttackHit(hero, enemy, normal, currentTime, variant);
  }
  pushHeroEffect(skill.type, hero.position, skill.range, currentTime, getHeroSkillEffectColor(hero, skill));
  return true;
}

function getHeroSkillEffectColor(hero, skill) {
  if (skill.color) {
    return skill.color;
  }

  if (skill.type === "groundSlam") {
    return "#fde68a";
  }

  if (skill.type === "warStomp") {
    return "#facc15";
  }

  return hero.visual.accentColor;
}

function useHeroForestBlessing(hero, skill, currentTime) {
  if (!skill || !canUseHeroSkill(hero, skill, currentTime)) {
    return false;
  }

  if (hero.hp / hero.maxHp > skill.triggerHpRatio) {
    return false;
  }

  spendHeroSkill(hero, skill, currentTime);
  healBall(hero, skill.heal);
  pushHeroEffect("heal", hero.position, 92, currentTime, "#bbf7d0");
  return true;
}

function useHeroStaffBuff(hero, skill, currentTime) {
  if (!skill || !canUseHeroSkill(hero, skill, currentTime)) {
    return false;
  }

  const enemy = getNearestAliveOpponent(hero);
  if (!enemy || !isInHeroSkillRange(hero, enemy, skill.triggerRange)) {
    return false;
  }

  if (!canUseWukongStaffBuffAtDistance(hero, enemy, skill)) {
    return false;
  }

  spendHeroSkill(hero, skill, currentTime);
  activateHeroSkillEffect(hero, skill, currentTime);
  hero.lastAttackTime = Math.min(hero.lastAttackTime, currentTime - getBallAttackCooldown(hero) * 0.58);
  pushHeroEffect(skill.id, hero.position, skill.range || skill.triggerRange, currentTime, getHeroSkillEffectColor(hero, skill));
  return true;
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

function getHeroSkillTargetsInRange(hero, skill) {
  return getAliveOpponents(hero)
    .filter((enemy) => isInHeroSkillRange(hero, enemy, skill.range))
    .sort((enemyA, enemyB) => {
      return length(subtract(enemyA.position, hero.position)) - length(subtract(enemyB.position, hero.position));
    });
}

function getAliveOpponents(ball) {
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
    color: skill.color || hero.visual.accentColor,
  };
}

function expireHeroSkillEffects(hero, currentTime) {
  if (!hero.heroSkillEffects) {
    return;
  }

  for (const [skillId, effect] of Object.entries(hero.heroSkillEffects)) {
    if (effect.expiresAt <= currentTime) {
      delete hero.heroSkillEffects[skillId];
    }
  }
}

function getActiveHeroSkillEffect(hero, skillId, currentTime = elapsedTimeSeconds) {
  const effect = hero.heroSkillEffects?.[skillId] || null;
  if (!effect) {
    return null;
  }

  if (effect.expiresAt <= currentTime) {
    delete hero.heroSkillEffects[skillId];
    return null;
  }

  return effect;
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
  ball.slowMultiplier = Math.min(ball.slowMultiplier, slowMultiplier);
  ball.slowUntil = Math.max(ball.slowUntil, currentTime + slowDuration);
  keepSpeed(ball);
}

function pushHeroEffect(type, position, radius, currentTime, color) {
  heroEffectInstances.push({
    type,
    position: { ...position },
    radius,
    color,
    createdAt: currentTime,
    expiresAt: currentTime + 0.55,
  });
}

function updateHeroEffectInstances(effects, currentTime) {
  return effects.filter((effect) => effect.expiresAt > currentTime);
}

function updateItemMode(deltaTime, currentTime) {
  const maxActiveItems = getItemMaxActiveCount(selectedProfessions.ballCount);
  if (droppedItems.length < maxActiveItems && currentTime >= nextItemSpawnTime) {
    spawnDroppedItem(currentTime);
  }

  resolveItemPickups(currentTime);
}

function spawnInitialItems(currentTime) {
  droppedItems = [];
  const initialItemCount = getItemInitialCount(selectedProfessions.ballCount);
  for (let index = 0; index < initialItemCount; index += 1) {
    spawnDroppedItem(currentTime, index);
  }
  nextItemSpawnTime = currentTime + getItemSpawnInterval(selectedProfessions.ballCount);
}

function spawnDroppedItem(currentTime, forcedOffset = 0) {
  const weaponIds = Object.keys(ItemWeaponConfig);
  if (weaponIds.length === 0 || droppedItems.length >= getItemMaxActiveCount(selectedProfessions.ballCount)) {
    return;
  }

  const spawnIndex = itemSpawnCounter + forcedOffset;
  const weaponNoise = terrainNoise(terrainState.seed, spawnIndex + 17, droppedItems.length + 23, 733);
  const weaponId = weaponIds[Math.floor(weaponNoise * weaponIds.length) % weaponIds.length];
  const position = createItemSpawnPosition(spawnIndex);

  droppedItems.push({
    id: `item-${itemSpawnCounter}`,
    weaponId,
    position,
    spawnedAt: currentTime,
  });
  itemSpawnCounter += 1;
  nextItemSpawnTime = currentTime + getItemSpawnInterval(selectedProfessions.ballCount);
}

function createItemSpawnPosition(spawnIndex) {
  const padding = ItemSpawnConfig.edgePadding;
  const span = ARENA_SIZE - padding * 2;

  for (let attempt = 0; attempt < 24; attempt += 1) {
    const x = padding + terrainNoise(terrainState.seed, spawnIndex, attempt, 811) * span;
    const y = padding + terrainNoise(terrainState.seed, spawnIndex, attempt, 823) * span;
    const position = { x, y };
    const tooCloseToBall = balls.some((ball) => {
      return ball.hp > 0 && length(subtract(ball.position, position)) < ItemSpawnConfig.avoidBallRadius;
    });
    if (!tooCloseToBall) {
      return position;
    }
  }

  return {
    x: padding + terrainNoise(terrainState.seed, spawnIndex, 0, 839) * span,
    y: padding + terrainNoise(terrainState.seed, spawnIndex, 0, 853) * span,
  };
}

function resolveItemPickups(currentTime) {
  droppedItems = droppedItems.filter((item) => {
    const picker = balls.find((ball) => {
      return ball.hp > 0 && length(subtract(ball.position, item.position)) <= ball.radius + ItemSpawnConfig.pickupRadius;
    });

    if (!picker) {
      return true;
    }

    equipItemWeapon(picker, item.weaponId, currentTime);
    return false;
  });
}

function equipItemWeapon(ball, weaponId, currentTime) {
  const weapon = ItemWeaponConfig[weaponId];
  if (!weapon) {
    return;
  }

  ball.attackState = null;
  ball.equippedItem = {
    weaponId,
    durability: weapon.durability,
    pickedAt: currentTime,
  };
  ball.lastAttackTime = Math.min(ball.lastAttackTime, currentTime - weapon.cooldown * 0.5);
}

function consumeEquippedItemDurability(ball) {
  if (!ball.equippedItem) {
    return;
  }

  ball.equippedItem.durability -= 1;
  if (ball.equippedItem.durability <= 0) {
    ball.equippedItem = null;
  }
}

function getEquippedItemWeapon(ball) {
  return ball.equippedItem ? ItemWeaponConfig[ball.equippedItem.weaponId] || null : null;
}

function getActiveItemWeaponId(ball) {
  return ball.attackState?.itemWeaponId || ball.equippedItem?.weaponId || null;
}

function getActiveItemWeapon(ball) {
  const weaponId = getActiveItemWeaponId(ball);
  return weaponId ? ItemWeaponConfig[weaponId] || null : null;
}

function getBallAttackCooldown(ball) {
  return getEquippedItemWeapon(ball)?.cooldown || ball.attackCooldown;
}

function getBallWeaponRange(ball) {
  const itemRange = getEquippedItemWeapon(ball)?.range;
  if (itemRange !== undefined) {
    return itemRange;
  }

  if (ball.config.attackMode === "staff") {
    return getWukongStaffRange(ball);
  }

  return ball.weaponRange;
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

  return getAttackAnimationConfig("default");
}

function getItemAttackAnimationConfig(weapon) {
  return {
    duration: weapon.duration || ATTACK_ANIMATION_CONFIG.default.duration,
    hitFrame: weapon.hitFrame || ATTACK_ANIMATION_CONFIG.default.hitFrame,
  };
}

function getItemAttackVariant(weapon, attacker, defender, currentTime) {
  if (weapon.kind !== "spell") {
    return {
      ...weapon,
      itemWeaponId: weapon.id,
      damage: weapon.damage,
    };
  }

  const spells = weapon.spellBook || [];
  const seed = Math.sin((currentTime + attacker.position.x * 0.13 + defender.position.y * 0.17) * 97.3) * 10000;
  const spell = spells[Math.abs(Math.floor(seed)) % spells.length] || null;
  return spell
    ? {
        ...spell,
        itemWeaponId: weapon.id,
        sourceWeaponId: weapon.id,
      }
    : {
        ...weapon,
        itemWeaponId: weapon.id,
    };
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
    color: skill.color,
    knockbackMultiplier: skill.knockbackMultiplier,
  });
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
  resolveSummonedBearCollisionEffects(ballA, ballB, normal, currentTime);
}

function updateAttackForPair(attacker, defender, currentTime) {
  if (["chainSpin", "frostOrbit", "yoyo", "summonBear"].includes(attacker.config.attackMode)) {
    return;
  }

  if (isBallControlLocked(attacker, currentTime)) {
    attacker.attackState = null;
    return;
  }

  updateAttackState(attacker, currentTime);

  const equippedWeapon = getEquippedItemWeapon(attacker);
  const canStartAttack =
    equippedWeapon?.kind === "projectile" ||
    equippedWeapon?.kind === "rocket" ||
    (equippedWeapon?.kind === "spell" && isInAttackRange(attacker, defender)) ||
    attacker.config.attackMode === "projectile" ||
    (attacker.config.attackMode === "cone" && isInHeroConeRange(attacker, defender)) ||
    isInAttackRange(attacker, defender);
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

  if (attackState.itemWeaponId) {
    updateItemAttackState(attacker, currentTime, progress);
  } else if (attacker.config.attackMode === "projectile") {
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
    const defender = attackState.defender;
    const normal = normalize(attackState.direction);
    attackState.didDealDamage = true;
    resolveAttackHit(attacker, defender, normal, currentTime);
  }

  if (currentTime - attackState.startTime >= attackState.duration) {
    attacker.attackState = null;
  }
}

function updateItemAttackState(attacker, currentTime, progress) {
  const attackState = attacker.attackState;
  const weapon = ItemWeaponConfig[attackState.itemWeaponId];
  const defender = attackState.defender;

  if (!weapon) {
    attackState.didDealDamage = true;
    return;
  }

  if ((weapon.kind === "projectile" || weapon.kind === "rocket") && !attackState.didFireProjectile && progress >= attackState.hitFrame) {
    attackState.didFireProjectile = true;
    attackState.didDealDamage = true;
    fireItemProjectile(attacker, defender, weapon, currentTime, attackState.variant);
    return;
  }

  if (weapon.kind === "spell" && !attackState.didCastSpell && progress >= attackState.hitFrame) {
    attackState.didCastSpell = true;
    attackState.didDealDamage = true;
    castItemSpell(attacker, defender, weapon, currentTime, attackState.variant);
    return;
  }

  if (weapon.kind === "melee" && !attackState.didDealDamage && progress >= attackState.hitFrame) {
    const normal = normalize(attackState.direction);
    attackState.didDealDamage = true;
    resolveAttackHit(attacker, defender, normal, currentTime, attackState.variant);
  }
}

function fireProjectile(attacker, defender, currentTime) {
  if (attacker.hp <= 0 || defender.hp <= 0 || !attacker.config.projectileWeapon) {
    return;
  }

  const variant = attacker.attackState?.variant;
  const weapon = variant?.heroSkillId === "fireArrow" ? variant : attacker.config.projectileWeapon;
  const direction = getProjectileAimDirection(attacker, defender, weapon.speed);
  const position = add(attacker.position, scale(direction, attacker.radius + weapon.spawnOffset));
  attacker.attackState.direction = direction;
  attacker.lastAttackTime = currentTime;
  projectiles.push({
    owner: attacker,
    kind: variant?.heroSkillId === "fireArrow" ? "fire" : "arrow",
    position,
    previousPosition: { ...position },
    direction,
    speed: weapon.speed,
    headRadius: weapon.headRadius,
    collisionRadius: weapon.headRadius,
    shaftLength: weapon.shaftLength,
    shaftRadius: 3,
    color: variant?.color || attacker.visual.accentColor,
    darkColor: "#050711",
    featherColor: attacker.visual.color,
    variant: variant || null,
  });
}

function fireItemProjectile(attacker, defender, weapon, currentTime, variant = null) {
  if (attacker.hp <= 0 || defender.hp <= 0 || !weapon) {
    return;
  }

  const direction = getProjectileAimDirection(attacker, defender, weapon.speed);
  const position = add(attacker.position, scale(direction, attacker.radius + (weapon.spawnOffset || 28)));
  attacker.attackState.direction = direction;
  projectiles.push({
    owner: attacker,
    kind: weapon.projectileKind || "bullet",
    position,
    previousPosition: { ...position },
    direction,
    speed: weapon.speed,
    headRadius: weapon.headRadius,
    collisionRadius: weapon.headRadius,
    shaftLength: weapon.shaftLength,
    shaftRadius: weapon.shaftRadius || 4,
    color: weapon.id === "rocket" ? "#ff6b24" : attacker.visual.accentColor,
    darkColor: "#050711",
    featherColor: attacker.visual.color,
    variant: variant || weapon,
    explosionRadius: weapon.explosionRadius || 0,
    explosionDamage: weapon.explosionDamage || 0,
  });
}

function castItemSpell(attacker, defender, weapon, currentTime, variant = null) {
  if (!variant) {
    return;
  }

  if (variant.castType === "trajectory") {
    castMageTrajectorySpell(attacker, defender, variant, currentTime);
    return;
  }

  castMageProjectileSpell(attacker, defender, variant, currentTime);
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
    updateHomingProjectileDirection(projectile);
    projectile.position = add(projectile.position, scale(projectile.direction, projectile.speed * deltaTime));

    if (!isProjectileInArena(projectile)) {
      return false;
    }

    const defender = balls.find((ball) => ball !== projectile.owner && ball.hp > 0 && getProjectileTrajectoryHit(projectile, ball));
    if (!defender) {
      return true;
    }

    resolveAttackHit(projectile.owner, defender, projectile.direction, currentTime, projectile.variant);
    if (projectile.explosionRadius > 0) {
      resolveProjectileExplosion(projectile, currentTime, defender);
    }
    return false;
  });
}

function resolveProjectileExplosion(projectile, currentTime, directHitDefender = null) {
  itemExplosions.push({
    position: { ...projectile.position },
    radius: projectile.explosionRadius,
    createdAt: currentTime,
    expiresAt: currentTime + 0.32,
  });

  for (const ball of balls) {
    if (ball === projectile.owner || ball.hp <= 0) {
      continue;
    }

    const distanceToExplosion = length(subtract(ball.position, projectile.position));
    if (distanceToExplosion > projectile.explosionRadius + ball.radius) {
      continue;
    }

    const damage = ball === directHitDefender ? projectile.explosionDamage * 0.45 : projectile.explosionDamage;
    const appliedDamage = damageBall(ball, damage);
    if (appliedDamage > 0) {
      const normal = normalize(subtract(ball.position, projectile.position));
      ball.velocity = add(ball.velocity, scale(normal, 70));
      keepSpeed(ball);
    }
  }
}

function updateHomingProjectileDirection(projectile) {
  if (!projectile.homingStrength || !projectile.target || projectile.target.hp <= 0) {
    return;
  }

  const desiredDirection = normalize(subtract(projectile.target.position, projectile.position));
  projectile.direction = normalize(lerpVector(projectile.direction, desiredDirection, projectile.homingStrength));
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
      state.rotationAngle = angleOf(normalize(ball.velocity));
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

  bear.boostFlashTime = Math.max(0, bear.boostFlashTime - deltaTime);
  bear.hitFlashTime = Math.max(0, bear.hitFlashTime - deltaTime);
}

function resolveSummonedBearOwnerCollision(owner, bear, currentTime) {
  if (!bear.wasTouchingOwner && currentTime - bear.lastOwnerBoostTime >= owner.config.summonBear.ownerBoostCooldown) {
    bear.damage = Math.min(owner.config.summonBear.maxDamage, bear.damage + owner.config.summonBear.damageGainPerOwnerHit);
    growSummonedBear(owner, bear);
    bear.lastOwnerBoostTime = currentTime;
    bear.boostFlashTime = 0.32;
    triggerBallPendants(owner, CosmeticTrigger.SKILL, currentTime);
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
  bear.hitFlashTime = 0.2;
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

  resolveBatDrain(ballA, ballB, normalFromAToB, currentTime);
  resolveBatDrain(ballB, ballA, scale(normalFromAToB, -1), currentTime);
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
  const position = getWallAnchoredPoint(contact.wall, contact.point, spike.radius);
  arenaHazards.push({
    type: "venomSpike",
    owner: ball,
    wall: contact.wall,
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
  const node = getWallAnchoredPoint(contact.wall, contact.point, web.nodeRadius);
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
    nodeRadius: web.nodeRadius,
    collisionRadius: web.collisionRadius,
    damage: web.damage,
    hitCooldown: web.hitCooldown,
  };
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
  if (tryHeroDodge(defender, attacker, currentTime, attackVariant)) {
    return 0;
  }

  const damage = attacker.dealAttackDamageTo(defender, normalFromAttackerToDefender, attackVariant);
  applyHeroAttackVariantEffects(defender, attackVariant, currentTime);
  applyAttackKnockback(attacker, defender, normalFromAttackerToDefender, damage, attackVariant);
  playHitCosmetics(attacker, defender, normalFromAttackerToDefender, damage, currentTime, attackVariant);
  return damage;
}

function tryHeroDodge(defender, attacker, currentTime, attackVariant = null) {
  if (defender.profession !== "demon" || attackVariant?.heroSkillId === "manaBurn") {
    return false;
  }

  const skill = getHeroSkill(defender, "dodge");
  if (!skill || !canUseHeroSkill(defender, skill, currentTime)) {
    return false;
  }

  const dodgeRoll = terrainNoise(terrainState.seed, Math.floor(currentTime * 100), defender.label.charCodeAt(0), 991);
  if (dodgeRoll > skill.chance) {
    return false;
  }

  spendHeroSkill(defender, skill, currentTime);
  const sidestep = normalize({ x: -attacker.velocity.y, y: attacker.velocity.x });
  defender.velocity = add(defender.velocity, scale(sidestep, defender.config.moveSpeed * 0.62));
  keepSpeed(defender);
  pushHeroEffect("dodge", defender.position, 76, currentTime, defender.visual.accentColor);
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
  if (attacker.hp <= 0 || defender.hp <= 0) {
    return false;
  }

  const attackReach = attacker.radius + defender.radius + getBallWeaponRange(attacker);
  return length(subtract(defender.position, attacker.position)) <= attackReach;
}

function isInHeroConeRange(attacker, defender) {
  if (attacker.hp <= 0 || defender.hp <= 0) {
    return false;
  }

  const toDefender = subtract(defender.position, attacker.position);
  const distanceToDefender = length(toDefender);
  if (distanceToDefender > attacker.radius + defender.radius + attacker.weaponRange) {
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

  const normal = getDirectionBetween(attacker, defender);
  return resolveAttackHit(attacker, defender, normal, currentTime, {
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

    const attackVariant = createWukongStaffAttackVariant(attacker, staff.effect, staff.index);
    totalDamage += resolveAttackHit(attacker, defender, staff.hit.normal, currentTime, attackVariant);
  }

  return totalDamage;
}

function createWukongStaffAttackVariant(attacker, effect, staffIndex) {
  if (!effect) {
    return null;
  }

  return {
    heroSkillId: effect.id,
    heroId: attacker.profession,
    isSkillHit: true,
    damage: Math.max(1, Math.round(attacker.attackDamage * effect.damageMultiplier)),
    knockbackMultiplier: effect.knockbackMultiplier || attacker.config.getKnockbackMultiplier(),
    staffIndex,
  };
}

function getActiveWukongStaffEffect(ball, currentTime = elapsedTimeSeconds) {
  return getActiveHeroSkillEffect(ball, "tripleStaff", currentTime) || getActiveHeroSkillEffect(ball, "giantStaff", currentTime);
}

function getWukongStaffRange(ball, currentTime = elapsedTimeSeconds) {
  const effect = getActiveHeroSkillEffect(ball, "giantStaff", currentTime);
  return ball.weaponRange * (effect?.rangeMultiplier || 1);
}

function getWukongStaffSegments(ball, currentTime = elapsedTimeSeconds, renderDirection = null, renderProgress = null) {
  const effect = getActiveWukongStaffEffect(ball, currentTime);
  const attackState = ball.attackState;
  const direction = normalize(renderDirection || attackState?.direction || ball.velocity);
  const progress = renderProgress ?? getAttackProgress(ball, currentTime);
  const staffCount = effect?.staffCount || 1;
  const spreadAngle = effect?.spreadAngle || 0;
  const baseAngle = angleOf(direction);
  const staffConfig = getAttackAnimationConfig("staff");
  const swingProgress = getWukongStaffSwingProgress(progress, currentTime);
  const swingAngle = baseAngle - staffConfig.sweepAngle / 2 + staffConfig.sweepAngle * swingProgress;
  const side = vectorFromAngle(swingAngle + Math.PI * 0.5);
  const offsets = staffCount === 3 ? [-spreadAngle, 0, spreadAngle] : [0];
  const range = getWukongStaffRange(ball, currentTime);

  return offsets.map((angleOffset, index) => {
    const staffDirection = vectorFromAngle(swingAngle + angleOffset);
    const sideOffset = staffCount === 3 ? (index - 1) * ball.radius * 0.48 : 0;
    const base = add(ball.position, scale(side, sideOffset));
    const start = subtract(base, scale(staffDirection, ball.radius * 0.72));
    const end = add(base, scale(staffDirection, ball.radius + range));

    return {
      index,
      effect,
      direction: staffDirection,
      start,
      end,
      hitRadius: effect?.id === "giantStaff" ? 14 : 10,
    };
  });
}

function getWukongStaffSwingProgress(progress, currentTime) {
  if (progress === null) {
    return clamp(0.5 + Math.sin(currentTime * 3.4) * 0.08, 0.38, 0.62);
  }

  return easeOutCubic(progress);
}

function getWukongStaffSwingHits(attacker, defender, currentTime) {
  const attackState = attacker.attackState;
  const currentProgress = attackState ? getAttackProgressFromState(attackState, currentTime) : 1;
  const sampleStart = 0;
  const sampleEnd = clamp(currentProgress, 0, 1);
  const sampleCount = 7;
  const hitsByStaff = new Map();

  for (let index = 0; index <= sampleCount; index += 1) {
    const sampleProgress = lerp(sampleStart, sampleEnd, index / sampleCount);
    for (const staff of getWukongStaffSegments(attacker, currentTime, attackState?.direction, sampleProgress)) {
      if (hitsByStaff.has(staff.index)) {
        continue;
      }

      const hit = getSegmentCircleHit(defender.position, defender.radius + staff.hitRadius, staff.start, staff.end);
      if (hit) {
        hitsByStaff.set(staff.index, {
          ...staff,
          hit,
        });
      }
    }
  }

  return [...hitsByStaff.values()];
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
  createDamageIndicator(ball, appliedDamage);
  tryHeroRebirth(ball, elapsedTimeSeconds);
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
  ball.attackDisabledUntil = currentTime + 0.35;
  pushHeroEffect("rebirth", ball.position, 150, currentTime, ball.visual.accentColor);
  return true;
}

function createDamageIndicator(ball, amount) {
  if (!ball || amount <= 0) {
    return;
  }

  const currentTime = elapsedTimeSeconds;
  const existingIndicator = damageIndicators.find((indicator) => {
    return (
      indicator.ball === ball &&
      indicator.expiresAt > currentTime &&
      currentTime - indicator.updatedAt <= DAMAGE_TEXT_MERGE_WINDOW
    );
  });

  if (existingIndicator) {
    existingIndicator.amount += amount;
    existingIndicator.createdAt = currentTime;
    existingIndicator.updatedAt = currentTime;
    existingIndicator.expiresAt = currentTime + DAMAGE_TEXT_DURATION;
    return;
  }

  const direction = ball.label === "A" ? -1 : 1;
  const alternatingOffset = damageIndicators.length % 2 === 0 ? 0 : direction * 10;
  damageIndicators.push({
    ball,
    amount,
    createdAt: currentTime,
    updatedAt: currentTime,
    expiresAt: currentTime + DAMAGE_TEXT_DURATION,
    offsetX: alternatingOffset,
  });
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
  const slowMultiplier = ball.slowUntil > elapsedTimeSeconds ? ball.slowMultiplier : 1;
  if (ball.slowUntil <= elapsedTimeSeconds) {
    ball.slowMultiplier = 1;
  }

  return ball.config.moveSpeed * getSpeedMultiplier(matchElapsedTimeSeconds) * slowMultiplier;
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

function getYoyoWeaponGeometry(ball, currentTime = elapsedTimeSeconds) {
  const weapon = ball.config.yoyoWeapon;
  const state = ball.yoyoWeaponState;
  const idleDirection = normalize(ball.velocity);
  const direction = state && state.phase !== "idle" ? vectorFromAngle(state.rotationAngle) : idleDirection;
  const extension = getYoyoWeaponExtension(ball, currentTime);
  const distance = lerp(ball.radius + weapon.headRadius * 0.55, weapon.orbitRadius, extension);

  return {
    direction,
    start: add(ball.position, scale(direction, ball.radius * 0.68)),
    head: add(ball.position, scale(direction, distance)),
    headRadius: weapon.headRadius,
    lineRadius: weapon.lineRadius,
    extension,
    active: state?.phase !== "idle",
  };
}

function getYoyoWeaponExtension(ball, currentTime = elapsedTimeSeconds) {
  const state = ball.yoyoWeaponState;
  const weapon = ball.config.yoyoWeapon;
  if (!state || state.phase === "idle") {
    return 0;
  }

  const phaseElapsed = currentTime - state.phaseStartedAt;
  if (state.phase === "out") {
    return easeOutCubic(phaseElapsed / weapon.extendDuration);
  }

  if (state.phase === "in") {
    return 1 - easeInCubic(phaseElapsed / weapon.retractDuration);
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

function getYoyoWeaponWallContact(ball, currentTime = elapsedTimeSeconds) {
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
  const progress = getAttackProgress(ball, currentTime);
  const attackConfig = getAttackAnimationConfig("reaper");
  const swingProgress = progress === null ? 0.55 : easeOutCubic(progress);
  const baseAngle = angleOf(direction);
  const bladeAngle = baseAngle - attackConfig.sweepAngle / 2 + attackConfig.sweepAngle * swingProgress;
  const bladeDirection = vectorFromAngle(bladeAngle);
  const side = vectorFromAngle(bladeAngle - Math.PI * 0.5);
  const socket = add(ball.position, scale(bladeDirection, ball.radius + ball.weaponRange * 0.48));
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
  const itemWeapon = getActiveItemWeapon(attacker);
  if ((itemWeapon?.kind === "projectile" || itemWeapon?.kind === "rocket") && itemWeapon.speed) {
    return getProjectileAimDirection(attacker, defender, itemWeapon.speed);
  }

  if (itemWeapon?.kind === "spell" && variant?.castType === "projectile") {
    return getProjectileAimDirection(attacker, defender, variant.speed);
  }

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
  if (isCurrentItemMode()) {
    const aliveBalls = balls.filter((ball) => ball.hp > 0);
    if (aliveBalls.length > 1) {
      return;
    }

    gameOver = true;
    resultMessage = aliveBalls.length === 0 ? t("result.draw") : t("result.winnerNoProfession", { side: getSideLabel(aliveBalls[0].label) });
    analytics.track("game_result", {
      result: resultMessage,
      scene: selectedProfessions.scene,
      ballCount: selectedProfessions.ballCount,
    });
    setScreen(Screen.RESULT);
    return;
  }

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
  professionScrollArea = null;
  professionScrollInputArea = null;
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
  y += drawLanguageSelector(panel.x + 28, y, panel.width - 56) + 18;
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
  const panel = getPanelRect(620, 210);
  drawPanel(panel);

  let y = panel.y + 38;
  drawButton(t("main.start"), panel.x + 28, y, panel.width - 56, 52, openMatchSetup, { id: "main-start" });
  y += 70;
  drawButton(t("main.settings"), panel.x + 28, y, panel.width - 56, 46, () => setScreen(Screen.SETTINGS), { id: "main-settings" });
}

function drawProfessionSelectScreen() {
  const panel = getPanelRect(820, 610);
  drawAppTitle(panel.y - 22, t("setup.subtitle"));
  drawPanel(panel);

  let y = panel.y + 24;
  drawSetupSceneRow(panel.x + 28, y, panel.width - 56);
  y += 88;
  const actionY = panel.y + panel.height - 70;

  if (isCurrentItemMode()) {
    drawItemModeSetup(panel, y, actionY);
    drawSetupActionButtons(panel, actionY);
    drawSceneDropdownOverlay();
    return;
  }

  const tabWidth = (panel.width - 68) / 2;
  drawButton(`${getSideLabel("a")}: ${getProfessionName(selectedProfessions.a)}`, panel.x + 28, y, tabWidth, 42, () => {
    setActiveProfessionSide("a");
  }, { active: activeProfessionSide === "a", id: "setup-side-a" });
  drawButton(`${getSideLabel("b")}: ${getProfessionName(selectedProfessions.b)}`, panel.x + 40 + tabWidth, y, tabWidth, 42, () => {
    setActiveProfessionSide("b");
  }, { active: activeProfessionSide === "b", id: "setup-side-b" });
  y += 62;

  drawListHeader(t("setup.professionHeader", { side: getSideLabel(activeProfessionSide) }), panel.x + 28, y, panel.width - 56);
  y += 30;

  const gridGap = 12;
  const gridWidth = panel.width - 56;
  const gridBottom = actionY - 20;
  const gridArea = {
    x: panel.x + 28,
    y,
    width: gridWidth,
    height: Math.max(0, gridBottom - y),
  };
  const columns = panel.width >= 520 ? 3 : 2;
  const activeProfessionIds = getActiveProfessionIds();
  const rows = Math.ceil(activeProfessionIds.length / columns);
  const cellWidth = (gridWidth - gridGap * (columns - 1)) / columns;
  const cellHeight = getProfessionGridCellHeight(gridArea.height, rows, gridGap, panel.width, selectedProfessions.scene);
  const contentHeight = rows * cellHeight + Math.max(0, rows - 1) * gridGap;
  const maxScroll = Math.max(0, contentHeight - gridArea.height);
  professionScrollOffset = clamp(professionScrollOffset, 0, maxScroll);
  professionScrollArea = { ...gridArea, maxScroll };
  professionScrollInputArea = {
    x: gridArea.x,
    y: y - 30,
    width: gridArea.width,
    height: gridArea.height + 30,
    maxScroll,
  };

  ctx.save();
  ctx.beginPath();
  ctx.rect(gridArea.x, gridArea.y, gridArea.width, gridArea.height);
  ctx.clip();
  activeProfessionIds.forEach((professionId, index) => {
    const column = index % columns;
    const row = Math.floor(index / columns);
    drawProfessionGridItem(
      gridArea.x + column * (cellWidth + gridGap),
      gridArea.y + row * (cellHeight + gridGap) - professionScrollOffset,
      cellWidth,
      cellHeight,
      professionId,
      { clipRect: gridArea },
    );
  });
  ctx.restore();
  drawProfessionScrollFrame(gridArea, maxScroll);

  drawSetupActionButtons(panel, actionY);
  drawSceneDropdownOverlay();
}

function drawSetupActionButtons(panel, actionY) {
  drawButton(t("setup.saveBack"), panel.x + 28, actionY, (panel.width - 68) / 2, 46, () => {
    selectedProfessions = complianceState.saveSelectedProfessions(selectedProfessions);
    setScreen(Screen.MAIN_MENU);
  }, { id: "setup-save-back" });
  drawButton(t("setup.start"), panel.x + 40 + (panel.width - 68) / 2, actionY, (panel.width - 68) / 2, 46, startGame, { id: "setup-start" });
}

function drawItemModeSetup(panel, y, actionY) {
  drawListHeader(t("setup.itemModeHeader"), panel.x + 28, y, panel.width - 56);
  y += 34;
  y = drawWrappedText(t("setup.itemModeDescription"), panel.x + 28, y, panel.width - 56, 20, COLORS.text, 14);
  y += 18;

  const previewArea = {
    x: panel.x + 28,
    y,
    width: panel.width - 56,
    height: Math.max(120, actionY - y - 22),
  };
  drawItemWeaponPreviewGrid(previewArea);
}

function drawSettingsScreen() {
  const panel = getPanelRect(660, 620);
  drawAppTitle(panel.y - 22, t("settings.subtitle"));
  drawPanel(panel);

  let y = panel.y + 28;
  drawPanelTitle(t("settings.languageTitle"), panel.x + 28, y, panel.width - 56);
  y += 36;
  y += drawLanguageSelector(panel.x + 28, y, panel.width - 56) + 18;
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
  const buttonHeight = 34;
  const minButtonWidth = 66;
  const columns = clamp(Math.floor((width + gap) / (minButtonWidth + gap)), 2, options.length);
  const rows = Math.ceil(options.length / columns);
  const buttonWidth = (width - gap * (columns - 1)) / columns;

  options.forEach((option, index) => {
    const column = index % columns;
    const row = Math.floor(index / columns);
    drawButton(option.label, x + column * (buttonWidth + gap), y + row * (buttonHeight + gap), buttonWidth, buttonHeight, () => setLocale(option.locale), {
      active: currentLocale === option.locale,
      id: `locale-${option.locale}`,
    });
  });

  return rows * buttonHeight + Math.max(0, rows - 1) * gap;
}

function drawSetupSceneRow(x, y, width) {
  const useDropdown = width < SCENE_DROPDOWN_BREAKPOINT && sceneIds.length > 2;
  if (useDropdown) {
    sceneDropdownLayout = {
      x,
      y,
      width,
      height: 68,
    };
    drawSceneDropdownTrigger(sceneDropdownLayout);
    return;
  }

  sceneDropdownLayout = null;
  const gap = 12;
  const cardWidth = (width - gap * (sceneIds.length - 1)) / sceneIds.length;
  const compact = width < 520 && sceneIds.length > 2;

  sceneIds.forEach((sceneId, index) => {
    const cardX = x + index * (cardWidth + gap);
    const selected = selectedProfessions.scene === sceneId;
    const iconSize = compact ? 24 : 32;
    const iconX = isRtlLocale(currentLocale)
      ? cardX + cardWidth - iconSize - 12
      : cardX + (compact ? 10 : 16);
    const textX = isRtlLocale(currentLocale) ? cardX + cardWidth - 12 : cardX + (compact ? 42 : 62);
    const textWidth = compact ? cardWidth - 54 : cardWidth - 78;

    ctx.save();
    drawPixelFrame(cardX, y, cardWidth, 68, {
      fill: selected ? "#12364b" : "#111a2f",
      border: selected ? "#4bcfff" : "#4b5f8a",
      shadow: "#050711",
      texture: selected ? voxelAssets.blocks.glowstone : voxelAssets.blocks.deepslate,
    });
    drawPixelArenaIcon(iconX, y + (compact ? 22 : 18), iconSize, sceneId);

    ctx.fillStyle = COLORS.muted;
    ctx.font = canvasFont(compact ? 10 : 12, 800);
    setCanvasDirection(ctx);
    ctx.textAlign = getTextAlignStart();
    ctx.textBaseline = "top";
    ctx.fillText(t("setup.sceneLabel"), textX, y + (compact ? 9 : 10));

    ctx.fillStyle = COLORS.text;
    const sceneName = getSceneName(sceneId);
    ctx.font = canvasFont(getFittedFontSize(sceneName, textWidth, compact ? 13 : 16, 9, 900), 900);
    ctx.fillText(sceneName, textX, y + (compact ? 25 : 26));

    ctx.fillStyle = COLORS.muted;
    ctx.font = canvasFont(compact ? 10 : 12, 700);
    drawSingleLineText(getSceneDescription(sceneId), isRtlLocale(currentLocale) ? cardX + 12 : textX, y + 48, textWidth);
    ctx.restore();

    addInteractiveElement({
      id: `scene-${sceneId}`,
      rect: { x: cardX, y, width: cardWidth, height: 68 },
      action: () => setSelectedScene(sceneId),
    });
  });
}

function drawSceneDropdownTrigger(rect) {
  const sceneId = selectedProfessions.scene;
  const iconSize = 32;
  const arrowSize = 28;
  const iconX = isRtlLocale(currentLocale) ? rect.x + rect.width - iconSize - 16 : rect.x + 16;
  const arrowX = isRtlLocale(currentLocale) ? rect.x + 14 : rect.x + rect.width - arrowSize - 14;
  const textX = isRtlLocale(currentLocale) ? rect.x + rect.width - 60 : rect.x + 62;
  const textEndPadding = isRtlLocale(currentLocale) ? 62 : 58;
  const textWidth = rect.width - textEndPadding - 62;

  ctx.save();
  drawPixelFrame(rect.x, rect.y, rect.width, rect.height, {
    fill: "#12364b",
    border: sceneDropdownOpen ? "#d9aa55" : "#4bcfff",
    shadow: "#050711",
    texture: sceneDropdownOpen ? voxelAssets.blocks.glowstone : voxelAssets.blocks.deepslate,
  });
  drawPixelArenaIcon(iconX, rect.y + 18, iconSize, sceneId);

  setCanvasDirection(ctx);
  ctx.textAlign = getTextAlignStart();
  ctx.textBaseline = "top";
  ctx.fillStyle = COLORS.muted;
  ctx.font = canvasFont(12, 800);
  ctx.fillText(t("setup.sceneLabel"), getTextStartX(textX, textWidth), rect.y + 10);

  ctx.fillStyle = COLORS.text;
  const sceneName = getSceneName(sceneId);
  ctx.font = canvasFont(getFittedFontSize(sceneName, textWidth, 18, 12, 900), 900);
  drawSingleLineText(sceneName, textX, rect.y + 27, textWidth);

  ctx.fillStyle = COLORS.muted;
  ctx.font = canvasFont(11, 700);
  drawSingleLineText(getSceneDescription(sceneId), textX, rect.y + 49, textWidth);

  drawPixelFrame(arrowX, rect.y + 20, arrowSize, arrowSize, {
    fill: sceneDropdownOpen ? "#d9aa55" : "#202834",
    border: sceneDropdownOpen ? "#fff4cf" : "#5c6462",
    shadow: "#050711",
    texture: voxelAssets.blocks.deepslate,
  });
  drawDropdownChevron(arrowX + arrowSize / 2, rect.y + arrowSize / 2 + 20, sceneDropdownOpen);
  ctx.restore();

  addInteractiveElement({
    id: "scene-dropdown-toggle",
    rect,
    action: () => {
      sceneDropdownOpen = !sceneDropdownOpen;
    },
  });
}

function drawSceneDropdownOverlay() {
  if (!sceneDropdownOpen || !sceneDropdownLayout) {
    return;
  }

  addInteractiveElement({
    id: "scene-dropdown-backdrop",
    rect: { x: 0, y: 0, width: viewport.width, height: viewport.height },
    action: () => {
      sceneDropdownOpen = false;
    },
  });

  const gap = 6;
  const panelPadding = 8;
  const top = sceneDropdownLayout.y + sceneDropdownLayout.height + 8;
  const maxOptionHeight = 54;
  const availableHeight = Math.max(44, viewport.height - top - 16 - panelPadding * 2);
  const optionHeight = clamp(Math.floor((availableHeight - gap * (sceneIds.length - 1)) / sceneIds.length), 44, maxOptionHeight);
  const panelHeight = panelPadding * 2 + sceneIds.length * optionHeight + gap * (sceneIds.length - 1);

  ctx.save();
  drawPixelFrame(sceneDropdownLayout.x, top, sceneDropdownLayout.width, panelHeight, {
    fill: "#111a2f",
    border: "#d9aa55",
    shadow: "#050711",
    texture: voxelAssets.blocks.deepslate,
  });

  sceneIds.forEach((sceneId, index) => {
    const optionY = top + panelPadding + index * (optionHeight + gap);
    drawSceneDropdownOption(sceneId, sceneDropdownLayout.x + panelPadding, optionY, sceneDropdownLayout.width - panelPadding * 2, optionHeight);
  });
  ctx.restore();
}

function drawSceneDropdownOption(sceneId, x, y, width, height) {
  const selected = selectedProfessions.scene === sceneId;
  const iconSize = Math.min(30, height - 14);
  const iconX = isRtlLocale(currentLocale) ? x + width - iconSize - 10 : x + 10;
  const textX = isRtlLocale(currentLocale) ? x + width - 52 : x + 52;
  const textWidth = width - 62;

  drawPixelFrame(x, y, width, height, {
    fill: selected ? "#384f2b" : "#202834",
    border: selected ? "#d9aa55" : "#5c6462",
    shadow: "#050711",
    texture: selected ? voxelAssets.blocks.grassDark : voxelAssets.blocks.deepslate,
  });
  drawPixelArenaIcon(iconX, y + (height - iconSize) / 2, iconSize, sceneId);

  setCanvasDirection(ctx);
  ctx.textAlign = getTextAlignStart();
  ctx.textBaseline = "middle";
  ctx.fillStyle = COLORS.text;
  ctx.font = canvasFont(getFittedFontSize(getSceneName(sceneId), textWidth, 15, 10, 900), 900);
  ctx.fillText(getSceneName(sceneId), getTextStartX(textX, textWidth), y + height / 2 - 7);

  ctx.fillStyle = COLORS.muted;
  ctx.font = canvasFont(10, 700);
  drawSingleLineText(getSceneDescription(sceneId), textX, y + height / 2 + 6, textWidth);

  addInteractiveElement({
    id: `scene-dropdown-${sceneId}`,
    rect: { x, y, width, height },
    action: () => setSelectedScene(sceneId),
  });
}

function drawDropdownChevron(centerX, centerY, isOpen) {
  const direction = isOpen ? -1 : 1;
  ctx.strokeStyle = isOpen ? "#20160c" : COLORS.text;
  ctx.lineWidth = 4;
  ctx.lineCap = "square";
  ctx.beginPath();
  ctx.moveTo(centerX - 7, centerY - direction * 3);
  ctx.lineTo(centerX, centerY + direction * 5);
  ctx.lineTo(centerX + 7, centerY - direction * 3);
  ctx.stroke();
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

function getProfessionGridCellHeight(availableHeight, rows, gap, panelWidth, sceneId = selectedProfessions.scene) {
  if (rows <= 0) {
    return 0;
  }

  if (shouldUseScrollableProfessionGrid(sceneId, rows, panelWidth)) {
    return panelWidth < 520 ? 112 : 124;
  }

  const fittedHeight = (availableHeight - gap * (rows - 1)) / rows;
  if (fittedHeight >= 88) {
    return clamp(fittedHeight, 88, 142);
  }

  return panelWidth < 520 ? 104 : 112;
}

function shouldUseScrollableProfessionGrid(sceneId, rows, panelWidth) {
  return panelWidth < 560 && rows >= 3 && !isItemScene(sceneId);
}

function drawProfessionScrollFrame(area, maxScroll) {
  if (area.height <= 0) {
    return;
  }

  ctx.save();
  ctx.lineWidth = 2;
  ctx.strokeStyle = "rgba(255, 246, 214, 0.22)";
  ctx.strokeRect(area.x + 1, area.y + 1, area.width - 2, area.height - 2);

  if (maxScroll > 0 && area.height > 34) {
    const trackWidth = 5;
    const trackX = isRtlLocale(currentLocale) ? area.x + 8 : area.x + area.width - 13;
    const trackY = area.y + 8;
    const trackHeight = area.height - 16;
    const thumbHeight = clamp((area.height / (area.height + maxScroll)) * trackHeight, 24, trackHeight);
    const thumbY = trackY + (professionScrollOffset / maxScroll) * (trackHeight - thumbHeight);

    ctx.fillStyle = "rgba(5, 7, 17, 0.62)";
    ctx.fillRect(trackX, trackY, trackWidth, trackHeight);
    ctx.fillStyle = "#d9aa55";
    ctx.fillRect(trackX, thumbY, trackWidth, thumbHeight);
  }
  ctx.restore();
}

function drawProfessionGridItem(x, y, width, height, professionId, options = {}) {
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
    clipRect: options.clipRect,
    action: () => {
      selectedProfessions = {
        ...selectedProfessions,
        [activeProfessionSide]: professionId,
      };
      serviceMessage = t("messages.selectedProfession", { side: sideLabel, profession: professionName });
    },
  });
}

function drawItemWeaponPreviewGrid(area) {
  const weaponIds = Object.keys(ItemWeaponConfig);
  const gap = 10;
  const columns = area.width >= 520 ? 3 : 2;
  const cellWidth = (area.width - gap * (columns - 1)) / columns;
  const rows = Math.ceil(weaponIds.length / columns);
  const cellHeight = Math.min(88, (area.height - gap * Math.max(0, rows - 1)) / rows);

  weaponIds.forEach((weaponId, index) => {
    const weapon = ItemWeaponConfig[weaponId];
    const column = index % columns;
    const row = Math.floor(index / columns);
    const x = area.x + column * (cellWidth + gap);
    const y = area.y + row * (cellHeight + gap);

    drawPixelFrame(x, y, cellWidth, cellHeight, {
      fill: "#202834",
      border: "#5c6462",
      shadow: "#050711",
      texture: voxelAssets.blocks.deepslate,
    });
    drawItemWeaponIcon(weapon, x + 18, y + 14, Math.min(42, cellHeight - 32));
    ctx.save();
    ctx.fillStyle = COLORS.text;
    ctx.font = canvasFont(getFittedFontSize(t(weapon.nameKey), cellWidth - 70, 15, 10, 900), 900);
    setCanvasDirection(ctx);
    ctx.textAlign = getTextAlignStart();
    ctx.textBaseline = "middle";
    ctx.fillText(t(weapon.nameKey), getTextStartX(x + 66, cellWidth - 78), y + cellHeight / 2 - 8);
    ctx.fillStyle = COLORS.muted;
    ctx.font = canvasFont(11, 700);
    const statText = `x${weapon.durability} / ${weapon.damage}`;
    ctx.fillText(statText, getTextStartX(x + 66, cellWidth - 78), y + cellHeight / 2 + 13);
    ctx.restore();
  });
}

function drawDroppedItems(context, currentTime) {
  if (!isCurrentItemMode()) {
    return;
  }

  for (const item of droppedItems) {
    const weapon = ItemWeaponConfig[item.weaponId];
    if (!weapon) {
      continue;
    }

    const bob = Math.sin((currentTime - item.spawnedAt) * 5.2) * 4;
    const size = 44;
    const x = item.position.x - size / 2;
    const y = item.position.y - size / 2 + bob;
    context.save();
    context.globalAlpha = 0.92;
    drawPixelFrame(x, y, size, size, {
      fill: "#111a2f",
      border: "#d9aa55",
      shadow: "#050711",
      texture: voxelAssets.blocks.glowstone,
    });
    drawItemWeaponIcon(weapon, x + 8, y + 8, size - 16);
    context.restore();
  }
}

function drawItemWeaponIcon(weapon, x, y, size) {
  const sprite = voxelAssets.items[weapon.sprite] || voxelAssets.items.sword;
  drawRotatedVoxelSprite(ctx, sprite, { x: x + size / 2, y: y + size / 2 }, size, -0.42, {
    shadowOffset: 2,
  });
}

function drawEquippedItemDurability(context, ball) {
  const weapon = getEquippedItemWeapon(ball);
  if (!weapon) {
    return;
  }

  const text = `x${ball.equippedItem.durability}`;
  context.save();
  context.font = canvasFont(14, 900);
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.strokeStyle = "rgba(5, 7, 17, 0.95)";
  context.lineWidth = 5;
  context.fillStyle = "#ffd166";
  context.strokeText(text, ball.position.x, ball.position.y + ball.radius + 20);
  context.fillText(text, ball.position.x, ball.position.y + ball.radius + 20);
  context.restore();
}

function drawHeroManaBar(context, ball) {
  const width = ball.radius * 2.2;
  const height = 7;
  const x = ball.position.x - width / 2;
  const y = ball.position.y + ball.radius + 31;
  const ratio = clamp(ball.mp / Math.max(1, ball.maxMp), 0, 1);

  context.save();
  context.fillStyle = "rgba(5, 7, 17, 0.9)";
  context.fillRect(x - 2, y - 2, width + 4, height + 4);
  context.fillStyle = "#0c2f5f";
  context.fillRect(x, y, width, height);
  context.fillStyle = "#38bdf8";
  context.fillRect(x, y, width * ratio, height);
  context.fillStyle = "#dffcff";
  context.fillRect(x, y, Math.max(0, width * ratio - 3), 2);
  context.restore();
}

function drawPixelArenaIcon(x, y, size, sceneId = selectedProfessions.scene) {
  const cell = Math.max(2, Math.floor(size / 8));
  const iconSize = cell * 8;
  if (sceneId === ITEM_SCENE_ID) {
    drawTiledVoxelTexture(ctx, voxelAssets.blocks.plank, x, y, iconSize, iconSize, cell * 4);
    ctx.fillStyle = "#050711";
    ctx.fillRect(x + cell, y + cell, cell * 6, cell * 6);
    drawItemWeaponIcon(ItemWeaponConfig.sword, x + cell * 1.2, y + cell * 1.2, cell * 5.6);
    return;
  }
  if (sceneId === HERO_SCENE_ID) {
    drawTiledVoxelTexture(ctx, voxelAssets.blocks.obsidian, x, y, iconSize, iconSize, cell * 4);
    ctx.fillStyle = "#0c2f5f";
    ctx.fillRect(x + cell, y + cell, cell * 6, cell * 6);
    ctx.fillStyle = "#38bdf8";
    ctx.fillRect(x + cell * 2, y + cell * 3, cell * 4, cell * 2);
    ctx.fillStyle = "#facc15";
    ctx.fillRect(x + cell * 3, y + cell, cell * 2, cell * 6);
    ctx.fillStyle = "#ff7a45";
    ctx.fillRect(x + cell, y + cell, cell, cell);
    ctx.fillRect(x + cell * 6, y + cell * 6, cell, cell);
    return;
  }
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
  const config = getCombatantConfig(professionId);
  if (!config) {
    return;
  }

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

  if (isHeroId(professionId)) {
    drawHeroProfessionIconDetails(professionId, left, top, cell);
  } else if (professionId === "bat") {
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
  } else if (professionId === "yoyo") {
    drawPixelCells(left, top, cell, [
      "................",
      ".....YYYY.......",
      "....YPPPYY......",
      "...YPWYWYPP.....",
      "....YPPPYY......",
      ".....YYYY.......",
      "........SSSS....",
    ], {
      P: "#ff7ab6",
      Y: "#fff1a8",
      W: "#ffffff",
      S: "#fff1a8",
    });
  } else if (professionId === "summoner") {
    drawPixelCells(left, top, cell, [
      "................",
      "..BB........BB..",
      ".BBBB......BBBB.",
      "...BBBBBBBBBB...",
      "....BBMMMMBB....",
      "......NNNN......",
      "....YYYYYYYY....",
    ], {
      B: "#5b3a24",
      M: "#d6a35f",
      N: "#050711",
      Y: "#fde68a",
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

function drawHeroProfessionIconDetails(professionId, left, top, cell) {
  if (professionId === "demon") {
    drawPixelCells(left, top, cell, [
      "................",
      "..HH........HH..",
      ".HHH........HHH.",
      "..H...RRRR...H..",
      "......R..R......",
      ".....MMMMMM.....",
      ".......MM.......",
    ], {
      H: "#050711",
      R: "#ff385c",
      M: "#ffd166",
    });
    return;
  }

  if (professionId === "dwarfKing") {
    drawPixelCells(left, top, cell, [
      "................",
      "....CCCCCCCC....",
      "...CYYYYYYYYC...",
      ".....EEEEEE.....",
      "....BBBBBBBB....",
      "...BBBBBBBBBB...",
      ".....MMMMMM.....",
    ], {
      C: "#050711",
      Y: "#fde68a",
      E: "#f8fbff",
      B: "#6b3419",
      M: "#b8bdc7",
    });
    return;
  }

  if (professionId === "minotaur") {
    drawPixelCells(left, top, cell, [
      ".HH..........HH.",
      "..HH........HH..",
      "...H........H...",
      "......EEEE......",
      ".....SSSSSS.....",
      "......SSSS......",
      ".....YYYYYY.....",
    ], {
      H: "#f8fbff",
      E: "#050711",
      S: "#c76f36",
      Y: "#facc15",
    });
    return;
  }

  if (professionId === "elfKing") {
    drawPixelCells(left, top, cell, [
      "................",
      "....LLLLLLLL....",
      "...LYLYLYLYL....",
      "......EEEE......",
      "....VVVVVVVV....",
      "...V........V...",
      ".......YY.......",
    ], {
      L: "#bbf7d0",
      Y: "#facc15",
      E: "#050711",
      V: "#14532d",
    });
    return;
  }

  if (professionId === "wukong") {
    drawPixelCells(left, top, cell, [
      "................",
      "....GGGGGGGG....",
      "...GRRRRRRRG....",
      ".....EEEEEE.....",
      "....MMMMMMMM....",
      "...MMYYYYMM.....",
      ".....RRRRRR.....",
    ], {
      G: "#facc15",
      R: "#dc2626",
      E: "#050711",
      M: "#92400e",
      Y: "#fde68a",
    });
  }
}

function getProfessionItemSprite(professionId) {
  const items = voxelAssets.items;
  const itemMap = {
    demon: { sprite: items.dagger, angle: -0.72, scale: 0.76 },
    dwarfKing: { sprite: items.hammer, angle: -0.72, scale: 0.78 },
    minotaur: { sprite: items.totem, angle: -0.42, scale: 0.68 },
    elfKing: { sprite: items.bow, angle: 0, scale: 0.7 },
    wukong: { sprite: items.goldStaff, angle: -0.48, scale: 0.86 },
    bat: null,
    venom: null,
    spider: null,
    lava: null,
    reaper: { sprite: items.sword, angle: -0.78, scale: 0.92 },
    frost: { sprite: items.iceShard, angle: -0.38, scale: 0.62 },
    yoyo: { sprite: items.yoyo, angle: -0.28, scale: 0.58 },
    summoner: { sprite: items.totem, angle: -0.3, scale: 0.58 },
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
    lines.push(...wrapWords(paragraph, maxWidth));
  }

  ctx.restore();
  return lines;
}

function wrapWords(paragraph, maxWidth) {
  const words = getWrapTokens(paragraph);
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

function getWrapTokens(paragraph) {
  return (
    String(paragraph).match(
      /[\u3400-\u9fff\u3040-\u30ff\uac00-\ud7af]|[^\s\u3400-\u9fff\u3040-\u30ff\uac00-\ud7af]+|\s+/g,
    ) || [""]
  );
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
    if (isInsideRect(point, element.rect) && (!element.clipRect || isInsideRect(point, element.clipRect))) {
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

function drawSummonedBears(ctx, currentTime) {
  for (const owner of balls) {
    const bear = owner.summonedBearState;
    if (!bear || owner.hp <= 0) {
      continue;
    }

    drawSummonedBear(ctx, owner, bear, currentTime);
  }
}

function drawSummonedBear(ctx, owner, bear, currentTime) {
  const cell = Math.max(4, Math.floor((bear.radius * 2) / 12));
  const spriteSize = cell * 12;
  const x = Math.round(bear.position.x - spriteSize / 2);
  const y = Math.round(bear.position.y - spriteSize / 2);
  const bodyColor = owner.label === "A" ? "#8b5a2b" : "#5b3a24";
  const muzzleColor = "#d6a35f";
  const flashAlpha = Math.max(bear.boostFlashTime / 0.32, bear.hitFlashTime / 0.2);
  const bob = Math.sin(currentTime * 8 + owner.label.charCodeAt(0)) * 2;

  ctx.save();
  ctx.translate(0, bob);
  drawPixelCells(x + cell, y + cell, cell, [
    "..OOOOOO..",
    ".OOOOOOOO.",
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
    ".BB....BB.",
    "BBBBBBBBBB",
    "BBBBBBBBBB",
    "BBBBBBBBBB",
    "BBBBBBBBBB",
    ".BBBBBBBB.",
    "..BBBBBB..",
    "...BBBB...",
  ], {
    B: bodyColor,
  });
  drawPixelCells(x, y, cell, [
    "..........",
    "...EE.EE..",
    "....MMMM..",
    "...MMMMM..",
    "....NN....",
  ], {
    E: "#050711",
    M: muzzleColor,
    N: "#050711",
  });

  if (flashAlpha > 0) {
    ctx.globalAlpha = clamp(flashAlpha, 0, 1) * 0.55;
    ctx.fillStyle = bear.boostFlashTime > bear.hitFlashTime ? "#fde68a" : "#ffffff";
    ctx.fillRect(x + cell * 2, y + cell * 2, cell * 8, cell * 6);
    ctx.globalAlpha = 1;
  }

  ctx.fillStyle = COLORS.text;
  ctx.strokeStyle = "rgba(5, 8, 12, 0.92)";
  ctx.lineWidth = 4;
  ctx.font = canvasFont(clamp(bear.radius * 0.48, 12, 16), 900);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const damageText = String(Math.ceil(bear.damage));
  ctx.strokeText(damageText, bear.position.x, bear.position.y);
  ctx.fillText(damageText, bear.position.x, bear.position.y);
  ctx.restore();
}

function drawProfessionBodyDetails(ctx, ball, x, y, cell) {
  if (ball.isHero) {
    drawHeroBodyDetails(ctx, ball, x, y, cell);
    return;
  }

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
  } else if (ball.profession === "yoyo") {
    ctx.fillStyle = "#fff1a8";
    ctx.fillRect(x + cell * 4, y + cell * 4, cell * 4, cell);
    ctx.fillRect(x + cell * 5, y + cell * 7, cell * 2, cell);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(x + cell * 5, y + cell * 5, cell, cell);
    ctx.fillRect(x + cell * 7, y + cell * 5, cell, cell);
  } else if (ball.profession === "summoner") {
    ctx.fillStyle = "#fde68a";
    ctx.fillRect(x + cell * 4, y + cell * 3, cell * 4, cell);
    ctx.fillRect(x + cell * 5, y + cell * 4, cell * 2, cell * 5);
    ctx.fillStyle = "#5b3a24";
    ctx.fillRect(x + cell * 4, y + cell * 7, cell, cell);
    ctx.fillRect(x + cell * 7, y + cell * 7, cell, cell);
  }
}

function drawHeroBodyDetails(ctx, ball, x, y, cell) {
  const pattern = ball.config.bodyPattern || ball.profession;

  if (pattern === "demon") {
    drawPixelCells(x, y, cell, [
      "..H......H..",
      ".HH......HH.",
      "..H.RRRR.H..",
      "....R..R....",
      "...MMMMMM...",
      ".....MM.....",
    ], {
      H: "#050711",
      R: "#ff385c",
      M: "#ffd166",
    });
    return;
  }

  if (pattern === "dwarfKing") {
    drawPixelCells(x, y, cell, [
      "...CCCCCC...",
      "..CYYYYYYC..",
      "....EEEE....",
      "...BBBBBB...",
      "..BBBBBBBB..",
      "...BBBBBB...",
      "....MMMM....",
    ], {
      C: "#050711",
      Y: "#fde68a",
      E: "#f8fbff",
      B: "#6b3419",
      M: "#b8bdc7",
    });
    return;
  }

  if (pattern === "minotaur") {
    drawPixelCells(x, y, cell, [
      "HH........HH",
      ".HH......HH.",
      "..H......H..",
      "....EEEE....",
      "...SSSSSS...",
      "....SSSS....",
      "...YYYYYY...",
    ], {
      H: "#f8fbff",
      E: "#050711",
      S: "#c76f36",
      Y: "#facc15",
    });
    return;
  }

  if (pattern === "elfKing") {
    drawPixelCells(x, y, cell, [
      "...LLLLLL...",
      "..LYLYLYL..",
      "....EEEE....",
      "...VVVVVV...",
      "..V......V..",
      ".....YY.....",
    ], {
      L: "#bbf7d0",
      Y: "#facc15",
      E: "#050711",
      V: "#14532d",
    });
    return;
  }

  if (pattern === "wukong") {
    drawPixelCells(x, y, cell, [
      "...GGGGGG...",
      "..GRRRRRG..",
      "....EEEE....",
      "...MMMMMM...",
      "..MYYYYYM...",
      "....RRRR....",
    ], {
      G: "#facc15",
      R: "#dc2626",
      E: "#050711",
      M: "#92400e",
      Y: "#fde68a",
    });
  }
}

function drawWeapon(ctx, ball, currentTime, target) {
  const direction = getWeaponDirection(ball, target);
  const progress = getAttackProgress(ball, currentTime);
  const itemWeapon = getActiveItemWeapon(ball);

  if (itemWeapon) {
    drawItemWeapon(ctx, ball, itemWeapon, direction, progress);
    return;
  }

  if (ball.isHero) {
    drawHeroWeapon(ctx, ball, direction, progress);
    return;
  }

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

  if (ball.profession === "yoyo") {
    drawYoyoWeapon(ctx, ball, currentTime);
    return;
  }

  if (ball.profession === "summoner") {
    drawSummonerTotemWeapon(ctx, ball, direction);
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

function drawHeroWeapon(ctx, ball, direction, progress) {
  if (ball.config.attackMode === "dualBlade") {
    drawDualBladeWeapon(ctx, ball, direction, progress);
    return;
  }

  if (ball.config.attackMode === "hammer") {
    drawHammerWeapon(ctx, ball, direction, progress);
    return;
  }

  if (ball.config.attackMode === "cone") {
    drawTotemWeapon(ctx, ball, direction, progress);
    return;
  }

  if (ball.config.attackMode === "projectile") {
    drawBowWeapon(ctx, ball, direction, progress);
    return;
  }

  if (ball.config.attackMode === "staff") {
    drawWukongStaffWeapon(ctx, ball, direction, progress);
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

function drawHammerWeapon(ctx, ball, direction, progress) {
  const baseAngle = angleOf(direction);
  const swing = progress === null ? -0.18 + Math.sin(elapsedTimeSeconds * 3.4) * 0.08 : lerp(-0.92, 0.58, easeOutCubic(progress));
  const hammerAngle = baseAngle + swing;
  const hammerDirection = vectorFromAngle(hammerAngle);
  const start = snapVector(add(ball.position, scale(hammerDirection, ball.radius * 0.28)), 4);
  const end = snapVector(add(ball.position, scale(hammerDirection, ball.radius + ball.weaponRange * 0.82)), 4);
  const headCenter = snapVector(add(end, scale(hammerDirection, ball.radius * 0.12)), 4);

  ctx.save();
  drawPixelLine(ctx, start, end, 15, "#050711");
  drawPixelLine(ctx, start, end, 8, "#8d5a2e");
  drawRotatedVoxelSprite(ctx, voxelAssets.items.hammer, headCenter, ball.radius * 1.72, hammerAngle, {
    anchorX: 0.72,
    anchorY: 0.5,
    shadowOffset: 4,
  });
  if (progress !== null && progress > 0.42 && progress < 0.78) {
    ctx.globalAlpha = 0.32;
    ctx.fillStyle = ball.visual.accentColor;
    ctx.fillRect(headCenter.x - 16, headCenter.y - 16, 32, 32);
  }
  ctx.restore();
}

function drawTotemWeapon(ctx, ball, direction, progress) {
  const baseAngle = angleOf(direction);
  const attackEase = progress === null ? 0 : easeOutCubic(progress);
  const extension = progress === null ? 0.8 : lerp(0.7, 1.08, attackEase);
  const center = snapVector(add(ball.position, scale(direction, ball.radius + ball.weaponRange * 0.48 * extension)), 4);
  const coneAngle = ball.config.coneAngle || Math.PI / 2;

  ctx.save();
  if (progress !== null) {
    ctx.globalAlpha = 0.16 * (1 - attackEase);
    ctx.fillStyle = ball.visual.accentColor;
    ctx.beginPath();
    moveToVector(ctx, ball.position);
    ctx.arc(ball.position.x, ball.position.y, ball.radius + ball.weaponRange, baseAngle - coneAngle / 2, baseAngle + coneAngle / 2);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  drawRotatedVoxelSprite(ctx, voxelAssets.items.totem, center, ball.radius * 1.88, baseAngle, {
    anchorX: 0.52,
    anchorY: 0.55,
    shadowOffset: 4,
  });

  const grip = snapVector(add(ball.position, scale(direction, ball.radius * 0.62)), 4);
  drawPixelLine(ctx, grip, center, 11, "#050711");
  drawPixelLine(ctx, grip, center, 5, "#8d5a2e");
  ctx.restore();
}

function drawWukongStaffWeapon(ctx, ball, direction, progress) {
  const activeEffect = getActiveWukongStaffEffect(ball);
  const segments = getWukongStaffSegments(ball, elapsedTimeSeconds, direction, progress);
  const glowColor = activeEffect?.color || ball.visual.accentColor;

  ctx.save();
  for (const staff of segments) {
    const start = snapVector(staff.start, 4);
    const end = snapVector(staff.end, 4);
    const staffVector = subtract(end, start);
    const staffLength = length(staffVector);
    const staffDirection = staffLength <= 0.0001 ? staff.direction : scale(staffVector, 1 / staffLength);
    const redCapLength = clamp(staffLength * 0.16, 16, 34);
    const startCap = add(start, scale(staffDirection, redCapLength));
    const endCap = subtract(end, scale(staffDirection, redCapLength));
    const outlineWidth = activeEffect?.id === "giantStaff" ? 18 : 14;
    const coreWidth = activeEffect?.id === "giantStaff" ? 10 : 8;

    drawPixelLine(ctx, start, end, outlineWidth, "#050711");
    drawPixelLine(ctx, startCap, endCap, coreWidth, "#facc15");
    drawPixelLine(ctx, start, startCap, coreWidth, "#dc2626");
    drawPixelLine(ctx, endCap, end, coreWidth, "#dc2626");

    if (activeEffect) {
      ctx.globalAlpha = activeEffect.id === "tripleStaff" ? 0.28 : 0.22;
      drawPixelLine(ctx, start, end, outlineWidth + 8, glowColor);
      ctx.globalAlpha = 1;
    }
  }
  ctx.restore();
}

function drawSummonerTotemWeapon(ctx, ball, direction) {
  const side = { x: -direction.y, y: direction.x };
  const center = add(ball.position, add(scale(direction, ball.radius * 0.54), scale(side, ball.radius * 0.42)));
  const angle = angleOf(direction) + Math.PI / 2;
  const pulse = 0.92 + Math.sin(elapsedTimeSeconds * 5.5) * 0.08;

  ctx.save();
  drawRotatedVoxelSprite(ctx, voxelAssets.items.totem, center, ball.radius * 1.35 * pulse, angle, {
    shadowOffset: 3,
  });
  ctx.fillStyle = "#050711";
  ctx.fillRect(center.x - 8, center.y - 8, 16, 16);
  ctx.fillStyle = ball.visual.accentColor;
  ctx.fillRect(center.x - 5, center.y - 5, 10, 10);
  ctx.restore();
}

function drawItemWeapon(ctx, ball, weapon, direction, progress) {
  if (weapon.id === "sword") {
    drawItemSwordWeapon(ctx, ball, weapon, direction, progress);
    return;
  }

  if (weapon.id === "spear") {
    drawItemSpearWeapon(ctx, ball, weapon, direction, progress);
    return;
  }

  if (weapon.id === "bow") {
    drawBowWeapon(ctx, ball, direction, progress);
    return;
  }

  if (weapon.id === "staff") {
    drawMageWeapon(ctx, ball, direction, progress);
    return;
  }

  drawItemGunWeapon(ctx, ball, weapon, direction, progress);
}

function drawItemSwordWeapon(ctx, ball, weapon, direction, progress) {
  const baseAngle = angleOf(direction);
  const sweepAngle = ATTACK_ANIMATION_CONFIG.blade.sweepAngle;
  const attackEase = progress === null ? null : easeOutCubic(progress);
  const bladeAngle = progress === null ? baseAngle : baseAngle - sweepAngle / 2 + sweepAngle * attackEase;
  const bladeDirection = vectorFromAngle(bladeAngle);
  const weaponStart = snapVector(add(ball.position, scale(bladeDirection, ball.radius * 0.46)), 4);
  const weaponEnd = snapVector(add(ball.position, scale(bladeDirection, ball.radius + weapon.range * 0.92)), 4);
  const hilt = snapVector(add(ball.position, scale(bladeDirection, ball.radius * 0.34)), 4);

  ctx.save();
  drawPixelLine(ctx, weaponStart, weaponEnd, 18, "#050711");
  drawPixelLine(ctx, weaponStart, weaponEnd, 11, ball.visual.accentColor);
  drawRotatedVoxelSprite(ctx, voxelAssets.items.sword, hilt, length(subtract(weaponEnd, hilt)) + 20, bladeAngle, {
    anchorX: 0,
    anchorY: 0.5,
    shadow: false,
  });
  ctx.restore();
}

function drawItemSpearWeapon(ctx, ball, weapon, direction, progress) {
  const hitFrame = ball.attackState?.hitFrame || weapon.hitFrame || ATTACK_ANIMATION_CONFIG.default.hitFrame;
  const extension = progress === null ? 0.9 : getThrustExtension(progress, hitFrame);
  const weaponStart = snapVector(add(ball.position, scale(direction, ball.radius * 0.52)), 4);
  const weaponEnd = snapVector(add(ball.position, scale(direction, ball.radius + weapon.range * extension)), 4);
  const spearTip = snapVector(add(weaponEnd, scale(direction, 10)), 4);

  ctx.save();
  drawRotatedVoxelSprite(ctx, voxelAssets.items.spear, weaponStart, length(subtract(spearTip, weaponStart)), angleOf(direction), {
    anchorX: 0,
    anchorY: 0.5,
    shadowOffset: 4,
  });
  ctx.restore();
}

function drawItemGunWeapon(ctx, ball, weapon, direction, progress) {
  const sprite = weapon.id === "rocket" ? voxelAssets.items.rocketLauncher : voxelAssets.items.pistol;
  const width = weapon.id === "rocket" ? ball.radius * 2.2 : ball.radius * 1.55;
  const center = add(ball.position, scale(direction, ball.radius * 0.88));
  const recoil = progress === null ? 0 : Math.sin(progress * Math.PI) * 8;

  ctx.save();
  drawRotatedVoxelSprite(ctx, sprite, subtract(center, scale(direction, recoil)), width, angleOf(direction), {
    anchorX: 0.2,
    anchorY: 0.5,
    shadowOffset: 4,
  });
  if (progress !== null && progress > 0.25 && progress < 0.62) {
    const muzzle = add(center, scale(direction, width * 0.7));
    ctx.fillStyle = "#ffe66d";
    ctx.fillRect(muzzle.x - 5, muzzle.y - 5, 10, 10);
  }
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
    const end = snapVector(add(start, scale(bladeDirection, ball.radius + ball.weaponRange * 0.48)), 4);

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

function drawDamageIndicators(ctx, currentTime) {
  for (const indicator of damageIndicators) {
    const progress = clamp((currentTime - indicator.createdAt) / DAMAGE_TEXT_DURATION, 0, 1);
    const alpha = 1 - easeInCubic(progress);
    const ball = indicator.ball;
    const fontSize = clamp(ball.radius * 0.62, 18, 25);
    const text = `-${formatDamageAmount(indicator.amount)}`;
    const x = clamp(ball.position.x + indicator.offsetX, 18, ARENA_SIZE - 18);
    const y = clamp(ball.position.y - ball.radius - 18 - progress * 30, 18, ARENA_SIZE - 10);

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = canvasFont(fontSize, 900);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.strokeStyle = "rgba(5, 7, 17, 0.95)";
    ctx.lineWidth = 6;
    ctx.fillStyle = indicator.amount >= 10 ? "#ffd166" : "#ff6b6b";
    ctx.strokeText(text, x, y);
    ctx.fillText(text, x, y);
    ctx.restore();
  }
}

function formatDamageAmount(amount) {
  return String(Math.max(1, Math.round(amount)));
}

function drawProjectile(ctx, projectile) {
  if (projectile.kind === "bullet") {
    drawBulletProjectile(ctx, projectile);
    return;
  }

  if (projectile.kind === "rocket") {
    drawRocketProjectile(ctx, projectile);
    return;
  }

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

function drawBulletProjectile(ctx, projectile) {
  ctx.save();
  ctx.globalAlpha = 0.35;
  drawPixelLine(ctx, snapVector(projectile.previousPosition, 4), snapVector(projectile.position, 4), 6, "#ffe66d");
  ctx.globalAlpha = 1;
  drawVoxelSpriteCentered(ctx, voxelAssets.items.bullet, snapVector(projectile.position, 4), 14, {
    angle: angleOf(projectile.direction),
    shadowOffset: 2,
  });
  ctx.restore();
}

function drawRocketProjectile(ctx, projectile) {
  const tail = snapVector(add(projectile.position, scale(projectile.direction, -projectile.shaftLength)), 4);
  ctx.save();
  ctx.globalAlpha = 0.45;
  drawPixelLine(ctx, snapVector(projectile.previousPosition, 4), tail, 14, "#ff6b24");
  ctx.globalAlpha = 1;
  drawRotatedVoxelSprite(ctx, voxelAssets.items.rocket, projectile.position, projectile.shaftLength + 24, angleOf(projectile.direction), {
    anchorX: 1,
    anchorY: 0.5,
    shadowOffset: 4,
  });
  ctx.restore();
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
  const normal = getWallNormal(hazard.wall);
  const base = snapVector(subtract(center, scale(normal, radius)), 4);
  const tip = snapVector(add(center, scale(normal, radius * 1.2)), 4);
  const side = { x: -normal.y, y: normal.x };

  ctx.fillStyle = "#050711";
  ctx.fillRect(base.x - Math.abs(side.x) * radius - 4, base.y - Math.abs(side.y) * radius - 4, Math.max(8, Math.abs(side.x) * radius * 2 + 8), Math.max(8, Math.abs(side.y) * radius * 2 + 8));
  drawPixelLine(ctx, add(base, scale(side, -radius * 0.72)), tip, 18, "#050711");
  drawPixelLine(ctx, add(base, scale(side, radius * 0.72)), tip, 18, "#050711");
  ctx.fillStyle = "#39d353";
  ctx.fillRect(base.x - Math.abs(side.x) * (radius - 4), base.y - Math.abs(side.y) * (radius - 4), Math.max(8, Math.abs(side.x) * (radius - 4) * 2), Math.max(8, Math.abs(side.y) * (radius - 4) * 2));
  drawPixelLine(ctx, add(base, scale(side, -radius * 0.56)), tip, 10, "#39d353");
  drawPixelLine(ctx, add(base, scale(side, radius * 0.56)), tip, 10, "#39d353");
  ctx.fillStyle = "#caff70";
  ctx.fillRect(tip.x - 4, tip.y - 4, 8, 8);
  ctx.fillRect(center.x - 5, center.y - 5, 10, 10);
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
    const pendingWeb = getPendingWebSegment(ball);
    if (pendingWeb) {
      const shimmer = 0.48 + Math.sin(currentTime * 9) * 0.1;
      ctx.globalAlpha = shimmer;
      drawPixelLine(ctx, snapVector(pendingWeb.start, 4), snapVector(pendingWeb.end, 4), 11, "#050711");
      drawPixelLine(ctx, snapVector(pendingWeb.start, 4), snapVector(pendingWeb.end, 4), 4, "#f8fbff");
      ctx.globalAlpha = 0.7;
      ctx.fillStyle = "#f0d7ff";
      ctx.fillRect(
        pendingWeb.start.x - pendingWeb.nodeRadius / 2,
        pendingWeb.start.y - pendingWeb.nodeRadius / 2,
        pendingWeb.nodeRadius,
        pendingWeb.nodeRadius,
      );
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

function drawItemExplosions(ctx, currentTime) {
  for (const explosion of itemExplosions) {
    const progress = clamp((currentTime - explosion.createdAt) / Math.max(0.001, explosion.expiresAt - explosion.createdAt), 0, 1);
    const radius = explosion.radius * easeOutCubic(progress);
    ctx.save();
    ctx.globalAlpha = 1 - progress;
    ctx.fillStyle = "#9f2d17";
    ctx.fillRect(explosion.position.x - radius, explosion.position.y - radius, radius * 2, radius * 2);
    ctx.fillStyle = "#ff6b24";
    ctx.fillRect(explosion.position.x - radius * 0.62, explosion.position.y - radius * 0.62, radius * 1.24, radius * 1.24);
    ctx.fillStyle = "#ffd166";
    ctx.fillRect(explosion.position.x - radius * 0.25, explosion.position.y - radius * 0.25, radius * 0.5, radius * 0.5);
    ctx.restore();
  }
}

function drawHeroEffects(ctx, currentTime) {
  for (const effect of heroEffectInstances) {
    const progress = clamp((currentTime - effect.createdAt) / Math.max(0.001, effect.expiresAt - effect.createdAt), 0, 1);
    const radius = effect.radius * easeOutCubic(progress);
    ctx.save();
    ctx.globalAlpha = 1 - progress;
    ctx.strokeStyle = "#050711";
    ctx.lineWidth = effect.type === "dodge" ? 10 : 14;
    ctx.beginPath();
    ctx.arc(effect.position.x, effect.position.y, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = effect.color;
    ctx.lineWidth = effect.type === "dodge" ? 4 : 6;
    ctx.beginPath();
    ctx.arc(effect.position.x, effect.position.y, radius * 0.9, 0, Math.PI * 2);
    ctx.stroke();
    if (effect.type === "rebirth" || effect.type === "heal") {
      ctx.fillStyle = effect.color;
      ctx.fillRect(effect.position.x - 6, effect.position.y - radius * 0.6, 12, radius * 1.2);
      ctx.fillRect(effect.position.x - radius * 0.6, effect.position.y - 6, radius * 1.2, 12);
    }
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

function drawYoyoWeapon(ctx, ball, currentTime) {
  if (!ball.yoyoWeaponState) {
    return;
  }

  const geometry = getYoyoWeaponGeometry(ball, currentTime);
  const start = snapVector(geometry.start, 4);
  const end = snapVector(geometry.head, 4);
  const headRadius = geometry.headRadius;
  const lineProgress = geometry.active ? 1 : 0.45;
  const segmentCount = geometry.active ? 8 : 3;

  ctx.save();
  ctx.globalAlpha = geometry.active ? 1 : 0.78;
  drawPixelLine(ctx, start, end, geometry.lineRadius * 2 + 6, "#050711");
  drawPixelLine(ctx, start, end, geometry.lineRadius + 2, ball.visual.accentColor);

  for (let index = 0; index <= segmentCount; index += 1) {
    const point = add(start, scale(subtract(end, start), (index / segmentCount) * lineProgress));
    const size = index % 2 === 0 ? 7 : 5;
    ctx.fillStyle = index % 2 === 0 ? "#ffffff" : ball.visual.color;
    ctx.fillRect(point.x - size / 2, point.y - size / 2, size, size);
  }

  const angle = ball.yoyoWeaponState.rotationAngle * 1.8;
  ctx.fillStyle = "#050711";
  ctx.fillRect(end.x - headRadius - 4, end.y - headRadius - 4, headRadius * 2 + 8, headRadius * 2 + 8);
  ctx.fillStyle = ball.visual.color;
  ctx.fillRect(end.x - headRadius, end.y - headRadius, headRadius * 2, headRadius * 2);
  ctx.fillStyle = ball.visual.accentColor;
  ctx.fillRect(end.x - headRadius * 0.5, end.y - headRadius * 0.5, headRadius, headRadius);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(end.x - 4, end.y - 4, 8, 8);
  drawVoxelSpriteCentered(ctx, voxelAssets.items.yoyo, end, headRadius * 2.22, {
    angle,
    shadowOffset: 3,
  });
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
  drawDroppedItems(ctx, elapsedTimeSeconds);
  drawFlameTrails(ctx, elapsedTimeSeconds);
  drawWebLinks(ctx, elapsedTimeSeconds);
  drawArenaHazards(ctx, elapsedTimeSeconds);
  drawSummonedBears(ctx, elapsedTimeSeconds);
  balls.forEach((ball) => {
    if (ball.hp > 0 || !isCurrentItemMode()) {
      ball.draw(ctx, elapsedTimeSeconds, getNearestAliveOpponent(ball));
    }
  });
  drawProjectiles(ctx);
  drawSpellTrajectories(ctx, elapsedTimeSeconds);
  drawItemExplosions(ctx, elapsedTimeSeconds);
  drawHeroEffects(ctx, elapsedTimeSeconds);
  renderAttackEffectInstances(ctx, attackEffectInstances, elapsedTimeSeconds);
  drawDamageIndicators(ctx, elapsedTimeSeconds);
  ctx.restore();
}

function getNearestAliveOpponent(ball) {
  let nearest = null;
  let nearestDistance = Infinity;
  for (const candidate of balls) {
    if (candidate === ball || candidate.hp <= 0 || areAlliedCombatants(ball, candidate)) {
      continue;
    }

    const distance = length(subtract(candidate.position, ball.position));
    if (distance < nearestDistance) {
      nearest = candidate;
      nearestDistance = distance;
    }
  }

  return nearest;
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
  professionScrollPointer = null;

  if (screen === Screen.PROFESSION_SELECT && canScrollProfessionGridAt(point)) {
    professionScrollPointer = {
      id: event.pointerId,
      lastY: point.y,
      startY: point.y,
      didScroll: false,
    };
    try {
      canvas.setPointerCapture(event.pointerId);
    } catch (error) {
      // Pointer capture is best-effort; scrolling still works without it.
    }
  }
}

function handlePointerMove(event) {
  if (!professionScrollPointer || professionScrollPointer.id !== event.pointerId) {
    return;
  }

  const point = getPointerPoint(event);
  const dragDelta = professionScrollPointer.lastY - point.y;
  const totalDrag = Math.abs(point.y - professionScrollPointer.startY);

  if (professionScrollPointer.didScroll || totalDrag >= PROFESSION_SCROLL_DRAG_THRESHOLD) {
    scrollProfessionGridBy(dragDelta);
    professionScrollPointer.didScroll = true;
    pointerDownElementId = null;
    event.preventDefault();
  }

  professionScrollPointer.lastY = point.y;
}

function handlePointerUp(event) {
  const point = getPointerPoint(event);
  const element = getInteractiveElementAt(point);
  const didScrollProfessionGrid = professionScrollPointer?.id === event.pointerId && professionScrollPointer.didScroll;
  const shouldRunAction = !didScrollProfessionGrid && element && pointerDownElementId === element.id;
  pointerDownElementId = null;
  professionScrollPointer = null;

  if (shouldRunAction) {
    element.action();
  } else if (didScrollProfessionGrid) {
    event.preventDefault();
  }
}

function handleWheel(event) {
  if (screen === Screen.PROFESSION_SELECT) {
    const point = getPointerPoint(event);
    if (canScrollProfessionGridAt(point)) {
      scrollProfessionGridBy(event.deltaY);
      event.preventDefault();
    }
    return;
  }

  if (screen !== Screen.LEGAL_DOCUMENT) {
    return;
  }

  legalScrollOffset = Math.max(0, legalScrollOffset + event.deltaY);
  event.preventDefault();
}

function canScrollProfessionGridAt(point) {
  return Boolean(
    professionScrollArea &&
      professionScrollArea.maxScroll > 0 &&
      isInsideRect(point, professionScrollInputArea || professionScrollArea),
  );
}

function scrollProfessionGridBy(deltaY) {
  if (!professionScrollArea || professionScrollArea.maxScroll <= 0) {
    return;
  }

  professionScrollOffset = clamp(
    professionScrollOffset + deltaY,
    0,
    professionScrollArea.maxScroll,
  );
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
  return `${weight} ${size}px "Courier New", "Microsoft YaHei", "PingFang TC", "Hiragino Sans", "Noto Sans CJK JP", monospace`;
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

function clampPointToArena(point, radius = 0) {
  return {
    x: clamp(point.x, radius, ARENA_SIZE - radius),
    y: clamp(point.y, radius, ARENA_SIZE - radius),
  };
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

function lerpVector(start, end, progress) {
  return {
    x: lerp(start.x, end.x, progress),
    y: lerp(start.y, end.y, progress),
  };
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
canvas.addEventListener("pointermove", handlePointerMove, { passive: false });
canvas.addEventListener("pointerup", handlePointerUp);
canvas.addEventListener("pointercancel", () => {
  pointerDownElementId = null;
  professionScrollPointer = null;
});
canvas.addEventListener("wheel", handleWheel, { passive: false });
canvas.addEventListener("contextmenu", (event) => event.preventDefault());
window.addEventListener("keydown", handleKeyDown);

bootGame();
