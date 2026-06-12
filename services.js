const ANALYTICS_PARAM_LIMIT = 25;
const ANALYTICS_NAME_LIMIT = 40;
const ANALYTICS_STRING_VALUE_LIMIT = 100;
const RESERVED_ANALYTICS_PREFIXES = ["firebase_", "ga_", "google_"];
const AD_DISABLED_MODE = "disabled";
const AD_DISABLED_REASON = "ads_removed";
const AD_FORMATS = Object.freeze({
  banner: "banner",
  interstitial: "interstitial",
  rewarded: "rewarded",
});
const IS_META_BUILD_TARGET = import.meta.env?.VITE_PLATFORM_TARGET === "meta";
const DEFAULT_SHARE_BASE_URL = "https://professionballarena.top";
const DEFAULT_WEB_STORE_URL = "https://professionballarena.top/download/";
const DEFAULT_GOOGLE_PLAY_PACKAGE = "com.professionballarena.game";
const DEFAULT_APP_VERSION = "0.1.0";
const BATTLE_SHARE_PATH = "/battle/";
const CUSTOM_DEEP_LINK_SCHEME = "professionballarena:";
const BATTLE_REPLAY_SEED_MAX = 0xffffffff;
let analyticsCollectionEnabled = false;

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
  rewardedAdGrant: "rewarded_ad_grant",
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
  enabled: false,
  get mode() {
    return AD_DISABLED_MODE;
  },
  isAvailable() {
    return false;
  },
  supportsPlacement() {
    return false;
  },
  async initialize() {
    return {
      available: false,
      initialized: false,
      mode: AD_DISABLED_MODE,
      reason: AD_DISABLED_REASON,
    };
  },
  getStatus() {
    return {
      available: false,
      mode: AD_DISABLED_MODE,
      initialized: false,
      reason: AD_DISABLED_REASON,
      metaRuntime: isMetaInstantRuntime() || isMetaBuildTarget(),
      placements: {
        app_open_interstitial: false,
        battle_banner_banner: false,
        rewarded_video: false,
      },
    };
  },
  getBanner(placement = "default") {
    return createAdNotShownResult(placement, AD_FORMATS.banner, AD_DISABLED_REASON);
  },
  async showInterstitial(placement = "default") {
    return createAdNotShownResult(placement, AD_FORMATS.interstitial, AD_DISABLED_REASON);
  },
  async showRewardedVideo(placement = "rewarded_video") {
    return createAdNotShownResult(placement, AD_FORMATS.rewarded, AD_DISABLED_REASON);
  },
  async hideBanner(placement = "default") {
    return {
      hidden: false,
      placement,
      network: AD_DISABLED_MODE,
      reason: "no_active_banner",
    };
  },
};

function getNativePlatform() {
  const platform = globalThis.Capacitor?.getPlatform?.();
  if (platform === "android" || platform === "ios") {
    return platform;
  }
  return isNativeRuntime() ? "android" : "web";
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

function createAdNotShownResult(placement, format, reason, error = null) {
  return {
    shown: false,
    available: false,
    placement,
    format,
    network: AD_DISABLED_MODE,
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
