import assert from "node:assert/strict";
import test from "node:test";

import {
  createOpsStoryPackage,
  resolveYoutubeVideoFormat,
  scoreClipCandidate,
  selectTopicClips,
} from "../scripts/youtube-ops-utils.mjs";

function createClip(overrides = {}) {
  return {
    index: overrides.index || 1,
    fileName: overrides.fileName || "01-bangbang-battle-2026-06-12-normal-match.webm",
    recordingTags: overrides.recordingTags || ["normal"],
    recordingTagLabels: overrides.recordingTagLabels || ["可备选素材"],
    matchup: overrides.matchup || "剑客 vs 法师",
    winnerRoleName: overrides.winnerRoleName || "剑客",
    roleNames: overrides.roleNames || { own: "剑客", opponent: "法师" },
    match: {
      winnerSide: "A",
      ownResult: "win",
      ownRole: "sword",
      opponentRole: "mage",
      duration: 28,
      ownDamage: 42,
      opponentDamage: 38,
      ownHits: 5,
      opponentHits: 4,
      reason: "球 A 抓住一次关键反打",
      lesson: "败方技能空档太长",
      ...overrides.match,
    },
  };
}

test("topic scoring favors dramatic highlight tags over backup clips", () => {
  const normalScore = scoreClipCandidate(createClip()).score;
  const comebackScore = scoreClipCandidate(createClip({ recordingTags: ["comeback", "clutch"] })).score;

  assert.ok(comebackScore > normalScore);
});

test("topic selection keeps daily picks varied when candidates allow it", () => {
  const selected = selectTopicClips([
    createClip({ index: 1, recordingTags: ["perfect"], match: { ownRole: "sword", opponentRole: "mage" } }),
    createClip({ index: 2, recordingTags: ["clutch"], match: { ownRole: "sword", opponentRole: "mage" } }),
    createClip({ index: 3, recordingTags: ["comeback"], matchup: "刺客 vs 铁盾", match: { ownRole: "assassin", opponentRole: "shield" } }),
  ], 2);

  assert.equal(selected.length, 2);
  assert.deepEqual(selected.map((clip) => clip.index), [1, 3]);
  assert.deepEqual(selected.map((clip) => clip.selectionRank), [1, 2]);
});

test("story package creates reusable prompt material for Chinese ops workflow", () => {
  const clip = createClip({ recordingTags: ["clutch"], winnerRoleName: "剑客" });
  const topic = scoreClipCandidate(clip);
  const story = createOpsStoryPackage({
    clip,
    topic,
    locale: "zh",
    videoFormat: resolveYoutubeVideoFormat("short"),
  });

  assert.equal(story.language, "zh");
  assert.match(story.surface, /Shorts/);
  assert.ok(story.titleIdeas.length >= 3);
  assert.match(story.editingPrompt, /游戏短视频剪辑导演/);
  assert.match(story.thumbnailPrompt, /像素风游戏/);
});

test("youtube format resolver supports common short aliases", () => {
  assert.deepEqual(resolveYoutubeVideoFormat("shorts").viewport, { width: 1080, height: 1920 });
  assert.deepEqual(resolveYoutubeVideoFormat("1:1").viewport, { width: 1080, height: 1080 });
  assert.deepEqual(resolveYoutubeVideoFormat("unknown").viewport, { width: 1280, height: 720 });
});
