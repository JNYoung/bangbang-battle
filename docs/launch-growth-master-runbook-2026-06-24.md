# 斗球球上架后增长总控 Runbook

Date: 2026-06-24
Project: `斗球球` / `Profession Ball Arena`
Repo: `/Users/zhengjinyang/Documents/球球大作战/bangbang-battle`

## 一句话主线

先把商店页和首局体验串起来，再用 YouTube 素材验证创意，最后才小预算上 Meta / Google：

```text
Play Console/GA 数据 -> ASO 首屏承诺 -> 首局启动/完成 -> 结算反制/二局 -> YouTube 素材 -> 小预算投放 -> 72 小时复盘 -> 迭代或暂停
```

当前最重要的增长命题：

```text
用户是否会被“选一组对阵 -> 猜谁赢 -> 看自动战斗 -> 看 verdict -> 再挑战反制阵容”吸引，并进入第二局和次日回访。
```

## 当前状态

最新自动报告：

- ASO: `reports/aso-insights/aso-insights-2026-06-24.md`
- GA: `reports/ga-daily/ga-daily-2026-06-24.md`
- 运营闭环: `reports/ops-growth-loop/ops-growth-loop-2026-06-24.md`

2026-06-23 数据读数：

| 指标 | 读数 | 解释 |
| --- | ---: | --- |
| Active users | 16 | 样本仍小，只适合看明显断点 |
| Events | 151 | GA Data API 已可读 |
| `game_start / game_init_success` | 6 / 17 = 35.3% | 首局启动弱，ASO 首屏/短描述/入口需要更明确 |
| `game_end / game_start` | 4 / 6 = 66.7% | 开局后完成率比前一天好，说明承接有改善空间 |
| `second_battle_start` | 0 | 二局循环未成立 |
| `next_match_recommend_click` | 0 | 结果页推荐未产生点击 |
| `next_day_return` | 11 | 回访事件可读，但样本小 |
| 广告事件 | 22 requests / 15 shows / 1 close | 与“当前版本不展示广告”的文档口径冲突，需要核对 |
| Play Console acquisition | 未发现导出 | 还不能判断商店曝光到安装转化 |

## 今天的优先级

1. P0: 导出 Play Console Store listing acquisition 到 `reports/play-console/`。
2. P0: 核对 GA 广告事件来源，确认是否旧包、测试包或当前生产包仍在发广告事件。
3. P1: 改 Google Play 短描述、首图、截图顺序，主打 matchup/counter。
4. P1: 补 result verdict / Try the counter 截图，承接二局循环。
5. P1: 刷新 YouTube Shorts 素材池，当前素材状态已 stale。
6. P2: 构建或 Firebase 配置变化后，有 Android 设备时跑 `npm run ga:daily -- --smoke`。

## 每日执行

### 1. 先跑总控命令

```bash
npm run ops:growth-loop
```

它会串起：

- `npm run aso:insights`
- `npm run ga:daily`
- YouTube 素材状态
- Play Console 导出状态
- 今日行动队列

如果当天不想重新请求 GA：

```bash
npm run ops:growth-loop -- --skip-refresh
```

### 2. 看 P0 阻塞

先回答两个问题：

```text
Play Console acquisition 是否已经导入？
广告事件来源是否和商店口径一致？
```

如果任一为否，当天不建议提高投放预算。

### 3. 看核心漏斗

每天只先看这几个：

| 指标 | 低于什么要处理 | 对应动作 |
| --- | ---: | --- |
| `game_start / game_init_success` | 50% | 改 ASO 首图、短描述、隐私同意后入口说明 |
| `game_end / game_start` | 55% | 修首局节奏、卡顿、可读性、结算到达 |
| `second_battle_start / game_start` | 20% | 强化 result verdict、counter、next match |
| `next_match_recommend_click / game_end` | 20% | 让结果页推荐按钮更清楚 |
| `next_day_return / active_users` | 方向参考 | 测 daily matchup / daily champion 素材 |

## ASO 策略

### Google Play 第一轮

目标：提高进入应用后的首局启动，而不是先追宽泛关键词。

短描述建议：

