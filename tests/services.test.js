import assert from "node:assert/strict";
import test from "node:test";

import {
  ShareTargets,
  ads,
  analytics,
  createBattleReplayShareUrl,
  iap,
  normalizeAnalyticsName,
  normalizeAnalyticsPayload,
  parseBattleReplayLink,
  socialShare,
} from "../services.js";

function withBuildEnv(env, callback) {
  const previousEnv = globalThis.__BANGBANG_BUILD_ENV__;
  globalThis.__BANGBANG_BUILD_ENV__ = env;

  const restore = () => {
    if (previousEnv === undefined) {
      delete globalThis.__BANGBANG_BUILD_ENV__;
    } else {
      globalThis.__BANGBANG_BUILD_ENV__ = previousEnv;
    }
  };

  try {
    const result = callback();
    if (result && typeof result.finally === "function") {
      return result.finally(restore);
    }
    restore();
    return result;
  } catch (error) {
    restore();
    throw error;
  }
}

function withCapacitor(capacitor, callback) {
  const previousCapacitor = globalThis.Capacitor;
  globalThis.Capacitor = capacitor;

  const restore = () => {
    globalThis.Capacitor = previousCapacitor;
  };

  try {
    const result = callback();
    if (result && typeof result.finally === "function") {
      return result.finally(restore);
    }
    restore();
    return result;
  } catch (error) {
    restore();
    throw error;
  }
}

function withMetaInstant(fbInstant, callback) {
  const previousFbInstant = globalThis.FBInstant;
  globalThis.FBInstant = fbInstant;

  const restore = () => {
    if (previousFbInstant === undefined) {
      delete globalThis.FBInstant;
    } else {
      globalThis.FBInstant = previousFbInstant;
    }
  };

  try {
    const result = callback();
    if (result && typeof result.finally === "function") {
      return result.finally(restore);
    }
    restore();
    return result;
  } catch (error) {
    restore();
    throw error;
  }
}

test("analytics placeholder is callable and does not send events", async () => {
  await analytics.setCollectionEnabled(true);
  const result = analytics.track("game_start", { a: "spear", b: "blade", enabled: true });

  assert.equal(result.sent, false);
  assert.equal(result.eventName, "game_start");
  assert.deepEqual(result.payload, { a: "spear", b: "blade", enabled: 1 });
  assert.equal(result.reason, "analytics_not_configured");
  await analytics.setCollectionEnabled(false);
});

test("analytics events stay local until consent enables collection", () => {
  const result = analytics.track("game_start", { scene: "classic" });

  assert.equal(result.sent, false);
  assert.equal(result.eventName, "game_start");
  assert.equal(result.reason, "analytics_collection_disabled");
});

test("analytics status reports unavailable without a native bridge", async () => {
  const result = await analytics.getStatus();

  assert.equal(result.available, false);
  assert.equal(result.reason, "analytics_not_configured");
});

test("analytics payload normalization keeps Firebase-compatible names and values", () => {
  assert.equal(normalizeAnalyticsName("google.bad-name", "event"), "event_google_bad_name");
  assert.deepEqual(normalizeAnalyticsPayload({
    "own role": "summoner",
    "attack-count": 12,
    muted: false,
    ignored: undefined,
  }), {
    own_role: "summoner",
    attack_count: 12,
    muted: 0,
  });
});

test("ads test chain returns mock placements safely", async () => {
  assert.equal(ads.isAvailable(), true);

  const result = await ads.showInterstitial("result");
  assert.equal(result.shown, true);
  assert.equal(result.placement, "result");
  assert.equal(result.network, "mock_game_ads");
  assert.equal(result.render, "canvas_mock");
  assert.equal(result.game_ad_context, "games");

  const banner = ads.getBanner("battle_banner");
  assert.equal(banner.available, true);
  assert.equal(banner.format, "banner");
});

