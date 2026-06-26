#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const frameworkPath = path.join(rootDir, "docs", "growth-metrics-framework.md");
const analyticsDocPath = path.join(rootDir, "docs", "analytics-events.md");
const servicesPath = path.join(rootDir, "services.js");
const gamePath = path.join(rootDir, "game.js");
const gaReportDir = path.join(rootDir, "reports", "ga-daily");

const coreEvents = [
  "game_init_success",
  "game_start",
  "game_end",
  "first_battle_start",
  "first_battle_complete",
  "second_battle_start",
  "daily_match_complete",
  "next_match_recommend_click",
  "next_day_return",
  "performance_snapshot",
];

const attributionFields = [
  "traffic_source",
  "traffic_medium",
  "traffic_campaign",
  "traffic_content",
  "creative_id",
  "campaign_id",
];

const requiredFrameworkSections = [
  "当前增长命题",
  "北极星",
  "本阶段主 KPI",
  "护栏指标",
  "核心漏斗",
  "归因字段",
  "数据质量验收",
  "Go / Hold / Stop",
  "72 小时实验队列",
];

const findings = [];

main();

function main() {
  const framework = readRequired(frameworkPath);
  const analyticsDoc = readRequired(analyticsDocPath);
  const services = readRequired(servicesPath);
  const game = readRequired(gamePath);
  const constants = parseAnalyticsEventConstants(services);
  const documentedEvents = parseDocumentedEvents(analyticsDoc);
  const referencedEvents = parseReferencedEvents(game, constants);
  const latestGaReport = readLatestGaReport();

  checkFrameworkDoc(framework);
  checkCoreEventCoverage(constants, documentedEvents, referencedEvents);
  checkAttributionCoverage(framework, analyticsDoc, services);
  checkGaReadout(latestGaReport);
  checkDecisionReadiness(latestGaReport);

  printSummary(latestGaReport);

  if (findings.some((item) => item.status === "fail")) {
    process.exitCode = 1;
  }
}

function readRequired(file) {
  if (!fs.existsSync(file)) {
    findings.push({
      status: "fail",
      area: "file",
      message: `Missing required file: ${file}`,
    });
    return "";
  }
  return fs.readFileSync(file, "utf8");
}

function parseAnalyticsEventConstants(source) {
  const match = source.match(/export const AnalyticsEvents = Object\.freeze\(\{([\s\S]*?)\}\);/);
  if (!match) {
    findings.push({
      status: "fail",
      area: "events",
      message: "Could not parse AnalyticsEvents from services.js.",
    });
    return {};
  }

  return Object.fromEntries(
    [...match[1].matchAll(/([A-Za-z0-9_]+):\s*"([^"]+)"/g)].map((entry) => [entry[1], entry[2]]),
  );
}

function parseDocumentedEvents(source) {
  return new Set(source
    .split("\n")
    .map((line) => line.match(/^\|\s*`([a-zA-Z0-9_]+)`\s*\|/)?.[1])
    .filter(Boolean));
}

function parseReferencedEvents(source, constants) {
  const keys = new Set([...source.matchAll(/AnalyticsEvents\.([A-Za-z0-9_]+)/g)].map((match) => match[1]));
  return new Set([...keys].map((key) => constants[key]).filter(Boolean));
}

function checkFrameworkDoc(framework) {
  for (const section of requiredFrameworkSections) {
    addFinding(
      framework.includes(section),
      "framework",
      `Framework covers: ${section}`,
      `Framework is missing section: ${section}`,
    );
  }
}

function checkCoreEventCoverage(constants, documentedEvents, referencedEvents) {
  const constantEvents = new Set(Object.values(constants));
  for (const eventName of coreEvents) {
    const inConstants = constantEvents.has(eventName);
    const documented = documentedEvents.has(eventName);
    const referenced = referencedEvents.has(eventName);
    addFinding(
      inConstants && documented && referenced,
      "core_events",
      `${eventName} is defined, documented, and referenced.`,
      `${eventName} coverage incomplete: constant=${inConstants}, doc=${documented}, code=${referenced}`,
    );
  }
}

function checkAttributionCoverage(framework, analyticsDoc, services) {
  for (const field of attributionFields) {
    addFinding(
      framework.includes(field) && analyticsDoc.includes(field) && services.includes(field),
      "attribution",
      `${field} is covered by framework, analytics docs, and runtime.`,
      `${field} is not fully covered by framework, analytics docs, and runtime.`,
    );
  }
}

