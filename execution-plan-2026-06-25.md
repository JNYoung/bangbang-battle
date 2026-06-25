# 斗球球执行计划 - 2026-06-25

目标：把当前已经做好的产品、商店素材、合规页面、数据脚本和 YouTube 素材，推进到“能用真实后台数据判断是否可以小预算学习”的状态。

## 当前判断

- 当前不建议放量，保持 `USD 0-10/day` 学习上限。
- 先补 Play Console acquisition，再核对广告事件来源。
- 产品主线继续围绕：`选对阵 -> 猜胜负 -> 看自动战斗 -> 看 verdict -> 再挑战反制阵容`。
- YouTube 已有 2026-06-24 新素材包，但第一条 Short 还缺 URL 绑定和指标回收。
- 后续录屏素材优先用道具模式和英雄模式；普通职业模式只作为补充素材。

## 增长结果与深度研究焦点

数据基线来自 `reports/ops-growth-loop/ops-growth-loop-2026-06-24.json`，GA 数据日期为 2026-06-23。当前样本仍小，今天的研究结论只用于找断点和决定下一轮动作，不用于放量。

| 指标 | 当前读数 | 今日判断 | 下一步研究 |
| --- | ---: | --- | --- |
| Active users | 16 | 样本小，只能看方向 | 每天继续刷新，周复盘只看趋势和明显断点 |
| `game_start / game_init_success` | 6 / 17 = 35.3% | 开局入口仍是最大上游漏斗 | 用 Play Console acquisition + GA start_source 判断商店承诺是否被产品承接 |
| 首局完成率：`game_end / game_start` | 4 / 6 = 66.7% | 表面可用，但 `first_battle_complete = 0` 暴露埋点口径风险 | 先修数据一致性，再按 start_source / render_quality / duration 拆首局完成 |
| 二局启动：`second_battle_start / game_start` | 0 / 6 = 0% | 结果页反制循环未成立 | 先让 `next_match_recommend_click` 和 `second_battle_start` 不为 0 |
| 次局完成率 | 未可读 | 当前没有稳定的 `second_battle_complete` 口径 | 增加或推导二局完成事件，再评估第二局是否也能完成 |
| 留存信号：`next_day_return / active_users` | 11 / 16 = 68.8% | 这是回访事件信号，不等于真实 D1 cohort retention | 用 GA cohort + Play acquisition 校准 D1/D7，按 creative_id/source/country 拆 |
| 广告相关事件 | 38 | 与“当前包无广告”口径冲突 | 先确认来源，避免 Data Safety 和投放承诺冲突 |

### 0. 当前指标驱动的增长调研方式

增长调研不是先找更多渠道，而是先回答一个更窄的问题：

```text
哪一种外部承诺，能带来会完成首局、愿意进入第二局、并且次日回来的用户？
```

因此本阶段按“指标断点 -> 证据来源 -> 增长假设 -> 小实验 -> 72 小时复盘”推进。

| 当前指标断点 | 先调研什么 | 主要证据源 | 产出 | 不能下的结论 |
| --- | --- | --- | --- | --- |
| `game_start / game_init_success = 35.3%` | 用户为什么打开后没有开始第一局 | Play acquisition、首页首屏、隐私同意后入口、首图/短描述、竞品首屏 | ASO/首屏承诺假设 | 不能只用 GA 判断商店页好坏 |
| `game_end / game_start = 66.7%` 但 `first_battle_complete = 0` | 首局完成是否真的可读 | release smoke、GA 事件模型、`game_end` payload、logcat | 埋点修复或口径说明 | 不能用坏口径决定买量 |
| `next_match_recommend_click = 0` | 结果页有没有明确下一步 | 结果页截图、按钮位置、文案、用户录屏、竞品结算页 | verdict/counter CTA 假设 | 不能说用户不想玩第二局，可能只是看不到入口 |
| `second_battle_start = 0` | 二局循环在哪里断 | 推荐按钮点击、`start_source=result_recommendation`、二局启动埋点 | 二局入口实验 | 不能做更复杂养成来替代二局入口 |
| 次局完成率未可读 | 二局启动后体验是否承接 | `second_battle_complete` 或第二局 `game_end` 推导 | 次局完成口径 | 不能只看二局启动就判断留存成立 |
| `next_day_return / active_users = 68.8%` | 回访是否来自真实 cohort | GA cohort、Play retained installers、creative_id/source/country | D1/D7 留存拆分 | 不能把 `next_day_return` 当 D1 retention |
| 广告事件 38 | 是否影响合规和承诺 | GA event rows、当前包代码、旧包/测试包版本 | 广告来源解释 | 不能按“无广告”继续放量 |

