import { mkdir, writeFile } from "node:fs/promises";
import { basename, join, resolve } from "node:path";

import { chromium } from "playwright";

import { createBattleReplayShareUrl } from "../services.js";
import { LegalConfig } from "../legal-config.js";
import { translate } from "../i18n.js";

const DEFAULT_BASE_URL = "http://localhost:5173/";
const DEFAULT_OUTPUT_ROOT = "ops-materials/youtube";
const DEFAULT_VIEWPORT = { width: 1280, height: 720 };
const DEFAULT_MATCH_TIMEOUT_MS = 120000;
const QUICK_BATTLE_POINT = { xRatio: 0.5, yRatio: 0.345 };
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
const captureCount = Math.max(1, Number.parseInt(options.count || options.n || "3", 10) || 3);
const baseUrl = options.url || process.env.YOUTUBE_CAPTURE_URL || DEFAULT_BASE_URL;
const gameLocale = normalizeGameLocale(options.gameLocale || options.locale || process.env.YOUTUBE_CAPTURE_LOCALE || "zh");
const browserLocale = options.browserLocale || (gameLocale === "zh" ? "zh-CN" : gameLocale);
const outputRoot = resolve(options.out || process.env.YOUTUBE_MATERIAL_DIR || DEFAULT_OUTPUT_ROOT);
const runId = createRunId();
const runDir = join(outputRoot, runId);
const videosDir = join(runDir, "videos");
const metadataDir = join(runDir, "metadata");
const renderQuality = options.renderQuality || process.env.YOUTUBE_CAPTURE_RENDER_QUALITY || "high";
const matchTimeoutMs = Math.max(
  30000,
  Number.parseInt(options.timeoutMs || process.env.YOUTUBE_CAPTURE_TIMEOUT_MS || String(DEFAULT_MATCH_TIMEOUT_MS), 10) ||
    DEFAULT_MATCH_TIMEOUT_MS,
);
const viewport = parseViewport(options.viewport) || DEFAULT_VIEWPORT;
const quickSettlementEnabled = options.realTime ? false : options.quickSettlement !== "0";
const headed = Boolean(options.headed);
const clips = [];

await mkdir(videosDir, { recursive: true });
await mkdir(metadataDir, { recursive: true });

