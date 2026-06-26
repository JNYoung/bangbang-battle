import crypto from "node:crypto";
import { execFile } from "node:child_process";
import { access, chmod, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

const DEFAULT_CONFIG_DIR = join(process.env.HOME || process.cwd(), ".config", "profession-ball-arena");
const DEFAULT_TOKEN_PATH = join(DEFAULT_CONFIG_DIR, "google-oauth-token.json");
const DEFAULT_CLIENT_PATH = join(DEFAULT_CONFIG_DIR, "google-oauth-client.json");
const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";

export const GOOGLE_SCOPES = Object.freeze({
  youtubeReadonly: "https://www.googleapis.com/auth/youtube.readonly",
  youtubeAnalyticsReadonly: "https://www.googleapis.com/auth/yt-analytics.readonly",
  analyticsReadonly: "https://www.googleapis.com/auth/analytics.readonly",
  youtubeUpload: "https://www.googleapis.com/auth/youtube.upload",
});

export const DEFAULT_GROWTH_API_SCOPES = [
  GOOGLE_SCOPES.youtubeReadonly,
  GOOGLE_SCOPES.youtubeAnalyticsReadonly,
  GOOGLE_SCOPES.analyticsReadonly,
  GOOGLE_SCOPES.youtubeUpload,
];

export async function resolveGoogleAccessToken({
  accessToken = "",
  tokenPath = process.env.GOOGLE_OAUTH_TOKEN_JSON || process.env.YOUTUBE_OAUTH_TOKEN_JSON || DEFAULT_TOKEN_PATH,
  clientPath = process.env.GOOGLE_OAUTH_CLIENT_JSON || process.env.YOUTUBE_OAUTH_CLIENT_JSON || DEFAULT_CLIENT_PATH,
  clientJson = process.env.GOOGLE_OAUTH_CLIENT || process.env.YOUTUBE_OAUTH_CLIENT || "",
  scopes = DEFAULT_GROWTH_API_SCOPES,
  minTtlMs = 120000,
} = {}) {
  if (accessToken) {
    return {
      accessToken,
      source: "env_access_token",
      accessIssues: [],
    };
  }

  const tokenRecord = await readJsonIfExists(tokenPath);
  if (tokenRecord?.access_token && !isExpiring(tokenRecord, minTtlMs) && hasRequiredScopes(tokenRecord, scopes)) {
    return {
      accessToken: tokenRecord.access_token,
      source: "oauth_token_file",
      tokenPath,
      accessIssues: [],
    };
  }

  const client = await loadOAuthClient({ clientPath, clientJson });
  if (tokenRecord?.refresh_token && client) {
    const refreshed = await refreshOAuthToken({ client, refreshToken: tokenRecord.refresh_token, scopes });
    const nextRecord = normalizeTokenRecord({
      ...tokenRecord,
      ...refreshed,
      refresh_token: refreshed.refresh_token || tokenRecord.refresh_token,
      scopes,
    });
    await writeSecretJson(tokenPath, nextRecord);
    return {
      accessToken: nextRecord.access_token,
      source: "oauth_refresh_token",
      tokenPath,
      accessIssues: [],
    };
  }

  const authUrl = client ? createGoogleAuthUrl({
    client,
    scopes,
    redirectUri: pickRedirectUri(client),
  }) : "";

  return {
    accessToken: "",
    source: "missing_google_oauth",
    tokenPath,
    clientPath,
    authUrl,
    accessIssues: [
      client
        ? "missing_google_oauth_token_run_npm_run_auth_google"
        : "missing_google_oauth_client_secret",
    ],
  };
}

export async function runInstalledAppOAuth({
  clientPath = process.env.GOOGLE_OAUTH_CLIENT_JSON || process.env.YOUTUBE_OAUTH_CLIENT_JSON || DEFAULT_CLIENT_PATH,
  clientJson = process.env.GOOGLE_OAUTH_CLIENT || process.env.YOUTUBE_OAUTH_CLIENT || "",
  tokenPath = process.env.GOOGLE_OAUTH_TOKEN_JSON || process.env.YOUTUBE_OAUTH_TOKEN_JSON || DEFAULT_TOKEN_PATH,
  scopes = DEFAULT_GROWTH_API_SCOPES,
  openBrowser = true,
} = {}) {
  const client = await loadOAuthClient({ clientPath, clientJson });
  if (!client) {
    throw new Error(`Missing OAuth client secret. Put it at ${clientPath} or set GOOGLE_OAUTH_CLIENT_JSON.`);
  }

  const serverResult = await listenForOAuthCode();
  const redirectUri = serverResult.redirectUri;
  const authUrl = createGoogleAuthUrl({ client, scopes, redirectUri });
  console.log(`Open this URL and approve access:\n${authUrl}\n`);

  if (openBrowser) {
    await openUrl(authUrl);
  }

  const code = await serverResult.codePromise;
  const tokens = await exchangeAuthCode({ client, code, redirectUri });
  const tokenRecord = normalizeTokenRecord({ ...tokens, scopes });
  await writeSecretJson(tokenPath, tokenRecord);
  console.log(`Saved OAuth token: ${tokenPath}`);
  return tokenRecord;
}

export async function createServiceAccountAccessToken({
  serviceAccountPath = process.env.GA4_SERVICE_ACCOUNT_JSON || process.env.GOOGLE_APPLICATION_CREDENTIALS || "",
  serviceAccountJson = process.env.GA4_SERVICE_ACCOUNT || process.env.GOOGLE_SERVICE_ACCOUNT_JSON || "",
  scopes = [GOOGLE_SCOPES.analyticsReadonly],
} = {}) {
  const account = await loadJsonInput(serviceAccountJson || serviceAccountPath);
  if (!account) {
    return {
      accessToken: "",
      source: "missing_service_account",
      accessIssues: ["missing_google_service_account_credentials"],
    };
  }
  if (!account.client_email || !account.private_key) {
    return {
      accessToken: "",
      source: "invalid_service_account",
      accessIssues: ["invalid_google_service_account_credentials"],
    };
  }

  const now = Math.floor(Date.now() / 1000);
  const header = base64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = base64Url(JSON.stringify({
    iss: account.client_email,
    scope: scopes.join(" "),
    aud: TOKEN_ENDPOINT,
    iat: now,
    exp: now + 3600,
  }));
  const unsigned = `${header}.${payload}`;
  const signature = crypto.createSign("RSA-SHA256").update(unsigned).sign(account.private_key);
  const assertion = `${unsigned}.${base64Url(signature)}`;
  const response = await fetchForm(TOKEN_ENDPOINT, {
    grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
    assertion,
  });

  return {
    accessToken: response.access_token || "",
    source: "service_account",
    accessIssues: response.access_token ? [] : ["google_service_account_token_empty"],
  };
}

export async function loadOAuthClient({ clientPath = DEFAULT_CLIENT_PATH, clientJson = "" } = {}) {
  const raw = await loadJsonInput(clientJson || clientPath);
  const client = raw?.installed || raw?.web || raw;
  if (!client?.client_id) {
    return null;
  }
  return {
    clientId: client.client_id,
    clientSecret: client.client_secret || "",
    redirectUris: client.redirect_uris || [],
  };
}

export function createGoogleAuthUrl({ client, scopes, redirectUri }) {
  const url = new URL(AUTH_ENDPOINT);
  url.searchParams.set("client_id", client.clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", scopes.join(" "));
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "consent");
  return url.href;
}

export async function exchangeAuthCode({ client, code, redirectUri }) {
  return fetchForm(TOKEN_ENDPOINT, {
    client_id: client.clientId,
    client_secret: client.clientSecret,
    code,
    grant_type: "authorization_code",
    redirect_uri: redirectUri,
  });
}

export async function refreshOAuthToken({ client, refreshToken, scopes = [] }) {
  const form = {
    client_id: client.clientId,
    client_secret: client.clientSecret,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  };
  if (scopes.length) {
    form.scope = scopes.join(" ");
  }
  return fetchForm(TOKEN_ENDPOINT, form);
}

export function defaultGoogleOAuthPaths() {
  return {
    configDir: DEFAULT_CONFIG_DIR,
    tokenPath: DEFAULT_TOKEN_PATH,
    clientPath: DEFAULT_CLIENT_PATH,
  };
}

export async function requestGoogleApiJson(url, {
  method = "GET",
  headers = {},
  body = undefined,
  timeoutSeconds = 30,
} = {}) {
  if (shouldUseCurlTransport()) {
    return requestJsonWithCurl(url, { method, headers, body, timeoutSeconds });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutSeconds * 1000);
  try {
    const response = await fetch(url, {
      method,
      headers,
      body,
      signal: controller.signal,
    });
    return normalizeHttpJsonResponse({
      ok: response.ok,
      status: response.status,
      statusText: response.statusText,
      text: await response.text(),
    });
  } catch (error) {
    if (shouldFallbackToCurl(error)) {
      return requestJsonWithCurl(url, { method, headers, body, timeoutSeconds });
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

async function listenForOAuthCode() {
  let server;
  const codePromise = new Promise((resolvePromise, rejectPromise) => {
    server = createServer((request, response) => {
      const url = new URL(request.url || "/", "http://127.0.0.1");
      const code = url.searchParams.get("code");
      const error = url.searchParams.get("error");
      response.writeHead(error ? 400 : 200, { "content-type": "text/html; charset=utf-8" });
      response.end(error
        ? `<h1>Authorization failed</h1><p>${escapeHtml(error)}</p>`
        : "<h1>Authorization complete</h1><p>You can close this tab and return to Codex.</p>");
      server.close();
      if (error) {
        rejectPromise(new Error(error));
      } else {
        resolvePromise(code);
      }
    });
  });

  await new Promise((resolvePromise, rejectPromise) => {
    server.on("error", rejectPromise);
    server.listen(0, "127.0.0.1", resolvePromise);
  });

  const { port } = server.address();
  return {
    redirectUri: `http://127.0.0.1:${port}/oauth2callback`,
    codePromise,
  };
}

function pickRedirectUri(client) {
  return client.redirectUris.find((uri) => uri.startsWith("http://127.0.0.1")) ||
    client.redirectUris.find((uri) => uri.startsWith("http://localhost")) ||
    "http://127.0.0.1";
}

function normalizeTokenRecord(token) {
  const expiresInMs = Number(token.expires_in || 3600) * 1000;
  return {
    access_token: token.access_token || "",
    refresh_token: token.refresh_token || "",
    token_type: token.token_type || "Bearer",
    scope: token.scope || (Array.isArray(token.scopes) ? token.scopes.join(" ") : ""),
    scopes: Array.isArray(token.scopes) ? token.scopes : String(token.scope || "").split(/\s+/).filter(Boolean),
    expires_at: token.expires_at || new Date(Date.now() + expiresInMs).toISOString(),
  };
}

function isExpiring(tokenRecord, minTtlMs) {
  const expiresAt = Date.parse(tokenRecord.expires_at || "");
  return !Number.isFinite(expiresAt) || expiresAt - Date.now() <= minTtlMs;
}

function hasRequiredScopes(tokenRecord, scopes = []) {
  const requiredScopes = scopes.filter(Boolean);
  if (!requiredScopes.length) {
    return true;
  }
  const grantedScopes = new Set([
    ...(Array.isArray(tokenRecord.scopes) ? tokenRecord.scopes : []),
    ...String(tokenRecord.scope || "").split(/\s+/),
  ].filter(Boolean));
  return requiredScopes.every((scope) => grantedScopes.has(scope));
}

async function fetchForm(url, form) {
  const body = new URLSearchParams();
  for (const [key, value] of Object.entries(form)) {
    if (value !== undefined && value !== null && value !== "") {
      body.set(key, value);
    }
  }
  const response = await requestGoogleApiJson(url, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  if (!response.ok) {
    throw new Error(response.json.error_description ||
      response.json.error?.message ||
      response.json.error ||
      `HTTP ${response.status}`);
  }
  return response.json;
}

async function requestJsonWithCurl(url, {
  method,
  headers,
  body,
  timeoutSeconds,
}) {
  const tempDir = await mkdtemp(join(tmpdir(), "pba-google-api-"));
  const configPath = join(tempDir, "curl.conf");
  const bodyPath = join(tempDir, "body.txt");
  try {
    const lines = [
      `url = "${escapeCurlConfigValue(String(url))}"`,
      `request = "${escapeCurlConfigValue(method)}"`,
      "silent",
      "show-error",
      "location",
      "compressed",
      `max-time = ${Math.max(1, Number(timeoutSeconds) || 30)}`,
      `write-out = "\\n__HTTP_STATUS__:%{http_code}"`,
    ];

    for (const [key, value] of Object.entries(headers || {})) {
      if (value !== undefined && value !== null && value !== "") {
        lines.push(`header = "${escapeCurlConfigValue(`${key}: ${value}`)}"`);
      }
    }

    if (body !== undefined) {
      await writeFile(bodyPath, typeof body === "string" ? body : String(body), { mode: 0o600 });
      await chmod(bodyPath, 0o600).catch(() => {});
      lines.push(`data-binary = "@${escapeCurlConfigValue(bodyPath)}"`);
    }

    await writeFile(configPath, `${lines.join("\n")}\n`, { mode: 0o600 });
    await chmod(configPath, 0o600).catch(() => {});
    const output = await new Promise((resolvePromise, rejectPromise) => {
      execFile("curl", ["--config", configPath], {
        encoding: "utf8",
        maxBuffer: 20 * 1024 * 1024,
        timeout: (Math.max(1, Number(timeoutSeconds) || 30) + 5) * 1000,
      }, (error, stdout, stderr) => {
        if (error) {
          rejectPromise(new Error((stderr || error.message).trim()));
        } else {
          resolvePromise(stdout);
        }
      });
    });
    const marker = "\n__HTTP_STATUS__:";
    const markerIndex = output.lastIndexOf(marker);
    if (markerIndex === -1) {
      throw new Error("curl response missing HTTP status");
    }
    const text = output.slice(0, markerIndex);
    const status = Number.parseInt(output.slice(markerIndex + marker.length).trim(), 10);
    return normalizeHttpJsonResponse({
      ok: status >= 200 && status < 300,
      status,
      statusText: "",
      text,
    });
  } finally {
    await rm(tempDir, { recursive: true, force: true }).catch(() => {});
  }
}

function normalizeHttpJsonResponse({ ok, status, statusText, text }) {
  let json = {};
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    json = { raw: text };
  }
  return {
    ok,
    status,
    statusText,
    text,
    json,
  };
}

function shouldUseCurlTransport() {
  const requested = String(process.env.GOOGLE_API_HTTP_TRANSPORT || "").toLowerCase();
  if (requested === "curl") {
    return true;
  }
  if (requested === "fetch") {
    return false;
  }
  return /^socks/i.test(activeProxyUrl());
}

function shouldFallbackToCurl(error) {
  if (String(process.env.GOOGLE_API_HTTP_TRANSPORT || "").toLowerCase() === "fetch") {
    return false;
  }
  const message = `${error?.code || ""} ${error?.name || ""} ${error?.message || ""} ${error?.cause?.code || ""}`;
  return Boolean(activeProxyUrl()) && /timeout|connect|network|fetch|abort|und_err/i.test(message);
}

function activeProxyUrl() {
  return process.env.HTTPS_PROXY ||
    process.env.https_proxy ||
    process.env.ALL_PROXY ||
    process.env.all_proxy ||
    process.env.HTTP_PROXY ||
    process.env.http_proxy ||
    "";
}

function escapeCurlConfigValue(value) {
  return String(value)
    .replace(/\\/g, "\\\\")
    .replace(/"/g, "\\\"")
    .replace(/\r/g, "\\r")
    .replace(/\n/g, "\\n");
}

async function loadJsonInput(input) {
  const raw = String(input || "").trim();
  if (!raw) {
    return null;
  }
  if (raw.startsWith("{")) {
    return JSON.parse(raw);
  }
  if (!(await pathExists(raw))) {
    return null;
  }
  return JSON.parse(await readFile(resolve(raw), "utf8"));
}

async function readJsonIfExists(filePath) {
  if (!(await pathExists(filePath))) {
    return null;
  }
  return JSON.parse(await readFile(resolve(filePath), "utf8"));
}

async function writeSecretJson(filePath, value) {
  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o600 });
  await chmod(filePath, 0o600).catch(() => {});
}

async function pathExists(filePath) {
  try {
    await access(resolve(filePath));
    return true;
  } catch {
    return false;
  }
}

async function openUrl(url) {
  if (process.platform !== "darwin") {
    return;
  }
  const { spawn } = await import("node:child_process");
  const child = spawn("open", [url], { stdio: "ignore", detached: true });
  child.unref();
}

function base64Url(value) {
  const buffer = Buffer.isBuffer(value) ? value : Buffer.from(value);
  return buffer.toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function escapeHtml(value) {
  return String(value || "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;",
  }[char]));
}

if (import.meta.url === pathToFileURL(process.argv[1] || "").href) {
  runInstalledAppOAuth().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