function readLatestGaReport() {
  if (!fs.existsSync(gaReportDir)) {
    return null;
  }

  const latest = fs.readdirSync(gaReportDir)
    .filter((file) => /^ga-daily-\d{4}-\d{2}-\d{2}\.json$/.test(file))
    .sort()
    .at(-1);
  if (!latest) {
    return null;
  }

  const file = path.join(gaReportDir, latest);
  try {
    return {
      file,
      data: JSON.parse(fs.readFileSync(file, "utf8")),
    };
  } catch (error) {
    findings.push({
      status: "fail",
      area: "ga",
      message: `Latest GA report is not valid JSON: ${file}`,
    });
    return null;
  }
}

function checkGaReadout(latestGaReport) {
  if (!latestGaReport) {
    findings.push({
      status: "warn",
      area: "ga",
      message: "No GA daily JSON report found. Run npm run ga:daily before interpreting growth metrics.",
    });
    return;
  }

  const { data } = latestGaReport;
  addFinding(
    data.gaData?.status === "ready",
    "ga",
    `Latest GA report is readable for ${data.reportDate}.`,
    `Latest GA report is not ready: ${data.gaData?.status || "unknown"}.`,
    "warn",
  );
}

function checkDecisionReadiness(latestGaReport) {
  if (!latestGaReport?.data?.gaData?.eventRows) {
    return;
  }

  const events = new Map(latestGaReport.data.gaData.eventRows.map((row) => [row.eventName, row]));
  const gameInit = readUsers(events, "game_init_success");
  const gameStart = readUsers(events, "game_start");
  const gameEnd = readUsers(events, "game_end");
  const secondBattleStart = readUsers(events, "second_battle_start");
  const nextMatchClick = readUsers(events, "next_match_recommend_click");
  const nextDayReturn = readUsers(events, "next_day_return");

  addFinding(
    gameInit > 0 && gameStart > 0,
    "funnel",
    `Opening funnel readable: game_init_success users=${gameInit}, game_start users=${gameStart}.`,
    `Opening funnel not readable enough: game_init_success users=${gameInit}, game_start users=${gameStart}.`,
    "warn",
  );
  addFinding(
    gameStart > 0 && gameEnd > 0,
    "funnel",
    `First-match completion proxy readable: game_start users=${gameStart}, game_end users=${gameEnd}.`,
    `First-match completion proxy not readable enough: game_start users=${gameStart}, game_end users=${gameEnd}.`,
    "warn",
  );
  addFinding(
    secondBattleStart > 0 || nextMatchClick > 0,
    "funnel",
    `Second-battle loop is readable: second_battle_start users=${secondBattleStart}, next_match_recommend_click users=${nextMatchClick}.`,
    `Second-battle loop still weak or zero: second_battle_start users=${secondBattleStart}, next_match_recommend_click users=${nextMatchClick}.`,
    "warn",
  );
  addFinding(
    nextDayReturn > 0,
    "retention",
    `Early return signal readable: next_day_return users=${nextDayReturn}.`,
    `Early return signal not readable: next_day_return users=${nextDayReturn}.`,
    "warn",
  );
}

function readUsers(events, eventName) {
  return Number(events.get(eventName)?.totalUsers || 0);
}

function addFinding(condition, area, passMessage, failMessage, failStatus = "fail") {
  findings.push({
    status: condition ? "pass" : failStatus,
    area,
    message: condition ? passMessage : failMessage,
  });
}

function printSummary(latestGaReport) {
  const counts = findings.reduce((acc, item) => {
    acc[item.status] = (acc[item.status] || 0) + 1;
    return acc;
  }, {});
  const status = counts.fail ? "FAIL" : counts.warn ? "ATTENTION" : "PASS";

  console.log("# Growth framework verification");
  console.log(`Status: ${status}`);
  console.log(`Checks: ${counts.pass || 0} pass, ${counts.warn || 0} warn, ${counts.fail || 0} fail`);
  console.log(`Framework: ${frameworkPath}`);
  if (latestGaReport) {
    console.log(`Latest GA report: ${latestGaReport.file}`);
  }
  console.log("");

  for (const item of findings.filter((entry) => entry.status !== "pass")) {
    console.log(`- [${item.status.toUpperCase()}] ${item.area}: ${item.message}`);
  }

  if (!findings.some((entry) => entry.status !== "pass")) {
    console.log("- All growth framework checks passed.");
  }

  console.log("");
  console.log("Interpretation:");
  console.log("- PASS means the framework is wired well enough to support routine decisions.");
  console.log("- WARN means do not scale spend from this signal yet; fix the gap or keep sample-size caveats explicit.");
  console.log("- FAIL means the framework is internally inconsistent and should be fixed before reporting.");
}