```text
Pick a matchup, watch pixel-ball battles, then try the counter.
```

中文短描述：

```text
选择对阵，观看球球自动开战，再挑战反制阵容。
```

Full description 首段：

```text
Profession Ball Arena is a fast portrait auto-battle game about compact pixel matchups. Pick two professions, watch the arena decide the result, then try the counter in the next round.
```

中文首段：

```text
斗球球是一款竖屏 2D 自动对战小游戏。先选择一组职业对阵，猜猜谁会赢，再观看球球在像素竞技场里自动开战；结算后可以继续挑战反制阵容。
```

截图顺序：

1. `matchup-question-battle`: `长矛球 vs 盾牌球，谁会赢？`
2. `pick-matchup`: `选职业，看克制`
3. `result-verdict-next`: `赢了？马上挑战反制`
4. `item-chaos`: `随机武器，局局不同`
5. `settings-privacy`: 合规截图放最后

Feature graphic:

```text
长矛球 VS 盾牌球
谁会赢？
```

英文：

```text
Spear vs Shield
Who wins?
```

### App Store 跟进

如果 iOS 上架或准备上架：

- zh-CN subtitle: `先猜胜负，再看对战`
- en-US subtitle: `Pick, watch, counter`
- zh-CN promotional text: `先猜谁赢，再看球球自动开战。结算后挑战反制阵容，快速一局看出职业克制。`
- en-US promotional text: `Pick a matchup, watch a fast pixel-ball duel, then try the counter after the result.`

第一轮 Product Page Optimization 只改截图和 promotional text，不同时改 icon。

## YouTube 策略

YouTube 现在的职责不是直接放量，而是低成本预筛素材。

每日素材命令：

```bash
npm run ops:daily-youtube
```

默认会录 9 个候选局，选 3 条 Shorts 素材。上传时优先用判断题：

- `Spear Ball vs Shield Ball: who wins?`
- `The mage had 1 HP. Can it still win?`
- `Bow Ball picked up a rocket. Fair fight?`

UTM 规则：

```text
utm_source=youtube
utm_medium=shorts
utm_campaign=organic_daily_YYYYMMDD
utm_content=<clip_or_angle_id>
creative_id=<creative_id>
```

判读：

| YouTube 信号 | 动作 |
| --- | --- |
| 前 3 秒弱 | 第一帧直接放 matchup + 爆点 |
| 完播弱 | 只保留 setup、turn、payoff |
| 评论弱 | 开头改成选择题或判定题 |
| 点击商店弱 | CTA 改为 `try the counter` |

## Meta / Google 小预算策略

### 预算级别

| Level | 条件 | 日预算 |
| --- | --- | ---: |
| 0 | Play Console acquisition 缺失、广告口径未清、二局为 0 | USD 0 |
| 1 | GA 可读，商店页数据可读，至少能看 `game_start` 和 `game_end` | USD 5-10 |
| 2 | 一个角度同时改善首局启动、完赛和二局 | USD 20-30 |
| 3 | D7 / pLTV / 变现假设可读 | USD 50+ |

当前建议：保持 Level 0 到 Level 1 之间，不超过 `USD 10/day`。

### Meta

Meta 第一轮只做 paid learning：

```yaml
daily_cap: USD 5-10
duration: 3-5 days
geo: one low-to-mid-cost cluster
objective: creative/product learning
```

前置条件：

- Meta 广告账户支付方式就绪。
- campaign/adset/creative 命名能回流到 GA。
- `game_start`、`game_end`、`second_battle_start` 可读。

不要因为 CTR 好就加预算。CTR 只说明 hook，不说明玩法承接。

### Google Ads

Google 先做 Play ASO，不急着 App Campaign 放量。

原因：

- `USD 10/day` 对 App Campaign 很容易学习不足。
- 现在 Play Console acquisition 还缺，不能判断商店页转化。
- 二局和 next-match 仍是 0，过早买量会把问题放大。

## 产品承接

ASO 主打 matchup/counter 后，产品内必须接住：

