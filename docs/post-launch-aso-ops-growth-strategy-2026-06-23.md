# 斗球球上架后 ASO、运营与小预算投放策略

Date: 2026-06-23
Project: `斗球球` / `Profession Ball Arena`
Repo: `/Users/zhengjinyang/Documents/球球大作战/bangbang-battle`

## 结论

当前最优策略不是马上把 YouTube / Meta / Google 三边都投起来，而是先用上架后的真实用户和小预算验证一个核心命题：

```text
用户是否会被“先猜谁赢 -> 看自动战斗 -> 看 verdict -> 再挑战反制阵容”吸引，并进入第二局和次日回访。
```

执行建议：

1. 先把 GA 数据纳入 ASO 决策：GA Data API 已可读，`npm run aso:insights` 会刷新 GA 日报并生成 ASO 待办；但 Play Console 的商店页曝光 -> 安装转化仍缺，所以每天真实花费仍不要超过 `USD 10`，且不做自动放量。
2. ASO 先从“自动对战”改成更强的“matchup prediction / verdict / counter”表达，截图顺序要让用户第一眼看到冲突、战斗和结算。
3. YouTube 先做低成本自然流量和素材验证，每天用现有脚本产出 3 条 Shorts 候选，再挑 1-3 条上传。
4. Meta 是第一批小预算 paid learning 的首选，但只有在支付方式、归因和事件读数可用后才加到 `USD 5-10/day`。
5. Google 先做 Play 商店页和素材优化；Google App Campaign 在 `USD 10/day` 阶段容易受预算/出价比例约束，只适合非常低 tCPI 的学习，不适合太早用 in-app action 优化。

## 当前证据

### 已确认可用

- `npm run ga:daily` 于 2026-06-23 复跑：采集链路 `7/7` 通过，GA Data API 已读取 property `539311512`，昨日 `17` active users / `161` events。
- `npm run aso:insights` 已接入：它会先刷新 GA 日报，再把 `game_start`、`game_end`、`next_day_return`、广告事件等翻译成 ASO/商店页行动项。
- 核心事件已覆盖：`game_start`、`first_battle_complete`、`second_battle_start`、`daily_match_complete`、`report_card_click`、`next_match_recommend_click`、`next_day_return`。
- 现有 ASO 包给出 readiness `82/100`，商店文案、截图脚本、合规 URL、评分策略已成型。
- YouTube 运营脚本已存在：`npm run ops:daily-youtube` 会录 9 个候选局，选 3 条 9:16 Shorts 素材，并输出标题、描述、标签和剪辑提示。
- 当前产品方向文档已把 Top 1 锚定在 `Matchup Prediction 斗蛐蛐`，而不是泛泛的自动对战。

### 当前阻塞

- Play Console 的 store listing acquisition、install source、keyword、country cohort 导出仍未接入。GA 能看应用内承接，但不能替代商店曝光 -> 安装转化。
- GA 昨日出现 `ad_request` / `ad_show` / `ad_close`，而当前代码和文档口径写的是现版本不展示广告；需要确认是否来自旧包、测试包或当前包仍在发广告事件，避免 Play Data safety / ASO 文案冲突。
- 在广告事件来源确认前，短期 pLTV/ROAS 不能真实计算，只能做保守学习预算。
- Meta ad account 已创建但没有支付方式；Meta Instant Games / Web Hosting 后台入口也仍有账号/后台访问阻塞。

## KPI 框架

### P0 放量前置指标

| 指标 | 定义 | 作用 |
| --- | --- | --- |
| Data API readable | `npm run ga:daily` 能读到昨日 GA 聚合事件 | 已满足；每日 ASO 洞察改用 `npm run aso:insights` |
| Store impressions -> installs | Play Console / App Store Connect 商店页转化 | 判断 ASO 是否拖累投放 |
| install/click -> `game_start` | 用户是否真的进入体验 | 判断广告/商店承诺是否匹配 |
| `game_start` -> `first_battle_complete` | 首局是否清楚、不卡、能完成 | 判断首局可读性 |
| `first_battle_complete` -> `second_battle_start` | 结算页是否产生再玩动机 | 判断核心循环 |
| D1 / D7 retention | 次日/七日留存 | 判断能否加预算 |

