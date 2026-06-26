import { access, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

import {
  GOOGLE_SCOPES,
  createServiceAccountAccessToken,
  requestGoogleApiJson,
  resolveGoogleAccessToken,
} from "./google-api-auth.mjs";

const DEFAULT_OUTPUT_ROOT = "ops-materials/youtube";
const DEFAULT_TIME_ZONE = "Asia/Shanghai";
const DEFAULT_PUBLISHED_RANK = 1;
const DEFAULT_GA4_PROPERTY_ID = "539311512";
const GOOGLE_PLAY_URL = "https://play.google.com/store/apps/details?id=com.professionballarena.game";
const GROWTH_API_SCOPES = [
  GOOGLE_SCOPES.youtubeReadonly,
  GOOGLE_SCOPES.youtubeAnalyticsReadonly,
  GOOGLE_SCOPES.analyticsReadonly,
];
const CADENCE_POLICY = {
  phase: "account_warmup",
  maxPostsPerDay: 1,
  candidatePoolPerDay: 9,
  holdWindowHours: 24,
  reason: "Keep Shorts signals concentrated while the channel is still warming up.",
};
const ANALYTICS_METRICS = [
  "views",
  "engagedViews",
  "likes",
  "comments",
  "shares",
  "subscribersGained",
  "subscribersLost",
  "estimatedMinutesWatched",
  "averageViewDuration",
  "averageViewPercentage",
];

export function parseArgs(argv) {
  const parsed = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith("--")) {
      continue;
    }

    const [rawKey, inlineValue] = arg.slice(2).split("=");
    const key = rawKey.trim();
    if (!key) {
      continue;
    }

    if (inlineValue !== undefined) {
      parsed[key] = inlineValue;
    } else if (argv[index + 1] && !argv[index + 1].startsWith("--")) {
      parsed[key] = argv[index + 1];
      index += 1;
    } else {
      parsed[key] = true;
    }
  }
  return parsed;
}

export function extractYoutubeVideoId(input) {
  const raw = String(input || "").trim();
  if (!raw) {
    return "";
  }
  if (/^[A-Za-z0-9_-]{11}$/.test(raw)) {
    return raw;
  }

  const looseMatch = /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|shorts\/|embed\/|live\/)|[?&]v=)([A-Za-z0-9_-]{11})/.exec(raw);
  if (looseMatch?.[1]) {
    return looseMatch[1];
  }

  try {
    const url = new URL(raw);
    const v = url.searchParams.get("v");
    if (/^[A-Za-z0-9_-]{11}$/.test(v || "")) {
      return v;
    }
    const parts = url.pathname.split("/").filter(Boolean);
    const candidate = parts.find((part, index) =>
      ["shorts", "embed", "live"].includes(parts[index - 1]) && /^[A-Za-z0-9_-]{11}$/.test(part),
    ) || (url.hostname.includes("youtu.be") ? parts[0] : "");
    return /^[A-Za-z0-9_-]{11}$/.test(candidate || "") ? candidate : "";
  } catch {
    return "";
  }
}

export function calculateEfficiency(tracking = {}) {
  const views = firstFinite(
    tracking.views_since_publish,
    tracking.views_current,
    tracking.views_24h,
  );
  const engagedViews = firstFinite(
    tracking.engaged_views_since_publish,
    tracking.engaged_views_current,
    tracking.engaged_views_24h,
  );
  const subscribersGained = firstFinite(
    tracking.subscribers_gained_since_publish,
    tracking.subscribers_gained_24h,
  );
  const likes = firstFinite(tracking.likes_since_publish, tracking.likes_current, tracking.likes_24h);
  const comments = firstFinite(tracking.comments_since_publish, tracking.comments_current, tracking.comments_24h);
  const shares = firstFinite(tracking.shares_since_publish, tracking.shares_24h);
  const gpClicks = firstFinite(tracking.google_play_clicks_since_publish, tracking.google_play_clicks_24h);
  const estimatedMinutesWatched = firstFinite(tracking.estimated_minutes_watched_since_publish);

  return {
    views_basis: views,
    engaged_views_basis: engagedViews,
    subscribers_gained_basis: subscribersGained,
    subscribers_per_1000_views: rate(subscribersGained, views, 1000),
    subscribers_per_1000_engaged_views: rate(subscribersGained, engagedViews, 1000),
    engaged_view_rate: rate(engagedViews, views),
    like_rate: rate(likes, views),
    comment_rate: rate(comments, views),
    share_rate: rate(shares, views),
    google_play_click_rate: rate(gpClicks, views),
    watch_minutes_per_view: rate(estimatedMinutesWatched, views),
    cadence_posts_today: 1,
    cadence_max_posts_today: CADENCE_POLICY.maxPostsPerDay,
    recommendation: createEfficiencyRecommendation({ views, engagedViews, subscribersGained, gpClicks }),
  };
}

