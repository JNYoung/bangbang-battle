import { execFile } from "node:child_process";
import { mkdtemp, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, extname, isAbsolute, join, resolve } from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

import { GOOGLE_SCOPES, resolveGoogleAccessToken } from "./google-api-auth.mjs";
import { applySinglePublishState, parseArgs } from "./youtube-publish-metrics.mjs";

const DEFAULT_OUTPUT_ROOT = "ops-materials/youtube";
const DEFAULT_PUBLISHED_RANK = 1;
const DEFAULT_PRIVACY_STATUS = "public";
const YOUTUBE_UPLOAD_URL = "https://www.googleapis.com/upload/youtube/v3/videos";
const UPLOAD_SCOPES = [
  GOOGLE_SCOPES.youtubeReadonly,
  GOOGLE_SCOPES.youtubeUpload,
];

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const runDir = await resolveRunDir(options.run || options.runId, options.root || process.env.YOUTUBE_MATERIAL_DIR);
  const manifestPath = join(runDir, "manifest.json");
  const manifest = await readJson(manifestPath);
  const selectionRank = Math.max(1, Number.parseInt(options.rank || DEFAULT_PUBLISHED_RANK, 10) || DEFAULT_PUBLISHED_RANK);
  const clip = findClipByRank(manifest.clips || [], selectionRank) || manifest.clips?.[0];
  if (!clip) {
    throw new Error(`No selected clip found in ${manifestPath}. Run ops:daily-youtube:en first.`);
  }

  const videoPath = await resolveClipVideoPath(clip, runDir);
  const privacyStatus = normalizePrivacyStatus(options.privacy || process.env.YOUTUBE_UPLOAD_PRIVACY || DEFAULT_PRIVACY_STATUS);
  const publishAt = options.publishAt || options.scheduleAt || process.env.YOUTUBE_UPLOAD_PUBLISH_AT || "";
  const metadata = createYoutubeVideoMetadata({ clip, privacyStatus, publishAt });
  const googleAuth = await resolveGoogleAccessToken({
    accessToken: options.accessToken || process.env.YOUTUBE_ACCESS_TOKEN || process.env.GOOGLE_ACCESS_TOKEN || "",
    tokenPath: options.tokenPath || process.env.GOOGLE_OAUTH_TOKEN_JSON || process.env.YOUTUBE_OAUTH_TOKEN_JSON,
    clientPath: options.clientPath || process.env.GOOGLE_OAUTH_CLIENT_JSON || process.env.YOUTUBE_OAUTH_CLIENT_JSON,
    clientJson: process.env.GOOGLE_OAUTH_CLIENT || process.env.YOUTUBE_OAUTH_CLIENT || "",
    scopes: UPLOAD_SCOPES,
  });
  if (!googleAuth.accessToken) {
    throw new Error(`Missing YouTube upload OAuth access. Run npm run auth:google. Issues: ${googleAuth.accessIssues?.join(", ") || "unknown"}`);
  }

  console.log(`Uploading ${videoPath}`);
  console.log(`Title: ${metadata.snippet.title}`);
  console.log(`Privacy: ${metadata.status.privacyStatus}${metadata.status.publishAt ? `, publishAt=${metadata.status.publishAt}` : ""}`);

  const uploadedVideo = await uploadYoutubeVideo({
    accessToken: googleAuth.accessToken,
    metadata,
    videoPath,
  });
  const youtubeVideoId = uploadedVideo.id || "";
  if (!youtubeVideoId) {
    throw new Error("YouTube upload completed without a video id.");
  }

  const youtubeUrl = `https://www.youtube.com/shorts/${youtubeVideoId}`;
  const generatedAt = new Date().toISOString();
  const publishedAtLocal = String(options.publishedAt || options.date || getLocalDateKey()).slice(0, 10);
  const uploadResultPath = join(runDir, `youtube-upload-result-${publishedAtLocal}.json`);
  const uploadMarkdownPath = join(runDir, `youtube-upload-result-${publishedAtLocal}.md`);
  const publishState = applySinglePublishState(manifest, {
    selectionRank,
    publishedAtLocal,
    youtubeVideoId,
    youtubeUrl,
    generatedAt,
    snapshot: {
      dataApi: {
        id: youtubeVideoId,
        status: uploadedVideo.status || {},
        snippet: {
          title: uploadedVideo.snippet?.title || metadata.snippet.title,
          publishedAt: uploadedVideo.snippet?.publishedAt || "",
        },
      },
      credentialSources: {
        youtubeUpload: googleAuth.source,
      },
    },
  });

  const publishedClip = publishState.publishedClip;
  if (publishedClip) {
    publishedClip.youtube.upload = {
      uploadedAt: generatedAt,
      uploadResultPath,
      uploadMarkdownPath,
      privacyStatus: metadata.status.privacyStatus,
      publishAt: metadata.status.publishAt || "",
      youtubeVideoId,
      youtubeUrl,
    };
  }

  await writeFile(manifestPath, `${JSON.stringify(publishState.manifest, null, 2)}\n`);
  await writeClipMetadataFiles(publishState.manifest.clips || []);
  const uploadResult = {
    generatedAt,
    runId: manifest.runId || basename(runDir),
    runDir,
    selectionRank,
    videoPath,
    youtubeVideoId,
    youtubeUrl,
    title: metadata.snippet.title,
    privacyStatus: metadata.status.privacyStatus,
    publishAt: metadata.status.publishAt || "",
    apiStatus: uploadedVideo.status || {},
  };
  await writeFile(uploadResultPath, `${JSON.stringify(uploadResult, null, 2)}\n`);
  await writeFile(uploadMarkdownPath, createUploadResultMarkdown(uploadResult));

  console.log(`Uploaded: ${youtubeUrl}`);
  console.log(`Updated manifest: ${manifestPath}`);
}

