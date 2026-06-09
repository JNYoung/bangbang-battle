import test from "node:test";
import assert from "node:assert/strict";

import {
  BATTLE_DANMAKU_EMOTION_ORDER,
  BATTLE_DANMAKU_LINES,
  chooseBattleDanmakuEmotion,
  chooseBattleDanmakuLine,
  formatBattleDanmakuLine,
  getBattleDanmakuEmotionMeta,
  normalizeDanmakuLocale,
} from "../battle-danmaku.js";
import { SUPPORTED_LOCALES } from "../i18n.js";

test("battle danmaku supports every game locale and emotion", () => {
  for (const locale of SUPPORTED_LOCALES) {
    assert.equal(normalizeDanmakuLocale(locale), locale);
    for (const emotion of BATTLE_DANMAKU_EMOTION_ORDER) {
      assert.ok(BATTLE_DANMAKU_LINES[locale][emotion].length >= 4, `${locale}.${emotion} needs enough variety`);
      assert.match(getBattleDanmakuEmotionMeta(emotion).color, /^#/);
    }
  }
});

test("battle danmaku locale normalization falls back safely", () => {
  assert.equal(normalizeDanmakuLocale("zh-Hant-HK"), "zh-TW");
  assert.equal(normalizeDanmakuLocale("en-US"), "en");
  assert.equal(normalizeDanmakuLocale("ar-SA"), "ar");
  assert.equal(normalizeDanmakuLocale("es-ES"), "zh");
});

test("battle danmaku line selection formats contextual placeholders", () => {
  const context = {
    side: "Ball A",
    role: "Mage",
    scene: "Classic",
  };

  assert.equal(
    chooseBattleDanmakuLine("en-US", "hype", context, () => 0),
    "Ball A just hit the gas!",
  );
  assert.equal(formatBattleDanmakuLine("{side} / {role} / {scene}", context), "Ball A / Mage / Classic");
});

test("battle danmaku emotion weighting responds to combat context", () => {
  assert.equal(chooseBattleDanmakuEmotion({ recentHighlightPriority: 4 }, () => 0), "shock");
  assert.equal(chooseBattleDanmakuEmotion({ lowHealth: "Ball B", minHpRatio: 0.2 }, () => 0), "tension");
  assert.equal(chooseBattleDanmakuEmotion({ isItemMode: true }, () => 0), "tease");
  assert.equal(chooseBattleDanmakuEmotion({ matchTime: 1 }, () => 0), "cheer");
});