test("ads delegates to native game ad bridge with game context", async () => {
  const calls = [];
  const capacitor = {
    Plugins: {
      GameAds: {
        initialize(options) {
          calls.push(["initialize", options]);
          return { available: true, transport: "native_game_ads" };
        },
        getBanner(options) {
          calls.push(["getBanner", options]);
          return { available: true, shown: true, placement: options.placement, format: "banner", network: "native_game_ads" };
        },
        showInterstitial(options) {
          calls.push(["showInterstitial", options]);
          return { shown: true, placement: options.placement, format: "interstitial", network: "native_game_ads" };
        },
        hideBanner(options) {
          calls.push(["hideBanner", options]);
          return { hidden: true, placement: options.placement };
        },
      },
    },
  };

  await withCapacitor(capacitor, async () => {
    assert.equal(ads.mode, "native");
    assert.equal((await ads.initialize()).transport, "native_game_ads");
    assert.equal((await ads.showInterstitial("app_open")).network, "native_game_ads");
    assert.equal((await ads.getBanner("battle_banner", { marginBottom: 24 })).network, "native_game_ads");
    assert.equal((await ads.hideBanner("battle_banner")).hidden, true);
    assert.deepEqual(calls.map(([name]) => name), ["initialize", "showInterstitial", "getBanner", "hideBanner"]);
    assert.equal(calls[1][1].context.category, "games");
    assert.deepEqual(calls[2][1].context.keywords, ["arcade game", "mobile game", "battle game", "pixel game"]);
  });
});

test("meta instant games uses FBInstant ads and disables banner placements", async () => {
  const calls = [];
  const fbInstant = {
    getSupportedAPIs() {
      return ["getInterstitialAdAsync", "getRewardedVideoAsync"];
    },
    async getInterstitialAdAsync(placementId) {
      calls.push(["getInterstitialAdAsync", placementId]);
      return {
        async loadAsync() {
          calls.push(["interstitial.loadAsync", placementId]);
        },
        async showAsync() {
          calls.push(["interstitial.showAsync", placementId]);
        },
      };
    },
    async getRewardedVideoAsync(placementId) {
      calls.push(["getRewardedVideoAsync", placementId]);
      return {
        async loadAsync() {
          calls.push(["rewarded.loadAsync", placementId]);
        },
        async showAsync() {
          calls.push(["rewarded.showAsync", placementId]);
        },
      };
    },
  };

  await withMetaInstant(fbInstant, async () => {
    await withBuildEnv({
      VITE_META_APP_OPEN_AD_PLACEMENT_ID: "meta-app-open-placement",
      VITE_META_REWARDED_VIDEO_PLACEMENT_ID: "meta-rewarded-placement",
    }, async () => {
      assert.equal(ads.mode, "meta_instant_games");
      assert.equal(ads.isAvailable(), true);
      assert.equal(ads.supportsPlacement("app_open", "interstitial"), true);
      assert.equal(ads.supportsPlacement("battle_banner", "banner"), false);

      const init = await ads.initialize();
      assert.equal(init.mode, "meta_instant_games");
      assert.equal(init.supports.banner, false);
      assert.equal(init.placements.appOpen, true);

      const interstitial = await ads.showInterstitial("app_open");
      assert.equal(interstitial.shown, true);
      assert.equal(interstitial.network, "meta_instant_games");
      assert.equal(interstitial.creative_id, "meta-app-open-placement");

      const rewarded = await ads.showRewardedVideo("rewarded_video");
      assert.equal(rewarded.shown, true);
      assert.equal(rewarded.network, "meta_instant_games");
      assert.equal(rewarded.creative_id, "meta-rewarded-placement");

      const banner = ads.getBanner("battle_banner");
      assert.equal(banner.shown, false);
      assert.equal(banner.reason, "meta_banner_not_supported");
      assert.deepEqual(calls.map(([name]) => name), [
        "getInterstitialAdAsync",
        "interstitial.loadAsync",
        "interstitial.showAsync",
        "getRewardedVideoAsync",
        "rewarded.loadAsync",
        "rewarded.showAsync",
      ]);
    });
  });
});

test("meta instant ads fail closed when placement ids are not configured", async () => {
  await withMetaInstant({
    getSupportedAPIs() {
      return ["getInterstitialAdAsync"];
    },
    async getInterstitialAdAsync() {
      throw new Error("Should not request without placement id");
    },
  }, async () => {
    await withBuildEnv({}, async () => {
      const result = await ads.showInterstitial("app_open");
      assert.equal(result.shown, false);
      assert.equal(result.network, "meta_instant_games");
      assert.equal(result.reason, "meta_placement_id_missing");
    });
  });
});

