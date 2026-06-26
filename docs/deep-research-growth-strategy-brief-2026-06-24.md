# GPT Deep Research Brief: 斗球球增长策略

日期：2026-06-24

## 研究目标

请为小游戏/轻度移动游戏 `斗球球` / `Profession Ball Arena` 制定一份可执行增长方案。不要只给演示层建议，要做 deep research：研究真实市场、竞品、渠道玩法、ASO、YouTube Shorts、低预算买量、留存机制、数据验证和 30/60/90 天实验节奏。

最终方案要回答一个核心问题：

> 这款以 matchup prediction、自动战斗、winner verdict、counter battle、daily matchup 为核心的轻度游戏，应该怎样用最小预算验证增长，并逐步打通 GA -> ASO -> YouTube -> 商店转化 -> 产品留存 -> 小额投放的闭环？

## 当前产品与数据背景

产品定位：

- 名称：`斗球球` / `Profession Ball Arena`
- 类型：轻度自动战斗/斗蛐蛐式 matchup prediction 小游戏
- 核心体验：选择或接受推荐 matchup -> 猜谁赢 -> 观看自动战斗 -> 查看 winner/verdict -> 尝试 counter/next matchup
- 平台：Web/Meta 小游戏、Android、iOS 准备中
- 当前优先方向：先验证首局启动、首局完成、二局循环、次日回访，再考虑加预算

当前本地运营报告读数：

| 指标 | 当前读数 |
| --- | ---: |
| Active users | 16 |
| Events | 151 |
| game_start / game_init_success | 35.3% |
| game_end / game_start | 66.7% |
| second_battle_start / game_start | 0% |
| next_match_click / game_end | 0% |
| next_day_return / active_users | 68.8% |
| 广告相关事件 | 38 |
| YouTube manifest | stale, 21 天前生成 |
| Play Console acquisition | 未导入 |
| Campaign attribution | UTM / creative_id 已接入代码和文档 |

当前运营判断：

- 不能放量。先解决 Play Console acquisition 缺失、广告事件来源、首局启动弱、二局循环为 0、YouTube 素材池 stale。
- GA 现在可以解释安装后承接，但不能替代商店曝光 -> 安装转化。
- ASO / Shorts / 小额投放必须统一到同一套 matchup/counter/verdict 承诺。

本地参考文件：

- `reports/ops-growth-loop/ops-growth-loop-2026-06-24.md`
- `reports/ops-growth-loop/html/2026-06-24/report.html`
- `docs/launch-growth-master-runbook-2026-06-24.md`
- `docs/post-launch-aso-ops-growth-strategy-2026-06-23.md`
- `docs/aso-priority-strategy-2026-06-23.md`
- `docs/youtube-ops-recording.md`
- `docs/analytics-events.md`

## 必须研究的问题

### 1. 市场与竞品

研究 matchup prediction、auto battler、battle simulator、idle battle、physics battle、casual arena、io-like battle、short-session mobile game 的增长模式。

请至少覆盖：

- 5-10 个可对标竞品或邻近产品，包括但不限于 auto battler、battle simulator、短局小游戏、轻策略对战、YouTube/TikTok 友好的自动战斗内容。
- 每个竞品的核心 hook、首屏截图表达、商店文案、视频素材模式、留存机制、变现方式。
- 哪些竞品适合借鉴，哪些不适合照搬。
- `斗球球` 最可能赢的细分定位：斗蛐蛐、猜胜负、反制阵容、每日冠军、离线短局、魔性职业对战等。

### 2. ASO 与商店页实验

研究 Google Play 和 App Store 对轻度游戏的商店页优化路径。

请给出：

- 首图、短描述、长描述、icon、feature graphic、preview video 的优先级。
- Google Play Store Listing Experiments 应该如何设计：一次测试什么、样本不足时如何判断、如何避免伪显著。
- App Store Product Page Optimization / Custom Product Pages / Apple Ads ad variations 应该如何设计。
- `斗球球` 第一轮 ASO 实验的 3 个处理组，包括截图顺序、文案、关键词方向、预期影响和验证指标。

### 3. YouTube Shorts / TikTok 风格素材策略

研究自动战斗类内容在 Shorts/TikTok/Reels 上的 hook 和留存打法。

请给出：

- 适合本游戏的 10 个 Shorts 选题模板。
- 前 1-3 秒 hook 文案、画面节奏、字幕、结尾 CTA 的最佳实践。
- 如何用 audience retention/key moments 判断素材是否值得复用到 ASO 或广告。
- 每天 3 条候选、每 3 天复盘的具体运营 SOP。
- UTM / creative_id 命名规则如何支持素材复盘。

### 4. 产品内留存与用户体验

研究轻度游戏在首局后如何把用户带到第二局和次日回访。

请给出：