export function applySinglePublishState(manifest, {
  selectionRank = DEFAULT_PUBLISHED_RANK,
  publishedAtLocal,
  youtubeVideoId = "",
  youtubeUrl = "",
  snapshot = {},
  generatedAt = new Date().toISOString(),
  trackingPath = "",
  trackingMarkdownPath = "",
  efficiencyPath = "",
  efficiencyMarkdownPath = "",
} = {}) {
  const next = JSON.parse(JSON.stringify(manifest || {}));
  const clips = Array.isArray(next.clips) ? next.clips : [];
  const publishedClip = findClipByRank(clips, selectionRank) || clips[0] || null;
  const publishedRank = publishedClip?.selectionRank || selectionRank;
  const status = createTrackingStatus({ youtubeVideoId, snapshot });
  const missing = createMissingList({ youtubeVideoId, snapshot });
  const heldReason = "起号阶段每日只发 1 条，剩余素材进入 hold queue，避免同日过量发布稀释推荐信号。";
  const tracking = publishedClip
    ? createVideoTracking({
        existingTracking: publishedClip.youtube?.tracking,
        publishedAtLocal,
        youtubeVideoId,
        youtubeUrl,
        snapshot,
        generatedAt,
      })
    : {};
  const efficiency = calculateEfficiency(tracking);

  for (const clip of clips) {
    clip.youtube = clip.youtube || {};
    if (clip === publishedClip) {
      clip.youtube.publishStatus = "published";
      clip.youtube.publishedAtLocal = publishedAtLocal;
      clip.youtube.tracking = tracking;
      clip.youtube.efficiency = efficiency;
      clip.youtube.trackingStatus = status;
      delete clip.youtube.holdReason;
    } else {
      clip.youtube.publishStatus = "held_for_cadence";
      clip.youtube.trackingStatus = "not_published_hold";
      clip.youtube.holdReason = heldReason;
      delete clip.youtube.publishedAtLocal;
      delete clip.youtube.tracking;
      delete clip.youtube.efficiency;
    }
  }

  next.publishTracking = {
    status,
    publishedAtLocal,
    trackingGeneratedAt: generatedAt,
    trackingPath,
    trackingMarkdownPath,
    efficiencyPath,
    efficiencyMarkdownPath,
    videosPublished: publishedClip ? 1 : 0,
    publishedSelectionRank: publishedClip ? publishedRank : null,
    publishedTitle: publishedClip?.youtube?.title || "",
    heldVideos: Math.max(0, clips.length - (publishedClip ? 1 : 0)),
    youtubeVideoId,
    youtubeUrl,
    cadencePolicy: CADENCE_POLICY,
    automation: {
      dataApiSynced: Boolean(snapshot.dataApi),
      analyticsApiSynced: Boolean(snapshot.analyticsApi),
      trafficSourceApiSynced: Boolean(snapshot.trafficSourceApi),
      channelStatsSynced: Boolean(snapshot.channelStats),
      ga4AttributionSynced: Boolean(snapshot.ga4AttributionApi),
      autoBoundLatestVideo: Boolean(snapshot.autoBoundVideo),
      credentialSources: snapshot.credentialSources || {},
      accessIssues: snapshot.accessIssues || [],
    },
    efficiency,
    missing,
  };

  return {
    manifest: next,
    publishedClip,
    tracking,
    efficiency,
    status,
    missing,
  };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const runDir = await resolveRunDir(options.run || options.runId, options.root || process.env.YOUTUBE_MATERIAL_DIR);
  const manifestPath = join(runDir, "manifest.json");
  const manifest = await readJson(manifestPath);
  const publishedAtLocal = String(options.publishedAt || options.date || getTodayInTimeZone()).slice(0, 10);
  const selectionRank = Math.max(1, Number.parseInt(options.rank || options.publishedRank || DEFAULT_PUBLISHED_RANK, 10) || DEFAULT_PUBLISHED_RANK);
  const existingClip = findClipByRank(manifest.clips || [], selectionRank) || manifest.clips?.[0] || {};
  const existingTracking = existingClip.youtube?.tracking || {};
  let youtubeVideoId = extractYoutubeVideoId(
    options.videoId || options.videoUrl || process.env.YOUTUBE_VIDEO_ID || process.env.YOUTUBE_VIDEO_URL ||
      existingTracking.youtube_video_id || existingTracking.youtube_url,
  );
  let youtubeUrl = normalizeYoutubeUrl(options.videoUrl || process.env.YOUTUBE_VIDEO_URL || existingTracking.youtube_url, youtubeVideoId);
  const generatedAt = new Date().toISOString();
  const dateKey = publishedAtLocal;
  const trackingPath = join(runDir, `youtube-publish-tracking-${dateKey}.json`);
  const trackingMarkdownPath = join(runDir, `youtube-publish-tracking-${dateKey}.md`);
  const efficiencyPath = join(runDir, `youtube-efficiency-${dateKey}.json`);
  const efficiencyMarkdownPath = join(runDir, `youtube-efficiency-${dateKey}.md`);
  const googleAuth = await resolveGoogleAccessToken({
    accessToken: options.accessToken || process.env.YOUTUBE_ACCESS_TOKEN || process.env.GOOGLE_ACCESS_TOKEN || "",
    tokenPath: options.tokenPath || process.env.GOOGLE_OAUTH_TOKEN_JSON || process.env.YOUTUBE_OAUTH_TOKEN_JSON,
    clientPath: options.clientPath || process.env.GOOGLE_OAUTH_CLIENT_JSON || process.env.YOUTUBE_OAUTH_CLIENT_JSON,
    clientJson: process.env.GOOGLE_OAUTH_CLIENT || process.env.YOUTUBE_OAUTH_CLIENT || "",
    scopes: GROWTH_API_SCOPES,
  });
  let autoBoundVideo = null;
  const preflightAccessIssues = [];
  if (!youtubeVideoId && googleAuth.accessToken && options.autoBindLatest !== "0") {
    try {
      autoBoundVideo = await findLatestOwnedYoutubeVideo({
        accessToken: googleAuth.accessToken,
        titleHint: existingClip.youtube?.title || "",
        publishedAfter: `${publishedAtLocal}T00:00:00Z`,
      });
    } catch (error) {
      preflightAccessIssues.push(`youtube_auto_bind_latest_failed:${compactError(error)}`);
    }
    if (!autoBoundVideo) {
      preflightAccessIssues.push("youtube_auto_bind_latest_video_empty");
    }
    youtubeVideoId = autoBoundVideo?.videoId || "";
    youtubeUrl = normalizeYoutubeUrl("", youtubeVideoId);
  }
  const snapshot = await readYoutubeSnapshot({
    youtubeVideoId,
    startDate: options.startDate || publishedAtLocal,
    endDate: options.endDate || getTodayInPacificDate(),
    accessToken: googleAuth.accessToken,
    oauthAccessIssues: [...(googleAuth.accessIssues || []), ...preflightAccessIssues],
    oauthSource: googleAuth.source || "",
    apiKey: options.apiKey || process.env.YOUTUBE_API_KEY || "",
    channelId: options.channelId || process.env.YOUTUBE_CHANNEL_ID || "",
    gaPropertyId: options.gaProperty || options.ga4Property || process.env.GA4_PROPERTY_ID || DEFAULT_GA4_PROPERTY_ID,
    gaAccessToken: options.gaAccessToken || process.env.GA4_ACCESS_TOKEN || "",
    gaServiceAccountPath: options.serviceAccount || process.env.GA4_SERVICE_ACCOUNT_JSON || process.env.GOOGLE_APPLICATION_CREDENTIALS || "",
    autoBoundVideo,
  });

  const updated = applySinglePublishState(manifest, {
    selectionRank,
    publishedAtLocal,
    youtubeVideoId,
    youtubeUrl,
    snapshot,
    generatedAt,
    trackingPath,
    trackingMarkdownPath,
    efficiencyPath,
    efficiencyMarkdownPath,
  });

  const trackingDocument = createTrackingDocument({
    runDir,
    manifestPath,
    publishedAtLocal,
    generatedAt,
    ...updated,
  });
  const efficiencyDocument = createEfficiencyDocument({
    runDir,
    publishedAtLocal,
    generatedAt,
    ...updated,
  });

  await writeJson(manifestPath, updated.manifest);
  await writeClipMetadata(updated.manifest);
  await writeJson(trackingPath, trackingDocument);
  await writeFile(trackingMarkdownPath, createTrackingMarkdown(trackingDocument));
  await writeJson(efficiencyPath, efficiencyDocument);
  await writeFile(efficiencyMarkdownPath, createEfficiencyMarkdown(efficiencyDocument));

  console.log(`Updated publish tracking: ${trackingMarkdownPath}`);
  console.log(`Updated efficiency report: ${efficiencyMarkdownPath}`);
  if (updated.missing.length) {
    console.log(`Still missing: ${updated.missing.join(", ")}`);
  }
}

