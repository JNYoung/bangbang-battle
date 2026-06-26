#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const reportDir = path.join(rootDir, "reports", "ga-daily");
const packageName = "com.professionballarena.game";
const expectedFirebaseAppId = "1:933439959875:android:76d88a27e9123f538d35f6";
const expectedProjectId = "profession-ball-arena";
const expectedProjectNumber = "933439959875";
const defaultGa4PropertyId = "539311512";
const defaultServiceAccountPath = path.join(process.env.HOME || "", ".config", "ga", "ga-daily-reader.json");
const firebaseConsoleUrl = "https://console.firebase.google.com/project/profession-ball-arena";
const firebaseEventsUrl = `${firebaseConsoleUrl}/analytics/events`;
const firebaseDebugViewUrl = `${firebaseConsoleUrl}/analytics/debugview`;
const coreRuntimeEvents = [
  "game_init_success",
  "game_start",
  "game_end",
  "daily_match_complete",
  "first_battle_start",
  "first_battle_complete",
  "performance_snapshot",
];

const options = parseArgs(process.argv.slice(2));

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});

async function main() {
  const generatedAt = new Date();
  const reportDate = options.date || formatLocalDate(addDays(generatedAt, -1));
  const runDate = formatLocalDate(generatedAt);
  const context = readProjectContext();
  const eventModel = readEventModel();
  const checks = buildLocalChecks(context, eventModel);
  const gaData = await readGaAggregateData(reportDate);
  const smoke = options.smoke ? runSmokeTest() : skippedSmoke();
  const recommendations = buildRecommendations(checks, gaData, eventModel, smoke);
  const status = summarizeStatus(checks, gaData, smoke);

  const report = {
    generatedAt: generatedAt.toISOString(),
    runDate,
    reportDate,
    status,
    project: {
      packageName,
      firebaseProjectId: context.googleServices.projectId,
      firebaseProjectNumber: context.googleServices.projectNumber,
      firebaseAppId: context.googleServices.appId,
      firebaseConsoleUrl,
      firebaseEventsUrl,
      firebaseDebugViewUrl,
    },
    checks,
    eventModel,
    gaData,
    smoke,
    recommendations,
  };

  fs.mkdirSync(reportDir, { recursive: true });
  const jsonPath = path.join(reportDir, `ga-daily-${runDate}.json`);
  const markdownPath = path.join(reportDir, `ga-daily-${runDate}.md`);
  fs.writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`);
  fs.writeFileSync(markdownPath, renderMarkdown(report, jsonPath, markdownPath));

  printConsoleSummary(report, jsonPath, markdownPath);

  if (options.strict && status.level !== "pass") {
    process.exitCode = 1;
  }
}

function parseArgs(args) {
  return {
    date: readArgValue(args, "--date"),
    lookbackDays: Number(readArgValue(args, "--lookback-days") || 7),
    propertyId: readArgValue(args, "--property") || process.env.GA4_PROPERTY_ID || defaultGa4PropertyId,
    accessToken: readArgValue(args, "--access-token") || process.env.GA4_ACCESS_TOKEN || "",
    serviceAccountPath: readArgValue(args, "--service-account")
      || process.env.GA4_SERVICE_ACCOUNT_JSON
      || process.env.GOOGLE_APPLICATION_CREDENTIALS
      || defaultServiceAccountPath,
    smoke: args.includes("--smoke"),
    smokeBuild: args.includes("--smoke-build"),
    strict: args.includes("--strict"),
  };
}

function readArgValue(args, name) {
  const prefix = `${name}=`;
  const inline = args.find((arg) => arg.startsWith(prefix));
  if (inline) {
    return inline.slice(prefix.length);
  }

  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : "";
}

function readProjectContext() {
  const googleServicesPath = path.join(rootDir, "android", "app", "google-services.json");
  const gradlePath = path.join(rootDir, "android", "app", "build.gradle");
  const servicesPath = path.join(rootDir, "services.js");
  const nativePluginPath = path.join(
    rootDir,
    "android",
    "app",
    "src",
    "main",
    "java",
    "com",
    "professionballarena",
    "game",
    "GameAnalyticsPlugin.java",
  );
  const docsPath = path.join(rootDir, "docs", "analytics-events.md");
  const packagePath = path.join(rootDir, "package.json");

  const googleServices = readGoogleServices(googleServicesPath);

  return {
    files: {
      googleServicesPath,
      gradlePath,
      servicesPath,
      nativePluginPath,
      docsPath,
      packagePath,
    },
    googleServices,
    gradle: readOptional(gradlePath),
    services: readOptional(servicesPath),
    nativePlugin: readOptional(nativePluginPath),
    docs: readOptional(docsPath),
    packageJson: JSON.parse(readOptional(packagePath) || "{}"),
  };
}

function readGoogleServices(file) {
  if (!fs.existsSync(file)) {
    return {
      exists: false,
      appId: "",
      projectId: "",
      projectNumber: "",
      packageName: "",
    };
  }

  const data = JSON.parse(fs.readFileSync(file, "utf8"));
  const client = data.client?.find((entry) => {
    return entry.client_info?.android_client_info?.package_name === packageName;
  });

  return {
    exists: true,
    appId: client?.client_info?.mobilesdk_app_id || "",
    projectId: data.project_info?.project_id || "",
    projectNumber: data.project_info?.project_number || "",
    packageName: client?.client_info?.android_client_info?.package_name || "",
  };
}

function readEventModel() {
  const servicesPath = path.join(rootDir, "services.js");
  const gamePath = path.join(rootDir, "game.js");
  const docsPath = path.join(rootDir, "docs", "analytics-events.md");
  const services = readOptional(servicesPath);
  const game = readOptional(gamePath);
  const docs = readOptional(docsPath);
  const constants = parseAnalyticsEventConstants(services);
  const documentedEvents = parseDocumentedEvents(docs);
  const referencedKeys = [...new Set([...game.matchAll(/AnalyticsEvents\.([A-Za-z0-9_]+)/g)].map((match) => match[1]))].sort();
  const emittedEvents = referencedKeys.map((key) => constants[key]).filter(Boolean).sort();
  const constantEvents = Object.values(constants).sort();

  return {
    constantCount: constantEvents.length,
    documentedCount: documentedEvents.length,
    emittedCount: emittedEvents.length,
    constants,
    constantEvents,
    documentedEvents,
    emittedEvents,
    undocumentedConstants: constantEvents.filter((event) => !documentedEvents.includes(event)),
    documentedButMissingConstants: documentedEvents.filter((event) => !constantEvents.includes(event)),
    constantsNotReferencedInGame: constantEvents.filter((event) => !emittedEvents.includes(event)),
    coreRuntimeCoverage: coreRuntimeEvents.map((event) => ({
      event,
      inConstants: constantEvents.includes(event),
      documented: documentedEvents.includes(event),
      referencedInGame: emittedEvents.includes(event),
    })),
  };
}

function parseAnalyticsEventConstants(source) {
  const match = source.match(/export const AnalyticsEvents = Object\.freeze\(\{([\s\S]*?)\}\);/);
  if (!match) {
    return {};
  }

  return Object.fromEntries(
    [...match[1].matchAll(/([A-Za-z0-9_]+):\s*"([^"]+)"/g)].map((entry) => [entry[1], entry[2]]),
  );
}

function parseDocumentedEvents(source) {
  return [...new Set(source
    .split("\n")
    .map((line) => line.match(/^\|\s*`([a-zA-Z0-9_]+)`\s*\|/)?.[1])
    .filter(Boolean))].sort();
}

function buildLocalChecks(context, eventModel) {
  const checks = [];
  addCheck(
    checks,
    "firebase_config",
    "Firebase Android 配置",
    context.googleServices.exists
      && context.googleServices.appId === expectedFirebaseAppId
      && context.googleServices.projectId === expectedProjectId
      && context.googleServices.projectNumber === expectedProjectNumber
      && context.googleServices.packageName === packageName
      ? "pass"
      : "fail",
    `appId=${context.googleServices.appId || "missing"}, project=${context.googleServices.projectId || "missing"}`,
  );
  addCheck(
    checks,
    "gradle_firebase",
    "Firebase Analytics 依赖和 Google Services 插件",
    context.gradle.includes("com.google.firebase:firebase-analytics") && context.gradle.includes("com.google.gms.google-services")
      ? "pass"
      : "fail",
    "Release 构建应打入 Firebase Analytics，并处理 google-services.json。",
  );
  addCheck(
    checks,
    "native_plugin",
    "原生统计桥接",
    ["logEvent", "setCollectionEnabled", "getStatus"].every((method) => context.nativePlugin.includes(`void ${method}`))
      ? "pass"
      : "fail",
    "Web runtime 所需的 Capacitor bridge 方法。",
  );
  addCheck(
    checks,
    "consent_gate",
    "同意后才采集",
    context.services.includes("let analyticsCollectionEnabled = false")
      && context.services.includes("setCollectionEnabled")
      && context.docs.includes("starts only after the user accepts")
      ? "pass"
      : "warn",
    "用户接受协议前，统计采集应保持关闭。",
  );
  addCheck(
    checks,
    "event_schema",
    "埋点口径完整性",
    eventModel.undocumentedConstants.length === 0 && eventModel.documentedButMissingConstants.length === 0
      ? "pass"
      : "warn",
    [
      formatList("未写入文档的代码常量", eventModel.undocumentedConstants),
      formatList("文档中存在但代码常量缺失", eventModel.documentedButMissingConstants),
    ].filter(Boolean).join("; ") || "代码常量和文档已对齐。",
  );
  addCheck(
    checks,
    "core_events",
    "核心运行事件覆盖",
    eventModel.coreRuntimeCoverage.every((entry) => entry.inConstants && entry.documented && entry.referencedInGame)
      ? "pass"
      : "fail",
    eventModel.coreRuntimeCoverage
      .filter((entry) => !entry.inConstants || !entry.documented || !entry.referencedInGame)
      .map((entry) => `${entry.event}: constant=${entry.inConstants}, doc=${entry.documented}, code=${entry.referencedInGame}`)
      .join("; ") || "核心采集事件已定义、已记录并在游戏代码中引用。",
  );
  addCheck(
    checks,
    "smoke_entrypoint",
    "Release 烟测入口",
    context.packageJson.scripts?.["android:ga:smoke"] ? "pass" : "warn",
    context.packageJson.scripts?.["android:ga:smoke"] || "缺少 android:ga:smoke npm script。",
  );
  return checks;
}

function addCheck(checks, id, label, status, detail) {
  checks.push({ id, label, status, detail });
}

async function readGaAggregateData(reportDate) {
  if (!options.propertyId) {
    return {
      status: "blocked",
      reason: "未配置 GA4_PROPERTY_ID，脚本暂时无法程序化读取 GA 面板数据。",
      required: ["GA4_PROPERTY_ID", "GA4_ACCESS_TOKEN or GOOGLE_APPLICATION_CREDENTIALS"],
      links: { firebaseEventsUrl, firebaseDebugViewUrl },
    };
  }

  try {
    const token = options.accessToken || createAccessTokenFromServiceAccount(options.serviceAccountPath);
    if (!token) {
      return {
        status: "blocked",
        reason: "未配置 GA4 读取凭证。请提供 GA4_ACCESS_TOKEN 或 GOOGLE_APPLICATION_CREDENTIALS。",
        required: ["GA4_ACCESS_TOKEN or GOOGLE_APPLICATION_CREDENTIALS"],
        propertyId: options.propertyId,
        links: { firebaseEventsUrl, firebaseDebugViewUrl },
      };
    }

    const eventRows = await runGaReport({
      propertyId: options.propertyId,
      token,
      body: {
        dateRanges: [{ startDate: reportDate, endDate: reportDate }],
        dimensions: [{ name: "eventName" }],
        metrics: [{ name: "eventCount" }, { name: "totalUsers" }],
        orderBys: [{ metric: { metricName: "eventCount" }, desc: true }],
        limit: 50,
      },
    });
    const trendRows = await runGaReport({
      propertyId: options.propertyId,
      token,
      body: {
        dateRanges: [{ startDate: formatLocalDate(addDays(new Date(`${reportDate}T00:00:00`), -(options.lookbackDays - 1))), endDate: reportDate }],
        dimensions: [{ name: "date" }],
        metrics: [{ name: "eventCount" }, { name: "activeUsers" }],
        orderBys: [{ dimension: { dimensionName: "date" } }],
      },
    });

    return {
      status: "ready",
      propertyId: options.propertyId,
      reportDate,
      lookbackDays: options.lookbackDays,
      eventRows: toGaRows(eventRows),
      trendRows: toGaRows(trendRows),
    };
  } catch (error) {
    return {
      status: "error",
      propertyId: options.propertyId,
      reportDate,
      reason: sanitizeError(error),
      links: { firebaseEventsUrl, firebaseDebugViewUrl },
    };
  }
}

function createAccessTokenFromServiceAccount(file) {
  if (!file || !fs.existsSync(file)) {
    return "";
  }

  const account = JSON.parse(fs.readFileSync(file, "utf8"));
  if (!account.client_email || !account.private_key) {
    throw new Error(`Invalid service account file: ${file}`);
  }

  const now = Math.floor(Date.now() / 1000);
  const header = base64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = base64Url(JSON.stringify({
    iss: account.client_email,
    scope: "https://www.googleapis.com/auth/analytics.readonly",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  }));
  const unsigned = `${header}.${payload}`;
  const signature = crypto.createSign("RSA-SHA256").update(unsigned).sign(account.private_key);
  const assertion = `${unsigned}.${base64Url(signature)}`;
  const data = requestJsonWithCurl("https://oauth2.googleapis.com/token", {
    form: {
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    },
  });
  return data.access_token || "";
}

function runGaReport({ propertyId, token, body }) {
  return requestJsonWithCurl(`https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
    body,
  });
}