### 启动假设门槛

这些不是当前真实表现，而是第一轮读数的判定线：

| Gate | 初始继续线 | 如果低于继续线 |
| --- | ---: | --- |
| `game_start -> first_battle_complete` | 55-65% | 先改首局流程、战斗可读性和加载稳定性 |
| `first_battle_complete -> second_battle_start` | 20-30% | 先改 verdict、推荐下一局、反制按钮 |
| D1 retention | 至少有一个 cohort 明显不为零，并优于其他角度 | 做 daily champion / daily matchup |
| D7 retention | 小样本只看方向，不做硬门槛 | 等 cohort 足够后再放量 |
| CPI | 只能作成本 sanity check | 不用 CPI 单独决定 scale |

## ASO 策略

### 定位

把主承诺从：

```text
选择职业、道具或英雄，观看球球自动开战。
```

升级为：

```text
Pick a matchup. Watch the arena. Try the counter.
```

中文表达：

```text
先猜谁赢，再看球球自动开战，结算后挑战反制阵容。
```

继续避免在公开名称、关键词或文案里使用 `球球大作战`，避免商标和误导风险。也避免 `下注`、`赔率`、`梭哈`、`赌`、`真实斗蛐蛐` 这类表达。

### Google Play 实验优先级

1. 短描述实验
   - Current: `Pick professions and watch quick pixel-ball auto battles.`
   - Test A: `Pick a matchup. Watch pixel-ball auto battles. Try the counter.`
   - Test B: `Who wins: spear, shield, mage, or chaos weapons? Watch and retry.`
   - zh-CN Test: `选择对阵，观看球球自动开战，再挑战反制阵容。`
2. 截图顺序实验
   - 01：matchup question / active battle
   - 02：profession select with contrast
   - 03：result verdict and next match
   - 04：item chaos
   - 05：privacy/settings transparency
3. 关键词和长描述
   - en: `auto battle`, `battle simulator`, `pixel arena`, `casual strategy`, `heroes`, `weapons`, `offline`, `matchup`
   - zh: `自动对战`, `像素`, `休闲`, `策略`, `谁会赢`, `职业`, `道具`, `英雄`

### Apple App Store

如果 iOS 已上架或准备上架：

- Product Page Optimization 测 1 个变量优先，不要一轮同时改 icon、视频、截图和副标题。
- 第一轮 treatment 建议只改截图和 promotional text，主打 matchup prediction。
- Custom Product Pages 后续按流量来源拆：
  - `counter_matchup`
  - `item_chaos`
  - `daily_champion`

## YouTube 策略

YouTube 先承担两个角色：自然流量入口和 paid creative 预筛选器。

### 每日动作

1. 运行：

```bash
npm run ops:daily-youtube
```

2. 从候选池中只挑 1 条上传 Shorts；起号阶段不建议同日连发，避免分散推荐信号。
3. 每条视频都用“判断题”作为开头：
   - `Spear Ball vs Shield Ball: who wins?`
   - `The mage had 1 HP. Can it still win?`
   - `Bow Ball picked up a rocket. Fair fight?`
4. 描述区和置顶评论放商店链接，链接命名至少保留：

```text
utm_source=youtube
utm_medium=shorts
utm_campaign=organic_daily_YYYYMMDD
utm_content=<creative_id>
```

### 优化规则

| YouTube 信号 | 判断 | 动作 |
| --- | --- | --- |
| 前 3 秒低 | 开头问题不够尖锐，画面不够直接 | 第一帧直接放 matchup + 爆点画面 |
| 完播低 | 中段拖 | 砍掉等待过程，只保留 setup、turn、payoff |
| 评论低 | 缺少可争论点 | 开头改成选择题或判定题 |
| 点击商店低 | 视频好看但不想玩 | 结尾 CTA 改成“try the counter”而不是“download now” |

### 付费建议

在 `USD 10/day` 阶段，不建议把 YouTube 当独立大额买量渠道。先用自然 Shorts 选出 2-3 条留存更好的素材，再把赢家给 Meta 或 Google App Campaign 使用。

## Meta 策略

