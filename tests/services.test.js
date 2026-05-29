import assert from "node:assert/strict";
import test from "node:test";

import { ads, analytics, iap, normalizeAnalyticsName, normalizeAnalyticsPayload } from "../services.js";

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
  const previousCapacitor = globalThis.Capacitor;
  const calls = [];
  globalThis.Capacitor = {
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

  try {
    assert.equal(ads.mode, "native");
    assert.equal((await ads.initialize()).transport, "native_game_ads");
    assert.equal((await ads.showInterstitial("app_open")).network, "native_game_ads");
    assert.equal((await ads.getBanner("battle_banner", { marginBottom: 24 })).network, "native_game_ads");
    assert.equal((await ads.hideBanner("battle_banner")).hidden, true);
    assert.deepEqual(calls.map(([name]) => name), ["initialize", "showInterstitial", "getBanner", "hideBanner"]);
    assert.equal(calls[1][1].context.category, "games");
    assert.deepEqual(calls[2][1].context.keywords, ["arcade game", "mobile game", "battle game", "pixel game"]);
  } finally {
    globalThis.Capacitor = previousCapacitor;
  }
});

test("native AdMob status uses production units only for configured platforms", () => {
  const previousCapacitor = globalThis.Capacitor;

  try {
    globalThis.Capacitor = {
      isNativePlatform: () => true,
      getPlatform: () => "android",
    };
    assert.equal(ads.getStatus().testing, false);
    assert.equal(ads.getStatus().realAdUnitsConfigured, true);

    globalThis.Capacitor = {
      isNativePlatform: () => true,
      getPlatform: () => "ios",
    };
    assert.equal(ads.getStatus().testing, true);
    assert.equal(ads.getStatus().realAdUnitsConfigured, false);
  } finally {
    globalThis.Capacitor = previousCapacitor;
  }
});

test("iap placeholder exposes empty products and restore result", async () => {
  assert.deepEqual(await iap.getProducts(), []);

  const result = await iap.restorePurchases();
  assert.equal(result.restored, false);
  assert.deepEqual(result.purchases, []);
  assert.equal(result.reason, "iap_not_configured");
});
