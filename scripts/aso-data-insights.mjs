#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const gaReportDir = path.join(rootDir, "reports", "ga-daily");
const outputDir = path.join(rootDir, "reports", "aso-insights");
const options = parseArgs(process.argv.slice(2));

main();

function main() {
  if (!options.skipGa) {
    run("npm", ["run", "ga:daily"], { inherit: true });
  }

  const gaReportPath = latestFile(gaReportDir, /^ga-daily-\d{4}-\d{2}-\d{2}\.json$/);
  if (!gaReportPath) {
    throw new Error(`No GA daily report found in ${gaReportDir}. Run npm run ga:daily first.`);
  }

  const gaReport = JSON.parse(fs.readFileSync(gaReportPath, "utf8"));
  const insight = buildAsoInsight(gaReport, gaReportPath);
  fs.mkdirSync(outputDir, { recursive: true });

  const jsonPath = path.join(outputDir, `aso-insights-${gaReport.runDate}.json`);
  const markdownPath = path.join(outputDir, `aso-insights-${gaReport.runDate}.md`);
  fs.writeFileSync(jsonPath, `${JSON.stringify(insight, null, 2)}\n`);
  fs.writeFileSync(markdownPath, renderMarkdown(insight, jsonPath, markdownPath));

  printSummary(insight, markdownPath, jsonPath);
}

function parseArgs(args) {
  return {
    skipGa: args.includes("--skip-ga"),
  };
}

function buildAsoInsight(gaReport, gaReportPath) {
  const events = Object.fromEntries((gaReport.gaData?.eventRows || []).map((row) => [row.eventName, row]));
  const eventCount = (name) => events[name]?.eventCount || 0;
  const totalUsers = (name) => events[name]?.totalUsers || 0;
  const trendRows = gaReport.gaData?.trendRows || [];
  const latestTrend = trendRows[trendRows.length - 1] || {};
  const previousTrend = trendRows.slice(0, -1);
  const previousAvgEvents = average(previousTrend.map((row) => row.eventCount));
  const previousAvgActiveUsers = average(previousTrend.map((row) => row.activeUsers));
  const playConsoleExports = findPlayConsoleExports();

  const metrics = {
    gaStatus: gaReport.gaData?.status || "unknown",
    gaPropertyId: gaReport.gaData?.propertyId || "",
    reportDate: gaReport.reportDate,
    activeUsers: latestTrend.activeUsers || 0,
    eventCount: latestTrend.eventCount || 0,
    previousAvgEvents,
    previousAvgActiveUsers,
    events: {
      screenView: eventCount("screen_view"),
      userEngagement: eventCount("user_engagement"),
      gameInitSuccess: eventCount("game_init_success"),
      sessionStart: eventCount("session_start"),
      gameStart: eventCount("game_start"),
      firstBattleStart: eventCount("first_battle_start"),
      firstBattleComplete: eventCount("first_battle_complete"),
      secondBattleStart: eventCount("second_battle_start"),
      dailyMatchComplete: eventCount("daily_match_complete"),
      gameEnd: eventCount("game_end"),
      nextMatchRecommendClick: eventCount("next_match_recommend_click"),
      reportCardClick: eventCount("report_card_click"),
      nextDayReturn: eventCount("next_day_return"),
      appRemove: eventCount("app_remove"),
      adRequest: eventCount("ad_request"),
      adShow: eventCount("ad_show"),
      adClose: eventCount("ad_close"),
      rewardedAdGrant: eventCount("rewarded_ad_grant"),
    },
    users: {
      gameInitSuccess: totalUsers("game_init_success"),
      gameStart: totalUsers("game_start"),
      gameEnd: totalUsers("game_end"),
      nextDayReturn: totalUsers("next_day_return"),
      adShow: totalUsers("ad_show"),
    },
  };

  metrics.rates = {
    initToGameStart: ratio(metrics.events.gameStart, metrics.events.gameInitSuccess),
    gameStartToEnd: ratio(metrics.events.gameEnd, metrics.events.gameStart),
    gameStartToDailyComplete: ratio(metrics.events.dailyMatchComplete, metrics.events.gameStart),
    gameStartToSecondBattle: ratio(metrics.events.secondBattleStart, metrics.events.gameStart),
    resultToNextMatchClick: ratio(metrics.events.nextMatchRecommendClick, metrics.events.gameEnd),
    activeUserNextDayReturnSignal: ratio(metrics.users.nextDayReturn, metrics.activeUsers),
  };

  const tasks = buildTasks(metrics, gaReport, playConsoleExports);
  const evidence = buildEvidence(metrics, gaReport, gaReportPath, playConsoleExports);

  return {
    generatedAt: new Date().toISOString(),
    runDate: gaReport.runDate,
    reportDate: gaReport.reportDate,
    status: summarizeInsightStatus(metrics, gaReport, tasks),
    source: {
      gaReportPath,
      gaReportStatus: gaReport.status,
      playConsoleExports,
    },
    metrics,
    evidence,
    tasks,
  };
}