function createYoutubeVideoMetadata({ clip, privacyStatus, publishAt }) {
  const status = {
    privacyStatus,
    selfDeclaredMadeForKids: Boolean(clip.youtube?.madeForKids),
  };
  if (publishAt) {
    status.privacyStatus = "private";
    status.publishAt = new Date(publishAt).toISOString();
  }

  return {
    snippet: {
      title: String(clip.youtube?.title || "Profession Ball Arena Short").slice(0, 100),
      description: String(clip.youtube?.description || ""),
      tags: (clip.youtube?.tags || []).map((tag) => String(tag).trim()).filter(Boolean).slice(0, 20),
      categoryId: "20",
      defaultLanguage: "en",
      defaultAudioLanguage: "en",
    },
    status,
  };
}

async function uploadYoutubeVideo({ accessToken, metadata, videoPath }) {
  const videoStat = await stat(videoPath);
  const mimeType = getVideoMimeType(videoPath);
  const uploadUrl = await startResumableUpload({
    accessToken,
    metadata,
    mimeType,
    contentLength: videoStat.size,
  });
  return finishResumableUpload({
    accessToken,
    uploadUrl,
    videoPath,
    mimeType,
    contentLength: videoStat.size,
  });
}

async function startResumableUpload({ accessToken, metadata, mimeType, contentLength }) {
  const tempDir = await mkdtemp(join(tmpdir(), "pba-youtube-upload-"));
  const metadataPath = join(tempDir, "metadata.json");
  const headersPath = join(tempDir, "headers.txt");
  const bodyPath = join(tempDir, "body.json");
  try {
    await writeFile(metadataPath, `${JSON.stringify(metadata)}\n`);
    const url = new URL(YOUTUBE_UPLOAD_URL);
    url.searchParams.set("uploadType", "resumable");
    url.searchParams.set("part", "snippet,status");
    const status = await execCurlStatus([
      "-sS",
      "-D", headersPath,
      "-o", bodyPath,
      "-X", "POST",
      "-H", `Authorization: Bearer ${accessToken}`,
      "-H", "Content-Type: application/json; charset=UTF-8",
      "-H", `X-Upload-Content-Type: ${mimeType}`,
      "-H", `X-Upload-Content-Length: ${contentLength}`,
      "--data-binary", `@${metadataPath}`,
      url.href,
      "-w", "%{http_code}",
    ]);
    const body = await readFile(bodyPath, "utf8").catch(() => "");
    if (status < 200 || status >= 300) {
      throw new Error(`YouTube upload session failed with HTTP ${status}: ${body}`);
    }
    const headers = await readFile(headersPath, "utf8");
    const uploadUrl = getHeaderValue(headers, "location");
    if (!uploadUrl) {
      throw new Error(`YouTube upload session did not return a Location header: ${body}`);
    }
    return uploadUrl;
  } finally {
    await rm(tempDir, { recursive: true, force: true }).catch(() => {});
  }
}

async function finishResumableUpload({ accessToken, uploadUrl, videoPath, mimeType, contentLength }) {
  const tempDir = await mkdtemp(join(tmpdir(), "pba-youtube-upload-"));
  const bodyPath = join(tempDir, "upload-response.json");
  try {
    const status = await execCurlStatus([
      "-sS",
      "-o", bodyPath,
      "-X", "PUT",
      "-H", `Authorization: Bearer ${accessToken}`,
      "-H", `Content-Type: ${mimeType}`,
      "-H", `Content-Length: ${contentLength}`,
      "--data-binary", `@${videoPath}`,
      uploadUrl,
      "-w", "%{http_code}",
    ], { timeoutMs: 15 * 60 * 1000 });
    const body = await readFile(bodyPath, "utf8").catch(() => "");
    if (status < 200 || status >= 300) {
      throw new Error(`YouTube video upload failed with HTTP ${status}: ${body}`);
    }
    return JSON.parse(body || "{}");
  } finally {
    await rm(tempDir, { recursive: true, force: true }).catch(() => {});
  }
}