function toGaRows(data) {
  const dimensions = data.dimensionHeaders?.map((entry) => entry.name) || [];
  const metrics = data.metricHeaders?.map((entry) => entry.name) || [];
  return (data.rows || []).map((row) => {
    const record = {};
    dimensions.forEach((name, index) => {
      record[name] = row.dimensionValues?.[index]?.value || "";
    });
    metrics.forEach((name, index) => {
      record[name] = Number(row.metricValues?.[index]?.value || 0);
    });
    return record;
  });
}

function requestJsonWithCurl(url, { method = "POST", headers = {}, body = null, form = null } = {}) {
  const args = [
    "--silent",
    "--show-error",
    "--location",
    "--max-time",
    "45",
    "--request",
    method,
    "--write-out",
    "\n__HTTP_STATUS__:%{http_code}",
  ];

  for (const [name, value] of Object.entries(headers)) {
    args.push("--header", `${name}: ${value}`);
  }

  if (form) {
    args.push("--header", "content-type: application/x-www-form-urlencoded");
    for (const [name, value] of Object.entries(form)) {
      args.push("--data-urlencode", `${name}=${value}`);
    }
  } else if (body !== null) {
    args.push("--data", JSON.stringify(body));
  }

  args.push(url);

  const result = spawnSync("curl", args, {
    cwd: rootDir,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });

  if (result.status !== 0) {
    throw new Error(`curl request failed: ${result.stderr || result.stdout}`);
  }

  const output = result.stdout || "";
  const marker = "\n__HTTP_STATUS__:";
  const markerIndex = output.lastIndexOf(marker);
  if (markerIndex < 0) {
    throw new Error("curl response missing HTTP status marker");
  }

  const rawBody = output.slice(0, markerIndex);
  const status = Number(output.slice(markerIndex + marker.length).trim());
  let data = {};
  if (rawBody.trim()) {
    try {
      data = JSON.parse(rawBody);
    } catch (error) {
      throw new Error(`curl response was not JSON, status=${status}: ${rawBody.slice(0, 300)}`);
    }
  }

  if (status < 200 || status >= 300) {
    throw new Error(data.error?.message || data.error_description || data.error || `HTTP ${status}`);
  }

  return data;
}