function buildEvidence(metrics, gaReport, gaReportPath, playConsoleExports) {
  const rows = [];
  rows.push({
    label: "GA Data API",
    value: metrics.gaStatus === "ready" ? "已读取" : "未读取",
    implication: metrics.gaStatus === "ready"
      ? `可用 property ${metrics.gaPropertyId} 读取昨日事件和 7 日趋势。`
      : "ASO 只能用本地链路检查，不能做真实漏斗判断。",
  });
  rows.push({
    label: "昨日活跃和事件",
    value: `${metrics.activeUsers} active users / ${metrics.eventCount} events`,
    implication: "封测样本小，适合判断链路和明显断点，不适合做放量结论。",
  });
  rows.push({
    label: "首局启动",
    value: `${metrics.events.gameStart}/${metrics.events.gameInitSuccess} (${formatPercent(metrics.rates.initToGameStart)})`,
    implication: "如果持续低于 50%，优先检查商店承诺、首屏、隐私同意后入口和第一张截图是否让用户知道下一步。",
  });
  rows.push({
    label: "首局完成",
    value: `${metrics.events.gameEnd}/${metrics.events.gameStart} (${formatPercent(metrics.rates.gameStartToEnd)})`,
    implication: "如果持续低于 55%，ASO 不要过度承诺“策略深度”，先把首局可读性和完成率拉起来。",
  });
  rows.push({
    label: "再玩动机",
    value: `${metrics.events.secondBattleStart} second_battle_start / ${metrics.events.nextMatchRecommendClick} next-match clicks`,
    implication: "ASO 可以主打 matchup/counter，但产品内结果页必须承接这个承诺。",
  });
  rows.push({
    label: "广告事件",
    value: `${metrics.events.adRequest} requests / ${metrics.events.adShow} shows / ${metrics.events.adClose} closes`,
    implication: "当前文档说现版本不展示广告；GA 中出现广告事件，需要确认是否来自旧包或测试包，避免 Play Data safety/商店文案冲突。",
  });
  rows.push({
    label: "Play Console 商店转化",
    value: playConsoleExports.length > 0 ? `${playConsoleExports.length} file(s)` : "未发现导出文件",
    implication: "GA 能看应用内行为，但 ASO 必须补 store listing impressions -> installs 才能判断商店页转化。",
  });
  rows.push({
    label: "GA 日报来源",
    value: path.relative(rootDir, gaReportPath),
    implication: `日报状态：${gaReport.status?.label || "unknown"}。`,
  });
  return rows;
}