async function readYoutubeSnapshot({
  youtubeVideoId,
  startDate,
  endDate,
  accessToken,
  oauthAccessIssues = [],
  oauthSource = "",
  apiKey,
  channelId,
  gaPropertyId,
  gaAccessToken,
  gaServiceAccountPath,
  autoBoundVideo,
}) {
  const snapshot = {
    generatedAt: new Date().toISOString(),
    dataApi: null,
    analyticsApi: null,
    trafficSourceApi: null,
    channelStats: null,
    ga4AttributionApi: null,
    autoBoundVideo: autoBoundVideo || null,
    credentialSources: {
      googleOAuth: oauthSource || "",
      youtubeApiKey: apiKey ? "env_or_cli_api_key" : "",
      ga4: "",
    },
    accessIssues: [...oauthAccessIssues],
  };

  if (!youtubeVideoId) {
    snapshot.accessIssues.push("missing_youtube_video_id_or_url");
    return snapshot;
  }

  if (!accessToken && !apiKey) {
    snapshot.accessIssues.push("missing_youtube_access_token_or_api_key");
  }

  if (accessToken || apiKey) {
    try {
      snapshot.dataApi = await fetchVideoDataApi({ youtubeVideoId, accessToken, apiKey });
    } catch (error) {
      snapshot.accessIssues.push(`youtube_data_api_failed:${compactError(error)}`);
    }
    try {
      snapshot.channelStats = await fetchChannelStats({ accessToken, apiKey, channelId });
    } catch (error) {
      snapshot.accessIssues.push(`youtube_channel_stats_failed:${compactError(error)}`);
    }
  }

  if (!accessToken) {
    snapshot.accessIssues.push("missing_youtube_analytics_oauth_token");
  } else {
    try {
      snapshot.analyticsApi = await fetchAnalyticsSummary({
        youtubeVideoId,
        startDate,
        endDate,
        accessToken,
        channelId,
        metrics: ANALYTICS_METRICS,
      });
    } catch (error) {
      if (String(error?.message || "").includes("engagedViews")) {
        snapshot.accessIssues.push("engagedViews_metric_unavailable_retrying_without_it");
        try {
          snapshot.analyticsApi = await fetchAnalyticsSummary({
            youtubeVideoId,
            startDate,
            endDate,
            accessToken,
            channelId,
            metrics: ANALYTICS_METRICS.filter((metric) => metric !== "engagedViews"),
          });
        } catch (fallbackError) {
          snapshot.accessIssues.push(`youtube_analytics_api_failed:${compactError(fallbackError)}`);
        }
      } else {
        snapshot.accessIssues.push(`youtube_analytics_api_failed:${compactError(error)}`);
      }
    }

    try {
      snapshot.trafficSourceApi = await fetchTrafficSourceSummary({
        youtubeVideoId,
        startDate,
        endDate,
        accessToken,
        channelId,
      });
    } catch (error) {
      snapshot.accessIssues.push(`youtube_traffic_source_api_failed:${compactError(error)}`);
    }
  }

  const gaCredential = await resolveGa4AccessToken({ gaAccessToken, sharedAccessToken: accessToken, gaServiceAccountPath });
  snapshot.credentialSources.ga4 = gaCredential.source || "";
  snapshot.accessIssues.push(...(gaCredential.accessIssues || []));
  if (gaPropertyId && gaCredential.accessToken) {
    try {
      snapshot.ga4AttributionApi = await fetchGa4YoutubeAttribution({
        propertyId: gaPropertyId,
        accessToken: gaCredential.accessToken,
        startDate,
        endDate,
        youtubeVideoId,
      });
    } catch (error) {
      snapshot.accessIssues.push(`ga4_youtube_attribution_failed:${compactError(error)}`);
    }
  } else if (!gaPropertyId) {
    snapshot.accessIssues.push("missing_ga4_property_id");
  }

  return snapshot;
}

async function fetchVideoDataApi({ youtubeVideoId, accessToken, apiKey }) {
  const url = new URL("https://www.googleapis.com/youtube/v3/videos");
  url.searchParams.set("part", "snippet,statistics,status");
  url.searchParams.set("id", youtubeVideoId);
  if (!accessToken && apiKey) {
    url.searchParams.set("key", apiKey);
  }
  const response = await fetchJson(url, accessToken);
  const item = response.items?.[0] || {};
  const statistics = item.statistics || {};
  return {
    title: item.snippet?.title || "",
    publishedAt: item.snippet?.publishedAt || "",
    privacyStatus: item.status?.privacyStatus || "",
    viewCount: toNumberOrNull(statistics.viewCount),
    likeCount: toNumberOrNull(statistics.likeCount),
    commentCount: toNumberOrNull(statistics.commentCount),
  };
}

async function fetchChannelStats({ accessToken, apiKey, channelId }) {
  const url = new URL("https://www.googleapis.com/youtube/v3/channels");
  url.searchParams.set("part", "statistics");
  const normalizedChannelId = normalizeChannelId(channelId);
  if (accessToken && (!normalizedChannelId || normalizedChannelId === "MINE")) {
    url.searchParams.set("mine", "true");
  } else if (normalizedChannelId && normalizedChannelId !== "MINE") {
    url.searchParams.set("id", normalizedChannelId);
  } else {
    return null;
  }
  if (!accessToken && apiKey) {
    url.searchParams.set("key", apiKey);
  }
  const response = await fetchJson(url, accessToken);
  const item = response.items?.[0] || {};
  const statistics = item.statistics || {};
  return {
    channelId: item.id || (normalizedChannelId === "MINE" ? "" : normalizedChannelId),
    subscriberCount: toNumberOrNull(statistics.subscriberCount),
    hiddenSubscriberCount: Boolean(statistics.hiddenSubscriberCount),
    videoCount: toNumberOrNull(statistics.videoCount),
    viewCount: toNumberOrNull(statistics.viewCount),
  };
}

async function fetchAnalyticsSummary({ youtubeVideoId, startDate, endDate, accessToken, channelId, metrics }) {
  const url = new URL("https://youtubeanalytics.googleapis.com/v2/reports");
  url.searchParams.set("ids", normalizeAnalyticsIds(channelId));
  url.searchParams.set("startDate", startDate);
  url.searchParams.set("endDate", endDate);
  url.searchParams.set("metrics", metrics.join(","));
  url.searchParams.set("filters", `video==${youtubeVideoId}`);
  const response = await fetchJson(url, accessToken);
  return analyticsRowToObject(response);
}

