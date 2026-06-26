# 斗球球 Growth 指标框架

Updated: 2026-06-25

本框架把 `docs/generic-growth-metrics-integration-template.md` 落到斗球球当前阶段：封测 / 小预算学习 / ASO 和短视频素材验证。核心目标不是放大单日数字，而是判断这条链路是否成立：

```text
外部 matchup 承诺 -> 打开游戏 -> 开始首局 -> 完成首局 -> 结果页产生下一局 -> 次日回访或分享/评分
```

## 1. 当前增长命题

```text
哪一种 matchup / counter / daily-champion 素材承诺，能带来完成首局、启动第二局，并在次日回访的用户？
```

当前阶段结论：

- 封测样本小，Go / Hold / Stop 主要看链路是否可读、方向是否连续，而不是用行业均值硬判。
- 先把 `game_start`、首局完成、二局启动、回访、来源归因读稳，再考虑真实加预算。
- 广告事件目前属于历史 / 平台接入信号，当前构建正常运行时不应把 ad 事件当作核心收入结论。

## 2. 北极星与 KPI

北极星指标：

| 指标 | 口径 | 为什么是北极星 |
| --- | --- | --- |
| 有价值对局用户 | 在 7 天内至少完成 1 局，并至少触发一次二局、分享、评分或次日回访的用户 | 它同时要求用户进入核心玩法，并表现出继续看/继续玩/愿意传播的意图 |

本阶段主 KPI：

| KPI | 分子 | 分母 | 时间窗口 | 数据源 | 当前用途 |
| --- | --- | --- | --- | --- | --- |
| 开局率 | `game_start` 用户数 | `game_init_success` 用户数 | 日 / 72 小时 | GA / Firebase | 判断首屏、商店承诺、素材承诺是否把人带进核心体验 |
| 首局完成率 | `game_end` 或 `first_battle_complete` 用户数 | `game_start` 用户数 | 日 / 72 小时 | GA / Firebase | 判断首局是否够清楚、够短、性能是否可接受 |
| 二局启动率 | `second_battle_start` 用户数 | `game_start` 用户数 | 日 / 72 小时 | GA / Firebase | 判断结果页 verdict / counter / next-match 是否形成循环 |
| 早期回访信号 | `next_day_return` 用户数 | active users 或首局 cohort | 日 / cohort | GA / Firebase | 封测期先当方向信号；不能等同于 D1 cohort |

护栏指标：

| 护栏 | 口径 | 触发动作 |
| --- | --- | --- |
| 性能卡顿 | `performance_snapshot.long_frame_pct`、`jank_frame_pct`、`render_quality_change` | 如果完成率下降且卡顿升高，先修性能再改文案 |
| 广告干扰 | `ad_show`、`ad_close`、`rewarded_ad_grant` 与 `game_start` / `game_end` 的关系 | 当前构建若无广告，不能把广告事件当收入；若重新接入广告，必须看完成率和回访是否恶化 |
| 承诺一致性 | store / YouTube / UTM 的 `creative_id` 与游戏内 matchup 是否一致 | 只涨点击不涨开局或二局时，先修素材和商店承诺 |

## 3. 核心漏斗

| 漏斗步骤 | 事件 / 数据 | 成功信号 | 主要改动触点 |
| --- | --- | --- | --- |
| 来源进入 | Play Console acquisition、UTM、`traffic_source`、`traffic_campaign`、`creative_id` | 来源和素材能回流到核心事件 | 商店链接、YouTube 描述、短链、素材命名 |
| 游戏初始化 | `game_init_success` | 本地采集和 GA 面板均可读 | Firebase / Capacitor bridge / consent |
| 开始首局 | `game_start`、`first_battle_start` | `game_start / game_init_success` 持续接近或超过 50% | 首页 CTA、默认 matchup、商店首图 |
| 完成首局 | `game_end`、`first_battle_complete`、`daily_match_complete` | 首局完成率 60%+，且口径一致 | 战斗时长、可读性、性能 |
| 结果页循环 | `next_match_recommend_click`、`second_battle_start` | 二局启动率从 0 变成可读，并逐步接近 20% | verdict、counter 按钮、推荐理由 |
| 分享 / 评分 / 回访 | `match_recording_share`、`report_card_click`、`store_review_click`、`next_day_return` | 某个来源或素材角度能带来连续回访信号 | daily matchup、daily champion、分享卡 |

## 4. 归因字段与素材命名

所有自然流量、短视频、商店实验和小预算投放都要能回到同一组字段：

| 字段 | 用法 | 示例 |
| --- | --- | --- |
| `traffic_source` | 来源平台 | `youtube`、`play_store`、`meta` |
| `traffic_medium` | 媒介 | `shorts`、`organic`、`paid` |
| `traffic_campaign` | 批次 | `launch_learning_202606` |
| `traffic_content` | 素材内容 | `lance_vs_shield_01` |
| `creative_id` | 素材主键 | `yt_20260625_counter_lance_shield_a` |
| `campaign_id` | 广告或实验 ID | `gp_store_exp_01` |

