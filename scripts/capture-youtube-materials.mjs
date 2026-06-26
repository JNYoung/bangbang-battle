import { copyFile, mkdir, writeFile } from "node:fs/promises";
import { basename, join, resolve } from "node:path";

import { chromium } from "playwright";

import { createBattleReplayShareUrl } from "../services.js";
import { LegalConfig } from "../legal-config.js";
import { translate } from "../i18n.js";
import {
  DEFAULT_SCENE_ID,
  HERO_SCENE_ID,
  ITEM_SCENE_ID,
  SceneConfig,
  getSceneDefaultProfessions,
  isHeroScene,
  isItemScene,
} from "../game-config.js";
import {
  DAILY_YOUTUBE_CLIP_COUNT,
  DEFAULT_DAILY_CANDIDATE_COUNT,
  createCustomYoutubeVideoFormat,
  createOpsStoryPackage,
  resolveYoutubeVideoFormat,
  scoreClipCandidate,
  selectTopicClips,
} from "./youtube-ops-utils.mjs";

const DEFAULT_BASE_URL = "http://localhost:5173/";
const DEFAULT_OUTPUT_ROOT = "ops-materials/youtube";
const DEFAULT_VIEWPORT = resolveYoutubeVideoFormat("landscape").viewport;
const DEFAULT_MATCH_TIMEOUT_MS = 120000;
const DEFAULT_DAILY_CAPTURE_SCENES = [ITEM_SCENE_ID, HERO_SCENE_ID];
const DEFAULT_DAILY_ITEM_BALL_COUNT = 4;
const QUICK_BATTLE_POINT = { xRatio: 0.5, yRatio: 0.345 };
const MAIN_START_POINT = { xRatio: 0.5, yRatio: 0.49 };
const SETUP_RANDOM_START_POINT = { xRatio: 0.5, yRatio: 0.79 };
const DOWNLOAD_BUTTON_POINT = { xRatio: 0.5, yRatio: 0.565 };
const RECORDING_TAG_LABELS = {
  perfect: "result.recordingTagPerfect",
  comeback: "result.recordingTagComeback",
  clutch: "result.recordingTagClutch",
  stomp: "result.recordingTagStomp",
  endurance: "result.recordingTagEndurance",
  draw: "result.recordingTagDraw",
  signature: "result.recordingTagSignature",
  close: "result.recordingTagClose",
  normal: "result.recordingTagNormal",
};

const options = parseArgs(process.argv.slice(2));
const dailyMode = Boolean(options.daily || process.env.YOUTUBE_CAPTURE_DAILY === "1");
const selectedCount = Math.max(
  1,
  Number.parseInt(options.count || options.n || String(dailyMode ? DAILY_YOUTUBE_CLIP_COUNT : 3), 10) ||
    DAILY_YOUTUBE_CLIP_COUNT,
);
const candidateCount = Math.max(
  selectedCount,
  Number.parseInt(
    options.candidates ||
      options.pool ||
      process.env.YOUTUBE_CAPTURE_CANDIDATES ||
      String(dailyMode ? DEFAULT_DAILY_CANDIDATE_COUNT : selectedCount),
    10,
  ) || selectedCount,
);
const baseUrl = options.url || process.env.YOUTUBE_CAPTURE_URL || DEFAULT_BASE_URL;
const gameLocale = normalizeGameLocale(options.gameLocale || options.locale || process.env.YOUTUBE_CAPTURE_LOCALE || "zh");
const browserLocale = options.browserLocale || (gameLocale === "zh" ? "zh-CN" : gameLocale);
const outputRoot = resolve(options.out || process.env.YOUTUBE_MATERIAL_DIR || DEFAULT_OUTPUT_ROOT);
const runId = createRunId();
const runDir = join(outputRoot, runId);
const videosDir = join(runDir, "videos");
const metadataDir = join(runDir, "metadata");
const candidateVideosDir = join(runDir, "candidates", "videos");
const candidateMetadataDir = join(runDir, "candidates", "metadata");
const renderQuality = options.renderQuality || process.env.YOUTUBE_CAPTURE_RENDER_QUALITY || "high";
const matchTimeoutMs = Math.max(
  30000,
  Number.parseInt(options.timeoutMs || process.env.YOUTUBE_CAPTURE_TIMEOUT_MS || String(DEFAULT_MATCH_TIMEOUT_MS), 10) ||
    DEFAULT_MATCH_TIMEOUT_MS,
);
const requestedFormat = resolveYoutubeVideoFormat(
  options.format || process.env.YOUTUBE_CAPTURE_FORMAT || (dailyMode ? "short" : "landscape"),
);
const videoFormat = createCustomYoutubeVideoFormat(requestedFormat, parseViewport(options.viewport));
const viewport = videoFormat.viewport || DEFAULT_VIEWPORT;
const quickSettlementEnabled = options.realTime ? false : options.quickSettlement !== "0";
const headed = Boolean(options.headed);
const browserChannel = options.browserChannel || process.env.YOUTUBE_CAPTURE_BROWSER_CHANNEL || "";
const captureProfiles = resolveCaptureProfiles({ dailyMode, options });
const candidateClips = [];