const browser = await chromium.launch({ headless: !headed });
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

  for (let index = 1; index <= captureCount; index += 1) {
    console.log(`Recording match ${index}/${captureCount}...`);
    await page.goto(getCaptureUrl(baseUrl, { renderQuality }), { waitUntil: "domcontentloaded" });
    await page.locator("#gameCanvas").waitFor({ state: "visible" });
    await page.waitForTimeout(800);

    const downloadPromise = page.waitForEvent("download", { timeout: matchTimeoutMs });
    await clickRatio(page, QUICK_BATTLE_POINT);
    const download = await getRecordingDownload(page, downloadPromise);
    const suggestedFileName = sanitizeFileName(download.suggestedFilename());
    const savedFileName = `${String(index).padStart(2, "0")}-${suggestedFileName}`;
    const videoPath = join(videosDir, savedFileName);
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
    });
    const metadataPath = join(metadataDir, `${String(index).padStart(2, "0")}-${clip.slug}.json`);
    await writeFile(metadataPath, `${JSON.stringify(clip, null, 2)}\n`);
    clips.push({
      ...clip,
      metadataPath,
    });
    console.log(`Saved ${videoPath}`);
  }

  const manifest = {
    generatedAt: new Date().toISOString(),
    runId,
    baseUrl,
    gameLocale,
    viewport,
    renderQuality,
    quickSettlementEnabled,
    outputDir: runDir,
    clips,
  };
  await writeFile(join(runDir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
  await writeFile(join(runDir, "youtube-upload-plan.md"), createUploadPlan(manifest));

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

function getCaptureUrl(baseUrl, { renderQuality }) {
  const url = new URL(baseUrl);
  url.searchParams.set("recording", "1");
  url.searchParams.set("autoDownloadRecording", "1");
  url.searchParams.set("renderQuality", renderQuality);
  return url.href;
}

async function getRecordingDownload(page, downloadPromise) {
  try {
    return await downloadPromise;
  } catch (error) {
    console.warn(`Auto-download did not fire: ${error.message}`);
    const manualDownloadPromise = page.waitForEvent("download", { timeout: 12000 });
    await clickRatio(page, DOWNLOAD_BUTTON_POINT);
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

function createClipRecord({ index, runId, videoPath, savedFileName, suggestedFileName, recordingTags, match, gameLocale, baseUrl }) {
  const tagLabels = recordingTags.map((tag) => getRecordingTagLabel(gameLocale, tag));
  const ownRoleName = getRoleDisplayName(gameLocale, match?.ownRole);
  const opponentRoleName = getRoleDisplayName(gameLocale, match?.opponentRole);
  const winnerRoleName = match?.winnerSide === "B" ? opponentRoleName : match?.winnerSide === "A" ? ownRoleName : translate(gameLocale, "result.draw");
  const primaryTag = tagLabels[0] || getRecordingTagLabel(gameLocale, "normal");
  const matchup = `${ownRoleName} vs ${opponentRoleName}`;
  const title = createYoutubeTitle({ gameLocale, primaryTag, winnerRoleName, matchup });
  const shareUrl = createBattleReplayShareUrl({
    scene: "classic",
    a: match?.ownRole || "",
    b: match?.opponentRole || "",
    seed: match?.replaySeed || "",
    matchId: match?.matchId || "",
    baseUrl,
  });
  const description = createYoutubeDescription({
    gameLocale,
    match,
    matchup,
    tagLabels,
    shareUrl,
  });
  const youtubeTags = createYoutubeTags({ gameLocale, recordingTags, tagLabels, ownRoleName, opponentRoleName });
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

function createYoutubeTitle({ gameLocale, primaryTag, winnerRoleName, matchup }) {
  if (gameLocale === "zh" || gameLocale === "zh-TW") {
    return `${primaryTag}｜${winnerRoleName}｜斗球球自动对战`;
  }

  return `${primaryTag} | ${winnerRoleName} | Profession Ball Arena`;
}

function createYoutubeDescription({ gameLocale, match, matchup, tagLabels, shareUrl }) {
  if (gameLocale === "zh" || gameLocale === "zh-TW") {
    return [
      "本机自动录制素材，适合剪辑后发布到 YouTube。",
      "",
      `对局：${matchup}`,
      `结果：${match?.winnerSide || "unknown"}`,
      `时长：${match?.duration || 0}s`,
      `运营标签：${tagLabels.join(" / ") || getRecordingTagLabel(gameLocale, "normal")}`,
      match?.reason ? `胜因：${match.reason}` : "",
      match?.lesson ? `败因回放：${match.lesson}` : "",
      shareUrl ? `回放链接：${shareUrl}` : "",
      "",
      "#斗球球 #小游戏 #自动对战 #gaming",
    ].filter(Boolean).join("\n");
  }

  return [
    "Locally recorded operations clip for YouTube editing and upload.",
    "",
    `Matchup: ${matchup}`,
    `Result: ${match?.winnerSide || "unknown"}`,
    `Duration: ${match?.duration || 0}s`,
    `Clip tags: ${tagLabels.join(" / ") || getRecordingTagLabel(gameLocale, "normal")}`,
    match?.reason ? `Why it won: ${match.reason}` : "",
    match?.lesson ? `Replay note: ${match.lesson}` : "",
    shareUrl ? `Replay link: ${shareUrl}` : "",
    "",
    "#ProfessionBallArena #AutoBattle #IndieGame #gaming",
  ].filter(Boolean).join("\n");
}

function createYoutubeTags({ gameLocale, recordingTags, tagLabels, ownRoleName, opponentRoleName }) {
  const baseTags =
    gameLocale === "zh" || gameLocale === "zh-TW"
      ? ["斗球球", "小游戏", "自动对战", "像素游戏", "游戏高光", "YouTube素材"]
      : ["Profession Ball Arena", "auto battle", "indie game", "pixel game", "game highlights", "YouTube clip"];
  return [...new Set([...baseTags, ...recordingTags, ...tagLabels, ownRoleName, opponentRoleName].filter(Boolean))].slice(0, 20);
}

function createUploadPlan(manifest) {
  const lines = [
    `# YouTube Upload Plan - ${manifest.runId}`,
    "",
    `Output: ${manifest.outputDir}`,
    `Generated: ${manifest.generatedAt}`,
    "",
    "Use YouTube Studio to upload the files under `videos/`, then copy the matching title, description, and tags below.",
    "",
  ];

  for (const clip of manifest.clips) {
    lines.push(`## ${clip.index}. ${clip.fileName}`);
    lines.push("");
    lines.push(`Video: ${clip.videoPath}`);
    lines.push(`Metadata: ${clip.metadataPath}`);
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
  }

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

function getRoleDisplayName(locale, roleId) {
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