Meta 是第一批 paid learning 的首选，但必须先满足：

- Meta 广告账户有支付方式。
- App / landing / store 可以按 `campaign_id`、`adset_id`、`creative_id` 归因。
- GA 或 Meta App Events 能至少读到 `game_start`、`first_battle_complete`、`second_battle_start`。

### 预算

第一轮不超过：

```yaml
daily_cap: USD 5-10
duration: 3-5 days
total_batch: USD 25-50
geo: one low-to-mid-cost cluster only
recommended_geo: [PH, MY, TH, ID]
avoid_initial: [US, JP, KR]
```

不要把 `USD 10/day` 拆成多个国家、多个 ad set、多个优化目标。小预算最怕学习信号被切碎。

### Campaign 结构

```yaml
campaign: PBA_Learn_Meta_<geo>_<date>
objective:
  if app events readable: app promotion / installs
  if app events blocked: traffic to store or web playable only for creative learning
adset:
  targeting: broad, Android first if Play listing is live
  budget: USD 5-10/day
ads:
  A1/A2: counter_matchup
  B1/B2: item_chaos
  C1/C2: daily_champion
required_naming:
  creative_id: A1_counter_matchup_profession_duel
  creative_tags: counter_matchup, profession_duel, pick_a_side
```

### Meta 判读

- CTR 只判断 hook。
- CPC / CPI 只判断买量成本是否离谱。
- `first_battle_complete` 和 `second_battle_start` 才判断是否值得继续。
- 如果 CTR 高但 `first_battle_complete` 弱，说明广告承诺太 clickbait 或商店/首局不匹配，不能 scale。

## Google 策略

Google 先分成两个层次：Google Play ASO 和 Google Ads App Campaign。

### Google Play

优先做：

- store listing acquisition 导出。
- short description / screenshot experiment。
- preview video 或 9:16 gameplay clip，突出真实战斗，不要做纯标题卡。
- country / language breakdown，先找低成本且有自然转化的地区。

### Google Ads App Campaign

官方 App Campaign 建议预算与出价保持比例：install tCPI 的 daily budget 至少约为目标 CPI 的 50 倍；in-app action tCPA 也需要足够 action 量和预算支持。因此在 `USD 10/day` 阶段：

- 如果目标 CPI 不能低到约 `USD 0.10-0.20`，Google App Campaign 会很容易学习不足。
- 不要一开始用 tCPA / in-app action 优化，直到目标 action 每天至少有稳定量级。
- 第一轮只投一个国家或一个 geo cluster。
- 素材直接复用 YouTube Shorts 和 ASO 截图，不新开重制作。

建议顺序：

1. 先让 Play 商店页转化率可读。
2. 再用 install objective 小额测试。
3. 等 `first_battle_complete` / `second_battle_start` 每日量足够后，再考虑 in-app action 优化。

## 留存优化决策树

| 读数 | 解释 | 产品动作 | 投放动作 |
| --- | --- | --- | --- |
| CTR 高，`game_start` 低 | 广告吸引但商店/落地页承诺不接 | 改 ASO 首屏和截图 | 停止加预算 |
| `game_start` 高，`first_battle_complete` 低 | 首局不清楚、过慢或卡顿 | 强化开局提示、战斗可读性、性能 | 不 scale |
| `first_battle_complete` 高，`second_battle_start` 低 | 结算页不是下一局入口 | 加 verdict、counter、next match | 继续小额学习 |
| 第二局强，D1 弱 | 当天好玩但没有回访理由 | 加 daily champion / daily matchup | 暂停加预算，等 D1 改善 |
| D1 强，D7 弱 | 有新鲜感，长期目标弱 | 加轻进度、战报历史、常胜职业 | 可小幅加预算观察 |
| D1/D7 都强 | 有放量基础 | 准备 pLTV、广告变现或订阅/IAA 假设 | 扩到 `USD 20-30/day` |

## 加预算规则

### Level 0: `USD 0/day`

适用：Play cohort 不可读，或刚上架没有 store acquisition 数据。

动作：

