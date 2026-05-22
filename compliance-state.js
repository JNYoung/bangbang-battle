import { LegalConfig, getLegalVersionKey } from "./legal-config.js";
import {
  DEFAULT_SCENE_ID,
  ProfessionConfig,
  SceneConfig,
  getSceneDefaultProfessions,
  getSceneProfessionIds,
} from "./game-config.js";

export const ComplianceStorageKeys = {
  acceptedLegalVersion: "bangbang.acceptedLegalVersion",
  selectedProfessions: "bangbang.selectedProfessions",
  settings: "bangbang.settings",
};

export const DefaultProfessions = {
  scene: DEFAULT_SCENE_ID,
  ...getSceneDefaultProfessions(DEFAULT_SCENE_ID),
  ballCount: 2,
};

export const MIN_BALL_COUNT = 2;
export const MAX_BALL_COUNT = 6;

export const DefaultSettings = {
  analyticsEnabled: false,
  adsEnabled: false,
  iapEnabled: false,
  vibrationEnabled: true,
  musicEnabled: true,
  soundEffectsEnabled: true,
};

export function createComplianceState({
  storage = getDefaultStorage(),
  legalConfig = LegalConfig,
  professionConfig = ProfessionConfig,
} = {}) {
  return {
    hasAcceptedCurrentLegal() {
      return safeGetItem(storage, ComplianceStorageKeys.acceptedLegalVersion) === getLegalVersionKey(legalConfig);
    },

    acceptCurrentLegal() {
      safeSetItem(storage, ComplianceStorageKeys.acceptedLegalVersion, getLegalVersionKey(legalConfig));
    },

    withdrawConsent() {
      safeRemoveItem(storage, ComplianceStorageKeys.acceptedLegalVersion);
    },

    getSelectedProfessions(overrides = {}) {
      const saved = safeParseJson(safeGetItem(storage, ComplianceStorageKeys.selectedProfessions), {});
      return normalizeSelectedProfessions(
        {
          a: overrides.a ?? saved.a,
          b: overrides.b ?? saved.b,
          scene: overrides.scene ?? saved.scene,
          ballCount: overrides.ballCount ?? saved.ballCount,
        },
        professionConfig,
      );
    },

    saveSelectedProfessions(selectedProfessions) {
      const normalized = normalizeSelectedProfessions(selectedProfessions, professionConfig);
      safeSetItem(storage, ComplianceStorageKeys.selectedProfessions, JSON.stringify(normalized));
      return normalized;
    },

    getSettings() {
      return {
        ...DefaultSettings,
        ...safeParseJson(safeGetItem(storage, ComplianceStorageKeys.settings), {}),
      };
    },

    saveSettings(settings) {
      const normalized = {
        ...DefaultSettings,
        ...settings,
      };
      safeSetItem(storage, ComplianceStorageKeys.settings, JSON.stringify(normalized));
      return normalized;
    },
  };
}

export function normalizeSelectedProfessions(selectedProfessions = {}, professionConfig = ProfessionConfig) {
  const scene = getValidScene(selectedProfessions.scene);
  const sceneDefaultProfessions = getSceneDefaultProfessions(scene);
  const sceneProfessionIds = getSceneProfessionIds(scene);

  return {
    scene,
    a: getValidProfessionForScene(selectedProfessions.a, sceneDefaultProfessions.a, sceneProfessionIds, professionConfig),
    b: getValidProfessionForScene(selectedProfessions.b, sceneDefaultProfessions.b, sceneProfessionIds, professionConfig),
    ballCount: normalizeBallCount(selectedProfessions.ballCount),
  };
}

export function normalizeBallCount(ballCount) {
  const parsedCount = Number.parseInt(ballCount, 10);
  if (!Number.isFinite(parsedCount)) {
    return DefaultProfessions.ballCount;
  }

  return Math.min(Math.max(parsedCount, MIN_BALL_COUNT), MAX_BALL_COUNT);
}

export function createMemoryStorage(initialState = {}) {
  const data = new Map(Object.entries(initialState));

  return {
    getItem(key) {
      return data.has(key) ? data.get(key) : null;
    },
    setItem(key, value) {
      data.set(key, String(value));
    },
    removeItem(key) {
      data.delete(key);
    },
    clear() {
      data.clear();
    },
  };
}

function getValidScene(scene) {
  return Object.hasOwn(SceneConfig, scene) ? scene : DefaultProfessions.scene;
}

function getValidProfessionForScene(profession, fallback, sceneProfessionIds, professionConfig) {
  return Object.hasOwn(professionConfig, profession) && sceneProfessionIds.includes(profession) ? profession : fallback;
}

function getDefaultStorage() {
  try {
    return globalThis.localStorage;
  } catch {
    return null;
  }
}

function safeGetItem(storage, key) {
  try {
    return storage?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

function safeSetItem(storage, key, value) {
  try {
    storage?.setItem(key, value);
  } catch {
    // Local storage can be unavailable in private browsing or embedded contexts.
  }
}

function safeRemoveItem(storage, key) {
  try {
    storage?.removeItem(key);
  } catch {
    // Local storage can be unavailable in private browsing or embedded contexts.
  }
}

function safeParseJson(value, fallback) {
  if (!value) {
    return fallback;
  }

  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}
