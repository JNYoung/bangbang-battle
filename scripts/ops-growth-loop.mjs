#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const gaReportDir = path.join(rootDir, "reports", "ga-daily");
const asoInsightDir = path.join(rootDir, "reports", "aso-insights");
const outputDir = path.join(rootDir, "reports", "ops-growth-loop");
const options = parseArgs(process.argv.slice(2));

main();

function main() {
  if (!options.skipRefresh) {
    run("npm", ["run", "aso:insights"], { inherit: true });
  }

  const generatedAt = new Date();
  const runDate = formatLocalDate(generatedAt);
  const gaReportPath = latestFile(gaReportDir, /^ga-daily-\d{4}-\d{2}-\d{2}\.json$/);
  const asoInsightPath = latestFile(asoInsightDir, /^aso-insights-\d{4}-\d{2}-\d{2}\.json$/);
  const gaReport = readJson(gaReportPath);
  const asoInsight = readJson(asoInsightPath);
  const historicalDaily = buildHistoricalDailySeries(gaReport);
  const youtubeManifestPath = latestYoutubeManifest();
  const youtubeManifest = readJson(youtubeManifestPath);
  const playConsoleExports = findPlayConsoleExports();
  const attributionReady = isAttributionReady();

  const report = buildGrowthLoopReport({
    generatedAt,
    runDate,
    gaReport,
    gaReportPath,
    historicalDaily,
    asoInsight,
    asoInsightPath,
    youtubeManifest,
    youtubeManifestPath,
    playConsoleExports,
    attributionReady,
  });

  fs.mkdirSync(outputDir, { recursive: true });
  const jsonPath = path.join(outputDir, `ops-growth-loop-${runDate}.json`);
  const markdownPath = path.join(outputDir, `ops-growth-loop-${runDate}.md`);
  fs.writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`);
  fs.writeFileSync(markdownPath, renderMarkdown(report, jsonPath, markdownPath));

  printSummary(report, markdownPath, jsonPath);
}

function parseArgs(args) {
  return {
    skipRefresh: args.includes("--skip-refresh"),
  };
}

function buildGrowthLoopReport({
  generatedAt,
  runDate,
  gaReport,
  gaReportPath,
  historicalDaily,
  asoInsight,
  asoInsightPath,
  youtubeManifest,
  youtubeManifestPath,
  playConsoleExports,
  attributionReady,
}) {
  const metrics = asoInsight?.metrics || {};
  const events = metrics.events || {};
  const rates = metrics.rates || {};
  const youtubeSummary = summarizeYoutubeManifest(youtubeManifest, youtubeManifestPath, generatedAt);
  const playConsoleReady = playConsoleExports.length > 0;
  const gaReady = metrics.gaStatus === "ready" || gaReport?.gaData?.status === "ready";
  const reportMetrics = {
    activeUsers: metrics.activeUsers || 0,
    eventCount: metrics.eventCount || 0,
    previousAvgActiveUsers: metrics.previousAvgActiveUsers || 0,
    previousAvgEvents: metrics.previousAvgEvents || 0,
    gameInitSuccess: events.gameInitSuccess || 0,
    gameStart: events.gameStart || 0,
    gameEnd: events.gameEnd || 0,
    firstBattleComplete: events.firstBattleComplete || 0,
    secondBattleStart: events.secondBattleStart || 0,
    nextMatchRecommendClick: events.nextMatchRecommendClick || 0,
    nextDayReturn: events.nextDayReturn || 0,
    adEvents: (events.adRequest || 0) + (events.adShow || 0) + (events.adClose || 0),
    initToGameStart: rates.initToGameStart ?? null,
    gameStartToEnd: rates.gameStartToEnd ?? null,
    gameStartToSecondBattle: rates.gameStartToSecondBattle ?? null,
    resultToNextMatchClick: rates.resultToNextMatchClick ?? null,
    activeUserNextDayReturnSignal: rates.activeUserNextDayReturnSignal ?? null,
  };
  const actions = buildActionQueue({
    metrics,
    events,
    rates,
    gaReport,
    asoInsight,
    youtubeSummary,
    playConsoleReady,
    attributionReady,
  });
  const optimizationPlan = buildOptimizationPlan({
    metrics: reportMetrics,
    gaReady,
    gaReport,
    youtubeSummary,
    playConsoleReady,
    attributionReady,
  });
  const chainHealth = buildChainHealth({
    metrics: reportMetrics,
    gaReady,
    gaReport,
    youtubeSummary,
    playConsoleReady,
    attributionReady,
  });
  const growthGates = buildGrowthGates({
    metrics: reportMetrics,
    gaReady,
    playConsoleReady,
    attributionReady,
    youtubeSummary,
  });
  const analysis = buildTimeframeAnalysis({
    metrics: reportMetrics,
    historicalDaily,
    optimizationPlan,
    growthGates,
    youtubeSummary,
    playConsoleReady,
  });

  return {
    generatedAt: generatedAt.toISOString(),
    runDate,
    reportDate: metrics.reportDate || gaReport?.reportDate || "",
    status: summarizeOverallStatus(actions, gaReady),
    sources: {
      gaReportPath,
      asoInsightPath,
      youtubeManifestPath,
      playConsoleExports,
      attributionReady,
    },
    chain: {
      ga: {
        status: gaReady ? "ready" : "blocked",
        propertyId: metrics.gaPropertyId || gaReport?.gaData?.propertyId || "",
        activeUsers: metrics.activeUsers || 0,
        eventCount: metrics.eventCount || 0,
        sevenDayTrend: gaReport?.gaData?.trendRows || [],
        thirtyDayTrend: historicalDaily.rows,
      },
      aso: {
        status: playConsoleReady ? "store_conversion_ready" : "needs_play_console_export",
        tasks: asoInsight?.tasks || [],
      },
      youtube: youtubeSummary,
      gameplay: {
        initToGameStart: rates.initToGameStart ?? null,
        gameStartToEnd: rates.gameStartToEnd ?? null,
        gameStartToSecondBattle: rates.gameStartToSecondBattle ?? null,
        resultToNextMatchClick: rates.resultToNextMatchClick ?? null,
        nextDayReturnSignal: rates.activeUserNextDayReturnSignal ?? null,
      },
    },
    metrics: reportMetrics,
    actions,
    optimizationPlan,
    chainHealth,
    growthGates,
    analysis,
  };
}

function buildHistoricalDailySeries(latestGaReport) {
  const byDate = new Map();
  const files = latestFiles(gaReportDir, /^ga-daily-\d{4}-\d{2}-\d{2}\.json$/);

  for (const file of files) {
    const report = readJson(file);
    addTrendRows(byDate, report?.gaData?.trendRows || []);
    addSingleReportDate(byDate, report);
  }
  addTrendRows(byDate, latestGaReport?.gaData?.trendRows || []);
  addSingleReportDate(byDate, latestGaReport);

  const sorted = [...byDate.values()]
    .filter((row) => row.date)
    .sort((a, b) => a.date.localeCompare(b.date));
  const latestDate = sorted.at(-1)?.date || normalizeGaDate(latestGaReport?.reportDate || latestGaReport?.gaData?.reportDate || "");
  const windowStart = latestDate ? offsetDate(latestDate, -29) : "";
  const rows = sorted
    .filter((row) => !windowStart || row.date >= windowStart)
    .slice(-30);

  return {
    windowDays: 30,
    observedDays: rows.length,
    expectedDays: 30,
    latestDate,
    windowStart,
    rows,
    coverageLabel: `${rows.length}/30 days observed`,
  };
}

function addTrendRows(byDate, rows) {
  for (const row of rows || []) {
    const date = normalizeGaDate(row.date || "");
    if (!date) continue;
    byDate.set(date, {
      date,
      activeUsers: toNumber(row.activeUsers),
      eventCount: toNumber(row.eventCount),
    });
  }
}

function addSingleReportDate(byDate, report) {
  const gaData = report?.gaData || {};
  if (gaData.status !== "ready") return;
  const date = normalizeGaDate(report?.reportDate || gaData.reportDate || "");
  if (!date || byDate.has(date)) return;
  const activeUsers = Math.max(...(gaData.eventRows || []).map((row) => toNumber(row.totalUsers)), 0);
  const eventCount = (gaData.eventRows || []).reduce((sum, row) => sum + toNumber(row.eventCount), 0);
  byDate.set(date, { date, activeUsers, eventCount });
}

function buildActionQueue({
  metrics,
  events,
  rates,
  gaReport,
  youtubeSummary,
  playConsoleReady,
  attributionReady,
}) {
  const actions = [];

  if (metrics.gaStatus !== "ready") {
    actions.push(action("P0", "数据链路", "修复 GA Data API 读取", "没有 GA 聚合事件时，ASO、YouTube 和玩法优化只能靠本地检查，无法判断真实用户行为。"));
  }

  if (!attributionReady) {
    actions.push(action("P0", "归因", "接入 campaign/UTM 透传", "核心漏斗事件需要带 traffic_source、campaign 和 creative_id，才能把 YouTube、ASO 和投放素材与留存行为连接起来。"));
  }

  if (!playConsoleReady) {
    actions.push(action("P0", "ASO 数据", "导入 Play Console store acquisition", "GA 只能解释安装后的承接，缺少商店曝光、访问、安装和关键词数据时，无法判断 ASO 首屏是否提高安装转化。"));
  }

  const adEventCount = (events.adRequest || 0) + (events.adShow || 0) + (events.adClose || 0);
  if (adEventCount > 0) {
    actions.push(action("P0", "合规/商店文案", "核对广告事件来源", `昨日仍有 ${adEventCount} 个广告相关事件；如果来自当前包，需要先修正 Data safety 和商店口径。`));
  }

  if (rates.initToGameStart !== null && rates.initToGameStart < 0.5) {
    actions.push(action("P1", "ASO 首屏", "把商店承诺改成 matchup 行动", `game_start / game_init_success 只有 ${formatPercent(rates.initToGameStart)}，优先让首图、短描述和开局入口说明“选对阵 -> 立即开战”。`));
  }

  if (rates.gameStartToEnd !== null && rates.gameStartToEnd < 0.55) {
    actions.push(action("P1", "玩法体验", "先修首局完成率", `game_end / game_start 为 ${formatPercent(rates.gameStartToEnd)}，需要检查首局时长、战斗可读性、性能和结算到达。`));
  }

  if ((events.secondBattleStart || 0) === 0 || (events.nextMatchRecommendClick || 0) === 0) {
    actions.push(action("P1", "留存循环", "强化 verdict -> counter -> second battle", "二局和推荐下一局为 0 时，ASO/Shorts 可以继续讲 matchup，但产品内结算页必须把这个承诺接住。"));
  }

  if (!youtubeSummary.manifestPath) {
    actions.push(action("P1", "YouTube", "生成每日 Shorts 候选", "没有可用 YouTube manifest，先跑 npm run ops:daily-youtube 产出素材、标题、描述和剪辑提示。"));
  } else if (youtubeSummary.ageDays > 3) {
    actions.push(action("P1", "YouTube", "刷新 Shorts 素材池", `最新 YouTube manifest 已经 ${youtubeSummary.ageDays} 天前生成，建议重新跑每日候选并用 UTM 链接回流。`));
  } else if (youtubeSummary.selectedClipCount < 3) {
    actions.push(action("P2", "YouTube", "补足 3 条每日候选", `当前只找到 ${youtubeSummary.selectedClipCount} 条候选，日更素材池偏薄。`));
  }

  if ((events.nextDayReturn || 0) > 0) {
    actions.push(action("P2", "留存素材", "保留 daily matchup / daily champion 方向", `next_day_return 有 ${events.nextDayReturn} 次，说明回访事件已可读；后续用每日对阵素材测试 D1。`));
  }

  if (gaReport?.smoke?.status === "skipped") {
    actions.push(action("P2", "QA", "构建变化后补跑 release GA smoke", "有 Android 设备时执行 npm run ga:daily -- --smoke，确认真实上传链路。"));
  }

  return actions.sort((a, b) => priorityRank(a.priority) - priorityRank(b.priority));
}

function summarizeYoutubeManifest(manifest, manifestPath, now) {
  if (!manifest) {
    return {
      status: "missing",
      manifestPath: "",
      runId: "",
      generatedAt: "",
      ageDays: null,
      clipCount: 0,
      selectedClipCount: 0,
      topAngles: [],
    };
  }

  const generatedAt = manifest.generatedAt || "";
  const ageDays = generatedAt ? Math.max(0, Math.floor((now.getTime() - Date.parse(generatedAt)) / (24 * 60 * 60 * 1000))) : null;
  const clips = Array.isArray(manifest.clips) ? manifest.clips : [];
  const selectedClips = clips.filter((clip) => clip.selected || clip.selectionRank || clip.youtube);
  const angleCounts = new Map();
  for (const clip of clips) {
    const tags = Array.isArray(clip.recordingTags) ? clip.recordingTags : [];
    const angle = clip.topic?.angle || tags[0] || "unknown";
    angleCounts.set(angle, (angleCounts.get(angle) || 0) + 1);
  }

  return {
    status: ageDays !== null && ageDays <= 3 ? "fresh" : "stale",
    manifestPath,
    runId: manifest.runId || "",
    generatedAt,
    ageDays,
    clipCount: clips.length,
    selectedClipCount: selectedClips.length,
    topAngles: [...angleCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([angle, count]) => ({ angle, count })),
  };
}

function summarizeOverallStatus(actions, gaReady) {
  if (!gaReady || actions.some((item) => item.priority === "P0")) {
    return { level: "attention", label: "需要先补数据/合规阻塞" };
  }
  if (actions.some((item) => item.priority === "P1")) {
    return { level: "iterate", label: "可优化但不宜放量" };
  }
  return { level: "ready", label: "可进入小额学习" };
}

function buildOptimizationPlan({
  metrics,
  gaReady,
  gaReport,
  youtubeSummary,
  playConsoleReady,
  attributionReady,
}) {
  const plan = [];

  if (!gaReady) {
    plan.push(planItem({
      id: "restore-ga-readout",
      priority: "P0",
      lane: "数据链路",
      title: "恢复 GA 聚合事件读取",
      status: "blocked",
      hypothesis: "没有稳定 GA 读数时，所有获客和留存判断都会退化成素材猜测。",
      evidence: ["GA daily 未处于 ready 状态"],
      actions: ["修复 GA Data API 配置", "补跑 ga:daily 并确认核心事件返回"],
      validationMetrics: ["ga_status=ready", "核心事件字段非空"],
      successCriteria: "连续 2 天 GA daily ready，且核心漏斗事件可读。",
      nextReview: "修复当天复盘",
      impactScore: 5,
      confidenceScore: 5,
      urgencyScore: 5,
      priorityScore: 100,
    }));
  }

  if (!playConsoleReady) {
    plan.push(planItem({
      id: "import-play-acquisition",
      priority: "P0",
      lane: "ASO 数据",
      title: "导入 Play Console store acquisition",
      status: "blocked",
      hypothesis: "ASO 首图和文案是否有效，必须通过商店曝光、访问、安装和来源数据验证。",
      evidence: ["未发现 Play Console acquisition 导出", "GA 只能解释安装后的承接"],
      actions: ["从 Play Console 导出 acquisition / store performance", "放入 reports/play-console/ 后重跑日报"],
      validationMetrics: ["store listing visitors", "installers", "visitor-to-installer rate", "country/source/search breakdown"],
      successCriteria: "报告能展示商店曝光到安装转化，并和 GA 开局漏斗并排读。",
      nextReview: "导入后下一次日报",
      impactScore: 5,
      confidenceScore: 4,
      urgencyScore: 5,
      priorityScore: 96,
    }));
  }

  if (!attributionReady) {
    plan.push(planItem({
      id: "campaign-attribution",
      priority: "P0",
      lane: "归因",
      title: "接入 campaign/UTM 透传",
      status: "blocked",
      hypothesis: "素材、来源和玩法表现必须在同一条 GA 漏斗里关联，才能决定继续哪类创意。",
      evidence: ["Campaign attribution 代码或文档未就绪"],
      actions: ["保存 UTM / creative_id", "附加到核心漏斗事件", "为 YouTube 和 ASO 链接统一命名"],
      validationMetrics: ["traffic_source", "traffic_campaign", "creative_id"],
      successCriteria: "核心漏斗事件携带来源和素材字段。",
      nextReview: "下一次 GA daily",
      impactScore: 5,
      confidenceScore: 4,
      urgencyScore: 5,
      priorityScore: 94,
    }));
  }

  if (metrics.adEvents > 0) {
    plan.push(planItem({
      id: "audit-ad-events",
      priority: "P0",
      lane: "合规/商店文案",
      title: "核对广告事件来源",
      status: "needs_decision",
      hypothesis: "如果当前包仍触发广告事件，商店 Data safety 和用户体验承诺需要先修正。",
      evidence: [`昨日广告相关事件 ${metrics.adEvents} 个`, "广告事件高于 game_start / game_end"],
      actions: ["确认事件来自旧包、测试包还是当前包", "若来自当前包，修正广告逻辑或商店披露"],
      validationMetrics: ["ad_request", "ad_show", "ad_close", "package/release source"],
      successCriteria: "当前发布包的广告事件来源解释清楚，且商店披露与真实行为一致。",
      nextReview: "下一次 release 或 GA smoke 后",
      impactScore: 5,
      confidenceScore: 4,
      urgencyScore: 5,
      priorityScore: 92,
    }));
  }

  if (metrics.initToGameStart !== null && metrics.initToGameStart < 0.5) {
    plan.push(planItem({
      id: "activation-matchup-promise",
      priority: "P1",
      lane: "ASO 首屏/开局",
      title: "把首屏承诺改成 matchup 行动",
      status: "ready_to_test",
      hypothesis: "用户打开后没有立刻理解“选对阵 -> 开战”，导致首局启动偏低。",
      evidence: [`game_start / game_init_success = ${formatPercent(metrics.initToGameStart)}`, "当前开局率低于 50% 继续线"],
      actions: ["首图改成对阵判断题", "短描述强调立即开战", "首页 CTA 与商店文案统一"],
      validationMetrics: ["game_start / game_init_success", "store visitors -> installers"],
      successCriteria: "开局率提升到 50% 以上，且商店安装转化不下降。",
      nextReview: "改文案/截图后 48-72 小时",
      impactScore: 4,
      confidenceScore: 4,
      urgencyScore: 4,
      priorityScore: 84,
    }));
  }

  if ((metrics.secondBattleStart || 0) === 0 || (metrics.nextMatchRecommendClick || 0) === 0) {
    plan.push(planItem({
      id: "result-counter-loop",
      priority: "P1",
      lane: "留存循环",
      title: "强化 verdict -> counter -> second battle",
      status: "ready_to_test",
      hypothesis: "首局后没有足够强的反制动机，导致二局和下一局点击为 0。",
      evidence: [
        `second_battle_start / game_start = ${formatPercent(metrics.gameStartToSecondBattle)}`,
        `next_match_click / game_end = ${formatPercent(metrics.resultToNextMatchClick)}`,
      ],
      actions: ["结果页突出 winner/verdict", "新增 Try the counter 或 next matchup 按钮", "截图 #3 展示结算反制"],
      validationMetrics: ["second_battle_start / game_start", "next_match_recommend_click / game_end"],
      successCriteria: "二局启动和 next-match 点击至少达到 20%。",
      nextReview: "下一版玩法或截图更新后",
      impactScore: 5,
      confidenceScore: 3,
      urgencyScore: 4,
      priorityScore: 82,
    }));
  }

  if (!youtubeSummary.manifestPath || youtubeSummary.ageDays > 3 || youtubeSummary.selectedClipCount < 3) {
    const evidence = youtubeSummary.manifestPath
      ? [`YouTube manifest 年龄 ${youtubeSummary.ageDays ?? "n/a"} 天`, `候选素材 ${youtubeSummary.selectedClipCount}/${youtubeSummary.clipCount}`]
      : ["未发现 YouTube manifest"];
    plan.push(planItem({
      id: "refresh-youtube-shorts",
      priority: "P1",
      lane: "YouTube",
      title: "刷新 Shorts 素材池并接回 GA",
      status: "ready_to_run",
      hypothesis: "稳定的每日 Shorts 候选能更快发现高留存 hook，再反哺 ASO 和投放素材。",
      evidence,
      actions: ["运行 npm run ops:daily-youtube", "每天选 1-3 条上传", "标题/描述链接带 UTM 和 creative_id"],
      validationMetrics: ["YouTube audience retention", "clicks by creative_id", "game_start by creative_id"],
      successCriteria: "连续 3 天每天至少 3 条候选，且上传素材能在 GA 中归因。",
      nextReview: "每 3 天复盘一次素材角度",
      impactScore: 4,
      confidenceScore: 3,
      urgencyScore: 4,
      priorityScore: 76,
    }));
  }

  if ((metrics.nextDayReturn || 0) > 0) {
    plan.push(planItem({
      id: "daily-return-hook",
      priority: "P2",
      lane: "留存素材",
      title: "保留 daily matchup / daily champion 方向",
      status: "watch",
      hypothesis: "每日对阵和每日冠军能成为轻量回访理由，但现在样本不足。",
      evidence: [`next_day_return = ${metrics.nextDayReturn}`, `next_day_return / active_users = ${formatPercent(metrics.activeUserNextDayReturnSignal)}`],
      actions: ["用 Shorts 和商店截图测试 daily champion 文案", "等待 Play cohort 或更大 GA 样本后再判断"],
      validationMetrics: ["D1 cohort retention", "next_day_return by creative_id"],
      successCriteria: "至少一个素材角度带来稳定次日回访信号。",
      nextReview: "样本扩大到 100+ active users 或 Play cohort 可读后",
      impactScore: 3,
      confidenceScore: 2,
      urgencyScore: 2,
      priorityScore: 55,
    }));
  }

  if (gaReport?.smoke?.status === "skipped") {
    plan.push(planItem({
      id: "release-ga-smoke",
      priority: "P2",
      lane: "QA",
      title: "补跑 release GA smoke",
      status: "waiting_for_device",
      hypothesis: "只有 release 包真实上传通过，日报中的漏斗判断才适合用于版本决策。",
      evidence: ["GA smoke status=skipped"],
      actions: ["有 Android 设备时运行 npm run ga:daily -- --smoke", "确认 release 事件进入 GA"],
      validationMetrics: ["smoke status", "release package event upload"],
      successCriteria: "release GA smoke 通过，且报告不再标记 skipped。",
      nextReview: "下一次有设备时",
      impactScore: 2,
      confidenceScore: 4,
      urgencyScore: 2,
      priorityScore: 45,
    }));
  }

  return plan.sort((a, b) => priorityRank(a.priority) - priorityRank(b.priority) || b.priorityScore - a.priorityScore);
}

function buildChainHealth({
  metrics,
  gaReady,
  gaReport,
  youtubeSummary,
  playConsoleReady,
  attributionReady,
}) {
  return [
    healthLane({
      lane: "GA 事件读数",
      status: gaReady ? "usable" : "blocked",
      evidenceScore: gaReady ? 80 : 20,
      actionabilityScore: attributionReady ? 75 : 40,
      experienceScore: metrics.initToGameStart !== null ? 55 : 30,
      scaleScore: gaReport?.smoke?.status === "skipped" ? 45 : 65,
      summary: gaReady ? "核心事件可读，但 release smoke 仍建议补跑。" : "GA 聚合事件不可稳定读取。",
      nextAction: gaReport?.smoke?.status === "skipped" ? "补跑 release GA smoke" : "继续每日跑数",
    }),
    healthLane({
      lane: "商店转化",
      status: playConsoleReady ? "usable" : "blocked",
      evidenceScore: playConsoleReady ? 75 : 15,
      actionabilityScore: playConsoleReady ? 70 : 30,
      experienceScore: metrics.initToGameStart !== null && metrics.initToGameStart >= 0.5 ? 65 : 40,
      scaleScore: playConsoleReady ? 60 : 15,
      summary: playConsoleReady ? "商店转化数据已可进入复盘。" : "缺 Play Console acquisition，ASO 只能做安装后承接判断。",
      nextAction: playConsoleReady ? "按来源/国家看转化" : "导入 Play Console acquisition",
    }),
    healthLane({
      lane: "YouTube 素材",
      status: youtubeSummary.status,
      evidenceScore: youtubeSummary.manifestPath ? 45 : 10,
      actionabilityScore: youtubeSummary.selectedClipCount >= 3 ? 65 : 35,
      experienceScore: 45,
      scaleScore: youtubeSummary.ageDays !== null && youtubeSummary.ageDays <= 3 ? 55 : 25,
      summary: youtubeSummary.manifestPath ? "素材池存在但已偏旧，需要日更候选。" : "还没有 YouTube 候选素材。",
      nextAction: "运行 npm run ops:daily-youtube",
    }),
    healthLane({
      lane: "首局体验",
      status: metrics.initToGameStart !== null && metrics.initToGameStart >= 0.5 ? "usable" : "weak",
      evidenceScore: metrics.gameInitSuccess > 0 ? 65 : 20,
      actionabilityScore: 70,
      experienceScore: metrics.initToGameStart !== null ? Math.round(metrics.initToGameStart * 100) : 20,
      scaleScore: metrics.activeUsers >= 100 ? 60 : 25,
      summary: `开局率 ${formatPercent(metrics.initToGameStart)}，先修首屏承诺和开局入口。`,
      nextAction: "改 ASO 首图/短描述/首页 CTA",
    }),
    healthLane({
      lane: "二局留存",
      status: metrics.gameStartToSecondBattle > 0 ? "learning" : "blocked",
      evidenceScore: metrics.gameStart > 0 ? 55 : 20,
      actionabilityScore: 70,
      experienceScore: metrics.gameStartToSecondBattle !== null ? Math.round(metrics.gameStartToSecondBattle * 100) : 0,
      scaleScore: metrics.nextDayReturn > 0 ? 35 : 20,
      summary: "二局和 next-match 还没成立，结算页需要承担留存动作。",
      nextAction: "强化 verdict/counter/next matchup",
    }),
  ];
}

function buildGrowthGates({
  metrics,
  gaReady,
  playConsoleReady,
  attributionReady,
  youtubeSummary,
}) {
  const blockers = [];
  if (!gaReady) blockers.push("GA daily 未 ready");
  if (!playConsoleReady) blockers.push("缺 Play Console acquisition");
  if (!attributionReady) blockers.push("缺 campaign/UTM 归因");
  if (metrics.adEvents > 0) blockers.push(`广告相关事件 ${metrics.adEvents} 个待解释`);
  if ((metrics.gameStartToSecondBattle || 0) <= 0) blockers.push("二局启动为 0");

  const hold = blockers.length > 0 || metrics.activeUsers < 100;
  return {
    budget: {
      status: hold ? "hold" : "learning",
      recommendation: hold ? "维持 USD 0-10/day 学习，不放量" : "可以进入小额学习预算",
      rationale: blockers.length ? blockers : ["样本量仍小，先用小预算验证素材和玩法承接"],
      goWhen: [
        "Play Console acquisition 已导入并能读 store visitors -> installers",
        "广告事件来源解释清楚，商店披露与真实行为一致",
        "game_start / game_init_success >= 50%",
        "second_battle_start / game_start >= 20%",
        "至少 3 条新鲜 Shorts 候选能按 creative_id 回流 GA",
      ],
      holdWhen: [
        "只有安装后 GA，没有商店曝光到安装转化",
        "YouTube manifest 超过 3 天未刷新",
        "DAU 仍低于 100，只能判断方向",
      ],
      stopWhen: [
        "两轮素材测试后开局率仍低于 35%",
        "二局启动持续为 0 且完赛率下降",
        "CPI 或商店转化明显恶化，同时 D1 没有改善信号",
      ],
    },
    youtubeFreshness: {
      status: youtubeSummary.ageDays !== null && youtubeSummary.ageDays <= 3 ? "fresh" : "stale",
      target: "每天 3 条候选，每 3 天复盘 hook 和 audience retention",
    },
  };
}

function buildTimeframeAnalysis({
  metrics,
  historicalDaily,
  optimizationPlan,
  growthGates,
  youtubeSummary,
  playConsoleReady,
}) {
  const dailyRows = historicalDaily.rows || [];
  const weeklyRows = aggregateTimeSeries(dailyRows, "week").slice(-4);
  const monthlyRows = aggregateTimeSeries(dailyRows, "month").slice(-3);
  const dailyTrend = summarizeSeriesTrend(dailyRows);

  return {
    daily: {
      id: "daily_30d",
      label: "Daily analysis",
      windowDays: 30,
      observedDays: historicalDaily.observedDays,
      expectedDays: historicalDaily.expectedDays,
      coverageLabel: historicalDaily.coverageLabel,
      trendRows: dailyRows,
      summary: buildDailySummary(dailyTrend, historicalDaily),
      trend: dailyTrend,
      operatingQuestions: [
        "最近 30 天 DAU 和事件是否稳定，还是只是在小样本内波动？",
        "game_start / game_init_success 是否随 ASO 首屏和首页 CTA 变化改善？",
        "second_battle_start 和 next_match_click 是否从 0 变成可读信号？",
      ],
      nextActions: [
        "每天重跑 npm run ops:growth-loop 和 npm run ops:growth-html",
        "导入 Play Console acquisition 后把商店转化与安装后开局并排看",
        "每条 YouTube/ASO 素材都带 creative_id，按素材角度看开局和二局",
      ],
    },
    weekly: {
      id: "weekly_ab",
      label: "Weekly analysis",
      windowWeeks: 4,
      observedWeeks: weeklyRows.length,
      rows: weeklyRows,
      summary: buildWeeklySummary(weeklyRows, playConsoleReady),
      experiments: buildWeeklyExperiments({ metrics, optimizationPlan, youtubeSummary, playConsoleReady }),
      reviewCadence: "每周固定复盘一次，保留赢家，停止明显输的处理组，新增 1-2 个变体。",
    },
    monthly: {
      id: "monthly_strategy_ab",
      label: "Monthly analysis",
      windowMonths: 3,
      observedMonths: monthlyRows.length,
      rows: monthlyRows,
      summary: buildMonthlySummary(monthlyRows, growthGates),
      experiments: buildMonthlyExperiments({ metrics, growthGates, playConsoleReady }),
      reviewCadence: "每月只做方向性 A/B：定位、渠道组合、留存机制和预算闸门，不用小样本强行判显著。",
    },
  };
}

function buildDailySummary(trend, historicalDaily) {
  if (!historicalDaily.observedDays) {
    return "30 天日趋势暂无可用 GA 聚合数据，先补 GA daily。";
  }
  const direction = trend.activeUsersDelta >= 0 ? "略有上升" : "略有下降";
  return `最近 30 天窗口实际观测 ${historicalDaily.coverageLabel}；当前样本不足，DAU ${direction}，先用作方向判断，不作为放量依据。`;
}

function buildWeeklySummary(rows, playConsoleReady) {
  if (!rows.length) {
    return "周分析暂无可用日趋势，先积累至少 2 个自然周。";
  }
  const last = rows.at(-1);
  const storeNote = playConsoleReady ? "可结合商店转化做周复盘。" : "仍缺 Play Console acquisition，周复盘只能看安装后承接。";
  return `最近可读周为 ${last.periodLabel}，平均 DAU ${round1(last.avgActiveUsers)}，总事件 ${last.eventCount}；${storeNote}`;
}

function buildMonthlySummary(rows, growthGates) {
  if (!rows.length) {
    return "月分析暂无足够历史，先把日报和周实验稳定跑起来。";
  }
  const gate = growthGates?.budget?.status || "hold";
  return `月度策略当前仍是 ${gate.toUpperCase()}；月分析重点不是判定显著性，而是选择下月主定位、渠道组合和留存机制。`;
}

function buildWeeklyExperiments({ metrics, optimizationPlan, youtubeSummary, playConsoleReady }) {
  return [
    abExperiment({
      id: "weekly_aso_matchup_first_screen",
      cadence: "weekly",
      lane: "ASO",
      title: "首图承诺 A/B：自动战斗 vs matchup prediction",
      variants: ["A: 自动战斗/职业竞技场", "B: 选对阵 -> 猜胜负 -> 立即开战"],
      hypothesis: "更明确的 matchup 判断题能提高商店安装后的开局率。",
      primaryMetric: playConsoleReady ? "store visitors -> installers" : "game_start / game_init_success",
      guardrailMetric: "game_end / game_start",
      minimumRun: "至少 7 天；如果 Play acquisition 缺失，只记录学习结论，不宣布赢家。",
      status: metrics.initToGameStart < 0.5 ? "ready_to_run" : "watch",
      sourcePlan: "Play Console acquisition + GA creative_id",
      priorityScore: scoreForExperiment("activation-matchup-promise", optimizationPlan, 80),
    }),
    abExperiment({
      id: "weekly_result_counter_loop",
      cadence: "weekly",
      lane: "玩法留存",
      title: "结果页 A/B：普通结算 vs counter challenge",
      variants: ["A: winner/verdict 结算", "B: winner/verdict + Try the counter"],
      hypothesis: "反制挑战能把首局完成用户带入第二局。",
      primaryMetric: "second_battle_start / game_start",
      guardrailMetric: "game_end / game_start",
      minimumRun: "至少 7 天或 50 次 game_start；低于样本量只看方向。",
      status: metrics.gameStartToSecondBattle > 0 ? "learning" : "ready_to_run",
      sourcePlan: "GA result action events",
      priorityScore: scoreForExperiment("result-counter-loop", optimizationPlan, 78),
    }),
    abExperiment({
      id: "weekly_youtube_hook",
      cadence: "weekly",
      lane: "YouTube",
      title: "Shorts hook A/B：先给结果 vs 先问谁赢",
      variants: ["A: 结局反转/赢家先露出", "B: 3 秒内提出谁会赢的问题"],
      hypothesis: "问题式 hook 更适合把观看兴趣带回游戏开局。",
      primaryMetric: "YouTube audience retention + GA game_start by creative_id",
      guardrailMetric: "clicks without game_start",
      minimumRun: "每周至少 3 条候选，连续 3 天上传后复盘。",
      status: youtubeSummary.ageDays !== null && youtubeSummary.ageDays <= 3 ? "learning" : "ready_to_run",
      sourcePlan: "YouTube key moments + UTM creative_id",
      priorityScore: scoreForExperiment("refresh-youtube-shorts", optimizationPlan, 72),
    }),
  ].sort((a, b) => b.priorityScore - a.priorityScore);
}

function buildMonthlyExperiments({ metrics, growthGates, playConsoleReady }) {
  return [
    abExperiment({
      id: "monthly_positioning",
      cadence: "monthly",
      lane: "定位",
      title: "主定位 A/B：斗蛐蛐魔性 vs 策略反制",
      variants: ["A: 魔性自动对战/斗蛐蛐", "B: 猜胜负 + counter strategy"],
      hypothesis: "月度层面要选出更适合 ASO、Shorts 和投放复用的统一承诺。",
      primaryMetric: playConsoleReady ? "installers + game_start by positioning" : "game_start by creative_id",
      guardrailMetric: "D1 / next_day_return",
      minimumRun: "一个自然月，至少覆盖 4 个周实验。",
      status: "planned",
      sourcePlan: "ASO treatment + YouTube series + campaign_id",
      priorityScore: 78,
    }),
    abExperiment({
      id: "monthly_retention_hook",
      cadence: "monthly",
      lane: "留存机制",
      title: "留存机制 A/B：daily matchup vs daily champion",
      variants: ["A: 每日对阵", "B: 每日冠军/连胜挑战"],
      hypothesis: "轻量每日理由可能比复杂养成更适合当前小样本阶段。",
      primaryMetric: "next_day_return / active_users",
      guardrailMetric: "game_start / game_init_success",
      minimumRun: "一个自然月或至少 100 active users 后再判断。",
      status: metrics.nextDayReturn > 0 ? "watch" : "planned",
      sourcePlan: "GA next_day_return + creative_id",
      priorityScore: 62,
    }),
    abExperiment({
      id: "monthly_budget_gate",
      cadence: "monthly",
      lane: "预算",
      title: "预算闸门 A/B：organic-only vs USD 0-10/day learning",
      variants: ["A: 只跑自然 Shorts/ASO", "B: USD 0-10/day 小额学习"],
      hypothesis: "在 Play acquisition 和二局循环未清前，小预算只应用来学习素材，不应该用来放量。",
      primaryMetric: "cost per game_start and second_battle_start",
      guardrailMetric: "growthGates.status",
      minimumRun: "满足 Go 条件前保持 Hold；每月复盘是否进入下一档预算。",
      status: growthGates?.budget?.status || "hold",
      sourcePlan: "ad spend export + GA UTM + Play acquisition",
      priorityScore: 58,
    }),
  ].sort((a, b) => b.priorityScore - a.priorityScore);
}

function abExperiment({
  id,
  cadence,
  lane,
  title,
  variants,
  hypothesis,
  primaryMetric,
  guardrailMetric,
  minimumRun,
  status,
  sourcePlan,
  priorityScore,
}) {
  return {
    id,
    cadence,
    lane,
    title,
    variants,
    hypothesis,
    primaryMetric,
    guardrailMetric,
    minimumRun,
    status,
    sourcePlan,
    priorityScore,
  };
}

function scoreForExperiment(planId, optimizationPlan, fallback) {
  return optimizationPlan.find((item) => item.id === planId)?.priorityScore || fallback;
}

function aggregateTimeSeries(rows, grain) {
  const groups = new Map();
  for (const row of rows || []) {
    const period = grain === "week" ? weekKey(row.date) : monthKey(row.date);
    if (!period) continue;
    const current = groups.get(period.key) || {
      period: period.key,
      periodLabel: period.label,
      startDate: period.startDate,
      endDate: period.endDate,
      observedDays: 0,
      activeUsersTotal: 0,
      eventCount: 0,
      maxActiveUsers: 0,
    };
    current.observedDays += 1;
    current.activeUsersTotal += toNumber(row.activeUsers);
    current.eventCount += toNumber(row.eventCount);
    current.maxActiveUsers = Math.max(current.maxActiveUsers, toNumber(row.activeUsers));
    groups.set(period.key, current);
  }
  return [...groups.values()]
    .map((row) => ({
      ...row,
      avgActiveUsers: row.observedDays ? row.activeUsersTotal / row.observedDays : 0,
      eventsPerActiveUser: row.activeUsersTotal ? row.eventCount / row.activeUsersTotal : 0,
    }))
    .sort((a, b) => a.period.localeCompare(b.period));
}

function summarizeSeriesTrend(rows) {
  if (!rows.length) {
    return {
      firstDate: "",
      lastDate: "",
      firstActiveUsers: 0,
      lastActiveUsers: 0,
      activeUsersDelta: 0,
      activeUsersPctChange: null,
      avgActiveUsers: 0,
      totalEvents: 0,
    };
  }
  const first = rows[0];
  const last = rows.at(-1);
  const activeUsersDelta = toNumber(last.activeUsers) - toNumber(first.activeUsers);
  const activeUsersPctChange = first.activeUsers ? activeUsersDelta / first.activeUsers : null;
  return {
    firstDate: first.date,
    lastDate: last.date,
    firstActiveUsers: toNumber(first.activeUsers),
    lastActiveUsers: toNumber(last.activeUsers),
    activeUsersDelta,
    activeUsersPctChange,
    avgActiveUsers: rows.reduce((sum, row) => sum + toNumber(row.activeUsers), 0) / rows.length,
    totalEvents: rows.reduce((sum, row) => sum + toNumber(row.eventCount), 0),
  };
}

function planItem({
  id,
  priority,
  lane,
  title,
  status,
  hypothesis,
  evidence,
  actions,
  validationMetrics,
  successCriteria,
  nextReview,
  impactScore,
  confidenceScore,
  urgencyScore,
  priorityScore,
}) {
  return {
    id,
    priority,
    lane,
    title,
    status,
    hypothesis,
    evidence,
    actions,
    validationMetrics,
    successCriteria,
    nextReview,
    impactScore,
    confidenceScore,
    urgencyScore,
    priorityScore,
  };
}

function healthLane({
  lane,
  status,
  evidenceScore,
  actionabilityScore,
  experienceScore,
  scaleScore,
  summary,
  nextAction,
}) {
  return {
    lane,
    status,
    evidenceScore,
    actionabilityScore,
    experienceScore,
    scaleScore,
    healthScore: Math.round((evidenceScore + actionabilityScore + experienceScore + scaleScore) / 4),
    summary,
    nextAction,
  };
}

function renderMarkdown(report, jsonPath, markdownPath) {
  const m = report.metrics;
  const sourceLines = [
    ["GA 日报", report.sources.gaReportPath],
    ["ASO 洞察", report.sources.asoInsightPath],
    ["YouTube manifest", report.sources.youtubeManifestPath || "未发现"],
  ].map(([label, value]) => `- ${label}: ${value}`).join("\n");
  const actionRows = report.actions.map((item) => {
    return `| ${item.priority} | ${item.area} | ${escapeMarkdown(item.title)} | ${escapeMarkdown(item.detail)} |`;
  }).join("\n");
  const topAction = report.actions[0];
  const trendRows = (report.chain.ga.sevenDayTrend || []).map((row) => {
    return `| ${row.date || ""} | ${row.activeUsers || 0} | ${row.eventCount || 0} |`;
  }).join("\n");
  const planRows = (report.optimizationPlan || []).map((item) => {
    return `| ${item.priority} | ${escapeMarkdown(item.lane)} | ${escapeMarkdown(item.title)} | ${escapeMarkdown(item.hypothesis)} | ${escapeMarkdown(item.actions?.[0] || "")} | ${escapeMarkdown(item.successCriteria)} |`;
  }).join("\n");
  const healthRows = (report.chainHealth || []).map((item) => {
    return `| ${escapeMarkdown(item.lane)} | ${item.healthScore} | ${escapeMarkdown(item.status)} | ${escapeMarkdown(item.summary)} | ${escapeMarkdown(item.nextAction)} |`;
  }).join("\n");
  const gate = report.growthGates?.budget || {};
  const goWhen = (gate.goWhen || []).map((item) => `- ${item}`).join("\n");
  const holdWhen = (gate.holdWhen || []).map((item) => `- ${item}`).join("\n");
  const stopWhen = (gate.stopWhen || []).map((item) => `- ${item}`).join("\n");
  const daily = report.analysis?.daily || {};
  const weekly = report.analysis?.weekly || {};
  const monthly = report.analysis?.monthly || {};
  const dailyTrendRows = (daily.trendRows || []).slice(-30).map((row) => {
    return `| ${row.date || ""} | ${row.activeUsers || 0} | ${row.eventCount || 0} |`;
  }).join("\n");
  const weeklyRows = (weekly.rows || []).map((row) => {
    return `| ${row.periodLabel || row.period} | ${row.observedDays || 0} | ${round1(row.avgActiveUsers)} | ${row.eventCount || 0} | ${round1(row.eventsPerActiveUser)} |`;
  }).join("\n");
  const monthlyRows = (monthly.rows || []).map((row) => {
    return `| ${row.periodLabel || row.period} | ${row.observedDays || 0} | ${round1(row.avgActiveUsers)} | ${row.eventCount || 0} | ${round1(row.eventsPerActiveUser)} |`;
  }).join("\n");
  const weeklyExperimentRows = (weekly.experiments || []).map((item) => {
    return `| ${escapeMarkdown(item.lane)} | ${escapeMarkdown(item.title)} | ${escapeMarkdown(item.variants.join(" / "))} | ${escapeMarkdown(item.primaryMetric)} | ${escapeMarkdown(item.status)} |`;
  }).join("\n");
  const monthlyExperimentRows = (monthly.experiments || []).map((item) => {
    return `| ${escapeMarkdown(item.lane)} | ${escapeMarkdown(item.title)} | ${escapeMarkdown(item.variants.join(" / "))} | ${escapeMarkdown(item.primaryMetric)} | ${escapeMarkdown(item.status)} |`;
  }).join("\n");

  return `# 运营闭环日报 - ${report.runDate}

生成时间：${report.generatedAt}
数据日期：${report.reportDate || "unknown"}
整体状态：**${report.status.label}**

## 今日第一动作

${topAction ? `**${topAction.priority} / ${topAction.area}: ${topAction.title}**\n\n${topAction.detail}` : "暂无阻塞动作；继续观察核心漏斗。"}

## 链路读数

| 指标 | 读数 |
| --- | ---: |
| Active users | ${m.activeUsers} |
| Events | ${m.eventCount} |
| game_start / game_init_success | ${formatPercent(m.initToGameStart)} |
| game_end / game_start | ${formatPercent(m.gameStartToEnd)} |
| second_battle_start / game_start | ${formatPercent(m.gameStartToSecondBattle)} |
| next_match_click / game_end | ${formatPercent(m.resultToNextMatchClick)} |
| next_day_return / active_users | ${formatPercent(m.activeUserNextDayReturnSignal)} |
| 广告相关事件 | ${m.adEvents} |

## 行动队列

| 优先级 | 领域 | 动作 | 原因 |
| --- | --- | --- | --- |
${actionRows || "| P2 | 观察 | 继续每日跑数 | 暂无新增断点。 |"}

## 优化方向与验证计划

| 优先级 | 链路 | 优化方向 | 假设 | 第一动作 | 成功判据 |
| --- | --- | --- | --- | --- | --- |
${planRows || "| P2 | 观察 | 暂无新增优化方向 | 等待更多样本 | 继续每日跑数 | 核心指标稳定 |"}

## 链路健康

| 链路 | Health score | 状态 | 读数解释 | 下一步 |
| --- | ---: | --- | --- | --- |
${healthRows || "| n/a | 0 | n/a | 暂无 | 继续跑数 |"}

## Go / Hold / Stop 放量门槛

- 当前建议：**${gate.recommendation || "继续小额学习"}**
- 状态：${gate.status || "unknown"}

Go 条件：
${goWhen || "- 暂无"}

Hold 条件：
${holdWhen || "- 暂无"}

Stop 条件：
${stopWhen || "- 暂无"}

## 三维度数据分析

### 按日分析：最近 30 天趋势

${daily.summary || "暂无日趋势。"}

| 日期 | 活跃用户 | 事件数 |
| --- | ---: | ---: |
${dailyTrendRows || "| n/a | 0 | 0 |"}

日分析动作：
${(daily.nextActions || []).map((item) => `- ${item}`).join("\n") || "- 继续每日跑数"}

### 按周分析：持续 A/B

${weekly.summary || "暂无周分析。"}

| 周期 | 观测天数 | Avg DAU | Events | Events / active user |
| --- | ---: | ---: | ---: | ---: |
${weeklyRows || "| n/a | 0 | 0 | 0 | 0 |"}

| 链路 | A/B 实验 | 变体 | 主指标 | 状态 |
| --- | --- | --- | --- | --- |
${weeklyExperimentRows || "| n/a | 暂无 | n/a | n/a | n/a |"}

### 按月分析：方向性 A/B

${monthly.summary || "暂无月分析。"}

| 月份 | 观测天数 | Avg DAU | Events | Events / active user |
| --- | ---: | ---: | ---: | ---: |
${monthlyRows || "| n/a | 0 | 0 | 0 | 0 |"}

| 链路 | 月度实验 | 变体 | 主指标 | 状态 |
| --- | --- | --- | --- | --- |
${monthlyExperimentRows || "| n/a | 暂无 | n/a | n/a | n/a |"}

## 近 7 天 GA 趋势

| 日期 | 活跃用户 | 事件数 |
| --- | ---: | ---: |
${trendRows || "| n/a | 0 | 0 |"}

## YouTube 素材状态

- 状态：${report.chain.youtube.status}
- Run ID：${report.chain.youtube.runId || "n/a"}
- 生成时间：${report.chain.youtube.generatedAt || "n/a"}
- 年龄：${report.chain.youtube.ageDays === null ? "n/a" : `${report.chain.youtube.ageDays} 天`}
- 候选数：${report.chain.youtube.selectedClipCount}/${report.chain.youtube.clipCount}

## 数据源

${sourceLines}
- Play Console exports: ${report.sources.playConsoleExports.length ? report.sources.playConsoleExports.join(", ") : "未发现"}
- Campaign attribution: ${report.sources.attributionReady ? "代码和文档已接入" : "未接入"}

## 产物

- JSON: ${jsonPath}
- Markdown: ${markdownPath}
`;
}

function action(priority, area, title, detail) {
  return { priority, area, title, detail };
}

function priorityRank(priority) {
  return { P0: 0, P1: 1, P2: 2 }[priority] ?? 3;
}

function latestFile(dir, pattern) {
  if (!fs.existsSync(dir)) {
    return "";
  }
  const candidates = fs.readdirSync(dir)
    .filter((file) => pattern.test(file))
    .map((file) => path.join(dir, file))
    .sort((a, b) => b.localeCompare(a));
  return candidates[0] || "";
}

function latestFiles(dir, pattern) {
  if (!fs.existsSync(dir)) {
    return [];
  }
  return fs.readdirSync(dir)
    .filter((file) => pattern.test(file))
    .map((file) => path.join(dir, file))
    .sort((a, b) => b.localeCompare(a));
}

function latestYoutubeManifest() {
  const dir = path.join(rootDir, "ops-materials", "youtube");
  if (!fs.existsSync(dir)) {
    return "";
  }
  const manifests = fs.readdirSync(dir)
    .map((entry) => path.join(dir, entry, "manifest.json"))
    .filter((file) => fs.existsSync(file))
    .sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);
  return manifests[0] || "";
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

function isAttributionReady() {
  const services = readOptional(path.join(rootDir, "services.js"));
  const docs = readOptional(path.join(rootDir, "docs", "analytics-events.md"));
  return services.includes("captureCampaignAttribution")
    && services.includes("getCampaignAttributionAnalyticsPayload")
    && docs.includes("Growth Attribution Parameters");
}

function readJson(file) {
  if (!file || !fs.existsSync(file)) {
    return null;
  }
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function readOptional(file) {
  return fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
}

function normalizeGaDate(value) {
  const raw = String(value || "").trim();
  if (/^\d{8}$/.test(raw)) {
    return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return raw;
  }
  return "";
}

function offsetDate(dateValue, dayOffset) {
  const date = parseDate(dateValue);
  if (!date) return "";
  date.setUTCDate(date.getUTCDate() + dayOffset);
  return formatUtcDate(date);
}

function parseDate(value) {
  const normalized = normalizeGaDate(value);
  if (!normalized) return null;
  const date = new Date(`${normalized}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function weekKey(value) {
  const date = parseDate(value);
  if (!date) return null;
  const day = date.getUTCDay() || 7;
  const monday = new Date(date);
  monday.setUTCDate(date.getUTCDate() - day + 1);
  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);
  return {
    key: formatUtcDate(monday),
    label: `${formatUtcDate(monday)} ~ ${formatUtcDate(sunday)}`,
    startDate: formatUtcDate(monday),
    endDate: formatUtcDate(sunday),
  };
}

function monthKey(value) {
  const date = parseDate(value);
  if (!date) return null;
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const start = new Date(Date.UTC(year, date.getUTCMonth(), 1));
  const end = new Date(Date.UTC(year, date.getUTCMonth() + 1, 0));
  return {
    key: `${year}-${month}`,
    label: `${year}-${month}`,
    startDate: formatUtcDate(start),
    endDate: formatUtcDate(end),
  };
}

function formatUtcDate(date) {
  return date.toISOString().slice(0, 10);
}

function toNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function round1(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "0";
  return `${Math.round(number * 10) / 10}`;
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

function formatPercent(value) {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return "n/a";
  }
  return `${Math.round(value * 1000) / 10}%`;
}

function formatLocalDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function escapeMarkdown(value) {
  return String(value || "").replace(/\|/g, "\\|").replace(/\n/g, " ");
}

function printSummary(report, markdownPath, jsonPath) {
  console.log(`运营闭环日报：${report.status.label}`);
  console.log(`今日动作：${report.actions[0]?.title || "继续观察"}`);
  console.log(`Markdown: ${markdownPath}`);
  console.log(`JSON: ${jsonPath}`);
}