调研顺序：

1. 先校准数据口径：`first_battle_complete`、二局完成、D1 cohort、广告事件来源。
2. 再定位漏斗断点：商店访问到安装、安装后开局、首局完成、结果页点击、二局启动、次日回访。
3. 再做外部调研：只看能解释当前断点的竞品、素材、商店页，不做泛泛市场报告。
4. 再写实验：每个实验只改一个主变量，绑定 `creative_id` / `start_source` / treatment id。
5. 72 小时后复盘：只保留同时改善上游点击和下游完成/留存的方向。

按指标调研增长的方法：

| 指标 | 增长调研问题 | 具体调研动作 | 第一轮实验 |
| --- | --- | --- | --- |
| 商店访问 -> 安装 | 哪个来源、国家、关键词带来的安装后质量更好 | 导出 Play acquisition / retained installers；按 country、organic search/browse、UTM 拆；检查第一张截图是否说清 matchup | Play Store listing：首图 `Spear vs Shield: who wins?` vs 当前图 |
| `game_start / game_init_success` | 用户打开后是否立刻知道要点哪里 | 对比首页首屏和商店承诺；录一段首次启动；检查隐私同意后是否直接看到 matchup CTA | 首页主按钮改为 `Pick a matchup` / `Start the duel` |
| `game_end / game_start` | 第一局是否太慢、太乱、看不懂或设备卡 | 按 `duration_sec`、`render_quality`、matchup、start_source 拆；查 `performance_snapshot` | 默认推荐更清楚的 matchup；首局加一句 winner/prediction 提示 |
| `next_match_recommend_click / game_end` | 结果页是否产生“我想反制”的冲动 | 截图检查按钮是否在首屏；调研同类游戏结算页 retry/revenge/counter 表达；看用户是否需要滚动 | 结果页主 CTA 改为 `Try the counter`，分享/战报降级 |
| `second_battle_start / game_start` | 点击推荐后是否能无摩擦进入第二局 | 检查 `startRecommendedMatch()` 路径；确认 `start_source=result_recommendation`；看是否又回到复杂选择 | 一键 revenge/counter，不要求重新配置 |
| 次局完成率 | 第二局是否只是被点开，还是能完成 | 增加 `second_battle_complete` 或让第二局 `game_end` 可推导；按第二局时长/结果拆 | 二局开场更快给冲突，避免重复教程/等待 |
| D1/D7 留存 | 回访理由是否成立 | 用 Play retained installers + GA cohort；按 creative_id、source、country、是否完成首局/二局拆 | `daily matchup` vs `daily champion` 两组素材和入口 |
| YouTube audience retention | 哪种 hook 值得反哺 ASO 和广告 | 看视频级 audience retention/key moments；标记 0-3 秒流失、完播、评论争议点；所有链接带 UTM/creative_id | 道具模式随机武器反转 vs 英雄模式克制/翻盘 |

外部调研只做四类：

