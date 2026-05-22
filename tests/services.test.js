import assert from "node:assert/strict";
import test from "node:test";

import { ads, analytics, iap } from "../services.js";

test("analytics placeholder is callable and does not send events", () => {
  const result = analytics.track("game_start", { a: "spear", b: "blade" });

  assert.equal(result.sent, false);
  assert.equal(result.eventName, "game_start");
  assert.equal(result.reason, "analytics_not_configured");
});

test("ads placeholder reports unavailable and no-ops safely", async () => {
  assert.equal(ads.isAvailable(), false);

  const result = await ads.showInterstitial("result");
  assert.equal(result.shown, false);
  assert.equal(result.reason, "ads_not_configured");
});

test("iap placeholder exposes empty products and restore result", async () => {
  assert.deepEqual(await iap.getProducts(), []);

  const result = await iap.restorePurchases();
  assert.equal(result.restored, false);
  assert.deepEqual(result.purchases, []);
  assert.equal(result.reason, "iap_not_configured");
});
