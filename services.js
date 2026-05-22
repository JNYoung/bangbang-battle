export const analytics = {
  enabled: false,
  track(eventName, payload = {}) {
    return {
      sent: false,
      eventName,
      payload,
      reason: "analytics_not_configured",
    };
  },
};

export const ads = {
  enabled: false,
  isAvailable() {
    return false;
  },
  async showInterstitial(placement = "default") {
    return {
      shown: false,
      placement,
      reason: "ads_not_configured",
    };
  },
};

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