async function fetchTrafficSourceSummary({ youtubeVideoId, startDate, endDate, accessToken, channelId }) {
  const url = new URL("https://youtubeanalytics.googleapis.com/v2/reports");
  url.searchParams.set("ids", normalizeAnalyticsIds(channelId));
  url.searchParams.set("startDate", startDate);
  url.searchParams.set("endDate", endDate);
  url.searchParams.set("metrics", "views");
  url.searchParams.set("dimensions", "insightTrafficSourceType");
  url.searchParams.set("filters", `video==${youtubeVideoId}`);
  const response = await fetchJson(url, accessToken);
  const headers = (response.columnHeaders || []).map((column) => column.name);
  const rows = response.rows || [];
  const sourceRows = rows.map((row) => Object.fromEntries(headers.map((header, index) => [header, row[index]])));
  const shortsRow = sourceRows.find((row) => row.insightTrafficSourceType === "SHORTS");
  return {
    rows: sourceRows,
    shortsTrafficViews: toNumberOrNull(shortsRow?.views),
  };
}

async function resolveGa4AccessToken({ gaAccessToken, sharedAccessToken, gaServiceAccountPath }) {
  if (gaAccessToken) {
    return {
      accessToken: gaAccessToken,
      source: "ga4_env_access_token",
      accessIssues: [],
    };
  }

  if (gaServiceAccountPath) {
    return createServiceAccountAccessToken({
      serviceAccountPath: gaServiceAccountPath,
      scopes: [GOOGLE_SCOPES.analyticsReadonly],
    });
  }

  if (sharedAccessToken) {
    return {
      accessToken: sharedAccessToken,
      source: "shared_google_oauth_token",
      accessIssues: [],
    };
  }

  return {
    accessToken: "",
    source: "missing_ga4_credentials",
    accessIssues: ["missing_ga4_access_token_or_service_account"],
  };
}

async function fetchGa4YoutubeAttribution({ propertyId, accessToken, startDate, endDate, youtubeVideoId }) {
  const queries = [];
  const sessionReport = await runGa4Report({
    propertyId,
    accessToken,
    body: createGa4YoutubeSessionReport({ startDate, endDate, youtubeVideoId }),
  });
  queries.push({
    id: "session_source",
    status: "ready",
    rows: toGa4Rows(sessionReport),
  });

  try {
    const customReport = await runGa4Report({
      propertyId,
      accessToken,
      body: createGa4YoutubeCustomParamReport({ startDate, endDate, youtubeVideoId }),
    });
    queries.push({
      id: "custom_event_params",
      status: "ready",
      rows: toGa4Rows(customReport),
    });
  } catch (error) {
    queries.push({
      id: "custom_event_params",
      status: "unavailable",
      reason: compactError(error),
      rows: [],
    });
  }

  return {
    propertyId,
    startDate,
    endDate,
    queries,
    summary: summarizeGa4AttributionRows(queries.flatMap((query) => query.rows || [])),
  };
}

