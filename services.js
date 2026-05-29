const ANALYTICS_PARAM_LIMIT = 25;
const ANALYTICS_NAME_LIMIT = 40;
const ANALYTICS_STRING_VALUE_LIMIT = 100;
const RESERVED_ANALYTICS_PREFIXES = ["firebase_", "ga_", "google_"];
const GOOGLE_TEST_AD_UNITS = Object.freeze({
  android: {
    appOpen: "ca-app-pub-3940256099942544/1033173712",
    battleBanner: "ca-app-pub-3940256099942544/6300978111",
  },
  ios: {
    appOpen: "ca-app-pub-3940256099942544/4411468910",
    battleBanner: "ca-app-pub-3940256099942544/2934735716",
  },
  web: {
    appOpen: "mock-game-app-open",
    battleBanner: "mock-game-battle-banner",
  },
});
const REAL_AD_UNITS = Object.freeze({
  android: {
    appOpen: "ca-app-pub-2481288993515154/2687290972",
    battleBanner: "ca-app-pub-2481288993515154/6818107670",
  },
});
const AD_UNIT_ENV_KEYS = Object.freeze({
  app_open: "APP_OPEN",
  battle_banner: "BATTLE_BANNER",
});
const AD_FALLBACK_ENV_KEYS = Object.freeze({
  appOpen: "APP_OPEN",
  battleBanner: "BATTLE_BANNER",
});
const GAME_AD_CONTEXT = Object.freeze({
  category: "games",
  keywords: ["arcade game", "mobile game", "battle game", "pixel game"],
});
let analyticsCollectionEnabled = false;
const adMobState = {
  importPromise: null,
  module: null,
  initialized: false,
  initializationError: null,
  activeBannerPlacement: null,
};

export const AnalyticsEvents = Object.freeze({
  adClick: "ad_click",
  adClose: "ad_close",
  adRequest: "ad_request",
  adShow: "ad_show",
  gameInitSuccess: "game_init_success",
  gameStart: "game_start",
  gameEnd: "game_end",
  performanceSnapshot: "performance_snapshot",
  settingSelect: "setting_select",
  legalAccept: "legal_accept",
  restorePurchases: "restore_purchases",
});

export const analytics = {
  get available() {
    return Boolean(getNativeAnalyticsPlugin()?.logEvent || getGtag());
  },

  get enabled() {
    return analyticsCollectionEnabled && this.available;
  },

  async setCollectionEnabled(enabled) {
    analyticsCollectionEnabled = Boolean(enabled);
    const nativePlugin = getNativeAnalyticsPlugin();

    if (nativePlugin?.setCollectionEnabled) {
      try {
        const result = await nativePlugin.setCollectionEnabled({ enabled: analyticsCollectionEnabled });
        return {
          enabled: analyticsCollectionEnabled,
          transport: "firebase_native",
          result,
        };
      } catch (error) {
        console.warn("Analytics collection toggle failed", error);
        return {
          enabled: analyticsCollectionEnabled,
          transport: "firebase_native",
          error,
        };
      }
    }

    const gtag = getGtag();
    if (gtag) {
      gtag("consent", "update", {
        analytics_storage: analyticsCollectionEnabled ? "granted" : "denied",
      });
      return {
        enabled: analyticsCollectionEnabled,
        transport: "gtag",
      };
    }

    return {
      enabled: analyticsCollectionEnabled,
      reason: "analytics_not_configured",
    };
  },

  async getStatus() {
    const nativePlugin = getNativeAnalyticsPlugin();
    if (nativePlugin?.getStatus) {
      try {
        return {
          available: true,
          transport: "firebase_native",
          result: await nativePlugin.getStatus(),
        };
      } catch (error) {
        console.warn("Analytics status check failed", error);
        return {
          available: true,
          transport: "firebase_native",
          error,
        };
      }
    }

    if (getGtag()) {
      return {
        available: true,
        transport: "gtag",
      };
    }

    return {
      available: false,
      reason: "analytics_not_configured",
    };
  },

  track(eventName, payload = {}) {
    const normalizedEventName = normalizeAnalyticsName(eventName, "app_event");
    const normalizedPayload = normalizeAnalyticsPayload(payload);

    if (!analyticsCollectionEnabled) {
      return {
        sent: false,
        eventName: normalizedEventName,
        payload: normalizedPayload,
        reason: "analytics_collection_disabled",
      };
    }

    const nativePlugin = getNativeAnalyticsPlugin();

    if (nativePlugin?.logEvent) {
      void nativePlugin.logEvent({
        name: normalizedEventName,
        params: normalizedPayload,
      }).catch((error) => {
        console.warn("Analytics event failed", normalizedEventName, error);
      });

      return {
        sent: true,
        eventName: normalizedEventName,
        payload: normalizedPayload,
        transport: "firebase_native",
      };
    }

    const gtag = getGtag();
    if (gtag) {
      gtag("event", normalizedEventName, normalizedPayload);
      return {
        sent: true,
        eventName: normalizedEventName,
        payload: normalizedPayload,
        transport: "gtag",
      };
    }

    return {
      sent: false,
      eventName: normalizedEventName,
      payload: normalizedPayload,
      reason: "analytics_not_configured",
    };
  },
};