function buildTasks(metrics, gaReport, playConsoleExports) {
  const tasks = [];

  if (metrics.gaStatus !== "ready") {
    tasks.push(task("P0", "数据链路", "修复 GA Data API 读取", "ASO 洞察必须能读到昨日事件和 7 日趋势。"));
  }

  if (playConsoleExports.length === 0) {
    tasks.push(task(
      "P0",
      "ASO 数据",
      "从 Play Console 导出 Store listing acquisition",
      "补齐 impressions、store listing visitors、installers、country/source/search 相关报表；否则无法判断 ASO 首屏和关键词是否拖累安装。",
    ));
  }

  if (metrics.events.adRequest + metrics.events.adShow + metrics.events.adClose > 0) {
    tasks.push(task(
      "P0",
      "合规/商店文案",
      "核对广告事件来源",
      "GA 昨日有 ad_request/ad_show/ad_close，但当前 docs/ad-flow.md 和商店口径写的是无广告；确认是否旧包、测试包或当前包仍在发广告事件。",
    ));
  }

  if (metrics.rates.initToGameStart !== null && metrics.rates.initToGameStart < 0.5) {
    tasks.push(task(
      "P1",
      "ASO 首屏",
      "把首图和短描述改成明确的 matchup 行动",
      `昨日 game_start / game_init_success 为 ${formatPercent(metrics.rates.initToGameStart)}。首图优先展示“选择对阵 -> 立即开战”，弱化泛泛功能列表。`,
    ));
  }

  if (metrics.rates.gameStartToEnd !== null && metrics.rates.gameStartToEnd < 0.55) {
    tasks.push(task(
      "P1",
      "产品承接",
      "先提高首局完成率，再扩大买量",
      `昨日 game_end / game_start 为 ${formatPercent(metrics.rates.gameStartToEnd)}。ASO 可以继续用自动战斗卖点，但投放前要查首局时长、卡顿和结算到达率。`,
    ));
  }

  if (metrics.events.nextMatchRecommendClick === 0 || metrics.events.secondBattleStart === 0) {
    tasks.push(task(
      "P1",
      "截图/结算页",
      "把 result verdict 和 Try the counter 做成可点击闭环",
      "ASO 主打 counter/matchup 时，截图第 3 张和结果页按钮都要承接同一句承诺；同时确认 next_match_recommend_click 和 second_battle_start 是否正常上报。",
    ));
  }

  if (metrics.events.nextDayReturn > 0) {
    tasks.push(task(
      "P2",
      "留存素材",
      "保留 daily matchup / daily champion 方向",
      `昨日 next_day_return 为 ${metrics.events.nextDayReturn}，封测样本小但说明回访事件可读；后续 ASO 截图和 Shorts 可测试“每日对阵”。`,
    ));
  }

  if (gaReport.smoke?.status === "skipped") {
    tasks.push(task(
      "P2",
      "QA",
      "有设备时补跑 release GA smoke",
      "当前日报默认跳过真机/模拟器上传烟测；构建、Firebase 配置、上架包变化后跑 npm run ga:daily -- --smoke。",
    ));
  }

  return tasks;
}

function task(priority, area, title, detail) {
  return { priority, area, title, detail };
}

function summarizeInsightStatus(metrics, gaReport, tasks) {
  if (metrics.gaStatus !== "ready") {
    return { level: "blocked", label: "数据未就绪" };
  }
  if (tasks.some((item) => item.priority === "P0")) {
    return { level: "attention", label: "可读但需处理" };
  }
  return { level: "ready", label: "可用于 ASO 复盘" };
}