- 跑 `npm run aso:insights`，确认 GA -> ASO 待办链路稳定。
- 跑 `npm run ops:growth-loop`，把 GA、ASO、YouTube 素材状态、归因和玩法断点汇总成当天行动队列。
- 每天 YouTube organic。
- 准备 6 条 paid creatives。
- 改 ASO screenshot / short description。

### Level 1: `USD 5-10/day`

适用：至少能按 campaign/creative 看 `game_start` 和首局完成。

动作：

- 只选 Meta 或 Google 其中一个 paid channel。
- 只跑一个 geo cluster。
- 3-5 天后读 cohort，不按当天 CTR 立刻判断。

### Level 2: `USD 20-30/day`

适用：

- 数据读数稳定。
- 至少一个 creative angle 同时赢 CTR、`first_battle_complete`、`second_battle_start`。
- D1 有方向性信号。

动作：

- winner mutation：赢家素材改 2-3 个变体。
- 增加一个相邻 geo 或一个新素材角度，不能同时大改。

### Level 3: `USD 50+/day`

适用：

- D7 cohort 有可解释趋势。
- pLTV 或广告变现假设可读。
- 商店页转化没有拖后腿。

动作：

- 拆 geo。
- 试 Google App Campaign 或更高预算 Meta。
- 准备 monetization/readout，不再只看 activation。

## Kill Rules

1. Play store acquisition / cohort 仍不可读时，不超过 `USD 10/day`。
2. 两个小批次都无法产生健康的 `first_battle_complete`，暂停投放，先修首局。
3. `first_battle_complete` 尚可但 `second_battle_start` 弱，暂停 scale，先修结算页和 next match。
4. D1 连续弱，先做 daily champion / daily matchup，不用 paid 强拉。
5. CPI 明显高于未来 pLTV 可能性，且 retention 无改善，kill 该 channel/angle。

## 运营节奏

### 每天

- 跑 `npm run aso:insights`。
- 跑 `npm run ops:growth-loop`，读取当天第一动作和 P0/P1 队列。
- 汇总昨日：
  - installs / first_open
  - `game_start`
  - `first_battle_complete`
  - `second_battle_start`
  - `next_match_recommend_click`
  - `next_day_return`
- 跑或检查 YouTube daily materials。
- 给出当天一个最重要动作。

### 每 72 小时

- 对每个 paid batch 做 cohort readout。
- 决定：kill、rewrite、iterate、hold、scale。
- 不在未满 72 小时的小样本上频繁改 campaign。

### 每周一

- ASO review：商店页转化、关键词、截图、短描述。
- Creative review：YouTube 前 3 秒、完播、点击，Meta/Google CTR/CPI。
- Retention review：D1/D7、第二局、next match。
- Budget decision：维持、降到 0、升到下一 level。

## 需要补齐的数据

用户本人需要处理：

- 从 Play Console 导出 store listing acquisitions、install source、country、keyword/search 相关报告。
- 如果要跑 Meta，添加支付方式并确认广告账户可以真实投放。
- 如果要跑 Google Ads，确认 Google Ads 与 Google Play / Firebase conversion tracking 绑定。

Codex 可以代办：

- 继续生成 YouTube Shorts 素材和 upload plan。
- 更新 ASO 文案、截图脚本、创意矩阵、campaign naming。
- 实现 campaign params 透传到 analytics payload。
- 生成 72 小时 cohort readout 模板。

## 本次引用来源

Local:

- `reports/ga-daily/ga-daily-2026-06-23.md`
- `reports/aso-insights/aso-insights-2026-06-23.md`
- `docs/aso-store-listing.md`
- `docs/analytics-events.md`
- `docs/ad-flow.md`
- `docs/youtube-ops-recording.md`
- `docs/douququ-growth-loop.md`
- `docs/paid-acquisition-small-budget-douququ.md`
- `docs/opportunity-radar-2026-06-22.md`
- `docs/meta-launch-plan.md`

Official:

- Google Ads App campaigns best practices: https://support.google.com/google-ads/answer/14104492
- Google Play preview assets: https://support.google.com/googleplay/android-developer/answer/9866151
- Apple Product Page Optimization: https://developer.apple.com/app-store/product-page-optimization/
- Apple Custom Product Pages: https://developer.apple.com/app-store/custom-product-pages/