| 类型 | 看什么 | 记录字段 | 用途 |
| --- | --- | --- | --- |
| Google Play 竞品 | 首图、短描述、视频第一秒、评论高频词、是否主打 retry/revenge | app、截图承诺、核心 hook、留存机制、变现 | 反推 ASO treatment |
| YouTube/Shorts 同类内容 | 前 3 秒问题、画面节奏、反转点、评论诱因 | hook、payoff、时长、CTA、互动问题 | 生成 Shorts 脚本和素材池 |
| 产品结算页模式 | winner 是否明确、下一局按钮是否主行动、是否给反制理由 | verdict、CTA、推荐理由、二局入口摩擦 | 结果页改版 |
| 小预算买量案例 | 预算档、学习目标、何时停、是否看下游行为 | budget、channel、metric、stop rule | 只作为预算纪律，不直接照搬数字 |

本周调研 backlog：

| 优先级 | 调研题 | 为什么现在做 | 完成物 |
| --- | --- | --- | --- |
| P0 | Play acquisition + retained installers 导出 | 没有商店曝光到安装，就无法判断 ASO 是否有效 | `reports/play-console/*` + 日报读数 |
| P0 | `first_battle_complete` 口径核验 | 当前首局完成率存在事件不一致 | smoke 记录 + 修复/说明 |
| P0 | 结果页 counter 入口可见性检查 | 二局和 next-match 都是 0 | 手机截图 + CTA 改动清单 |
| P1 | 10 个竞品商店首图/短描述扫描 | 为第一轮 ASO treatment 找真实表达方式 | `matchup/counter` 文案候选表 |
| P1 | 10 条同类 Shorts hook 拆解 | 为每日素材找开头模板 | hook、payoff、CTA 模板 |
| P1 | D1 cohort 查询方案 | 防止误把 `next_day_return` 当留存 | GA/Play cohort 字段清单 |
| P2 | 低预算渠道规则复核 | 防止过早进入 Google App Campaign 学习不足 | USD 0-10/day 复盘模板 |

72 小时复盘判断：

- 只提高曝光、点击或观看，不提高 `game_start` / 首局完成 / 二局启动的方向，不保留。
- 只提高 `game_start`，但首局完成率跌破 55%，说明承诺和体验不匹配，优先修首局。
- 只提高结果页点击，但次局完成率低，说明 CTA 过强或第二局承接弱，优先修二局体验。
- 有一个素材或来源同时带来更高 `game_start`、首局完成、二局启动，才进入小预算学习候选。
- D1 cohort 不可读前，不做超过 `USD 10/day` 的放量判断。

### 1. 首局完成率深度研究

研究问题：用户一旦开始第一局，是否能顺畅看完并理解胜负？这里不要只看完成率，还要判断“完成后是否知道下一步”。

当前口径：

- 运营代理指标：`game_end / game_start`，当前 `4 / 6 = 66.7%`。
- 埋点一致性指标：`first_battle_complete` 应该和首局 `game_end` 同向出现；当前读数为 `0`，必须先排查。
- 上游保护指标：`game_start / game_init_success`，当前 `35.3%`，说明即使首局完成率可用，首屏/开局入口仍不能放松。

需要拆分的维度：

| 维度 | 要回答的问题 | 需要字段 |
| --- | --- | --- |
| `start_source` | 哪个入口带来的首局更容易完成 | `game_start.start_source` + `game_end.match_id` |
| `render_quality` | 低端设备是否更容易中途流失 | `render_quality`、`performance_snapshot`、`game_end` |
| `duration_sec` | 首局是否过长或过短导致理解失败 | `game_end.duration_sec` |
| `own_role/opponent_role` | 哪些 matchup 首局更有可读性 | `own_role`、`opponent_role`、`result` |
| `traffic_content/creative_id` | 哪条素材带来的用户能完成首局 | attribution payload |

今日动作：