function renderMarkdown(insight, jsonPath, markdownPath) {
  const evidenceRows = insight.evidence.map((row) => {
    return `| ${row.label} | ${escapeMarkdown(row.value)} | ${escapeMarkdown(row.implication)} |`;
  }).join("\n");
  const taskRows = insight.tasks.map((item) => {
    return `| ${item.priority} | ${item.area} | ${escapeMarkdown(item.title)} | ${escapeMarkdown(item.detail)} |`;
  }).join("\n");

  return `# ASO 数据洞察 - ${insight.runDate}

生成时间：${insight.generatedAt}
数据日期：${insight.reportDate}
整体状态：**${insight.status.label}**

## 结论

- GA 已经作为 ASO 洞察输入：property \`${insight.metrics.gaPropertyId}\`，昨日 ${insight.metrics.activeUsers} active users / ${insight.metrics.eventCount} events。
- 当前最重要的 ASO 缺口不是 GA，而是 Play Console 商店页曝光 -> 安装转化导出；没有它只能判断应用内承接，不能判断商店页转化。
- 封测样本仍小，今天的动作应该聚焦链路和明显断点：首图/短描述是否促发首局、首局是否完成、结果页是否带来第二局。

## 关键证据

| 信号 | 读数 | ASO 含义 |
| --- | --- | --- |
${evidenceRows}

## ASO 待办

| 优先级 | 领域 | 任务 | 说明 |
| --- | --- | --- | --- |
${taskRows || "| P2 | 观察 | 暂无新增任务 | 继续每日跑数，等待更多样本。 |"}

## 推荐接入节奏

1. 每天跑 \`npm run aso:insights\`，它会刷新 GA 日报并生成本文件。
2. 每周一把 Play Console acquisition 导出放到 \`reports/play-console/\` 后再复盘 ASO 转化。
3. 每次改短描述、截图顺序、素材角度时，在本报告里看 \`game_start\`、\`game_end\`、\`second_battle_start\` 是否同向改善。

## 产物

- JSON: ${jsonPath}
- Markdown: ${markdownPath}
- GA source: ${insight.source.gaReportPath}
`;
}

function latestFile(dir, pattern) {
  if (!fs.existsSync(dir)) {
    return "";
  }
  const candidates = fs.readdirSync(dir)
    .filter((file) => pattern.test(file))
    .map((file) => path.join(dir, file))
    .sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);
  return candidates[0] || "";
}

function findPlayConsoleExports() {
  const dirs = [
    path.join(rootDir, "reports", "play-console"),
    path.join(rootDir, "data", "play-console"),
    path.join(rootDir, "exports", "play-console"),
  ];
  return dirs.flatMap((dir) => {
    if (!fs.existsSync(dir)) {
      return [];
    }
    return fs.readdirSync(dir)
      .filter((file) => /\.(csv|tsv|xlsx|json)$/i.test(file))
      .map((file) => path.join(dir, file));
  });
}

function run(command, args, opts = {}) {
  const result = spawnSync(command, args, {
    cwd: rootDir,
    encoding: "utf8",
    stdio: opts.inherit ? "inherit" : "pipe",
  });
  if (result.status !== 0) {
    const output = [result.stdout, result.stderr].filter(Boolean).join("\n");
    throw new Error(`Command failed: ${command} ${args.join(" ")}\n${output}`);
  }
  return result.stdout || "";
}

function ratio(numerator, denominator) {
  if (!denominator) {
    return null;
  }
  return numerator / denominator;
}

function average(values) {
  const clean = values.filter((value) => Number.isFinite(value));
  if (clean.length === 0) {
    return 0;
  }
  return clean.reduce((sum, value) => sum + value, 0) / clean.length;
}

function formatPercent(value) {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return "n/a";
  }
  return `${Math.round(value * 1000) / 10}%`;
}

function escapeMarkdown(text) {
  return String(text || "").replace(/\|/g, "\\|").replace(/\n/g, " ");
}

function printSummary(insight, markdownPath, jsonPath) {
  console.log(`ASO 数据洞察：${insight.status.label}`);
  console.log(`GA 数据：${insight.metrics.gaStatus === "ready" ? "已读取" : "未读取"}`);
  console.log(`昨日 active users / events：${insight.metrics.activeUsers} / ${insight.metrics.eventCount}`);
  console.log(`ASO 待办：${insight.tasks.length}`);
  console.log(`Markdown: ${markdownPath}`);
  console.log(`JSON: ${jsonPath}`);
}