export function normalizeAnalyticsPayload(payload = {}) {
  const normalized = {};

  for (const [rawKey, rawValue] of Object.entries(payload)) {
    if (Object.keys(normalized).length >= ANALYTICS_PARAM_LIMIT) {
      break;
    }

    const value = normalizeAnalyticsValue(rawValue);
    if (value === null || value === undefined) {
      continue;
    }

    normalized[normalizeAnalyticsName(rawKey, "param")] = value;
  }

  return normalized;
}

export function normalizeAnalyticsName(name, fallback) {
  const baseName = String(name || "")
    .trim()
    .replace(/[^a-zA-Z0-9_]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
  const alphaPrefixedName = /^[a-zA-Z]/.test(baseName) ? baseName : `${fallback}_${baseName}`;
  const safeName = alphaPrefixedName.slice(0, ANALYTICS_NAME_LIMIT) || fallback;

  if (RESERVED_ANALYTICS_PREFIXES.some((prefix) => safeName.toLowerCase().startsWith(prefix))) {
    return `${fallback}_${safeName}`.slice(0, ANALYTICS_NAME_LIMIT);
  }

  return safeName;
}

function normalizeAnalyticsValue(value) {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === "boolean") {
    return value ? 1 : 0;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === "string") {
    return value.slice(0, ANALYTICS_STRING_VALUE_LIMIT);
  }

  return JSON.stringify(value).slice(0, ANALYTICS_STRING_VALUE_LIMIT);
}

function getNativeAnalyticsPlugin() {
  return globalThis.Capacitor?.Plugins?.GameAnalytics || null;
}

function getNativeAdsPlugin() {
  return globalThis.Capacitor?.Plugins?.GameAds || null;
}

function getGtag() {
  return typeof globalThis.gtag === "function" ? globalThis.gtag : null;
}