1. 开局前有明确 matchup title。
2. 战斗中能看懂双方差异。
3. 结果页有明确 winner / verdict。
4. 结果页有 `Try the counter` / 推荐下一局。
5. `next_match_recommend_click` 和 `second_battle_start` 必须正常上报。

如果 ASO 改好后 `game_start` 上升但 `game_end` 不升，优先修首局可读性。

如果 `game_end` 上升但二局不升，优先修结果页和 next-match。

## 数据归因

所有自然内容和投放都用同一套参数：

```text
utm_source=<youtube|meta|google|play>
utm_medium=<shorts|paid|organic|store_experiment>
utm_campaign=<campaign_name>
utm_content=<creative_or_variant_id>
creative_id=<creative_id>
campaign_id=<campaign_id_if_any>
```

核心事件必须带这些字段：

- `game_init_success`
- `game_start`
- `first_battle_start`
- `first_battle_complete`
- `second_battle_start`
- `daily_match_complete`
- `game_end`
- `next_match_recommend_click`
- `next_day_return`

不要把 `gclid`、`fbclid` 原始点击 ID 写进事件 payload。

## 每周复盘

每周一输出一次：

1. ASO 实验状态：短描述、截图、feature graphic 是否变更。
2. Play Console：store visitors、installers、country、search/source。
3. GA 漏斗：`game_start`、`game_end`、二局、next-match、D1。
4. YouTube 素材：前 3 秒、完播、点击、评论。
5. 预算 level：继续 0、进入 5-10/day、升到 20-30/day、或暂停。
6. 下一个 72 小时实验：只选一个主变量。

## 7 天路线图

### Day 1

- 导出 Play Console acquisition。
- 核对广告事件来源。
- 定稿 Google Play 短描述和截图文案。

### Day 2

- 生成新截图 #1、#3 和 feature graphic。
- 跑 `npm run aso:screenshots` 或补手动素材。

### Day 3

- 上线或启动 Store Listing Experiment。
- 记录上线时间。

### Day 4-6

- 每天跑 `npm run ops:growth-loop`。
- 如果 YouTube 素材 stale，跑 `npm run ops:daily-youtube`。
- 不因为单日小样本改投放预算。

### Day 7

- 复盘：首局启动、完赛、二局是否改善。
- 只做一个决定：保留、迭代、回滚、或进入小预算学习。

## 需要用户处理

- 登录 Play Console 导出 acquisition。
- 如果已上线商店页实验，记录实验开始时间和变体。
- 确认广告事件来源和 Data safety / Ads declaration 口径。
- Meta / Google Ads 支付方式、账户状态、真实投放开关。
- YouTube Studio 上传和公开视频。

## Codex 可代办

- 每天跑 `npm run ops:growth-loop` 并解释结果。
- 生成商店文案、截图 caption、feature graphic brief。
- 生成 YouTube Shorts 素材和上传文案。
- 生成 72 小时 cohort readout。
- 更新本地 docs 和脚本，保持 GA -> ASO -> 运营闭环一致。

## 相关文件

| 文件 | 作用 |
| --- | --- |
| `reports/ops-growth-loop/ops-growth-loop-2026-06-24.md` | 今日总控日报 |
| `reports/aso-insights/aso-insights-2026-06-24.md` | 今日 ASO 数据洞察 |
| `reports/ga-daily/ga-daily-2026-06-24.md` | 今日 GA 日报 |
| `docs/aso-priority-strategy-2026-06-23.md` | ASO 优先策略 |
| `docs/post-launch-aso-ops-growth-strategy-2026-06-23.md` | 上架后增长总策略 |
| `docs/ops-growth-loop.md` | 自动化运营闭环说明 |
| `docs/aso-store-listing.md` | 商店元数据和截图基础包 |
| `docs/paid-acquisition-small-budget-douququ.md` | 小预算买量学习计划 |
| `docs/youtube-ops-recording.md` | YouTube 素材生产流程 |

## 当前总判断

现在不要急着扩大投放。先把 Play Console acquisition、广告事件口径、ASO 首屏和 result/counter 截图补齐。只要 `game_start / game_init_success` 仍低于 50%、二局和 next-match 仍为 0，投放就应该服务于学习，不应该服务于放量。