async function execCurlStatus(args, { timeoutMs = 120000 } = {}) {
  const stdout = await new Promise((resolvePromise, rejectPromise) => {
    execFile("curl", args, {
      encoding: "utf8",
      maxBuffer: 20 * 1024 * 1024,
      timeout: timeoutMs,
    }, (error, output, stderr) => {
      if (error) {
        rejectPromise(new Error((stderr || error.message).trim()));
      } else {
        resolvePromise(output.trim());
      }
    });
  });
  const status = Number.parseInt(stdout.slice(-3), 10);
  if (!Number.isFinite(status)) {
    throw new Error(`curl did not return an HTTP status: ${stdout}`);
  }
  return status;
}

function getHeaderValue(headers, headerName) {
  const needle = `${headerName.toLowerCase()}:`;
  const lines = String(headers || "").split(/\r?\n/);
  for (let index = lines.length - 1; index >= 0; index -= 1) {
    const line = lines[index];
    if (line.toLowerCase().startsWith(needle)) {
      return line.slice(line.indexOf(":") + 1).trim();
    }
  }
  return "";
}

async function resolveRunDir(runId, root = DEFAULT_OUTPUT_ROOT) {
  if (runId) {
    const direct = resolve(runId);
    if (await pathExists(join(direct, "manifest.json"))) {
      return direct;
    }
    const underRoot = resolve(root || DEFAULT_OUTPUT_ROOT, runId);
    if (await pathExists(join(underRoot, "manifest.json"))) {
      return underRoot;
    }
    throw new Error(`Cannot find run manifest for "${runId}".`);
  }

  const rootDir = resolve(root || DEFAULT_OUTPUT_ROOT);
  const entries = await readdir(rootDir, { withFileTypes: true });
  const runs = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort()
    .reverse();
  for (const runName of runs) {
    const runDir = join(rootDir, runName);
    if (await pathExists(join(runDir, "manifest.json"))) {
      return runDir;
    }
  }
  throw new Error(`No YouTube material run with manifest.json found under ${rootDir}.`);
}

async function resolveClipVideoPath(clip, runDir) {
  const candidates = [
    clip.videoPath,
    clip.fileName ? join(runDir, "videos", clip.fileName) : "",
    clip.candidateVideoPath,
  ].filter(Boolean);
  for (const candidate of candidates) {
    const videoPath = isAbsolute(candidate) ? candidate : resolve(candidate);
    if (await pathExists(videoPath)) {
      return videoPath;
    }
  }
  throw new Error(`Video file not found for selected clip ${clip.fileName || clip.selectionRank}.`);
}

function findClipByRank(clips, selectionRank) {
  return clips.find((clip) => Number(clip.selectionRank) === Number(selectionRank));
}

async function writeClipMetadataFiles(clips) {
  for (const clip of clips) {
    if (clip.metadataPath) {
      await writeFile(clip.metadataPath, `${JSON.stringify(clip, null, 2)}\n`);
    }
  }
}

function normalizePrivacyStatus(value) {
  const normalized = String(value || DEFAULT_PRIVACY_STATUS).trim().toLowerCase();
  if (["public", "private", "unlisted"].includes(normalized)) {
    return normalized;
  }
  throw new Error(`Invalid privacy status "${value}". Expected public, private, or unlisted.`);
}

function getVideoMimeType(videoPath) {
  const extension = extname(videoPath).toLowerCase();
  if (extension === ".mp4" || extension === ".m4v") {
    return "video/mp4";
  }
  if (extension === ".mov") {
    return "video/quicktime";
  }
  return "video/webm";
}

function createUploadResultMarkdown(result) {
  const lines = [
    `# YouTube Upload Result - ${result.runId}`,
    "",
    `Uploaded: ${result.generatedAt}`,
    `Video: ${result.videoPath}`,
    `Title: ${result.title}`,
    `Privacy: ${result.privacyStatus}${result.publishAt ? ` (scheduled ${result.publishAt})` : ""}`,
    `YouTube: ${result.youtubeUrl}`,
    "",
  ];
  return `${lines.join("\n")}\n`;
}

async function readJson(filePath) {
  return JSON.parse(await readFile(resolve(filePath), "utf8"));
}

async function pathExists(filePath) {
  try {
    await stat(resolve(filePath));
    return true;
  } catch {
    return false;
  }
}

function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

if (import.meta.url === pathToFileURL(process.argv[1] || "").href) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