async function runGa4Report({ propertyId, accessToken, body }) {
  const response = await requestGoogleApiJson(`https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${accessToken}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(response.json.error?.message ||
      response.json.error_description ||
      response.json.error ||
      `HTTP ${response.status}`);
  }
  return response.json;
}

function createGa4YoutubeSessionReport({ startDate, endDate, youtubeVideoId }) {
  return {
    dateRanges: [{ startDate, endDate }],
    dimensions: [
      { name: "eventName" },
      { name: "sessionSource" },
      { name: "sessionMedium" },
      { name: "sessionCampaignName" },
    ],
    metrics: [{ name: "eventCount" }, { name: "totalUsers" }],
    dimensionFilter: {
      orGroup: {
        expressions: [
          stringContainsFilter("sessionSource", "youtube"),
          stringContainsFilter("sessionSource", "youtu"),
          stringContainsFilter("sessionCampaignName", "youtube"),
          youtubeVideoId ? stringContainsFilter("sessionCampaignName", youtubeVideoId) : null,
        ].filter(Boolean),
      },
    },
    limit: 100,
  };
}

function createGa4YoutubeCustomParamReport({ startDate, endDate, youtubeVideoId }) {
  return {
    dateRanges: [{ startDate, endDate }],
    dimensions: [
      { name: "eventName" },
      { name: "customEvent:traffic_source" },
      { name: "customEvent:traffic_campaign" },
      { name: "customEvent:traffic_content" },
    ],
    metrics: [{ name: "eventCount" }, { name: "totalUsers" }],
    dimensionFilter: {
      orGroup: {
        expressions: [
          stringContainsFilter("customEvent:traffic_source", "youtube"),
          stringContainsFilter("customEvent:traffic_campaign", "youtube"),
          youtubeVideoId ? stringContainsFilter("customEvent:traffic_content", youtubeVideoId) : null,
        ].filter(Boolean),
      },
    },
    limit: 100,
  };
}

function stringContainsFilter(fieldName, value) {
  return {
    filter: {
      fieldName,
      stringFilter: {
        matchType: "CONTAINS",
        value,
        caseSensitive: false,
      },
    },
  };
}

function toGa4Rows(report) {
  const dimensions = (report.dimensionHeaders || []).map((header) => header.name);
  const metrics = (report.metricHeaders || []).map((header) => header.name);
  return (report.rows || []).map((row) => {
    const record = {};
    dimensions.forEach((name, index) => {
      record[name] = row.dimensionValues?.[index]?.value || "";
    });
    metrics.forEach((name, index) => {
      record[name] = toNumberOrNull(row.metricValues?.[index]?.value) || 0;
    });
    return record;
  });
}

function summarizeGa4AttributionRows(rows) {
  const dedupeKey = (row) => [
    row.eventName || "",
    row.sessionSource || row["customEvent:traffic_source"] || "",
    row.sessionCampaignName || row["customEvent:traffic_campaign"] || "",
    row["customEvent:traffic_content"] || "",
  ].join("|");
  const uniqueRows = new Map();
  for (const row of rows) {
    uniqueRows.set(dedupeKey(row), row);
  }
  const values = [...uniqueRows.values()];
  const eventCount = sumMetric(values, "eventCount");
  return {
    eventCount,
    totalUsers: maxMetric(values, "totalUsers"),
    gameStartEvents: sumMetric(values.filter((row) => row.eventName === "game_start"), "eventCount"),
    gameInitSuccessEvents: sumMetric(values.filter((row) => row.eventName === "game_init_success"), "eventCount"),
    firstBattleCompleteEvents: sumMetric(values.filter((row) => row.eventName === "first_battle_complete"), "eventCount"),
    secondBattleStartEvents: sumMetric(values.filter((row) => row.eventName === "second_battle_start"), "eventCount"),
    matchRecordingShareEvents: sumMetric(values.filter((row) => row.eventName === "match_recording_share"), "eventCount"),
    storeReviewClickEvents: sumMetric(values.filter((row) => row.eventName === "store_review_click"), "eventCount"),
  };
}

async function findLatestOwnedYoutubeVideo({ accessToken, titleHint, publishedAfter }) {
  const uploads = await listLatestOwnedUploadedVideos({ accessToken }).catch(() => []);
  const uploadedInWindow = filterVideosByPublishedAfter(uploads, publishedAfter);
  const titleMatch = findTitleHintMatch(uploadedInWindow, titleHint) ||
    findTitleHintMatch(uploads, titleHint);
  if (titleMatch) {
    return titleMatch;
  }
  if (uploadedInWindow[0]) {
    return uploadedInWindow[0];
  }
  if (uploads[0]) {
    return uploads[0];
  }

  const titleSearch = titleHint ? await searchOwnedYoutubeVideos({
    accessToken,
    query: titleHint,
    publishedAfter,
  }) : [];
  const fallbackSearch = titleSearch.length ? titleSearch : await searchOwnedYoutubeVideos({
    accessToken,
    query: "",
    publishedAfter,
  });
  return fallbackSearch[0] || null;
}

async function listLatestOwnedUploadedVideos({ accessToken }) {
  const channelsUrl = new URL("https://www.googleapis.com/youtube/v3/channels");
  channelsUrl.searchParams.set("part", "contentDetails");
  channelsUrl.searchParams.set("mine", "true");
  const channels = await fetchJson(channelsUrl, accessToken);
  const uploadsPlaylistId = channels.items?.[0]?.contentDetails?.relatedPlaylists?.uploads || "";
  if (!uploadsPlaylistId) {
    return [];
  }

  const playlistUrl = new URL("https://www.googleapis.com/youtube/v3/playlistItems");
  playlistUrl.searchParams.set("part", "snippet,contentDetails");
  playlistUrl.searchParams.set("playlistId", uploadsPlaylistId);
  playlistUrl.searchParams.set("maxResults", "5");
  const playlist = await fetchJson(playlistUrl, accessToken);
  return (playlist.items || [])
    .map((item) => ({
      videoId: item.contentDetails?.videoId || item.snippet?.resourceId?.videoId || "",
      title: item.snippet?.title || "",
      publishedAt: item.contentDetails?.videoPublishedAt || item.snippet?.publishedAt || "",
      channelTitle: item.snippet?.channelTitle || "",
    }))
    .filter((item) => item.videoId)
    .sort(compareVideosByPublishedAtDesc);
}

async function searchOwnedYoutubeVideos({ accessToken, query, publishedAfter }) {
  const url = new URL("https://www.googleapis.com/youtube/v3/search");
  url.searchParams.set("part", "snippet");
  url.searchParams.set("forMine", "true");
  url.searchParams.set("type", "video");
  url.searchParams.set("maxResults", "5");
  if (query) {
    url.searchParams.set("q", query);
  }
  const response = await fetchJson(url, accessToken);
  return filterVideosByPublishedAfter((response.items || [])
    .map((item) => ({
      videoId: item.id?.videoId || "",
      title: item.snippet?.title || "",
      publishedAt: item.snippet?.publishedAt || "",
      channelTitle: item.snippet?.channelTitle || "",
    }))
    .filter((item) => item.videoId), publishedAfter)
    .sort(compareVideosByPublishedAtDesc);
}

function filterVideosByPublishedAfter(videos, publishedAfter) {
  const threshold = Date.parse(publishedAfter || "");
  if (!Number.isFinite(threshold)) {
    return videos;
  }
  return videos.filter((video) => {
    const publishedAt = Date.parse(video.publishedAt || "");
    return Number.isFinite(publishedAt) && publishedAt >= threshold;
  });
}

function findTitleHintMatch(videos, titleHint) {
  const normalizedHint = normalizeSearchText(titleHint);
  if (!normalizedHint) {
    return null;
  }
  return videos.find((video) => {
    const normalizedTitle = normalizeSearchText(video.title);
    return normalizedTitle.includes(normalizedHint) || normalizedHint.includes(normalizedTitle);
  }) || null;
}

function compareVideosByPublishedAtDesc(a, b) {
  return (Date.parse(b.publishedAt || "") || 0) - (Date.parse(a.publishedAt || "") || 0);
}

function normalizeSearchText(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

async function fetchJson(url, accessToken) {
  const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
  const response = await requestGoogleApiJson(url, { headers });
  if (!response.ok) {
    const message = response.json.error?.message ||
      response.json.error_description ||
      response.text ||
      response.statusText;
    throw new Error(`${response.status} ${message}`);
  }
  return response.json;
}

function analyticsRowToObject(response) {
  const headers = (response.columnHeaders || []).map((column) => column.name);
  const row = response.rows?.[0] || [];
  return Object.fromEntries(headers.map((header, index) => [header, toNumberOrNull(row[index])]));
}

function createVideoTracking({ existingTracking = {}, publishedAtLocal, youtubeVideoId, youtubeUrl, snapshot, generatedAt }) {
  const dataApi = snapshot.dataApi || {};
  const analyticsApi = snapshot.analyticsApi || {};
  const channelStats = snapshot.channelStats || {};
  const trafficSourceApi = snapshot.trafficSourceApi || {};
  const ga4Summary = snapshot.ga4AttributionApi?.summary || {};
  const subscribersBefore = firstFinite(existingTracking.channel_subscribers_before);
  const subscribersCurrent = firstFinite(channelStats.subscriberCount);
  const channelSubscribersGained = subscribersBefore !== null && subscribersCurrent !== null
    ? subscribersCurrent - subscribersBefore
    : null;

  return {
    ...existingTracking,
    youtube_video_id: youtubeVideoId,
    youtube_url: youtubeUrl,
    published_at_local: publishedAtLocal,
    visibility: dataApi.privacyStatus || existingTracking.visibility || "public",
    snapshot_at: generatedAt,
    data_source: createDataSourceLabel(snapshot),
    youtube_title_current: dataApi.title || existingTracking.youtube_title_current || "",
    youtube_published_at: dataApi.publishedAt || existingTracking.youtube_published_at || "",
    channel_subscribers_current: subscribersCurrent,
    channel_subscribers_gained_since_baseline: channelSubscribersGained,
    views_current: firstFinite(dataApi.viewCount),
    likes_current: firstFinite(dataApi.likeCount),
    comments_current: firstFinite(dataApi.commentCount),
    views_since_publish: firstFinite(analyticsApi.views),
    engaged_views_since_publish: firstFinite(analyticsApi.engagedViews),
    likes_since_publish: firstFinite(analyticsApi.likes),
    comments_since_publish: firstFinite(analyticsApi.comments),
    shares_since_publish: firstFinite(analyticsApi.shares),
    subscribers_gained_since_publish: firstFinite(analyticsApi.subscribersGained),
    subscribers_lost_since_publish: firstFinite(analyticsApi.subscribersLost),
    estimated_minutes_watched_since_publish: firstFinite(analyticsApi.estimatedMinutesWatched),
    average_view_duration_since_publish: firstFinite(analyticsApi.averageViewDuration),
    average_percentage_viewed_since_publish: firstFinite(analyticsApi.averageViewPercentage),
    shorts_traffic_views_since_publish: firstFinite(trafficSourceApi.shortsTrafficViews),
    ga4_youtube_event_count_since_publish: firstFinite(ga4Summary.eventCount),
    ga4_youtube_total_users_since_publish: firstFinite(ga4Summary.totalUsers),
    ga4_game_start_events_from_youtube_since_publish: firstFinite(ga4Summary.gameStartEvents),
    ga4_game_init_success_events_from_youtube_since_publish: firstFinite(ga4Summary.gameInitSuccessEvents),
    ga4_first_battle_complete_events_from_youtube_since_publish: firstFinite(ga4Summary.firstBattleCompleteEvents),
    ga4_second_battle_start_events_from_youtube_since_publish: firstFinite(ga4Summary.secondBattleStartEvents),
    ga4_match_recording_share_events_from_youtube_since_publish: firstFinite(ga4Summary.matchRecordingShareEvents),
    ga4_store_review_click_events_from_youtube_since_publish: firstFinite(ga4Summary.storeReviewClickEvents),
    shown_in_feed_24h: existingTracking.shown_in_feed_24h ?? null,
    viewed_vs_swiped_away_24h: existingTracking.viewed_vs_swiped_away_24h ?? null,
    google_play_clicks_24h: existingTracking.google_play_clicks_24h ?? null,
    replay_link_clicks_24h: existingTracking.replay_link_clicks_24h ?? null,
    notes: existingTracking.notes || "",
    access_issues: snapshot.accessIssues || [],
  };
}

function createTrackingDocument({ runDir, manifestPath, publishedAtLocal, generatedAt, manifest, tracking, efficiency, status, missing }) {
  const clips = manifest.clips || [];
  const publishedClip = clips.find((clip) => clip.youtube?.publishStatus === "published") || null;
  return {
    runId: manifest.runId,
    sourceManifest: manifestPath,
    generatedAt,
    publishedAtLocal,
    status,
    surface: "YouTube Shorts",
    googlePlayUrl: GOOGLE_PLAY_URL,
    cadencePolicy: CADENCE_POLICY,
    metricDefinitions: {
      views: "For Shorts, API views count starts/replays after the 2025 Shorts view-count change.",
      engagedViews: "Quality-oriented Shorts count aligned with the previous view-counting methodology.",
      subscribers_gained: "Per-video subscribers gained from YouTube Analytics when OAuth is available.",
      subscribers_per_1000_views: "subscribers gained / views * 1000.",
      google_play_clicks: "Needs GA/UTM or YouTube external-link click export; YouTube APIs do not reliably expose this per Short.",
      ga4_youtube_attribution: "GA4 events whose session source/campaign or registered custom event params indicate YouTube traffic.",
    },
    automation: manifest.publishTracking?.automation || {},
    missing,
    publishedVideo: publishedClip ? createTrackingVideoRecord(publishedClip, tracking, efficiency) : null,
    heldVideos: clips
      .filter((clip) => clip.youtube?.publishStatus === "held_for_cadence")
      .map((clip) => ({
        selectionRank: clip.selectionRank,
        title: clip.youtube?.title || "",
        videoPathMp4: clip.videoPathMp4 || "",
        replayUrl: clip.youtube?.replayUrl || clip.shareUrl || "",
        holdReason: clip.youtube?.holdReason || "",
      })),
    outputDir: runDir,
  };
}

function createEfficiencyDocument({ runDir, publishedAtLocal, generatedAt, manifest, tracking, efficiency, status, missing }) {
  const publishedClip = (manifest.clips || []).find((clip) => clip.youtube?.publishStatus === "published") || null;
  return {
    runId: manifest.runId,
    generatedAt,
    publishedAtLocal,
    status,
    cadencePolicy: CADENCE_POLICY,
    title: publishedClip?.youtube?.title || "",
    youtubeUrl: tracking.youtube_url || "",
    youtubeVideoId: tracking.youtube_video_id || "",
    metrics: tracking,
    efficiency,
    decision: createCadenceDecision({ efficiency, missing }),
    outputDir: runDir,
  };
}

function createTrackingVideoRecord(clip, tracking, efficiency) {
  return {
    selectionRank: clip.selectionRank,
    title: clip.youtube?.title || "",
    videoPathMp4: clip.videoPathMp4 || "",
    videoPathWebm: clip.videoPath || "",
    replayUrl: clip.youtube?.replayUrl || clip.shareUrl || "",
    googlePlayUrl: clip.youtube?.googlePlayUrl || GOOGLE_PLAY_URL,
    pinnedComment: clip.youtube?.pinnedComment || "",
    tracking,
    efficiency,
  };
}

function createTrackingMarkdown(document) {
  const video = document.publishedVideo;
  const tracking = video?.tracking || {};
  const efficiency = video?.efficiency || {};
  const lines = [
    `# YouTube Publish Tracking - ${document.publishedAtLocal}`,
    "",
    `Status: ${document.status}`,
    `Cadence: ${document.cadencePolicy.maxPostsPerDay} Short/day max during account warmup`,
    `Published videos: ${video ? 1 : 0}`,
    `Held videos: ${document.heldVideos.length}`,
    `Google Play: ${document.googlePlayUrl}`,
    "",
    "## Published Short",
    "",
    "| Title | YouTube URL | Views | Engaged views | Subs gained | Subs / 1k views | Likes | Comments | Shares | Avg view | Avg % viewed |",
    "| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |",
    video
      ? `| ${escapePipe(video.title)} | ${tracking.youtube_url || "TBD"} | ${formatMetric(firstFinite(tracking.views_since_publish, tracking.views_current))} | ${formatMetric(tracking.engaged_views_since_publish)} | ${formatMetric(tracking.subscribers_gained_since_publish)} | ${formatRate(efficiency.subscribers_per_1000_views)} | ${formatMetric(firstFinite(tracking.likes_since_publish, tracking.likes_current))} | ${formatMetric(firstFinite(tracking.comments_since_publish, tracking.comments_current))} | ${formatMetric(tracking.shares_since_publish)} | ${formatSeconds(tracking.average_view_duration_since_publish)} | ${formatPercent(tracking.average_percentage_viewed_since_publish)} |`
      : "| TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD |",
    "",
    "## Efficiency Read",
    "",
    `- Recommendation: ${efficiency.recommendation || "Waiting for data."}`,
    `- Google Play click rate: ${formatPercent(efficiency.google_play_click_rate)}`,
    `- Engaged view rate: ${formatPercent(efficiency.engaged_view_rate)}`,
    `- Watch minutes per view: ${formatRate(efficiency.watch_minutes_per_view)}`,
    "",
    "## GA4 Attribution",
    "",
    "| Source events | Users | Game starts | First battle complete | Second battle starts | Store review clicks |",
    "| --- | --- | --- | --- | --- | --- |",
    video
      ? `| ${formatMetric(tracking.ga4_youtube_event_count_since_publish)} | ${formatMetric(tracking.ga4_youtube_total_users_since_publish)} | ${formatMetric(tracking.ga4_game_start_events_from_youtube_since_publish)} | ${formatMetric(tracking.ga4_first_battle_complete_events_from_youtube_since_publish)} | ${formatMetric(tracking.ga4_second_battle_start_events_from_youtube_since_publish)} | ${formatMetric(tracking.ga4_store_review_click_events_from_youtube_since_publish)} |`
      : "| TBD | TBD | TBD | TBD | TBD | TBD |",
    "",
    "## Automation Sources",
    "",
    `- YouTube Data API: ${document.automation?.dataApiSynced ? "synced" : "pending"}`,
    `- YouTube Analytics API: ${document.automation?.analyticsApiSynced ? "synced" : "pending"}`,
    `- YouTube traffic source API: ${document.automation?.trafficSourceApiSynced ? "synced" : "pending"}`,
    `- GA4 Data API: ${document.automation?.ga4AttributionSynced ? "synced" : "pending"}`,
    `- Auto-bound latest video: ${document.automation?.autoBoundLatestVideo ? "yes" : "no"}`,
    `- Credential sources: ${Object.entries(document.automation?.credentialSources || {}).filter(([, value]) => value).map(([key, value]) => `${key}=${value}`).join(", ") || "pending"}`,
    "",
    "## Held Queue",
    "",
  ];

  if (document.heldVideos.length) {
    lines.push("| Rank | Title | Reason |");
    lines.push("| --- | --- | --- |");
    for (const held of document.heldVideos) {
      lines.push(`| ${held.selectionRank} | ${escapePipe(held.title)} | ${escapePipe(held.holdReason)} |`);
    }
  } else {
    lines.push("No held videos.");
  }

  lines.push("");
  lines.push("## Auto Pull Command");
  lines.push("");
  lines.push("```bash");
  lines.push("YOUTUBE_ACCESS_TOKEN=... npm run ops:youtube-metrics -- --run=2026-06-24-231930 --video-url='https://www.youtube.com/shorts/VIDEO_ID'");
  lines.push("```");
  lines.push("");
  lines.push("Needs `YOUTUBE_ACCESS_TOKEN` with YouTube Analytics readonly access for subscribers gained, shares, average view duration, and engaged views. `YOUTUBE_API_KEY` can read public video stats, but it cannot read per-video subscriber attribution.");

  if (document.missing.length) {
    lines.push("");
    lines.push("## Missing");
    lines.push("");
    for (const item of document.missing) {
      lines.push(`- ${item}`);
    }
  }

  return `${lines.join("\n")}\n`;
}

