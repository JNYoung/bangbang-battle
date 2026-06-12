import assert from "node:assert/strict";
import test from "node:test";

import {
  AnalyticsEvents,
  ShareTargets,
  ads,
  analytics,
  createBattleReplayShareUrl,
  iap,
  normalizeAnalyticsName,
  normalizeAnalyticsPayload,
  parseBattleReplayLink,
  reviews,
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

test("analytics event names include render quality monitoring", () => {
  assert.equal(AnalyticsEvents.renderQualityChange, "render_quality_change");
  assert.equal(AnalyticsEvents.rewardedAdGrant, "rewarded_ad_grant");
});

test("ads service is disabled and never shows placements", async () => {
  assert.equal(ads.enabled, false);
  assert.equal(ads.mode, "disabled");
  assert.equal(ads.isAvailable(), false);
  assert.equal(ads.supportsPlacement("rewarded_video", "rewarded"), false);

  const init = await ads.initialize();
  assert.equal(init.available, false);
  assert.equal(init.reason, "ads_removed");

  const interstitial = await ads.showInterstitial("app_open");
  assert.equal(interstitial.shown, false);
  assert.equal(interstitial.network, "disabled");
  assert.equal(interstitial.reason, "ads_removed");

  const banner = ads.getBanner("battle_banner");
  assert.equal(banner.available, false);
  assert.equal(banner.format, "banner");
  assert.equal(banner.reason, "ads_removed");

  const rewarded = await ads.showRewardedVideo("rewarded_video");
  assert.equal(rewarded.shown, false);
  assert.equal(rewarded.format, "rewarded");
  assert.equal(rewarded.reason, "ads_removed");

  const hide = await ads.hideBanner("battle_banner");
  assert.equal(hide.hidden, false);
  assert.equal(hide.network, "disabled");
});

test("ads service does not delegate to native or Meta ad APIs", async () => {
  const calls = [];
  const capacitor = {
    Plugins: {
      GameAds: {
        initialize() {
          calls.push("native.initialize");
        },
        getBanner() {
          calls.push("native.getBanner");
        },
        showInterstitial() {
          calls.push("native.showInterstitial");
        },
        showRewardedVideo() {
          calls.push("native.showRewardedVideo");
        },
        hideBanner() {
          calls.push("native.hideBanner");
        },
      },
    },
  };
  const fbInstant = {
    getSupportedAPIs() {
      calls.push("meta.getSupportedAPIs");
      return ["getInterstitialAdAsync", "getRewardedVideoAsync"];
    },
    async getInterstitialAdAsync() {
      calls.push("meta.getInterstitialAdAsync");
    },
    async getRewardedVideoAsync() {
      calls.push("meta.getRewardedVideoAsync");
    },
  };

  await withCapacitor(capacitor, async () => {
    await withMetaInstant(fbInstant, async () => {
      assert.equal((await ads.initialize()).reason, "ads_removed");
      assert.equal((await ads.showInterstitial("app_open")).shown, false);
      assert.equal((await ads.showRewardedVideo("rewarded_video")).shown, false);
      assert.equal(ads.getBanner("battle_banner").shown, false);
      assert.equal((await ads.hideBanner("battle_banner")).hidden, false);
    });
  });

  assert.deepEqual(calls, []);
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

test("reviews delegate in-app review and store opens to the native bridge", async () => {
  const calls = [];
  await withCapacitor({
    isNativePlatform: () => true,
    getPlatform: () => "android",
    getConfig: () => ({ appId: "com.example.game" }),
    Plugins: {
      GameReview: {
        requestReview(options) {
          calls.push(["requestReview", options]);
          return { requested: true, transport: "google_play_review_api" };
        },
        openStoreListing(options) {
          calls.push(["openStoreListing", options]);
          return { opened: true, transport: "android_market_intent" };
        },
      },
    },
  }, async () => {
    await withBuildEnv({ VITE_APP_VERSION: "2.0.0" }, async () => {
      assert.equal(reviews.isNativeAvailable(), true);
      const requestResult = await reviews.requestReview({ source: "result", reason: "post_win_result" });
      assert.equal(requestResult.requested, true);
      assert.equal(requestResult.appVersion, "2.0.0");
      assert.equal(requestResult.google_play_package, "com.example.game");

      const storeResult = await reviews.openStoreListing({ source: "settings", writeReview: true });
      assert.equal(storeResult.opened, true);
      assert.deepEqual(calls.map(([name]) => name), ["requestReview", "openStoreListing"]);
      assert.equal(calls[1][1].writeReview, true);
    });
  });
});

test("reviews fail closed without a native review bridge", async () => {
  await withBuildEnv({ VITE_WEB_STORE_URL: "https://example.test/download/" }, async () => {
    assert.equal(reviews.isNativeAvailable(), false);
    const requestResult = await reviews.requestReview({ source: "result" });
    assert.equal(requestResult.requested, false);
    assert.equal(requestResult.reason, "native_review_unavailable");

    const status = reviews.getStatus();
    assert.equal(status.available, false);
    assert.equal(status.web_store_url, "https://example.test/download/");
  });
});

test("iap placeholder exposes empty products and restore result", async () => {
  assert.deepEqual(await iap.getProducts(), []);

  const result = await iap.restorePurchases();
  assert.equal(result.restored, false);
  assert.deepEqual(result.purchases, []);
  assert.equal(result.reason, "iap_not_configured");
});