- [ ] 跑 `npm run ga:daily`，确认 `first_battle_complete` 是否仍为 0。
- [ ] 用 release smoke 手动完成一局，验证 `first_battle_start`、`game_end`、`first_battle_complete` 是否同时出现。
- [ ] 如果 `first_battle_complete` 仍缺失，先把它作为 P0 埋点修复，不直接用它做增长判断。
- [ ] 在下一版日报里增加首局完成拆分表：`start_source`、`render_quality`、`duration_bucket`、`creative_id`。

第一轮成功线：

- 样本少于 30 次 `game_start`：只要求 `first_battle_complete` 口径正确，且 `game_end / game_start` 不低于 55%。
- 样本达到 30-100 次 `game_start`：`game_end / game_start >= 60%`，且低端设备不明显拖后腿。
- 如果开局率升高但首局完成率跌破 55%，暂停加素材和买量，优先修首局可读性、时长和性能。

### 2. 次局完成率深度研究

研究问题：用户看完第一局后，是否愿意进入第二局，并且第二局能否完成？当前只看 `second_battle_start` 不够，必须补出“次局完成率”。

推荐口径：

| 层级 | 指标 | 用途 |
| --- | --- | --- |
| 结果页点击 | `next_match_recommend_click / game_end` | 判断 verdict/counter 按钮是否有吸引力 |
| 二局启动 | `second_battle_start / game_start` | 判断核心循环是否被激活 |
| 次局完成 | `second_battle_complete / second_battle_start` | 判断第二局体验是否仍能跑通 |
| 反制路径质量 | `second_battle_complete with start_source=result_recommendation` | 判断结果页推荐是否真的带来有效第二局 |

当前数据缺口：

- `next_match_recommend_click = 0`，说明结果页推荐动作没有被点击，或入口/埋点没有被触发。
- `second_battle_start = 0`，说明二局循环没有成立。
- 事件模型里没有明确 `second_battle_complete`；如果短期不加新事件，至少需要让 `game_end` 带 `daily_match_index` 或 `total_matches_before`，用第二局的 `game_end` 推导完成率。

今日动作：

- [ ] 手动跑一局，检查结果页主按钮是否在首屏可见，文案是否是 `Try the counter` / `Challenge the counter`，而不是弱化为普通下一局。
- [ ] 点击结果页推荐按钮，确认 `next_match_recommend_click` payload 带 `recommendation_reason`、`recommended_matchup`、`winner_side`。
- [ ] 确认推荐启动的下一局带 `start_source=result_recommendation`。
- [ ] 给二局完成补一个稳定口径：优先新增 `second_battle_complete`；如果暂不加事件，则让 `game_end` payload 增加 `daily_match_index`、`total_matches_before`。
- [ ] 下次报告把二局链路拆成：`game_end -> next_match_recommend_click -> second_battle_start -> second_battle_complete`。

第一轮实验：

| 实验 | A | B | 主指标 | 判定 |
| --- | --- | --- | --- | --- |
| 结果页主按钮 | 普通下一局 | `Try the counter` | `next_match_recommend_click / game_end` | B 不能低于 A，目标先到 20% |
| 推荐理由 | 只展示按钮 | 按钮 + 一句 counter 原因 | `second_battle_start / game_start` | 有理由版本带来更多二局启动才保留 |
| 二局节奏 | 当前战斗节奏 | 第二局开场更快给冲突 | `second_battle_complete / second_battle_start` | 不牺牲完成率才保留 |

第一轮成功线：

- 48 小时内：`next_match_recommend_click` 和 `second_battle_start` 必须从 0 变成可读。
- 周目标：`next_match_recommend_click / game_end >= 20%`，`second_battle_start / game_start >= 20%`。
- 新增二局完成口径后：`second_battle_complete / second_battle_start >= 55%`，否则说明第二局入口可能有吸引力但体验没有承接。

### 3. 留存率深度研究

研究问题：用户是否因为 matchup/counter/daily promise 回来，而不是只完成一次测试？当前 `next_day_return / active_users` 是早期信号，不等于真正的 D1/D7 cohort retention。

推荐口径：