function runSmokeTest() {
  const args = ["run", "android:ga:smoke"];
  if (!options.smokeBuild) {
    args.push("--", "--skip-build");
  }

  const result = spawnSync("npm", args, {
    cwd: rootDir,
    encoding: "utf8",
    stdio: "pipe",
  });
  const output = [result.stdout, result.stderr].filter(Boolean).join("\n");
  return {
    status: result.status === 0 ? "pass" : "fail",
    command: `npm ${args.join(" ")}`,
    detail: output.slice(-6000),
  };
}

function skippedSmoke() {
  return {
    status: "skipped",
    command: "npm run ga:daily -- --smoke",
    detail: "默认跳过，因为 release 烟测需要一台已就绪的 Android 模拟器或真机。",
  };
}

function buildRecommendations(checks, gaData, eventModel, smoke) {
  const recommendations = [];
  if (gaData.status === "blocked") {
    recommendations.push({
      priority: "high",
      title: "把 GA 面板读取接入每日巡检",
      detail: "配置 GA4_PROPERTY_ID，并提供 GA4_ACCESS_TOKEN 或 GOOGLE_APPLICATION_CREDENTIALS，让日报能读取昨日聚合事件，而不是停在本地采集链路检查。",
    });
  }
  if (gaData.status === "error") {
    recommendations.push({
      priority: "high",
      title: "修复 GA Data API 读取权限",
      detail: gaData.reason,
    });
  }
  if (checks.some((check) => check.status === "fail")) {
    recommendations.push({
      priority: "high",
      title: "先修复采集链路失败项，再看面板趋势",
      detail: "本地配置或核心事件检查失败时，GA 聚合数可能缺失或归因错误。",
    });
  }
  if (eventModel.undocumentedConstants.length > 0 || eventModel.documentedButMissingConstants.length > 0) {
    recommendations.push({
      priority: "medium",
      title: "保持埋点文档和代码同步",
      detail: [
        formatList("未写入文档的代码常量", eventModel.undocumentedConstants),
        formatList("文档中存在但代码常量缺失", eventModel.documentedButMissingConstants),
      ].filter(Boolean).join("; "),
    });
  }
  if (smoke.status === "skipped") {
    recommendations.push({
      priority: "medium",
      title: "构建或 Firebase 配置变化后跑 release 烟测",
      detail: "准备好 Android 设备后执行 `npm run ga:daily -- --smoke`，验证真实 Firebase 上传链路。",
    });
  }
  recommendations.push({
    priority: "low",
    title: "封测量级上来后补生产诊断事件",
    detail: "当封测有足够流量后，再考虑 `scene_select`、`role_select`、`game_error`、`asset_load_error`，从链路巡检转向体验优化。",
  });
  return recommendations;
}