export const ads = {
  enabled: true,
  get mode() {
    if (getNativeAdsPlugin()) {
      return "native";
    }
    if (adMobState.initialized) {
      return "admob";
    }
    return "mock";
  },
  isAvailable() {
    return true;
  },
  async initialize() {
    const nativePlugin = getNativeAdsPlugin();
    if (nativePlugin?.initialize) {
      return nativePlugin.initialize({ context: GAME_AD_CONTEXT });
    }

    if (!shouldUseNativeAdMob()) {
      return {
        available: true,
        initialized: false,
        mode: "mock",
        context: GAME_AD_CONTEXT,
        reason: "web_mock_ads",
      };
    }

    if (adMobState.initialized) {
      return {
        available: true,
        initialized: true,
        mode: "admob",
        testing: isAdMobTestingEnabled(),
        non_personalized_ads: shouldRequestNonPersonalizedAds(),
        context: GAME_AD_CONTEXT,
      };
    }

    try {
      const adMobModule = await loadAdMobModule();
      await adMobModule.AdMob.initialize({
        initializeForTesting: isAdMobTestingEnabled(),
        tagForChildDirectedTreatment: false,
        tagForUnderAgeOfConsent: false,
        maxAdContentRating: adMobModule.MaxAdContentRating?.ParentalGuidance || "ParentalGuidance",
      });
      adMobState.initialized = true;
      adMobState.initializationError = null;

      return {
        available: true,
        initialized: true,
        mode: "admob",
        testing: isAdMobTestingEnabled(),
        non_personalized_ads: shouldRequestNonPersonalizedAds(),
        context: GAME_AD_CONTEXT,
      };
    } catch (error) {
      adMobState.initializationError = error;
      console.warn("AdMob initialization failed", error);
      return {
        available: false,
        initialized: false,
        mode: "admob",
        reason: "admob_initialization_failed",
        error,
      };
    }
  },
  getStatus() {
    return {
      available: this.isAvailable(),
      mode: this.mode,
      admobInitialized: adMobState.initialized,
      admobInitializationError: adMobState.initializationError?.message || null,
      activeBannerPlacement: adMobState.activeBannerPlacement,
      testing: isAdMobTestingEnabled(),
      realAdUnitsConfigured: hasRealAdUnitsConfigured(getNativePlatform()),
      non_personalized_ads: shouldRequestNonPersonalizedAds(),
      game_ad_context: GAME_AD_CONTEXT,
    };
  },
  getBanner(placement = "default", options = {}) {
    const nativePlugin = getNativeAdsPlugin();
    if (nativePlugin?.getBanner) {
      return nativePlugin.getBanner({ placement, ...options, context: GAME_AD_CONTEXT });
    }

    if (shouldUseNativeAdMob()) {
      return showAdMobBanner(placement, options);
    }

    return createMockAdResult(placement, "banner");
  },
  async showInterstitial(placement = "default") {
    const nativePlugin = getNativeAdsPlugin();
    if (nativePlugin?.showInterstitial) {
      return nativePlugin.showInterstitial({ placement, context: GAME_AD_CONTEXT });
    }

    if (shouldUseNativeAdMob()) {
      return showAdMobInterstitial(placement);
    }

    return createMockAdResult(placement, "interstitial");
  },
  async hideBanner(placement = "default") {
    const nativePlugin = getNativeAdsPlugin();
    if (nativePlugin?.hideBanner) {
      return nativePlugin.hideBanner({ placement });
    }

    if (!adMobState.module?.AdMob || !adMobState.activeBannerPlacement) {
      return {
        hidden: false,
        placement,
        reason: "no_active_banner",
      };
    }

    try {
      await adMobState.module.AdMob.hideBanner();
      adMobState.activeBannerPlacement = null;
      return {
        hidden: true,
        placement,
        network: "admob",
      };
    } catch (error) {
      console.warn("AdMob banner hide failed", error);
      return {
        hidden: false,
        placement,
        network: "admob",
        reason: "hide_failed",
        error,
      };
    }
  },
};

async function showAdMobInterstitial(placement) {
  const adMobModule = await getReadyAdMobModule();
  if (!adMobModule?.AdMob) {
    return createAdNotShownResult(placement, "interstitial", "admob_unavailable");
  }

  const adId = getAdUnitId(placement, "appOpen");
  try {
    await adMobModule.AdMob.prepareInterstitial({
      adId,
      isTesting: isAdMobTestingEnabled(),
      npa: shouldRequestNonPersonalizedAds(),
      immersiveMode: true,
    });
    await adMobModule.AdMob.showInterstitial();
    return createNativeAdResult(placement, "interstitial", "native_interstitial", adId);
  } catch (error) {
    console.warn("AdMob interstitial failed", placement, error);
    return createAdNotShownResult(placement, "interstitial", "admob_interstitial_failed", error);
  }
}

async function showAdMobBanner(placement, options = {}) {
  const adMobModule = await getReadyAdMobModule();
  if (!adMobModule?.AdMob) {
    return createAdNotShownResult(placement, "banner", "admob_unavailable");
  }

  const adId = getAdUnitId(placement, "battleBanner");
  const margin = Math.max(0, Math.round(Number(options.marginBottom) || 0));
  try {
    await adMobModule.AdMob.showBanner({
      adId,
      adSize: adMobModule.BannerAdSize?.BANNER || "BANNER",
      position: adMobModule.BannerAdPosition?.BOTTOM_CENTER || "BOTTOM_CENTER",
      margin,
      isTesting: isAdMobTestingEnabled(),
      npa: shouldRequestNonPersonalizedAds(),
    });
    adMobState.activeBannerPlacement = placement;
    return createNativeAdResult(placement, "banner", "native_banner", adId, {
      margin_bottom: margin,
      requested_width: options.width,
      requested_height: options.height,
    });
  } catch (error) {
    console.warn("AdMob banner failed", placement, error);
    return createAdNotShownResult(placement, "banner", "admob_banner_failed", error);
  }
}

async function getReadyAdMobModule() {
  const initResult = await ads.initialize();
  if (!initResult?.available || !adMobState.module) {
    return null;
  }
  return adMobState.module;
}