function createEfficiencyMarkdown(document) {
  const metrics = document.metrics || {};
  const efficiency = document.efficiency || {};
  const lines = [
    `# YouTube Efficiency - ${document.publishedAtLocal}`,
    "",
    `Video: ${document.title || "TBD"}`,
    `URL: ${document.youtubeUrl || "TBD"}`,
    `Status: ${document.status}`,
    "",
    "## Core Efficiency",
    "",
    "| Metric | Value |",
    "| --- | --- |",
    `| Views basis | ${formatMetric(efficiency.views_basis)} |`,
    `| Engaged views basis | ${formatMetric(efficiency.engaged_views_basis)} |`,
    `| Subscribers gained | ${formatMetric(efficiency.subscribers_gained_basis)} |`,
    `| Subscribers / 1k views | ${formatRate(efficiency.subscribers_per_1000_views)} |`,
    `| Subscribers / 1k engaged views | ${formatRate(efficiency.subscribers_per_1000_engaged_views)} |`,
    `| Like rate | ${formatPercent(efficiency.like_rate)} |`,
    `| Comment rate | ${formatPercent(efficiency.comment_rate)} |`,
    `| Share rate | ${formatPercent(efficiency.share_rate)} |`,
    `| Google Play click rate | ${formatPercent(efficiency.google_play_click_rate)} |`,
    `| Avg view duration | ${formatSeconds(metrics.average_view_duration_since_publish)} |`,
    `| Avg % viewed | ${formatPercent(metrics.average_percentage_viewed_since_publish)} |`,
    `| GA4 YouTube source events | ${formatMetric(metrics.ga4_youtube_event_count_since_publish)} |`,
    `| GA4 game starts from YouTube | ${formatMetric(metrics.ga4_game_start_events_from_youtube_since_publish)} |`,
    `| GA4 first battles complete from YouTube | ${formatMetric(metrics.ga4_first_battle_complete_events_from_youtube_since_publish)} |`,
    "",
    "## Cadence Decision",
    "",
    document.decision,
    "",
    "## Notes",
    "",
    "- Keep today's posting count at 1 unless the 24h signal is exceptional.",
    "- Compare the next Short against this one by subscribers per 1k views, engaged view rate, and Google Play click rate.",
    "- Shorts `views` and `engagedViews` are both tracked because Shorts view counting changed in 2025.",
  ];

  return `${lines.join("\n")}\n`;
}

