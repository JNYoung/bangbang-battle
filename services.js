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
const AD_MOB_MODES = Object.freeze({
  auto: "auto",
  mock: "mock",
  real: "real",
  test: "test",
});
const META_AD_NETWORK = "meta_instant_games";
const META_INTERSTITIAL_FORMAT = "interstitial";
const META_REWARDED_FORMAT = "rewarded";
const META_PLACEMENT_ENV_KEYS = Object.freeze({
  app_open: {
    interstitial: [
      "VITE_META_APP_OPEN_AD_PLACEMENT_ID",
      "VITE_META_INTERSTITIAL_PLACEMENT_ID",
      "VITE_META_APP_OPEN_PLACEMENT_ID",
    ],
  },
  rewarded_video: {
    rewarded: [
      "VITE_META_REWARDED_VIDEO_PLACEMENT_ID",
      "VITE_META_REWARDED_AD_PLACEMENT_ID",
      "VITE_META_REWARDED_PLACEMENT_ID",
    ],
  },
});
const IS_META_BUILD_TARGET = import.meta.env?.VITE_PLATFORM_TARGET === "meta";
const GAME_AD_CONTEXT = Object.freeze({
  category: "games",
  keywords: ["arcade game", "mobile game", "battle game", "pixel game"],
});
const DEFAULT_SHARE_BASE_URL = "https://professionballarena.top";
const DEFAULT_WEB_STORE_URL = "https://professionballarena.top/download/";
const DEFAULT_GOOGLE_PLAY_PACKAGE = "com.professionballarena.game";
const DEFAULT_APP_VERSION = "0.1.0";
const BATTLE_SHARE_PATH = "/battle/";
const CUSTOM_DEEP_LINK_SCHEME = "professionballarena:";
const BATTLE_REPLAY_SEED_MAX = 0xffffffff;
let analyticsCollectionEnabled = false;
const adMobState = {
  importPromise: null,
  module: null,
  initialized: false,
  initializationError: null,
  activeBannerPlacement: null,
};
const metaAdState = {
  initialized: false,
  initializationError: null,
};