async function loadAdMobModule() {
  if (adMobState.module) {
    return adMobState.module;
  }

  adMobState.importPromise ||= import("@capacitor-community/admob")
    .then((module) => {
      adMobState.module = module;
      return module;
    })
    .catch((error) => {
      adMobState.importPromise = null;
      throw error;
    });

  return adMobState.importPromise;
}

function shouldUseNativeAdMob() {
  return Boolean(globalThis.Capacitor?.isNativePlatform?.());
}

function getNativePlatform() {
  const platform = globalThis.Capacitor?.getPlatform?.();
  if (platform === "android" || platform === "ios") {
    return platform;
  }
  return shouldUseNativeAdMob() ? "android" : "web";
}

function getAdUnitId(placement, fallbackKey) {
  const platform = getNativePlatform();
  const placementKey = getPlacementEnvKey(placement, fallbackKey);
  return (
    getEnvAdUnitId(platform, placementKey) ||
    (!isAdMobTestingEnabled() ? REAL_AD_UNITS[platform]?.[fallbackKey] : null) ||
    GOOGLE_TEST_AD_UNITS[platform]?.[fallbackKey] ||
    GOOGLE_TEST_AD_UNITS.web[fallbackKey]
  );
}

function isAdMobTestingEnabled() {
  return getBooleanBuildEnvValue("VITE_ADMOB_TESTING", !hasRealAdUnitsConfigured(getNativePlatform()));
}

function shouldRequestNonPersonalizedAds() {
  return getBooleanBuildEnvValue("VITE_ADMOB_NPA", true);
}

function hasRealAdUnitsConfigured(platform) {
  return Boolean(
    getEnvAdUnitId(platform, AD_FALLBACK_ENV_KEYS.appOpen) ||
    REAL_AD_UNITS[platform]?.appOpen
  ) && Boolean(
    getEnvAdUnitId(platform, AD_FALLBACK_ENV_KEYS.battleBanner) ||
    REAL_AD_UNITS[platform]?.battleBanner
  );
}

function getPlacementEnvKey(placement, fallbackKey) {
  return AD_UNIT_ENV_KEYS[placement] || AD_FALLBACK_ENV_KEYS[fallbackKey] || String(placement || fallbackKey).toUpperCase();
}

function getEnvAdUnitId(platform, placementKey) {
  const platformPrefix = platform.toUpperCase();
  return (
    getBuildEnvValue(`VITE_ADMOB_${platformPrefix}_${placementKey}_AD_UNIT_ID`) ||
    getBuildEnvValue(`VITE_ADMOB_${placementKey}_AD_UNIT_ID`)
  );
}

function getBooleanBuildEnvValue(key, fallback) {
  const value = getBuildEnvValue(key);
  if (value === undefined || value === null || value === "") {
    return fallback;
  }
  return !["0", "false", "no", "off"].includes(String(value).toLowerCase());
}

function getBuildEnvValue(key) {
  return import.meta.env?.[key];
}

function createMockAdResult(placement, format) {
  return {
    shown: true,
    available: true,
    placement,
    format,
    network: "mock_game_ads",
    render: "canvas_mock",
    creative_id: `mock_game_${placement}_${format}`,
    campaign: "game_ad_debug_chain",
    testing: true,
    game_ad_context: GAME_AD_CONTEXT.category,
  };
}

function createNativeAdResult(placement, format, render, creativeId, extra = {}) {
  return {
    shown: true,
    available: true,
    placement,
    format,
    network: "admob",
    render,
    creative_id: creativeId,
    campaign: "admob_game_context",
    testing: isAdMobTestingEnabled(),
    game_ad_context: GAME_AD_CONTEXT.category,
    ...extra,
  };
}

function createAdNotShownResult(placement, format, reason, error = null) {
  return {
    shown: false,
    available: false,
    placement,
    format,
    network: "admob",
    reason,
    error,
  };
}

if (typeof globalThis !== "undefined") {
  Object.defineProperty(globalThis, "__BANGBANG_ADS_DEBUG__", {
    configurable: true,
    get() {
      return ads.getStatus();
    },
  });
}

export const iap = {
  enabled: false,
  async getProducts() {
    return [];
  },
  async restorePurchases() {
    return {
      restored: false,
      purchases: [],
      reason: "iap_not_configured",
    };
  },
};
