import assert from "node:assert/strict";
import test from "node:test";

import {
  applySinglePublishState,
  calculateEfficiency,
  extractYoutubeVideoId,
} from "../scripts/youtube-publish-metrics.mjs";

test("extractYoutubeVideoId supports common Shorts and watch URLs", () => {
  assert.equal(extractYoutubeVideoId("https://www.youtube.com/shorts/abcDEF123_4"), "abcDEF123_4");
  assert.equal(extractYoutubeVideoId("https://youtu.be/abcDEF123_4"), "abcDEF123_4");
  assert.equal(extractYoutubeVideoId("https://www.youtube.com/watch?v=abcDEF123_4&t=2"), "abcDEF123_4");
  assert.equal(extractYoutubeVideoId("abcDEF123_4"), "abcDEF123_4");
});

test("calculateEfficiency keeps subscriber and engagement rates explicit", () => {
  const efficiency = calculateEfficiency({
    views_since_publish: 1000,
    engaged_views_since_publish: 420,
    subscribers_gained_since_publish: 3,
    likes_since_publish: 50,
    comments_since_publish: 10,
    shares_since_publish: 5,
    google_play_clicks_24h: 20,
    estimated_minutes_watched_since_publish: 80,
  });

  assert.equal(efficiency.subscribers_per_1000_views, 3);
  assert.equal(efficiency.engaged_view_rate, 0.42);
  assert.equal(efficiency.like_rate, 0.05);
  assert.equal(efficiency.comment_rate, 0.01);
  assert.equal(efficiency.share_rate, 0.005);
  assert.equal(efficiency.google_play_click_rate, 0.02);
  assert.equal(efficiency.watch_minutes_per_view, 0.08);
});

test("calculateEfficiency treats missing metrics as unknown, not zero", () => {
  const efficiency = calculateEfficiency({
    views_since_publish: null,
    likes_since_publish: "",
  });

  assert.equal(efficiency.views_basis, null);
  assert.equal(efficiency.like_rate, null);
});

test("applySinglePublishState marks one clip published and holds the rest", () => {
  const manifest = {
    runId: "2026-06-24-231930",
    clips: [
      { selectionRank: 1, youtube: { title: "A", tracking: {} } },
      { selectionRank: 2, youtube: { title: "B", tracking: {} } },
      { selectionRank: 3, youtube: { title: "C", tracking: {} } },
    ],
  };
  const result = applySinglePublishState(manifest, {
    selectionRank: 1,
    publishedAtLocal: "2026-06-25",
    youtubeVideoId: "abcDEF123_4",
    youtubeUrl: "https://www.youtube.com/shorts/abcDEF123_4",
    snapshot: {
      dataApi: { viewCount: 120, likeCount: 8, commentCount: 1, privacyStatus: "public" },
      analyticsApi: { views: 118, engagedViews: 50, subscribersGained: 1 },
      accessIssues: [],
    },
  });

  assert.equal(result.manifest.publishTracking.videosPublished, 1);
  assert.equal(result.manifest.clips[0].youtube.publishStatus, "published");
  assert.equal(result.manifest.clips[0].youtube.tracking.youtube_video_id, "abcDEF123_4");
  assert.equal(result.manifest.clips[1].youtube.publishStatus, "held_for_cadence");
  assert.equal(result.manifest.clips[2].youtube.tracking, undefined);
});