test("native AdMob status keeps live ads explicit and testable", () => {
  withCapacitor({
    isNativePlatform: () => true,
    getPlatform: () => "android",
  }, () => {
    withBuildEnv({}, () => {
      const status = ads.getStatus();
      assert.equal(status.configuredAdMobMode, "auto");
      assert.equal(status.resolvedAdMobMode, "test");
      assert.equal(status.testing, true);
      assert.equal(status.liveAdMobEnabled, false);
      assert.equal(status.realAdUnitsConfigured, true);
    });

    withBuildEnv({ VITE_ADMOB_MODE: "real" }, () => {
      const status = ads.getStatus();
      assert.equal(status.configuredAdMobMode, "real");
      assert.equal(status.resolvedAdMobMode, "real");
      assert.equal(status.testing, false);
      assert.equal(status.liveAdMobEnabled, true);
    });

    withBuildEnv({ VITE_ADMOB_TESTING: "false" }, () => {
      const status = ads.getStatus();
      assert.equal(status.configuredAdMobMode, "real");
      assert.equal(status.resolvedAdMobMode, "real");
      assert.equal(status.testing, false);
    });
  });

  withCapacitor({
    isNativePlatform: () => true,
    getPlatform: () => "ios",
  }, () => {
    withBuildEnv({ VITE_ADMOB_MODE: "real" }, () => {
      const status = ads.getStatus();
      assert.equal(status.configuredAdMobMode, "real");
      assert.equal(status.resolvedAdMobMode, "test");
      assert.equal(status.testing, true);
      assert.equal(status.liveAdMobEnabled, false);
      assert.equal(status.realAdUnitsConfigured, false);
    });
  });
});

test("battle replay share URLs carry matchup and deterministic seed", () => {
  withBuildEnv({ VITE_SHARE_BASE_URL: "https://example.test/root/" }, () => {
    const shareUrl = createBattleReplayShareUrl({
      scene: "classic",
      a: "spear",
      b: "blade",
      ballCount: 4,
      seed: 12345,
      matchId: "match-1",
    });

    assert.equal(shareUrl, "https://example.test/battle/?scene=classic&a=spear&b=blade&count=4&seed=12345&match=match-1&auto=play");
    assert.deepEqual(parseBattleReplayLink(shareUrl), {
      rawUrl: shareUrl,
      source: "deeplink",
      autoStart: true,
      scene: "classic",
      a: "spear",
      b: "blade",
      ballCount: "4",
      replaySeed: 12345,
      matchId: "match-1",
    });
  });
});

test("custom battle deep links are parsed for native app opens", () => {
  const link = parseBattleReplayLink("professionballarena://battle/replay?scene=items&count=6&seed=42");

  assert.equal(link.autoStart, true);
  assert.equal(link.scene, "items");
  assert.equal(link.ballCount, "6");
  assert.equal(link.replaySeed, 42);
});

test("social share delegates image payloads to the native bridge", async () => {
  const calls = [];
  await withCapacitor({
    Plugins: {
      GameSocial: {
        shareImage(options) {
          calls.push(options);
          return { shared: true, transport: "android_sharesheet" };
        },
      },
    },
  }, async () => {
    const result = await socialShare.shareImage({
      target: ShareTargets.tiktok,
      fileName: "report.png",
      contentType: "image/png",
      base64Data: "data:image/png;base64,AAAA",
      title: "Report",
      text: "Replay",
      deepLinkUrl: "https://example.test/battle/?seed=1",
    });

    assert.equal(result.shared, true);
    assert.equal(calls[0].target, "tiktok");
    assert.equal(calls[0].deepLinkUrl, "https://example.test/battle/?seed=1");
  });
});

test("iap placeholder exposes empty products and restore result", async () => {
  assert.deepEqual(await iap.getProducts(), []);

  const result = await iap.restorePurchases();
  assert.equal(result.restored, false);
  assert.deepEqual(result.purchases, []);
  assert.equal(result.reason, "iap_not_configured");
});