| 指标 | 定义 | 用途 |
| --- | --- | --- |
| D1 cohort retention | 某日新用户或首局用户，次日再次活跃的比例 | 放量前核心留存判断 |
| D7 cohort retention | 某日新用户或首局用户，7 日内回来的比例 | 判断是否值得继续做付费学习 |
| `next_day_return / active_users` | 当日有 next-day-return 事件的用户占 active users | 当前可用的早期回访信号 |
| `daily_match_complete / active_users` | 每日挑战是否真的被完成 | 验证 daily matchup / daily champion 是否成立 |
| retained installer rate | Play Console 商店实验里的 1-day retention/acquisition 视角 | 判断商店素材带来的用户质量 |

需要拆分的 cohort：

- 来源：Play organic search、Play browse、YouTube Shorts、UTM、未来 paid campaign。
- 素材：`creative_id` / `traffic_content`，尤其是 `matchup_question`、`counter_revenge`、`daily_champion`。
- 国家/语言：先看 Play Console country 和 GA locale，不急着扩市场。
- 首局质量：完成首局 vs 没完成首局；二局启动 vs 没启动二局。

今日动作：

- [ ] Play Console acquisition 导入后，把 store visitors、installers、retained installers / 1-day retention 视角并排放进日报。
- [ ] GA 里确认 `creative_id`、`traffic_source`、`traffic_campaign`、`start_source` 能被 Data API 查询；必要时注册 custom dimensions。
- [ ] 用 `next_day_return` 继续做短期信号，但在报告里标注“不是 D1 cohort”。
- [ ] 准备两个留存素材方向：`daily matchup` 和 `daily champion`，每个方向至少 3 条 Shorts / 截图文案。

第一轮成功线：

- 样本少于 30 个新用户 cohort：只看 `next_day_return` 是否持续非零，以及是否集中在完成首局/二局的人群。
- 样本达到 30-100 个新用户 cohort：至少一个来源或素材角度的 D1 cohort 明显优于其他角度，再考虑继续同方向素材。
- D7 只做方向判断，不做硬门槛；如果 D1/D7 都没有信号，暂停加预算，优先做 daily matchup / daily champion 的回访理由。

### 4. 数据与实验方法

- Google Play Store listing experiments 官方支持用商店文案和图形做 A/B；为了让小样本可解释，本轮一次只测一个主资产，同时看 acquisition 和 1-day retained installer 视角。
- Play Console acquisition 导出需要保留 Date、Country、Acquisition Channel、UTM、Keyword 等字段；报告里要避免把 organic search 和 organic browse 重复相加。
- GA Data API 可以查询 event-scoped custom dimensions/metrics，但前提是属性里已注册；因此 `creative_id`、`start_source`、`recommendation_reason`、`daily_match_index` 这些字段要进入可查询清单。
- GameAnalytics 2025 移动游戏 benchmark 可以作为外部留存参照，但当前样本太小，不用行业均值当硬闸门；先用自己 cohort 的相对改善判断 keep / iterate / stop。

外部参考：