推荐 `creative_id`：

```text
<channel>_<yyyymmdd>_<angle>_<matchup>_<variant>
```

示例：

```text
yt_20260625_counter_lance_shield_a
gp_20260625_daily_champion_items_b
meta_20260625_prediction_railgun_loop_a
```

## 5. 数据质量验收

每日先验收链路，再解读指标：

- `docs/analytics-events.md` 和 `services.js` 的事件名一致。
- 核心事件在代码中实际引用：`game_init_success`、`game_start`、`game_end`、`first_battle_start`、`first_battle_complete`、`second_battle_start`、`daily_match_complete`、`next_match_recommend_click`、`next_day_return`。
- UTM / `creative_id` 能被保存，并附加到核心漏斗事件。
- `reports/ga-daily/` 有最近一次可读 GA 报告；若没有凭据，先补 `GA4_ACCESS_TOKEN` 或 `GOOGLE_APPLICATION_CREDENTIALS`。
- 若 GA Data API 能读，但 `creative_id` / `start_source` / `recommendation_reason` 不能查，需要在 GA4 注册 event-scoped custom dimensions。
- `next_day_return` 只是早期回访信号；D1 / D7 必须按 cohort 计算。

## 6. Go / Hold / Stop

Go：只在以下条件同时满足时考虑扩大到 `USD 10/day` 以上。

- Play Console acquisition 可读，并能和 GA 漏斗并排看。
- 至少 3 条新鲜素材能通过 `creative_id` 回流到 `game_start` 和 `second_battle_start`。
- `game_start / game_init_success >= 50%`。
- `game_end / game_start >= 60%`，且首局完成口径已解释清楚。
- `second_battle_start / game_start >= 20%`。
- 至少一个来源 / 素材角度出现连续回访信号，且性能护栏没有恶化。

Hold：继续小样本学习。

- GA 可读，但 Play acquisition、YouTube retention 或 custom dimensions 仍缺。
- 上游变好，下游还没确认，例如点击或开局提升但二局还弱。
- DAU / cohort 太小，不足以判断留存，只能看方向。

Stop：暂停对应素材或产品改动。

- 两轮素材后只涨点击，不涨开局、首局完成或二局启动。
- 二局入口点击上涨，但 `game_end / game_start` 或性能护栏明显恶化。
- 数据口径不可信，例如事件文档和代码不一致，或 GA 面板持续不可读。

## 7. 72 小时实验队列

### 实验 A：结果页 counter 主按钮

假设：如果结果页把主按钮从普通“下一局”改成更明确的 counter / verdict 承诺，则 `next_match_recommend_click / game_end` 和 `second_battle_start / game_start` 会改善，因为用户知道下一局要验证什么。

| 版本 | 改动 | 主指标 | 护栏 |
| --- | --- | --- | --- |
| A | 当前结果页 | `next_match_recommend_click / game_end` | `game_end / game_start` |
| B | 强化 verdict + counter CTA | `second_battle_start / game_start` | 性能和首局完成率不能下降 |

继续线：72 小时内 `next_match_recommend_click` 和 `second_battle_start` 非零，且方向优于 A。

### 实验 B：素材承诺与首屏一致

假设：如果 YouTube / Play 首图都使用 “Pick a matchup. Watch the arena. Try the counter.” 的同一承诺，则 `game_start / game_init_success` 会改善，因为外部期待和游戏内第一步一致。

| 版本 | 改动 | 主指标 | 护栏 |
| --- | --- | --- | --- |
| A | 当前素材 / 商店页 | `game_start / game_init_success` | `game_end / game_start` |
| B | matchup 问题首图 + 同款首页 CTA | `game_start by creative_id` | 只涨点击不涨开局即停止 |

继续线：至少一个 `creative_id` 的开局率连续两个观察窗口更好。

### 实验 C：daily matchup 回访理由

假设：如果用户看到每日对阵 / 每日冠军承诺，则 `next_day_return` 和后续 D1 cohort 会改善，因为回访理由从“再玩一把”变成“今天看谁赢”。

| 版本 | 改动 | 主指标 | 护栏 |
| --- | --- | --- | --- |
| A | 当前回访体验 | `next_day_return` | `game_start / game_init_success` |
| B | daily matchup / champion 文案和素材 | D1 cohort | 不牺牲首局完成 |

继续线：样本小于 30 人时只要求 `next_day_return` 持续非零；样本达到 30-100 人后再看 cohort。

## 8. 验证命令

```bash
npm run growth:verify
```

该命令检查：

- 专用 growth 框架文档是否覆盖北极星、KPI、漏斗、归因、实验和 Go / Hold / Stop。
- 核心事件是否在 `services.js` 常量、`docs/analytics-events.md` 文档和 `game.js` 引用中同时存在。
- UTM / `creative_id` 归因字段是否接入。
- 最近 GA 日报是否存在且可读；若 GA 已可读，则提示当前关键漏斗的实际状态和样本限制。
