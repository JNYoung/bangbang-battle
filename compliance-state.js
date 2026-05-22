import { LegalConfig, getLegalVersionKey } from "./legal-config.js";
import { ProfessionConfig } from "./game-config.js";

export const ComplianceStorageKeys = {
  acceptedLegalVersion: "bangbang.acceptedLegalVersion",
  selectedProfessions: "bangbang.selectedProfessions",
  settings: "bangbang.settings",
};

export const DefaultProfessions = {
  a: "spear",
  b: "blade",
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
  return {
    a: getValidProfession(selectedProfessions.a, DefaultProfessions.a, professionConfig),
    b: getValidProfession(selectedProfessions.b, DefaultProfessions.b, professionConfig),
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

function getValidProfession(profession, fallback, professionConfig) {
  return Object.hasOwn(professionConfig, profession) ? profession : fallback;
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