function summarizeStatus(checks, gaData, smoke) {
  if (checks.some((check) => check.status === "fail") || smoke.status === "fail" || gaData.status === "error") {
    return { level: "fail", label: "失败" };
  }
  if (checks.some((check) => check.status === "warn") || gaData.status === "blocked" || smoke.status === "skipped") {
    return { level: "attention", label: "需要处理" };
  }
  return { level: "pass", label: "通过" };
}

function renderMarkdown(report, jsonPath, markdownPath) {
  const localChecks = report.checks.map((check) => {
    return `| ${check.label} | ${translateCheckStatus(check.status)} | ${escapeMarkdown(check.detail)} |`;
  }).join("\n");
  const coreRows = report.eventModel.coreRuntimeCoverage.map((entry) => {
    return `| \`${entry.event}\` | ${yesNo(entry.inConstants)} | ${yesNo(entry.documented)} | ${yesNo(entry.referencedInGame)} |`;
  }).join("\n");
  const gaSection = renderGaSection(report.gaData);
  const recommendationRows = report.recommendations.map((item) => {
    return `| ${translatePriority(item.priority)} | ${escapeMarkdown(item.title)} | ${escapeMarkdown(item.detail)} |`;
  }).join("\n");

  return `# GA 每日巡检 - ${report.runDate}

生成时间：${report.generatedAt}
检查的 GA 数据日期：${report.reportDate}
整体状态：**${report.status.label}**

## 结论

- 采集链路：${report.checks.some((check) => check.status === "fail") ? "未完成" : "本地检查完整"}。
- GA 面板/API 数据：${report.gaData.status === "ready" ? "已成功读取" : translateGaStatus(report.gaData.status)}。
- 封测提醒：样本量小的时候，趋势只能作方向参考；每天最可靠的信号是采集、上传、读取和分析链路是否稳定。

## 项目

- Firebase 项目：\`${report.project.firebaseProjectId}\`
- Android 包名：\`${report.project.packageName}\`
- Firebase app id：\`${report.project.firebaseAppId}\`
- Events 面板：${report.project.firebaseEventsUrl}
- DebugView：${report.project.firebaseDebugViewUrl}

## 本地链路检查

| 检查项 | 状态 | 说明 |
| --- | --- | --- |
${localChecks}

## 核心事件覆盖

| 事件 | 常量 | 文档 | 游戏代码引用 |
| --- | --- | --- | --- |
${coreRows}

## GA 聚合数据

${gaSection}

## 烟测

- 状态：${translateSmokeStatus(report.smoke.status)}
- 命令：\`${report.smoke.command}\`
- 说明：${escapeMarkdown(firstLine(report.smoke.detail))}

## 优化队列

| 优先级 | 事项 | 说明 |
| --- | --- | --- |
${recommendationRows}

## 产物

- JSON: ${jsonPath}
- Markdown: ${markdownPath}
`;
}