- [Google Play Store listing experiments](https://play.google.com/console/about/store-listing-experiments/)
- [Play Console acquisition and retention reports](https://support.google.com/googleplay/android-developer/answer/6263332?hl=en)
- [GA Data API custom dimensions and metrics](https://developers.google.com/analytics/devguides/reporting/data/v1/api-schema)
- [GameAnalytics 2025 Mobile Gaming Benchmarks](https://www.gameanalytics.com/reports/2025-mobile-gaming-benchmarks)

## 今日 P0

### 1. 导出 Play Console acquisition

目的：补齐商店曝光、访问、安装数据，否则 GA 只能解释安装后行为。

人工操作：

1. 打开 Google Play Console。
2. 进入 `斗球球 / Profession Ball Arena`。
3. 导出 Store listing acquisition / Store performance 相关 CSV。
4. 放到：

```text
reports/play-console/play-store-acquisition-YYYY-MM-DD.csv
```

完成后运行：

```bash
npm run ops:growth-loop -- --skip-refresh
npm run ops:growth-html
```

验收：

- `reports/ops-growth-loop/ops-growth-loop-YYYY-MM-DD.md` 能读到 Play Console 数据。
- 报告能并排展示 store visitors -> installers 和 GA 首局漏斗。

### 2. 核对广告事件来源

背景：文档和当前代码口径是“当前包不展示广告”，但 2026-06-23 GA 有 38 个广告相关事件。

要判断：

- 是否来自旧包。
- 是否来自测试包。
- 是否当前发布包仍在发广告事件。

检查材料：

```bash
npm run ga:daily
rg -n "ad_request|ad_show|ad_close|rewarded_ad" game.js services.js docs tests
```

验收：

- 如果是旧包/测试包：在执行记录里写明来源解释。
- 如果是当前包：先修代码或调整 Play Data Safety / 商店文案，不能继续按“无广告”放量。

## 今日 P1

### 3. 补跑 release GA smoke

前提：Android 模拟器或真机已就绪。

运行：

```bash
export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
export ANDROID_HOME="$HOME/Library/Android/sdk"
export ANDROID_SDK_ROOT="$ANDROID_HOME"
npm run android:ga:smoke
```

验收：

- release 包能上传 `game_init_success` 和 `game_start`。
- logcat 没有旧 Firebase app id、`_dbg`、上传失败或广告误触发证据。

### 4. 绑定 YouTube 首条 Short 指标

当前素材包：

```text
ops-materials/youtube/2026-06-24-231930/
```

首条标题：

```text
It Looked Over, Then the Comeback Hit
```

拿到 YouTube URL 后运行：

```bash
npm run ops:youtube-metrics -- --run=2026-06-24-231930 --video-url="https://www.youtube.com/shorts/VIDEO_ID"
```

如果 OAuth 未配置，先运行：

```bash
npm run auth:google
```

验收：

- `youtube-publish-tracking-YYYY-MM-DD.md/json` 有真实 URL 和指标。
- `youtube-efficiency-YYYY-MM-DD.md/json` 至少能读 views、engaged views、like/comment/share、平均观看时长或可解释缺失原因。
- 未绑定指标前，不发第二条 Short。

### 5. 验证结果页二局循环

目标指标：

- `next_match_recommend_click / game_end >= 20%`
- `second_battle_start / game_start >= 20%`

重点检查：

- 结果页 winner / verdict 是否足够明显。
- `Try the counter` 或推荐下一局按钮是否在手机上显眼。
- 点击后是否带 `start_source=result_recommendation`。
- GA 是否收到 `next_match_recommend_click` 和 `second_battle_start`。

建议命令：

```bash
npm run test
npm run aso:screenshots
npm run ga:daily
```

验收：

- 新截图已覆盖：
  - `01-matchup-question-battle.png`
  - `02-pick-matchup.png`
  - `03-result-verdict-next.png`
  - `04-item-chaos.png`
  - `05-settings-privacy.png`
- 结果页推荐链路在代码、截图和 GA 事件里一致。

## 本周 P2

### 6. 更新 Google Play 商店素材

使用当前 ASO pack：

```text
docs/aso-store-listing.md
```

推荐首轮：

- Short description：主打 matchup / counter。
- 第一张图：`Spear vs Shield: who wins?`
- 第三张图：result verdict / Try the counter。
- Feature graphic：`Spear VS Shield / Who wins?`

验收：

- Play Console 中 metadata、截图顺序和 Data Safety 口径一致。
- 不把“无广告”写成和真实 GA 冲突的承诺。

### 7. Meta 后台入口继续排障

当前已有：

```text
release/meta-instant/profession-ball-arena-meta.zip
store-assets/review-videos/profession-ball-arena-meta-review.mp4
official-site/dist/
docs/meta-launch-plan.md
```

阻塞：

- 当前 Meta 后台没有 Instant Games / Web Hosting 入口。
- Data Deletion URL 字段曾拒绝有效 HTTPS URL。

验收：

- 能进入正确 Instant Games 上传页。
- ZIP 上传后后台测试可进入合规弹窗、主菜单和一局战斗。

### 8. iOS 首发条件准备

当前阻塞：

- Apple Developer Program。
- signing certificate / provisioning profile。
- Xcode iOS runtime。

执行参考：

```text
docs/ios-first-release.md
```

验收：

- `security find-identity -v -p codesigning` 有有效 identity。
- `~/Library/MobileDevice/Provisioning Profiles` 有对应 profile。
- Xcode 能 archive 并上传 TestFlight。

## 每日例行命令

```bash
npm run ga:daily
npm run aso:insights
npm run ops:growth-loop
npm run ops:growth-html
```

YouTube 每日素材：

```bash
npm run ops:daily-youtube:en
```

录屏选择：

- 道具模式：优先录随机武器、地图事件、最后几秒翻盘，适合前 3 秒强视觉 hook。
- 英雄模式：优先录英雄克制、残血反杀、技能节奏反转，适合做角色辨识和评论讨论。
- 普通职业模式：只在需要补充 matchup 基础教学或商店截图时使用。

质量检查：

```bash
npm run lint:syntax
npm test
npm run test:matchups
npm run test:artifacts
```

完整检查：

```bash
npm run test:ci
```

## 放量闸门

### Go

满足后才考虑超过 `USD 10/day`：

- Play Console acquisition 已导入。
- 广告事件来源解释清楚，商店披露与真实行为一致。
- `game_start / game_init_success >= 50%`。
- 首局完成率 `game_end / game_start >= 60%`，且 `first_battle_complete` 口径已修正。
- `second_battle_start / game_start >= 20%`。
- 次局完成率已可读，且 `second_battle_complete / second_battle_start >= 55%`。
- D1 cohort retention 已可读，至少一个来源/素材角度有稳定回访信号。
- 至少 3 条新鲜 Shorts 候选能按 `creative_id` 回流 GA。

### Hold

保持学习，不放量：

- 只有安装后 GA，没有商店曝光到安装转化。
- YouTube 指标未绑定。
- DAU 低于 100。
- 二局循环仍为 0。
- `first_battle_complete` 与 `game_end` 口径不一致。
- 留存只能看到 `next_day_return` 事件，尚不能按 cohort 判断 D1/D7。

### Stop

暂停素材或投放：

- 两轮素材测试后开局率仍低于 35%。
- 首局完成率连续低于 55%，且 performance / duration / matchup 拆分显示体验问题。
- 二局启动持续为 0 且完赛率下降。
- 次局启动上升但次局完成率低于 55%，说明结果页承诺没有被第二局体验承接。
- CPI 或商店转化恶化，同时 D1 没有改善。

## 今日完成记录模板

```text
日期：
执行人：

完成：
- 

数据：
- active users:
- game_start / game_init_success:
- game_end / game_start:
- first_battle_complete / game_start:
- second_battle_start / game_start:
- second_battle_complete / second_battle_start:
- next_match_recommend_click / game_end:
- next_day_return / active_users:
- D1 cohort retention:
- Play store visitors -> installers:
- retained installers / 1-day retention:

阻塞：
- 

明天只做一件事：
- 
```

## 相关文件

- 进度 HTML：`progress-summary-2026-06-25.html`
- 运营报告：`reports/ops-growth-loop/html/2026-06-24/report.html`
- ASO 文案：`docs/aso-store-listing.md`
- Google Play：`docs/google-play-release.md`
- iOS：`docs/ios-first-release.md`
- Meta：`docs/meta-launch-plan.md`
- YouTube：`ops-materials/youtube/2026-06-24-231930/`
