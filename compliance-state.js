import { LegalConfig, getLegalVersionKey } from "./legal-config.js";
import {
  DEFAULT_SCENE_ID,
  HeroConfig,
  ProfessionConfig,
  SceneConfig,
  getSceneDefaultProfessions,
  getSceneProfessionIds,
  isHeroScene,
  isItemScene,
} from "./game-config.js";

export const ComplianceStorageKeys = {
  acceptedLegalVersion: "bangbang.acceptedLegalVersion",
  selectedProfessions: "bangbang.selectedProfessions",
  settings: "bangbang.settings",
  reviewPromptState: "bangbang.reviewPromptState",
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
  reducedShakeEnabled: false,
  highlightTextEnabled: true,
  compactReportEnabled: false,
  quickSettlementEnabled: false,
};

export const REVIEW_SESSION_MIN_GAP_MS = 30 * 60 * 1000;

export const DefaultReviewPromptState = {
  sessionCount: 0,
  lastSessionStartedAt: 0,
  lastPromptedAt: 0,
  lastPromptedVersion: "",
  promptAttemptCount: 0,
  lastStoreListingOpenedAt: 0,
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

    getReviewPromptState() {
      return normalizeReviewPromptState(
        safeParseJson(safeGetItem(storage, ComplianceStorageKeys.reviewPromptState), {}),
      );
    },

    saveReviewPromptState(reviewPromptState) {
      const normalized = normalizeReviewPromptState(reviewPromptState);
      safeSetItem(storage, ComplianceStorageKeys.reviewPromptState, JSON.stringify(normalized));
      return normalized;
    },

    recordReviewSessionStarted({
      nowMs = Date.now(),
      minGapMs = REVIEW_SESSION_MIN_GAP_MS,
    } = {}) {
      const state = this.getReviewPromptState();
      const sessionStartedAt = normalizeTimestamp(nowMs);
      const sessionGapMs = Math.max(0, Number(minGapMs) || 0);

      if (!sessionStartedAt || (state.sessionCount > 0 && sessionStartedAt - state.lastSessionStartedAt < sessionGapMs)) {
        return state;
      }

      return this.saveReviewPromptState({
        ...state,
        sessionCount: state.sessionCount + 1,
        lastSessionStartedAt: sessionStartedAt,
      });
    },
  };
}

export function normalizeSelectedProfessions(selectedProfessions = {}, professionConfig = ProfessionConfig) {
  const scene = getValidScene(selectedProfessions.scene);
  const sceneDefaultProfessions = getSceneDefaultProfessions(scene);
  const sceneProfessionIds = getSceneProfessionIds(scene);
  const selectableConfig = isHeroScene(scene) ? HeroConfig : professionConfig;

  if (isItemScene(scene)) {
    return {
      scene,
      a: null,
      b: null,
      ballCount: normalizeBallCount(selectedProfessions.ballCount),
    };
  }

  return {
    scene,
    a: getValidProfessionForScene(selectedProfessions.a, sceneDefaultProfessions.a, sceneProfessionIds, selectableConfig),
    b: getValidProfessionForScene(selectedProfessions.b, sceneDefaultProfessions.b, sceneProfessionIds, selectableConfig),
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

export function normalizeReviewPromptState(reviewPromptState = {}) {
  return {
    sessionCount: normalizeNonNegativeInteger(reviewPromptState.sessionCount),
    lastSessionStartedAt: normalizeTimestamp(reviewPromptState.lastSessionStartedAt),
    lastPromptedAt: normalizeTimestamp(reviewPromptState.lastPromptedAt),
    lastPromptedVersion: String(reviewPromptState.lastPromptedVersion || ""),
    promptAttemptCount: normalizeNonNegativeInteger(reviewPromptState.promptAttemptCount),
    lastStoreListingOpenedAt: normalizeTimestamp(reviewPromptState.lastStoreListingOpenedAt),
  };
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
  if (!sceneProfessionIds.length) {
    return null;
  }

  return Object.hasOwn(professionConfig, profession) && sceneProfessionIds.includes(profession) ? profession : fallback;
}

function normalizeNonNegativeInteger(value) {
  const parsedValue = Number.parseInt(value, 10);
  return Number.isFinite(parsedValue) ? Math.max(0, parsedValue) : 0;
}

function normalizeTimestamp(value) {
  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) ? Math.max(0, Math.round(parsedValue)) : 0;
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