function createTrackingStatus({ youtubeVideoId, snapshot }) {
  if (!youtubeVideoId) {
    return "one_published_missing_video_url";
  }
  if (snapshot.analyticsApi && (snapshot.dataApi || snapshot.channelStats)) {
    return "one_published_metrics_synced";
  }
  if (snapshot.dataApi || snapshot.channelStats) {
    return "one_published_public_stats_synced_missing_analytics_oauth";
  }
  return "one_published_waiting_for_credentials";
}

function createMissingList({ youtubeVideoId, snapshot }) {
  const missing = [];
  if (!youtubeVideoId) {
    missing.push("youtube_video_url_or_id");
  }
  if (!snapshot.dataApi && !snapshot.channelStats) {
    missing.push("youtube_data_api_stats");
  }
  if (!snapshot.analyticsApi) {
    missing.push("youtube_analytics_oauth_metrics");
  }
  if (!snapshot.trafficSourceApi) {
    missing.push("youtube_shorts_traffic_source_metrics");
  }
  if (!snapshot.ga4AttributionApi) {
    missing.push("ga4_youtube_attribution_metrics");
  }
  missing.push("google_play_clicks_from_ga_or_utm");
  return [...new Set(missing)];
}

function createDataSourceLabel(snapshot) {
  const sources = [];
  if (snapshot.dataApi) {
    sources.push("youtube_data_api");
  }
  if (snapshot.analyticsApi) {
    sources.push("youtube_analytics_api");
  }
  if (snapshot.trafficSourceApi) {
    sources.push("youtube_traffic_source_api");
  }
  if (snapshot.channelStats) {
    sources.push("youtube_channel_stats_api");
  }
  if (snapshot.ga4AttributionApi) {
    sources.push("ga4_data_api");
  }
  return sources.length ? sources.join("+") : "pending_credentials";
}