function renderGaSection(gaData) {
  if (gaData.status !== "ready") {
    return [
      `状态：**${translateGaStatus(gaData.status)}**`,
      "",
      gaData.reason,
      "",
      `需要配置：${(gaData.required || []).map((item) => `\`${item}\``).join(", ") || "无"}`,
    ].join("\n");
  }

  const eventRows = gaData.eventRows.length > 0
    ? gaData.eventRows.map((row) => `| \`${row.eventName}\` | ${row.eventCount} | ${row.totalUsers} |`).join("\n")
    : "| n/a | 0 | 0 |";
  const trendRows = gaData.trendRows.length > 0
    ? gaData.trendRows.map((row) => `| ${row.date} | ${row.eventCount} | ${row.activeUsers} |`).join("\n")
    : "| n/a | 0 | 0 |";

  return `${gaData.reportDate} 主要事件：

| 事件 | 事件数 | 用户数 |
| --- | ---: | ---: |
${eventRows}

近 ${gaData.lookbackDays} 天趋势：

| 日期 | 事件数 | 活跃用户 |
| --- | ---: | ---: |
${trendRows}`;
}

function printConsoleSummary(report, jsonPath, markdownPath) {
  console.log(`GA 每日巡检：${report.status.label}`);
  console.log(`检查日期：${report.reportDate}`);
  console.log(`采集链路检查：${report.checks.filter((check) => check.status === "pass").length}/${report.checks.length} 通过`);
  console.log(`GA 面板/API 数据：${translateGaStatus(report.gaData.status)}`);
  if (report.gaData.reason) {
    console.log(`GA 数据说明：${report.gaData.reason}`);
  }
  console.log(`Markdown: ${markdownPath}`);
  console.log(`JSON: ${jsonPath}`);
}