await mkdir(videosDir, { recursive: true });
await mkdir(metadataDir, { recursive: true });
await mkdir(candidateVideosDir, { recursive: true });
await mkdir(candidateMetadataDir, { recursive: true });

const browser = await launchCaptureBrowser({ headed, browserChannel });
const context = await browser.newContext({
  acceptDownloads: true,
  colorScheme: "dark",
  deviceScaleFactor: 1,
  locale: browserLocale,
  viewport,
});

await context.addInitScript(
  ({ gameLocale: locale, legalVersion, quickSettlement }) => {
    localStorage.setItem("bangbang.acceptedLegalVersion", legalVersion);
    localStorage.setItem("bangbang.locale", locale);
    localStorage.setItem(
      "bangbang.settings",
      JSON.stringify({
        analyticsEnabled: false,
        adsEnabled: false,
        iapEnabled: false,
        vibrationEnabled: false,
        musicEnabled: false,
        soundEffectsEnabled: false,
        reducedShakeEnabled: false,
        highlightTextEnabled: true,
        compactReportEnabled: false,
        quickSettlementEnabled: quickSettlement,
        matchRecordingEnabled: true,
      }),
    );
  },
  {
    gameLocale,
    legalVersion: LegalConfig.version,
    quickSettlement: quickSettlementEnabled,
  },
);