- 首局启动率低时应该优先修什么：商店承诺、首页 CTA、默认 matchup、加载体验、教程、战斗可读性。
- 完赛率尚可但二局为 0 时，结果页应该怎样设计：winner verdict、prediction result、counter challenge、推荐下一局、分享战报。
- Daily matchup / daily champion / streak / collection / cosmetic / ranking 哪些适合本阶段，哪些应推迟。
- 低样本阶段如何避免过早做复杂养成系统。

### 5. 小预算买量与增长闸门

研究 indie / small-budget mobile game 的买量验证方式。

请给出：

- USD 0-10/day、USD 10-30/day、USD 30-100/day 三档预算下应该验证什么。
- Meta、Google App Campaigns、Apple Ads、YouTube organic 哪些适合先试，哪些应暂缓。
- CPI、store conversion、game_start、first completion、second battle、D1 retention、ad event、pLTV 的 go/hold/stop 门槛。
- 在 Play Console acquisition 和 cohort 不完整时，哪些结论不能下。

### 6. 数据与分析体系

请评估当前数据链路，并给出下一步测量方案：

- GA4 推荐事件中哪些游戏事件适合映射到当前事件。
- Play Console acquisition、App Store Analytics、YouTube retention、GA UTM/creative_id 应该如何合并复盘。
- 每日、每周、每个版本应该看什么报表。
- 样本量不足时如何表达不确定性。
- 哪些事件或参数必须补充，才能判断留存时间和用户体验是否真的改善。

## 必须使用或核对的来源类型

请优先使用官方来源，并清楚区分官方文档、行业文章、案例观察和个人观点。

建议起点：

- Google Analytics acquisition reports: https://support.google.com/analytics/answer/14731736
- GA4 recommended events: https://support.google.com/analytics/answer/9267735
- GA4 event reference: https://developers.google.com/analytics/devguides/collection/ga4/reference/events
- Google Play acquisition reporting: https://play.google.com/console/about/acquisitionreporting/
- Google Play Store Listing Experiments: https://play.google.com/console/about/store-listing-experiments/
- Google Play acquisition and retention help: https://support.google.com/googleplay/android-developer/answer/6263332
- YouTube audience retention/key moments: https://support.google.com/youtube/answer/9314415
- Google Ads App campaign creative assets: https://support.google.com/google-ads/answer/6167158
- Apple Product Page Optimization: https://developer.apple.com/app-store/product-page-optimization/
- App Store Connect Product Page Optimization analytics: https://developer.apple.com/help/app-store-connect-analytics/acquisition/product-page-optimization/
- App Store Connect Analytics: https://developer.apple.com/app-store-connect/analytics/
- Apple Ads ad variations/custom product pages: https://ads.apple.com/app-store/help/ads/0077-create-ad-variations

也请补充行业来源、竞品观察、案例文章和创意库研究，但必须标注来源可信度和适用性。

## 输出格式要求

请输出一份中文方案，结构如下：

1. Executive summary：3-5 条最重要结论。
2. 市场与竞品洞察：竞品表格 + 可借鉴模式。
3. 增长定位建议：`斗球球` 应该主打什么、不应该主打什么。
4. ASO 策略：Google Play / App Store 分开写，给出首轮实验。
5. YouTube Shorts 策略：选题库、脚本模板、上传节奏、复盘方法。
6. 产品留存策略：首局、结算页、二局、次日回访的改造优先级。
7. 数据与归因方案：事件、参数、报表、样本量和复盘节奏。
8. 小预算买量方案：预算档位、渠道顺序、go/hold/stop 门槛。
9. 30/60/90 天路线图：每周产出、指标目标、决策点。
10. 实验 backlog：至少 20 条实验，包含假设、动作、指标、门槛、优先级。
11. 风险与反证：哪些信号说明方向错了，应该停止或转向。
12. Source appendix：所有引用来源，附一句说明该来源支持什么结论。

## 约束

- 不要假设已经有大样本。当前 DAU 很小，所有建议必须适配小样本学习。
- 不要建议大额放量，除非明确说明必须满足哪些数据条件。
- 不要只写泛泛的“优化 ASO / 多发视频 / 提升留存”。每条建议都要有具体素材、文案、产品动作或数据验证。
- 不要把商店转化和安装后承接混为一谈。
- 不要把 YouTube 观看数据直接等同于游戏留存；必须通过 UTM / creative_id 或明确假设连接。
- 不要把复杂养成系统作为第一优先级，除非研究证明它比修首局和二局更重要。

## 期望结论颗粒度

请让方案能直接变成执行计划。每个建议最好能落到：

- 改哪张截图或哪句文案
- 录哪类 matchup 素材
- 结果页加什么按钮或提示
- 看哪个指标，阈值是多少
- 何时继续、何时停止、何时转向