function readOptional(file) {
  return fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
}

function addDays(date, days) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

function formatLocalDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function base64Url(value) {
  const buffer = Buffer.isBuffer(value) ? value : Buffer.from(value);
  return buffer.toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function sanitizeError(error) {
  return String(error?.message || error).replace(/Bearer\s+[A-Za-z0-9._-]+/g, "Bearer [redacted]");
}

function formatList(label, values) {
  return values.length > 0 ? `${label}: ${values.join(", ")}` : "";
}

function yesNo(value) {
  return value ? "是" : "否";
}

function firstLine(text) {
  return String(text || "").split("\n").find(Boolean) || "";
}

function escapeMarkdown(text) {
  return String(text || "").replace(/\|/g, "\\|").replace(/\n/g, " ");
}

function translateGaStatus(status) {
  return {
    ready: "已读取",
    blocked: "未接入",
    error: "读取失败",
  }[status] || status;
}

function translateSmokeStatus(status) {
  return {
    pass: "通过",
    fail: "失败",
    skipped: "已跳过",
  }[status] || status;
}

function translateCheckStatus(status) {
  return {
    pass: "通过",
    warn: "需关注",
    fail: "失败",
  }[status] || status;
}

function translatePriority(priority) {
  return {
    high: "高",
    medium: "中",
    low: "低",
  }[priority] || priority;
}