function createEfficiencyRecommendation({ views, engagedViews, subscribersGained, gpClicks }) {
  if (views === null) {
    return "Waiting for the first metrics snapshot. Do not publish a second Short today.";
  }
  const subRate = rate(subscribersGained, views, 1000);
  const engagedRate = rate(engagedViews, views);
  if (subRate !== null && subRate >= 3 && engagedRate !== null && engagedRate >= 0.45) {
    return "Strong early signal. Keep the next post for tomorrow and make it a controlled follow-up.";
  }
  if (gpClicks !== null && views > 0 && gpClicks === 0) {
    return "Views without store intent. Improve description/ pinned comment CTA before the next post.";
  }
  return "Hold cadence at one Short per day and wait for the 24h read before choosing the next angle.";
}

function createCadenceDecision({ efficiency, missing }) {
  if (missing.includes("youtube_video_url_or_id") || missing.includes("youtube_analytics_oauth_metrics")) {
    return "Hold more uploads until the posted Short is bound to a YouTube URL and Analytics OAuth can read subscriber efficiency.";
  }
  if (efficiency.subscribers_per_1000_views !== null && efficiency.subscribers_per_1000_views >= 3) {
    return "Signal is promising, but still keep one Short per day. Use the same angle tomorrow instead of posting extra today.";
  }
  return "Keep the account-warmup pace: one Short today, review after 24h, then pick tomorrow's strongest candidate.";
}

async function resolveRunDir(runIdOrPath, root) {
  const outputRoot = resolve(root || DEFAULT_OUTPUT_ROOT);
  if (runIdOrPath) {
    const maybePath = resolve(runIdOrPath);
    if (await pathExists(join(maybePath, "manifest.json"))) {
      return maybePath;
    }
    return resolve(outputRoot, runIdOrPath);
  }

  const entries = await readdir(outputRoot, { withFileTypes: true });
  const candidates = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }
    const runDir = join(outputRoot, entry.name);
    if (await pathExists(join(runDir, "manifest.json"))) {
      candidates.push(runDir);
    }
  }
  candidates.sort();
  if (!candidates.length) {
    throw new Error(`No YouTube runs found under ${outputRoot}`);
  }
  return candidates.at(-1);
}

async function writeClipMetadata(manifest) {
  for (const clip of manifest.clips || []) {
    if (clip.metadataPath) {
      await writeJson(clip.metadataPath, clip);
    }
  }
}

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

async function writeJson(filePath, value) {
  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

async function pathExists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

function findClipByRank(clips, selectionRank) {
  return clips.find((clip) => Number(clip.selectionRank) === Number(selectionRank));
}

function normalizeYoutubeUrl(input, youtubeVideoId) {
  const raw = String(input || "").trim();
  if (raw.startsWith("http")) {
    return raw;
  }
  return youtubeVideoId ? `https://www.youtube.com/shorts/${youtubeVideoId}` : "";
}

function normalizeChannelId(channelId) {
  const raw = String(channelId || "").trim();
  if (!raw || raw.toUpperCase() === "MINE" || raw === "channel==MINE") {
    return raw ? "MINE" : "";
  }
  return raw.replace(/^channel==/, "");
}

function normalizeAnalyticsIds(channelId) {
  const raw = String(channelId || "").trim();
  if (!raw || raw.toUpperCase() === "MINE") {
    return "channel==MINE";
  }
  return raw.includes("==") ? raw : `channel==${raw}`;
}

function getTodayInTimeZone(timeZone = DEFAULT_TIME_ZONE) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function getTodayInPacificDate() {
  return getTodayInTimeZone("America/Los_Angeles");
}

function firstFinite(...values) {
  for (const value of values) {
    if (value === null || value === undefined || value === "") {
      continue;
    }
    const number = Number(value);
    if (Number.isFinite(number)) {
      return number;
    }
  }
  return null;
}

function toNumberOrNull(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function sumMetric(rows, fieldName) {
  return rows.reduce((sum, row) => sum + (firstFinite(row[fieldName]) || 0), 0);
}

function maxMetric(rows, fieldName) {
  const values = rows.map((row) => firstFinite(row[fieldName])).filter((value) => value !== null);
  return values.length ? Math.max(...values) : null;
}

function rate(numerator, denominator, multiplier = 1) {
  if (numerator === null || denominator === null || denominator <= 0) {
    return null;
  }
  return round((numerator / denominator) * multiplier, 4);
}

function round(value, digits = 4) {
  if (!Number.isFinite(Number(value))) {
    return null;
  }
  const factor = 10 ** digits;
  return Math.round(Number(value) * factor) / factor;
}

function formatMetric(value) {
  const number = firstFinite(value);
  return number === null ? "TBD" : String(number);
}

function formatRate(value) {
  const number = firstFinite(value);
  return number === null ? "TBD" : String(number);
}

function formatPercent(value) {
  const number = firstFinite(value);
  return number === null ? "TBD" : `${round(number * 100, 2)}%`;
}

function formatSeconds(value) {
  const number = firstFinite(value);
  return number === null ? "TBD" : `${round(number, 2)}s`;
}

function escapePipe(value) {
  return String(value || "").replace(/\|/g, "/");
}

function compactError(error) {
  return String(error?.message || error || "unknown").replace(/\s+/g, " ").slice(0, 180);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
