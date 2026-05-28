const ANALYTICS_PARAM_LIMIT = 25;
const ANALYTICS_NAME_LIMIT = 40;
const ANALYTICS_STRING_VALUE_LIMIT = 100;
const RESERVED_ANALYTICS_PREFIXES = ["firebase_", "ga_", "google_"];
let analyticsCollectionEnabled = false;

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
  return globalThis.Capacitor?.Plugins?.GameAds || globalThis.Capacitor?.Plugins?.AdMob || null;
}

function getGtag() {
  return typeof globalThis.gtag === "function" ? globalThis.gtag : null;
}

export const ads = {
  enabled: true,
  get mode() {
    return getNativeAdsPlugin() ? "native" : "mock";
  },
  isAvailable() {
    return true;
  },
  getBanner(placement = "default") {
    const nativePlugin = getNativeAdsPlugin();
    if (nativePlugin?.getBanner) {
      return nativePlugin.getBanner({ placement });
    }

    return createMockAdResult(placement, "banner");
  },
  async showInterstitial(placement = "default") {
    const nativePlugin = getNativeAdsPlugin();
    if (nativePlugin?.showInterstitial) {
      return nativePlugin.showInterstitial({ placement });
    }

    return createMockAdResult(placement, "interstitial");
  },
};

function createMockAdResult(placement, format) {
  return {
    shown: true,
    available: true,
    placement,
    format,
    network: "mock",
    render: "canvas_mock",
    creative_id: `mock_${placement}_${format}`,
    campaign: "test_ad_chain",
  };
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