try {
  const page = await context.newPage();
  const consoleIssues = [];
  page.on("console", (message) => {
    if (message.type() === "error" || message.type() === "warning") {
      consoleIssues.push(`${message.type()}: ${message.text()}`);
    }
  });
  page.on("pageerror", (error) => consoleIssues.push(`pageerror: ${error.message}`));

  for (let index = 1; index <= candidateCount; index += 1) {
    const captureProfile = captureProfiles[(index - 1) % captureProfiles.length];
    console.log(`Recording candidate ${index}/${candidateCount} (${captureProfile.label})...`);
    await page.goto(getCaptureUrl(baseUrl, { renderQuality, captureProfile }), { waitUntil: "domcontentloaded" });
    await page.locator("#gameCanvas").waitFor({ state: "visible" });
    await page.waitForTimeout(800);

    const downloadPromise = page.waitForEvent("download", { timeout: matchTimeoutMs });
    await startCaptureMatch(page, captureProfile);
    const download = await getRecordingDownload(page, downloadPromise);
    const suggestedFileName = sanitizeFileName(download.suggestedFilename());
    const savedFileName = `${String(index).padStart(2, "0")}-${suggestedFileName}`;
    const videoPath = join(candidateVideosDir, savedFileName);
    await download.saveAs(videoPath);

    const match = await getLatestMatchHistory(page);
    const recordingTags = getRecordingTagsFromFileName(suggestedFileName);
    const clip = createClipRecord({
      index,
      runId,
      videoPath,
      savedFileName,
      suggestedFileName,
      recordingTags,
      match,
      gameLocale,
      baseUrl,
      captureProfile,
    });
    candidateClips.push({
      ...enrichClipWithOps({ clip, gameLocale, videoFormat }),
      candidateMetadataPath: join(candidateMetadataDir, `${String(index).padStart(2, "0")}-${clip.slug}.json`),
    });
    console.log(`Saved candidate ${videoPath}`);
  }

  const selectedCandidates = selectTopicClips(candidateClips, selectedCount);
  const selectedRanks = new Map(selectedCandidates.map((clip) => [clip.index, clip.selectionRank]));
  const selectedClips = [];

  for (const selectedCandidate of selectedCandidates) {
    const selectionRank = selectedCandidate.selectionRank;
    const selectedFileName = createSelectedFileName(selectedCandidate.fileName, selectionRank);
    const selectedVideoPath = join(videosDir, selectedFileName);
    const metadataPath = join(metadataDir, `${String(selectionRank).padStart(2, "0")}-${selectedCandidate.slug}.json`);
    const selectedClip = {
      ...selectedCandidate,
      selected: true,
      selectionRank,
      candidateVideoPath: selectedCandidate.videoPath,
      videoPath: selectedVideoPath,
      fileName: selectedFileName,
      metadataPath,
    };
    await copyFile(selectedCandidate.videoPath, selectedVideoPath);
    await writeFile(metadataPath, `${JSON.stringify(selectedClip, null, 2)}\n`);
    selectedClips.push(selectedClip);
    console.log(`Selected #${selectionRank} score ${selectedClip.topic.score}: ${selectedVideoPath}`);
  }

  const candidates = candidateClips.map((clip) => ({
    ...clip,
    selected: selectedRanks.has(clip.index),
    selectionRank: selectedRanks.get(clip.index) || null,
    selectedVideoPath: selectedClips.find((selectedClip) => selectedClip.index === clip.index)?.videoPath || "",
  }));

  for (const candidate of candidates) {
    await writeFile(candidate.candidateMetadataPath, `${JSON.stringify(candidate, null, 2)}\n`);
  }

  const manifest = {
    generatedAt: new Date().toISOString(),
    runId,
    dailyMode,
    baseUrl,
    gameLocale,
    viewport,
    videoFormat,
    renderQuality,
    quickSettlementEnabled,
    captureProfiles,
    selectedCount,
    candidateCount,
    outputDir: runDir,
    clips: selectedClips,
    candidates,
  };
  await writeFile(join(runDir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
  await writeFile(join(runDir, "youtube-upload-plan.md"), createUploadPlan(manifest));
  await writeFile(join(runDir, "daily-ops-brief.md"), createDailyOpsBrief(manifest));

  if (consoleIssues.length) {
    console.warn("Captured with console warnings:");
    for (const issue of consoleIssues) {
      console.warn(`- ${issue}`);
    }
  }

  console.log(`Done. Materials saved in ${runDir}`);
} finally {
  await browser.close();
}

async function launchCaptureBrowser({ headed, browserChannel }) {
  const launchOptions = { headless: !headed };
  if (browserChannel) {
    return chromium.launch({ ...launchOptions, channel: browserChannel });
  }

  try {
    return await chromium.launch(launchOptions);
  } catch (error) {
    if (!String(error?.message || "").includes("Executable doesn't exist")) {
      throw error;
    }
    console.warn("Bundled Playwright Chromium is missing; falling back to installed Google Chrome.");
    return chromium.launch({ ...launchOptions, channel: "chrome" });
  }
}

function parseArgs(argv) {
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

function resolveCaptureProfiles({ dailyMode, options }) {
  const requestedScenes = parseSceneList(
    options.scenes ||
      options.scene ||
      process.env.YOUTUBE_CAPTURE_SCENES ||
      (dailyMode ? DEFAULT_DAILY_CAPTURE_SCENES.join(",") : ""),
  );

  if (!requestedScenes.length) {
    return [createQuickCaptureProfile()];
  }

  return requestedScenes.map((sceneId) => createSceneCaptureProfile(sceneId, options));
}

function createQuickCaptureProfile() {
  return {
    id: "quick-start",
    label: "Quick Start playlist",
    startMode: "quick-start",
    scene: "",
    a: "",
    b: "",
    ballCount: null,
  };
}

function createSceneCaptureProfile(sceneId, options) {
  const defaultProfessions = getSceneDefaultProfessions(sceneId);
  const requestedBallCount = options.ballCount || options.countBalls || process.env.YOUTUBE_CAPTURE_BALL_COUNT;
  const dailyItemBallCount = options.dailyItemBallCount || process.env.YOUTUBE_DAILY_ITEM_BALL_COUNT || DEFAULT_DAILY_ITEM_BALL_COUNT;
  const ballCount = isItemScene(sceneId)
    ? parsePositiveInteger(requestedBallCount || dailyItemBallCount, DEFAULT_DAILY_ITEM_BALL_COUNT)
    : null;

  return {
    id: ballCount ? `${sceneId}-${ballCount}` : sceneId,
    label: getCaptureProfileLabel(sceneId, ballCount),
    startMode: "setup-random-start",
    scene: sceneId,
    a: isItemScene(sceneId) ? "" : defaultProfessions.a || "",
    b: isItemScene(sceneId) ? "" : defaultProfessions.b || "",
    ballCount,
  };
}

function parseSceneList(value) {
  return String(value || "")
    .split(",")
    .map((scene) => normalizeCaptureScene(scene))
    .filter(Boolean);
}

function normalizeCaptureScene(scene) {
  const normalized = String(scene || "").trim().toLowerCase();
  if (!normalized) {
    return "";
  }
  const aliases = {
    item: ITEM_SCENE_ID,
    items: ITEM_SCENE_ID,
    "item-mode": ITEM_SCENE_ID,
    hero: HERO_SCENE_ID,
    heroes: HERO_SCENE_ID,
    "hero-mode": HERO_SCENE_ID,
    classic: DEFAULT_SCENE_ID,
    profession: DEFAULT_SCENE_ID,
    professions: DEFAULT_SCENE_ID,
    quick: "quick",
    playlist: "quick",
  };
  const sceneId = aliases[normalized] || normalized;
  if (sceneId === "quick") {
    return "";
  }
  if (!Object.hasOwn(SceneConfig, sceneId)) {
    throw new Error(`Unknown capture scene "${scene}". Expected one of: ${Object.keys(SceneConfig).join(", ")}, quick.`);
  }
  return sceneId;
}

function getCaptureProfileLabel(sceneId, ballCount = null) {
  if (isItemScene(sceneId)) {
    return `Item Mode${ballCount ? ` (${ballCount} balls)` : ""}`;
  }
  if (isHeroScene(sceneId)) {
    return "Hero Mode";
  }
  return `${SceneConfig[sceneId]?.id || sceneId} mode`;
}

function parsePositiveInteger(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function getCaptureUrl(baseUrl, { renderQuality, captureProfile }) {
  const url = new URL(baseUrl);
  url.searchParams.set("recording", "1");
  url.searchParams.set("autoDownloadRecording", "1");
  url.searchParams.set("renderQuality", renderQuality);
  if (captureProfile?.scene) {
    url.searchParams.set("scene", captureProfile.scene);
  }
  if (captureProfile?.a) {
    url.searchParams.set("a", captureProfile.a);
  }
  if (captureProfile?.b) {
    url.searchParams.set("b", captureProfile.b);
  }
  if (captureProfile?.ballCount) {
    url.searchParams.set("count", String(captureProfile.ballCount));
  }
  return url.href;
}

async function startCaptureMatch(page, captureProfile) {
  if (captureProfile?.startMode === "setup-random-start") {
    await clickInteractiveElement(page, "main-start", MAIN_START_POINT);
    await page.waitForTimeout(300);
    await clickInteractiveElement(page, "setup-random-start", SETUP_RANDOM_START_POINT, { timeoutMs: 8000 });
    return;
  }

  await clickInteractiveElement(page, "main-quick-start", QUICK_BATTLE_POINT);
}

async function getRecordingDownload(page, downloadPromise) {
  try {
    return await downloadPromise;
  } catch (error) {
    console.warn(`Auto-download did not fire: ${error.message}`);
    const manualDownloadPromise = page.waitForEvent("download", { timeout: 12000 });
    await clickInteractiveElement(page, "result-download-recording", DOWNLOAD_BUTTON_POINT, { timeoutMs: 8000 });
    return manualDownloadPromise;
  }
}

async function getLatestMatchHistory(page) {
  return page.evaluate(() => {
    try {
      const progress = JSON.parse(localStorage.getItem("bangbang.playerProgress") || "{}");
      return progress.history?.[0] || null;
    } catch {
      return null;
    }
  });
}

function enrichClipWithOps({ clip, gameLocale, videoFormat }) {
  const topic = scoreClipCandidate(clip);
  const story = createOpsStoryPackage({ clip, topic, locale: gameLocale, videoFormat });
  const title = story.titleIdeas[0] || clip.youtube?.title || "";
  const description = createStoryYoutubeDescription({
    baseDescription: clip.youtube?.description || "",
    story,
    topic,
    gameLocale,
  });

  return {
    ...clip,
    topic,
    story,
    youtube: {
      ...clip.youtube,
      title,
      description,
      tags: [...new Set([...(clip.youtube?.tags || []), topic.primaryTag, story.angle].filter(Boolean))].slice(0, 20),
    },
  };
}

function createClipRecord({ index, runId, videoPath, savedFileName, suggestedFileName, recordingTags, match, gameLocale, baseUrl, captureProfile }) {
  const sceneId = match?.scene || captureProfile?.scene || DEFAULT_SCENE_ID;
  const tagLabels = recordingTags.map((tag) => getRecordingTagLabel(gameLocale, tag));
  const ownRoleName = getRoleDisplayName(gameLocale, match?.ownRole, sceneId);
  const opponentRoleName = getRoleDisplayName(gameLocale, match?.opponentRole, sceneId);
  const winnerRoleName = match?.winnerSide === "B" ? opponentRoleName : match?.winnerSide === "A" ? ownRoleName : translate(gameLocale, "result.draw");
  const primaryTag = tagLabels[0] || getRecordingTagLabel(gameLocale, "normal");
  const modeLabel = getModeDisplayName(gameLocale, sceneId);
  const matchup = isItemScene(sceneId) ? modeLabel : `${ownRoleName} vs ${opponentRoleName}`;
  const title = createYoutubeTitle({ gameLocale, primaryTag, modeLabel });
  const shareUrl = createBattleReplayShareUrl({
    scene: sceneId,
    a: isItemScene(sceneId) ? "" : match?.ownRole || captureProfile?.a || "",
    b: isItemScene(sceneId) ? "" : match?.opponentRole || captureProfile?.b || "",
    ballCount: match?.ballCount || captureProfile?.ballCount || "",
    seed: match?.replaySeed || "",
    matchId: match?.matchId || "",
    baseUrl,
  });
  const description = createYoutubeDescription({
    gameLocale,
    match,
    matchup,
    modeLabel,
    winnerRoleName,
    tagLabels,
    shareUrl,
  });
  const youtubeTags = createYoutubeTags({ gameLocale, recordingTags, tagLabels, ownRoleName, opponentRoleName, modeLabel });
  const slug = sanitizeFileName(`${recordingTags.join("-") || "normal"}-${match?.matchId || index}`).replace(/\.[^.]+$/, "");

  return {
    index,
    runId,
    slug,
    videoPath,
    fileName: savedFileName,
    sourceFileName: suggestedFileName,
    recordingTags,
    recordingTagLabels: tagLabels,
    scene: sceneId,
    modeLabel,
    captureProfile,
    matchup,
    winnerRoleName,
    roleNames: {
      own: ownRoleName,
      opponent: opponentRoleName,
    },
    shareUrl,
    match,
    youtube: {
      title,
      description,
      tags: youtubeTags,
      category: "Gaming",
      privacyStatus: "private",
      madeForKids: false,
    },
  };
}

function createYoutubeTitle({ gameLocale, primaryTag, modeLabel }) {
  if (gameLocale === "zh" || gameLocale === "zh-TW") {
    return `${primaryTag}｜${modeLabel}｜斗球球自动对战`;
  }

  return `${primaryTag} | ${modeLabel} | Profession Ball Arena`;
}

function createYoutubeDescription({ gameLocale, match, matchup, modeLabel, winnerRoleName, tagLabels, shareUrl }) {
  const resultLine = createResultLine({ gameLocale, match, winnerRoleName });
  if (gameLocale === "zh" || gameLocale === "zh-TW") {
    return [
      "斗球球每日新录制自动对战素材。",
      "",
      `${modeLabel}${matchup && matchup !== modeLabel ? `：${matchup}` : ""}`,
      resultLine,
      `全局 ${match?.duration || 0}s。`,
      `看点：${tagLabels.join(" / ") || getRecordingTagLabel(gameLocale, "normal")}`,
      match?.reason ? `胜因：${match.reason}` : "",
      match?.lesson ? `败因回放：${match.lesson}` : "",
      shareUrl ? `回放链接：${shareUrl}` : "",
      "",
      "#斗球球 #小游戏 #自动对战 #gaming",
    ].filter(Boolean).join("\n");
  }

  return [
    "Fresh auto-battle footage from Profession Ball Arena.",
    "",
    `${modeLabel}${matchup && matchup !== modeLabel ? `: ${matchup}` : ""}.`,
    resultLine,
    `Recorded from a ${match?.duration || 0}s run.`,
    `Watch for ${formatEnglishTagList(tagLabels) || "the final exchange"}.`,
    match?.reason ? `The turning point: ${match.reason}` : "",
    match?.lesson ? `On the replay: ${match.lesson}` : "",
    shareUrl ? `Replay link: ${shareUrl}` : "",
    "",
    "#ProfessionBallArena #AutoBattle #IndieGame #gaming",
  ].filter(Boolean).join("\n");
}

function createStoryYoutubeDescription({ baseDescription, story, topic, gameLocale }) {
  const zh = gameLocale === "zh" || gameLocale === "zh-TW";
  const storyLines = zh
    ? [
        "",
        story.hook,
        "你会怎么剪这一局？",
      ]
    : [
        "",
        story.hook,
        "Which side would you run next?",
      ];

  return [baseDescription, ...storyLines].filter(Boolean).join("\n");
}

function createYoutubeTags({ gameLocale, recordingTags, tagLabels, ownRoleName, opponentRoleName, modeLabel }) {
  const baseTags =
    gameLocale === "zh" || gameLocale === "zh-TW"
      ? ["斗球球", "小游戏", "自动对战", "像素游戏", "游戏高光", "YouTube素材"]
      : ["Profession Ball Arena", "auto battle", "indie game", "pixel game", "game highlights", "YouTube clip"];
  return [...new Set([...baseTags, modeLabel, ...recordingTags, ...tagLabels, ownRoleName, opponentRoleName].filter(Boolean))].slice(0, 20);
}

function createResultLine({ gameLocale, match, winnerRoleName }) {
  if (match?.winnerSide === "draw") {
    return gameLocale === "zh" || gameLocale === "zh-TW" ? "双方同时倒下。" : "Both sides drop together.";
  }
  if (!match?.winnerSide) {
    return gameLocale === "zh" || gameLocale === "zh-TW" ? "胜负等待复盘确认。" : "The ending is ready for a replay check.";
  }
  return gameLocale === "zh" || gameLocale === "zh-TW"
    ? `${winnerRoleName} 收下这一局。`
    : `${winnerRoleName} takes the win.`;
}

function formatEnglishTagList(tagLabels) {
  const tags = (tagLabels || []).filter(Boolean);
  if (!tags.length) {
    return "";
  }
  if (tags.length === 1) {
    return tags[0];
  }
  if (tags.length === 2) {
    return `${tags[0]} and ${tags[1]}`;
  }
  return `${tags.slice(0, -1).join(", ")}, and ${tags[tags.length - 1]}`;
}

function getModeDisplayName(locale, sceneId) {
  if (isItemScene(sceneId)) {
    return locale === "zh" || locale === "zh-TW" ? "道具模式" : "Item Mode";
  }
  if (isHeroScene(sceneId)) {
    return locale === "zh" || locale === "zh-TW" ? "英雄模式" : "Hero Mode";
  }
  if (sceneId === "super") {
    return locale === "zh" || locale === "zh-TW" ? "超能模式" : "Super Mode";
  }
  return locale === "zh" || locale === "zh-TW" ? "职业模式" : "Classic Mode";
}

function createSelectedFileName(fileName, selectionRank) {
  const rank = String(selectionRank).padStart(2, "0");
  return `${rank}-${String(fileName || "clip.webm").replace(/^\d+-/, "")}`;
}

function createUploadPlan(manifest) {
  const lines = [
    `# YouTube Upload Plan - ${manifest.runId}`,
    "",
    `Output: ${manifest.outputDir}`,
    `Generated: ${manifest.generatedAt}`,
    `Format: ${manifest.videoFormat.label} (${manifest.viewport.width}x${manifest.viewport.height})`,
    `Selected: ${manifest.clips.length}/${manifest.candidateCount}`,
    "",
    "Upload rank 1 with `npm run ops:youtube-upload -- --run=<runId> --rank=1 --privacy=public`, or use YouTube Studio and copy the matching metadata below.",
    "",
  ];

  for (const clip of manifest.clips) {
    lines.push(`## ${clip.selectionRank}. ${clip.fileName}`);
    lines.push("");
    lines.push(`Video: ${clip.videoPath}`);
    lines.push(`Metadata: ${clip.metadataPath}`);
    lines.push(`Candidate source: ${clip.candidateVideoPath || clip.videoPath}`);
    lines.push(`Topic score: ${clip.topic?.score || 0}`);
    if (clip.topic?.reasons?.length) {
      lines.push(`Why selected: ${clip.topic.reasons.join(" / ")}`);
    }
    if (clip.story?.hook) {
      lines.push(`Hook: ${clip.story.hook}`);
      lines.push(`Opening caption: ${clip.story.openingCaption}`);
    }
    lines.push("");
    lines.push(`Title: ${clip.youtube.title}`);
    lines.push("");
    lines.push("Description:");
    lines.push("```text");
    lines.push(clip.youtube.description);
    lines.push("```");
    lines.push("");
    lines.push(`Tags: ${clip.youtube.tags.join(", ")}`);
    lines.push("");
    if (clip.story?.thumbnailPrompt) {
      lines.push("Thumbnail prompt:");
      lines.push("```text");
      lines.push(clip.story.thumbnailPrompt);
      lines.push("```");
      lines.push("");
    }
    if (clip.story?.editingPrompt) {
      lines.push("Editing prompt:");
      lines.push("```text");
      lines.push(clip.story.editingPrompt);
      lines.push("```");
      lines.push("");
    }
  }

  return `${lines.join("\n")}\n`;
}

function createDailyOpsBrief(manifest) {
  const isEnglish = String(manifest.gameLocale || "").toLowerCase().startsWith("en");
  if (isEnglish) {
    return createEnglishDailyOpsBrief(manifest);
  }

  const lines = [
    `# Daily YouTube Ops Brief - ${manifest.runId}`,
    "",
    `生成时间：${manifest.generatedAt}`,
    `精选素材：${manifest.clips.length} 条`,
    `候选池：${manifest.candidateCount} 条`,
    `画幅：${manifest.videoFormat.label} (${manifest.viewport.width}x${manifest.viewport.height})`,
    `正式素材目录：${manifest.outputDir}/videos`,
    "",
    `## 今日精选 ${manifest.clips.length} 条`,
    "",
  ];

  for (const clip of manifest.clips) {
    lines.push(`### ${clip.selectionRank}. ${clip.story?.angle || clip.topic?.angle || "备选素材"} - ${clip.fileName}`);
    lines.push("");
    lines.push(`- 分数：${clip.topic?.score || 0}`);
    lines.push(`- 模式：${clip.modeLabel || clip.captureProfile?.label || ""}`);
    lines.push(`- 标题：${clip.youtube.title}`);
    lines.push(`- 钩子：${clip.story?.hook || ""}`);
    lines.push(`- 开场字幕：${clip.story?.openingCaption || ""}`);
    lines.push(`- 视频：${clip.videoPath}`);
    lines.push(`- 元数据：${clip.metadataPath}`);
    lines.push("");
    if (clip.story?.threeActStory?.length) {
      lines.push("剧情三段：");
      for (const beat of clip.story.threeActStory) {
        lines.push(`- ${beat.beat}：${beat.copy}`);
      }
      lines.push("");
    }
  }

  lines.push("## 候选排行");
  lines.push("");
  lines.push("| 分数 | 入选 | 模式 | 标签 | 文件 | 理由 |");
  lines.push("| --- | --- | --- | --- | --- | --- |");
  for (const candidate of [...manifest.candidates].sort((a, b) => (b.topic?.score || 0) - (a.topic?.score || 0))) {
    const score = candidate.topic?.score || 0;
    const selected = candidate.selected ? `#${candidate.selectionRank}` : "否";
    const mode = String(candidate.modeLabel || candidate.captureProfile?.label || "").replace(/\|/g, "/");
    const labels = ((candidate.recordingTagLabels || candidate.recordingTags || []).join(" / ") || "normal").replace(/\|/g, "/");
    const fileName = String(candidate.fileName || "").replace(/\|/g, "/");
    const reasons = (candidate.topic?.reasons || []).join("；").replace(/\|/g, "/");
    lines.push(`| ${score} | ${selected} | ${mode} | ${labels} | ${fileName} | ${reasons} |`);
  }

  lines.push("");
  lines.push("## Prompt 调优提示");
  lines.push("");
  lines.push("- 点击率低：先改 `story.thumbnailPrompt` 和 `story.titleIdeas[0]`。");
  lines.push("- 完播率低：缩短中段，只保留开场、转折、最后一击。");
  lines.push("- 评论少：把开场字幕改成问题句，并在置顶评论里让观众判定胜负。");

  return `${lines.join("\n")}\n`;
}

function createEnglishDailyOpsBrief(manifest) {
  const lines = [
    `# Daily YouTube Ops Brief - ${manifest.runId}`,
    "",
    `Generated: ${manifest.generatedAt}`,
    `Selected clips: ${manifest.clips.length}`,
    `Candidate pool: ${manifest.candidateCount}`,
    `Format: ${manifest.videoFormat.label} (${manifest.viewport.width}x${manifest.viewport.height})`,
    `Ready-to-upload videos: ${manifest.outputDir}/videos`,
    "",
    "## Today's Shorts",
    "",
  ];

  for (const clip of manifest.clips) {
    lines.push(`### ${clip.selectionRank}. ${clip.story?.angle || clip.topic?.angle || "backup clip"} - ${clip.fileName}`);
    lines.push("");
    lines.push(`- Score: ${clip.topic?.score || 0}`);
    lines.push(`- Mode: ${clip.modeLabel || clip.captureProfile?.label || ""}`);
    lines.push(`- Title: ${clip.youtube.title}`);
    lines.push(`- Hook: ${clip.story?.hook || ""}`);
    lines.push(`- Opening caption: ${clip.story?.openingCaption || ""}`);
    lines.push(`- Video: ${clip.videoPath}`);
    lines.push(`- Metadata: ${clip.metadataPath}`);
    lines.push("");
    if (clip.story?.threeActStory?.length) {
      lines.push("Three-act story:");
      for (const beat of clip.story.threeActStory) {
        lines.push(`- ${beat.beat}: ${beat.copy}`);
      }
      lines.push("");
    }
  }

  lines.push("## Candidate Ranking");
  lines.push("");
  lines.push("| Score | Selected | Mode | Tags | File | Reasons |");
  lines.push("| --- | --- | --- | --- | --- | --- |");
  for (const candidate of [...manifest.candidates].sort((a, b) => (b.topic?.score || 0) - (a.topic?.score || 0))) {
    const score = candidate.topic?.score || 0;
    const selected = candidate.selected ? `#${candidate.selectionRank}` : "No";
    const mode = String(candidate.modeLabel || candidate.captureProfile?.label || "").replace(/\|/g, "/");
    const labels = ((candidate.recordingTagLabels || candidate.recordingTags || []).join(" / ") || "normal").replace(/\|/g, "/");
    const fileName = String(candidate.fileName || "").replace(/\|/g, "/");
    const reasons = (candidate.topic?.reasons || []).join("; ").replace(/\|/g, "/");
    lines.push(`| ${score} | ${selected} | ${mode} | ${labels} | ${fileName} | ${reasons} |`);
  }

  lines.push("");
  lines.push("## Prompt Tuning Notes");
  lines.push("");
  lines.push("- Low CTR: revise `story.thumbnailPrompt` and `story.titleIdeas[0]` first.");
  lines.push("- Low retention: shorten the middle and keep only setup, turn, and final hit.");
  lines.push("- Low comments: make the opening caption a question and add a pinned-comment judgment prompt.");

  return `${lines.join("\n")}\n`;
}

function getRecordingTagsFromFileName(fileName) {
  const match = /^bangbang-battle-\d{4}-\d{2}-\d{2}-(.+)-[a-z0-9_]+\.[a-z0-9]+$/i.exec(fileName);
  if (!match?.[1]) {
    return ["normal"];
  }

  return match[1].split("-").filter(Boolean);
}

function getRecordingTagLabel(locale, tag) {
  const key = RECORDING_TAG_LABELS[tag] || RECORDING_TAG_LABELS.normal;
  const label = translate(locale, key, { source: translate(locale, "result.sourceAttack") });
  return label === key ? tag : label;
}

function getRoleDisplayName(locale, roleId, sceneId = DEFAULT_SCENE_ID) {
  if (isItemScene(sceneId)) {
    return translate(locale, "reports.itemModeRole");
  }
  if (!roleId || roleId === "none") {
    return locale === "zh" || locale === "zh-TW" ? "未知职业" : "Unknown Role";
  }
  if (roleId === "item_ball") {
    return translate(locale, "reports.itemModeRole");
  }

  const professionName = translate(locale, `professions.${roleId}.name`);
  if (professionName !== `professions.${roleId}.name`) {
    return professionName;
  }

  const heroName = translate(locale, `heroes.${roleId}.name`);
  return heroName !== `heroes.${roleId}.name` ? heroName : roleId;
}

function normalizeGameLocale(locale) {
  const normalized = String(locale || "zh").trim();
  if (/^zh-(tw|hk|hant)/i.test(normalized)) {
    return "zh-TW";
  }
  if (/^en/i.test(normalized)) {
    return "en";
  }
  if (/^ja/i.test(normalized)) {
    return "ja";
  }
  if (/^fr/i.test(normalized)) {
    return "fr";
  }
  if (/^de/i.test(normalized)) {
    return "de";
  }
  if (/^ar/i.test(normalized)) {
    return "ar";
  }
  return "zh";
}

function parseViewport(value) {
  if (!value) {
    return null;
  }

  const match = /^(\d+)x(\d+)$/i.exec(String(value));
  if (!match) {
    throw new Error(`Invalid viewport "${value}". Expected WIDTHxHEIGHT, for example 1280x720.`);
  }

  return {
    width: Number.parseInt(match[1], 10),
    height: Number.parseInt(match[2], 10),
  };
}

async function clickRatio(page, point) {
  const viewportSize = page.viewportSize() || DEFAULT_VIEWPORT;
  await page.mouse.click(
    Math.round(viewportSize.width * point.xRatio),
    Math.round(viewportSize.height * point.yRatio),
  );
}

async function clickInteractiveElement(page, elementId, fallbackPoint, { timeoutMs = 5000 } = {}) {
  try {
    await page.waitForFunction(
      (id) => Array.isArray(globalThis.__bangbangInteractiveRects) &&
        globalThis.__bangbangInteractiveRects.some((element) => element.id === id),
      elementId,
      { timeout: timeoutMs },
    );
    const rect = await page.evaluate((id) => {
      const elements = Array.isArray(globalThis.__bangbangInteractiveRects)
        ? globalThis.__bangbangInteractiveRects
        : [];
      return elements.find((element) => element.id === id)?.rect || null;
    }, elementId);
    if (rect) {
      await page.mouse.click(Math.round(rect.x + rect.width / 2), Math.round(rect.y + rect.height / 2));
      return;
    }
  } catch (error) {
    console.warn(`Could not click ${elementId} by interactive rect: ${error.message}`);
  }

  await clickRatio(page, fallbackPoint);
}

function sanitizeFileName(fileName) {
  return basename(String(fileName || "clip.webm")).replace(/[^\w.-]+/g, "-");
}

function createRunId(date = new Date()) {
  const parts = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
    String(date.getHours()).padStart(2, "0"),
    String(date.getMinutes()).padStart(2, "0"),
    String(date.getSeconds()).padStart(2, "0"),
  ];
  return `${parts.slice(0, 3).join("-")}-${parts.slice(3).join("")}`;
}