export const AnalyticsEvents = Object.freeze({
  adClick: "ad_click",
  adClose: "ad_close",
  adRequest: "ad_request",
  adShow: "ad_show",
  dailyMatchComplete: "daily_match_complete",
  firstBattleComplete: "first_battle_complete",
  firstBattleStart: "first_battle_start",
  gameInitSuccess: "game_init_success",
  gameStart: "game_start",
  gameEnd: "game_end",
  nextDayReturn: "next_day_return",
  nextMatchRecommendClick: "next_match_recommend_click",
  performanceSnapshot: "performance_snapshot",
  reviewPromptRequest: "review_prompt_request",
  reviewPromptResult: "review_prompt_result",
  storeReviewClick: "store_review_click",
  reportCardClick: "report_card_click",
  renderQualityChange: "render_quality_change",
  secondBattleStart: "second_battle_start",
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

function getNativeSocialPlugin() {
  return globalThis.Capacitor?.Plugins?.GameSocial || null;
}

function getNativeReviewPlugin() {
  return globalThis.Capacitor?.Plugins?.GameReview || null;
}

function getGtag() {
  return typeof globalThis.gtag === "function" ? globalThis.gtag : null;
}

export const ShareTargets = Object.freeze({
  system: "system",
  facebook: "facebook",
  tiktok: "tiktok",
});

export function createBattleReplaySeed() {
  return Math.floor(Math.random() * BATTLE_REPLAY_SEED_MAX) >>> 0;
}

export function normalizeBattleReplaySeed(seed) {
  const parsedSeed = Number.parseInt(seed, 10);
  if (!Number.isFinite(parsedSeed)) {
    return null;
  }

  return Math.min(Math.max(parsedSeed, 1), BATTLE_REPLAY_SEED_MAX) >>> 0;
}

export function createBattleReplayShareUrl(payload = {}) {
  const baseUrl = getBuildEnvValue("VITE_SHARE_BASE_URL") || DEFAULT_SHARE_BASE_URL;
  const shareUrl = new URL(BATTLE_SHARE_PATH, baseUrl);
  const entries = {
    scene: payload.scene,
    a: payload.a,
    b: payload.b,
    count: payload.ballCount,
    seed: normalizeBattleReplaySeed(payload.seed),
    match: payload.matchId,
    auto: "play",
  };

  for (const [key, value] of Object.entries(entries)) {
    if (value !== null && value !== undefined && value !== "") {
      shareUrl.searchParams.set(key, String(value));
    }
  }

  return shareUrl.toString();
}

export function parseBattleReplayLink(rawUrl) {
  if (!rawUrl || typeof rawUrl !== "string") {
    return null;
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(rawUrl, DEFAULT_SHARE_BASE_URL);
  } catch {
    return null;
  }

  const isCustomScheme = parsedUrl.protocol === CUSTOM_DEEP_LINK_SCHEME;
  const isHttpsBattlePath = /^https?:$/.test(parsedUrl.protocol) && parsedUrl.pathname.startsWith(BATTLE_SHARE_PATH);
  const isLocalQueryOverride = parsedUrl.searchParams.has("scene") || parsedUrl.searchParams.has("seed");
  if (!isCustomScheme && !isHttpsBattlePath && !isLocalQueryOverride) {
    return null;
  }

  const autoValue = String(parsedUrl.searchParams.get("auto") || "").toLowerCase();
  return {
    rawUrl: parsedUrl.toString(),
    source: parsedUrl.searchParams.get("source") || "deeplink",
    autoStart: isCustomScheme || ["1", "true", "play", "replay"].includes(autoValue),
    scene: parsedUrl.searchParams.get("scene"),
    a: parsedUrl.searchParams.get("a"),
    b: parsedUrl.searchParams.get("b"),
    ballCount: parsedUrl.searchParams.get("count") || parsedUrl.searchParams.get("ballCount"),
    replaySeed: normalizeBattleReplaySeed(parsedUrl.searchParams.get("seed")),
    matchId: parsedUrl.searchParams.get("match"),
  };
}

export const deepLinks = {
  async getLaunchUrl() {
    const nativePlugin = getNativeSocialPlugin();
    if (nativePlugin?.getLaunchDeepLink) {
      try {
        return nativePlugin.getLaunchDeepLink();
      } catch (error) {
        console.warn("Launch deep link lookup failed", error);
      }
    }

    const webUrl = globalThis.location?.href || "";
    return {
      url: webUrl,
      source: "web_location",
      native: false,
    };
  },

  addListener(callback) {
    const nativePlugin = getNativeSocialPlugin();
    if (!nativePlugin?.addListener || typeof callback !== "function") {
      return null;
    }

    return nativePlugin.addListener("deepLinkOpen", callback);
  },
};

export const socialShare = {
  isNativeAvailable() {
    return Boolean(getNativeSocialPlugin()?.shareImage);
  },

  async shareImage(options = {}) {
    const nativePlugin = getNativeSocialPlugin();
    if (!nativePlugin?.shareImage) {
      return {
        shared: false,
        target: options.target || ShareTargets.system,
        reason: "native_social_unavailable",
      };
    }

    return nativePlugin.shareImage({
      target: normalizeShareTarget(options.target),
      fileName: options.fileName,
      contentType: options.contentType || "image/png",
      base64Data: options.base64Data,
      title: options.title,
      text: options.text,
      deepLinkUrl: options.deepLinkUrl,
    });
  },
};

export const reviews = {
  get appVersion() {
    return getAppVersion();
  },

  isNativeAvailable() {
    return Boolean(getNativeReviewPlugin()?.requestReview);
  },

  getStatus() {
    const platform = getNativePlatform();
    return {
      available: this.isNativeAvailable(),
      platform,
      app_version: getAppVersion(),
      google_play_package: getGooglePlayPackageName(),
      app_store_app_id_configured: Boolean(getAppStoreAppId()),
      web_store_url: getWebStoreUrl(),
      native_transport: getNativeReviewPlugin() ? "native_game_review" : null,
      meta_runtime: isMetaInstantRuntime() || isMetaBuildTarget(),
    };
  },

  async requestReview(options = {}) {
    const nativePlugin = getNativeReviewPlugin();
    const payload = createReviewPayload(options);

    if (!nativePlugin?.requestReview) {
      return {
        requested: false,
        ...payload,
        transport: "none",
        reason: "native_review_unavailable",
      };
    }

    try {
      const result = await nativePlugin.requestReview(payload);
      return {
        requested: Boolean(result?.requested ?? result?.shownMaybe ?? true),
        ...payload,
        ...result,
      };
    } catch (error) {
      console.warn("Native review request failed", error);
      return {
        requested: false,
        ...payload,
        transport: "native_game_review",
        reason: "native_review_failed",
        error,
      };
    }
  },

  async openStoreListing(options = {}) {
    const nativePlugin = getNativeReviewPlugin();
    const payload = createReviewPayload({
      source: options.source || "manual",
      writeReview: options.writeReview ?? true,
      ...options,
    });

    if (nativePlugin?.openStoreListing) {
      try {
        const result = await nativePlugin.openStoreListing(payload);
        return {
          opened: Boolean(result?.opened),
          ...payload,
          ...result,
        };
      } catch (error) {
        console.warn("Native store listing open failed", error);
        return {
          opened: false,
          ...payload,
          transport: "native_game_review",
          reason: "native_store_listing_failed",
          error,
        };
      }
    }

    const storeUrl = createStoreListingUrl(payload);
    if (!storeUrl) {
      return {
        opened: false,
        ...payload,
        transport: "web_link",
        reason: "store_listing_unavailable",
      };
    }

    return {
      opened: openExternalUrl(storeUrl),
      ...payload,
      transport: "web_link",
      url: storeUrl,
    };
  },
};

function createReviewPayload(options = {}) {
  return {
    source: options.source || "automatic",
    reason: options.reason || "post_result",
    writeReview: Boolean(options.writeReview ?? false),
    platform: getNativePlatform(),
    appVersion: getAppVersion(),
    app_store_app_id: options.appStoreAppId || getAppStoreAppId(),
    google_play_package: options.googlePlayPackageName || getGooglePlayPackageName(),
    web_store_url: options.webStoreUrl || getWebStoreUrl(),
  };
}

function createStoreListingUrl(payload) {
  if (payload.platform === "ios") {
    const appStoreAppId = payload.app_store_app_id;
    if (!appStoreAppId) {
      return null;
    }

    const reviewAction = payload.writeReview ? "?action=write-review" : "";
    return `https://apps.apple.com/app/id${encodeURIComponent(appStoreAppId)}${reviewAction}`;
  }

  if (payload.platform === "android") {
    return `https://play.google.com/store/apps/details?id=${encodeURIComponent(payload.google_play_package || DEFAULT_GOOGLE_PLAY_PACKAGE)}`;
  }

  return payload.web_store_url || DEFAULT_WEB_STORE_URL;
}

function normalizeShareTarget(target) {
  return Object.values(ShareTargets).includes(target) ? target : ShareTargets.system;
}

export const ads = {
  enabled: true,
  get mode() {
    if (getNativeAdsPlugin()) {
      return "native";
    }
    if (isMetaInstantRuntime()) {
      return META_AD_NETWORK;
    }
    if (adMobState.initialized) {
      return "admob";
    }
    return "mock";
  },
  isAvailable() {
    if (getNativeAdsPlugin()) {
      return true;
    }
    if (isMetaInstantRuntime()) {
      return hasMetaAdApi(META_INTERSTITIAL_FORMAT) || hasMetaAdApi(META_REWARDED_FORMAT);
    }
    return true;
  },
  supportsPlacement(placement = "default", format = "interstitial") {
    const nativePlugin = getNativeAdsPlugin();
    if (nativePlugin) {
      return true;
    }

    if (isMetaInstantRuntime()) {
      if (format === "banner") {
        return false;
      }
      if (format === META_REWARDED_FORMAT) {
        return hasMetaAdApi(META_REWARDED_FORMAT);
      }
      return hasMetaAdApi(META_INTERSTITIAL_FORMAT);
    }

    return format === "banner" || format === "interstitial";
  },
  async initialize() {
    const nativePlugin = getNativeAdsPlugin();
    if (nativePlugin?.initialize) {
      return nativePlugin.initialize({ context: GAME_AD_CONTEXT });
    }

    if (isMetaInstantRuntime()) {
      return initializeMetaInstantAds();
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
        admob_mode: getResolvedAdMobMode(),
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
        admob_mode: getResolvedAdMobMode(),
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
      metaInitialized: metaAdState.initialized,
      metaInitializationError: metaAdState.initializationError?.message || null,
      metaSupportedAPIs: getSupportedMetaApis(),
      metaPlacements: getMetaPlacementStatus(),
      testing: isAdMobTestingEnabled(),
      configuredAdMobMode: getConfiguredAdMobMode(),
      resolvedAdMobMode: getResolvedAdMobMode(),
      liveAdMobEnabled: getResolvedAdMobMode() === AD_MOB_MODES.real,
      realAdUnitsConfigured: hasRealAdUnitsConfigured(getNativePlatform()),
      non_personalized_ads: shouldRequestNonPersonalizedAds(),
      game_ad_context: GAME_AD_CONTEXT,
      placements: {
        app_open_interstitial: this.supportsPlacement("app_open", "interstitial"),
        battle_banner_banner: this.supportsPlacement("battle_banner", "banner"),
        rewarded_video: this.supportsPlacement("rewarded_video", META_REWARDED_FORMAT),
      },
    };
  },
  getBanner(placement = "default", options = {}) {
    const nativePlugin = getNativeAdsPlugin();
    if (nativePlugin?.getBanner) {
      return nativePlugin.getBanner({ placement, ...options, context: GAME_AD_CONTEXT });
    }

    if (isMetaInstantRuntime()) {
      return createMetaAdNotShownResult(placement, "banner", "meta_banner_not_supported");
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

    if (isMetaInstantRuntime()) {
      return showMetaInstantInterstitial(placement);
    }

    if (shouldUseNativeAdMob()) {
      return showAdMobInterstitial(placement);
    }

    return createMockAdResult(placement, "interstitial");
  },
  async showRewardedVideo(placement = "rewarded_video") {
    const nativePlugin = getNativeAdsPlugin();
    if (nativePlugin?.showRewardedVideo) {
      return nativePlugin.showRewardedVideo({ placement, context: GAME_AD_CONTEXT });
    }

    if (isMetaInstantRuntime()) {
      return showMetaInstantRewardedVideo(placement);
    }

    return createMockAdResult(placement, META_REWARDED_FORMAT);
  },
  async hideBanner(placement = "default") {
    const nativePlugin = getNativeAdsPlugin();
    if (nativePlugin?.hideBanner) {
      return nativePlugin.hideBanner({ placement });
    }

    if (isMetaInstantRuntime()) {
      return {
        hidden: false,
        placement,
        network: META_AD_NETWORK,
        reason: "meta_banner_not_supported",
      };
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

function initializeMetaInstantAds() {
  try {
    const supportsInterstitial = hasMetaAdApi(META_INTERSTITIAL_FORMAT);
    const supportsRewarded = hasMetaAdApi(META_REWARDED_FORMAT);
    metaAdState.initialized = true;
    metaAdState.initializationError = null;

    return {
      available: supportsInterstitial || supportsRewarded,
      initialized: true,
      mode: META_AD_NETWORK,
      network: META_AD_NETWORK,
      supports: {
        interstitial: supportsInterstitial,
        rewarded: supportsRewarded,
        banner: false,
      },
      placements: getMetaPlacementStatus(),
      context: GAME_AD_CONTEXT,
    };
  } catch (error) {
    metaAdState.initializationError = error;
    return {
      available: false,
      initialized: false,
      mode: META_AD_NETWORK,
      network: META_AD_NETWORK,
      reason: "meta_ads_initialization_failed",
      error,
    };
  }
}

async function showMetaInstantInterstitial(placement) {
  if (!hasMetaAdApi(META_INTERSTITIAL_FORMAT)) {
    return createMetaAdNotShownResult(placement, META_INTERSTITIAL_FORMAT, "meta_interstitial_unavailable");
  }

  return showMetaInstantAd(placement, META_INTERSTITIAL_FORMAT);
}

async function showMetaInstantRewardedVideo(placement) {
  if (!hasMetaAdApi(META_REWARDED_FORMAT)) {
    return createMetaAdNotShownResult(placement, META_REWARDED_FORMAT, "meta_rewarded_unavailable");
  }

  return showMetaInstantAd(placement, META_REWARDED_FORMAT);
}

async function showMetaInstantAd(placement, format) {
  const fb = getMetaInstant();
  const placementId = getMetaPlacementId(placement, format);
  if (!placementId) {
    return createMetaAdNotShownResult(placement, format, "meta_placement_id_missing");
  }

  try {
    const ad =
      format === META_REWARDED_FORMAT
        ? await fb.getRewardedVideoAsync(placementId)
        : await fb.getInterstitialAdAsync(placementId);
    await ad.loadAsync();
    await ad.showAsync();
    return createMetaAdResult(placement, format, `meta_${format}`, placementId);
  } catch (error) {
    console.warn("Meta Instant ad failed", placement, error);
    return createMetaAdNotShownResult(placement, format, "meta_ad_failed", error);
  }
}

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
  if (isMetaBuildTarget()) {
    throw new Error("AdMob is disabled for Meta Instant Games builds.");
  }

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
  return !isMetaBuildTarget() && isNativeRuntime() && getResolvedAdMobMode() !== AD_MOB_MODES.mock;
}

function getNativePlatform() {
  const platform = globalThis.Capacitor?.getPlatform?.();
  if (platform === "android" || platform === "ios") {
    return platform;
  }
  return isNativeRuntime() ? "android" : "web";
}

function getAdUnitId(placement, fallbackKey) {
  const platform = getNativePlatform();
  const placementKey = getPlacementEnvKey(placement, fallbackKey);
  const resolvedMode = getResolvedAdMobMode();

  if (resolvedMode === AD_MOB_MODES.real) {
    return (
      getEnvAdUnitId(platform, placementKey) ||
      REAL_AD_UNITS[platform]?.[fallbackKey] ||
      GOOGLE_TEST_AD_UNITS[platform]?.[fallbackKey] ||
      GOOGLE_TEST_AD_UNITS.web[fallbackKey]
    );
  }

  if (resolvedMode === AD_MOB_MODES.test) {
    return GOOGLE_TEST_AD_UNITS[platform]?.[fallbackKey] || GOOGLE_TEST_AD_UNITS.web[fallbackKey];
  }

  return GOOGLE_TEST_AD_UNITS.web[fallbackKey];
}

function isAdMobTestingEnabled() {
  return getResolvedAdMobMode() === AD_MOB_MODES.test;
}

function getResolvedAdMobMode() {
  const configuredMode = getConfiguredAdMobMode();
  const platform = getNativePlatform();

  if (!isNativeRuntime() || configuredMode === AD_MOB_MODES.mock) {
    return AD_MOB_MODES.mock;
  }

  if (configuredMode === AD_MOB_MODES.real) {
    return hasRealAdUnitsConfigured(platform) ? AD_MOB_MODES.real : AD_MOB_MODES.test;
  }

  if (configuredMode === AD_MOB_MODES.test) {
    return AD_MOB_MODES.test;
  }

  return AD_MOB_MODES.test;
}

function getConfiguredAdMobMode() {
  const explicitMode = normalizeAdMobMode(getBuildEnvValue("VITE_ADMOB_MODE"));
  if (explicitMode) {
    return explicitMode;
  }

  const explicitTesting = getExplicitBooleanBuildEnvValue("VITE_ADMOB_TESTING");
  if (explicitTesting !== null) {
    return explicitTesting ? AD_MOB_MODES.test : AD_MOB_MODES.real;
  }

  const explicitReleaseAds = getExplicitBooleanBuildEnvValue("VITE_ADMOB_RELEASE_ADS");
  if (explicitReleaseAds === true) {
    return AD_MOB_MODES.real;
  }

  return AD_MOB_MODES.auto;
}

function normalizeAdMobMode(value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const normalized = String(value).trim().toLowerCase();
  if (normalized === "production" || normalized === "prod" || normalized === "live") {
    return AD_MOB_MODES.real;
  }
  if (normalized === "testing" || normalized === "debug") {
    return AD_MOB_MODES.test;
  }
  if (normalized === "off" || normalized === "disabled" || normalized === "canvas") {
    return AD_MOB_MODES.mock;
  }
  if (Object.hasOwn(AD_MOB_MODES, normalized)) {
    return AD_MOB_MODES[normalized];
  }
  return null;
}

function isNativeRuntime() {
  return Boolean(globalThis.Capacitor?.isNativePlatform?.());
}

function isMetaBuildTarget() {
  return IS_META_BUILD_TARGET || getBuildEnvValue("VITE_PLATFORM_TARGET") === "meta";
}

function getMetaInstant() {
  return globalThis.FBInstant || globalThis.window?.FBInstant || null;
}

function isMetaInstantRuntime() {
  return Boolean(getMetaInstant());
}

function hasMetaAdApi(format) {
  const fb = getMetaInstant();
  if (!fb) {
    return false;
  }

  const methodName = format === META_REWARDED_FORMAT ? "getRewardedVideoAsync" : "getInterstitialAdAsync";
  if (typeof fb[methodName] !== "function") {
    return false;
  }

  const supportedApis = getSupportedMetaApis();
  return supportedApis.length === 0 || supportedApis.includes(methodName);
}

function getSupportedMetaApis() {
  const fb = getMetaInstant();
  if (typeof fb?.getSupportedAPIs !== "function") {
    return [];
  }

  try {
    const supportedApis = fb.getSupportedAPIs();
    return Array.isArray(supportedApis) ? supportedApis : [];
  } catch {
    return [];
  }
}

function getMetaPlacementStatus() {
  return {
    appOpen: Boolean(getMetaPlacementId("app_open", META_INTERSTITIAL_FORMAT)),
    rewardedVideo: Boolean(getMetaPlacementId("rewarded_video", META_REWARDED_FORMAT)),
  };
}

function getMetaPlacementId(placement, format) {
  const key = String(placement || "");
  const envKeys = META_PLACEMENT_ENV_KEYS[key]?.[format] || [];
  for (const envKey of envKeys) {
    const value = getBuildEnvValue(envKey);
    if (value) {
      return value;
    }
  }
  return null;
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
  const explicitValue = getExplicitBooleanBuildEnvValue(key);
  return explicitValue === null ? fallback : explicitValue;
}

function getExplicitBooleanBuildEnvValue(key) {
  const value = getBuildEnvValue(key);
  if (value === undefined || value === null || value === "") {
    return null;
  }
  return !["0", "false", "no", "off"].includes(String(value).toLowerCase());
}

function getBuildEnvValue(key) {
  const processEnv = typeof process !== "undefined" ? process.env : null;
  return import.meta.env?.[key] ?? globalThis.__BANGBANG_BUILD_ENV__?.[key] ?? processEnv?.[key];
}

function getAppVersion() {
  return String(
    getBuildEnvValue("VITE_APP_VERSION") ||
    getBuildEnvValue("npm_package_version") ||
    DEFAULT_APP_VERSION,
  );
}

function getGooglePlayPackageName() {
  return String(
    getBuildEnvValue("VITE_GOOGLE_PLAY_PACKAGE") ||
    globalThis.Capacitor?.getConfig?.()?.appId ||
    DEFAULT_GOOGLE_PLAY_PACKAGE,
  );
}

function getAppStoreAppId() {
  return String(
    getBuildEnvValue("VITE_APP_STORE_APP_ID") ||
    getBuildEnvValue("APP_STORE_APP_ID") ||
    "",
  ).replace(/^id/i, "");
}

function getWebStoreUrl() {
  return String(getBuildEnvValue("VITE_WEB_STORE_URL") || DEFAULT_WEB_STORE_URL);
}

function openExternalUrl(url) {
  try {
    const link = globalThis.document?.createElement?.("a");
    if (!link) {
      globalThis.location.href = url;
      return true;
    }

    link.href = url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    globalThis.document.body?.append(link);
    link.click();
    link.remove();
    return true;
  } catch (error) {
    console.warn("Failed to open external URL", error);
    return false;
  }
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
    admob_mode: getResolvedAdMobMode(),
    game_ad_context: GAME_AD_CONTEXT.category,
    ...extra,
  };
}

function createMetaAdResult(placement, format, render, creativeId, extra = {}) {
  return {
    shown: true,
    available: true,
    placement,
    format,
    network: META_AD_NETWORK,
    render,
    creative_id: creativeId,
    campaign: "meta_instant_games",
    testing: false,
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
    testing: isAdMobTestingEnabled(),
    admob_mode: getResolvedAdMobMode(),
    error,
  };
}

function createMetaAdNotShownResult(placement, format, reason, error = null) {
  return {
    shown: false,
    available: false,
    placement,
    format,
    network: META_AD_NETWORK,
    reason,
    testing: false,
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
