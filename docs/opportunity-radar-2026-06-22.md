# 小游戏机会雷达与买量工程闭环

Run date: 2026-06-22
Project: `斗球球` / `Profession Ball Arena`
Repo: `/Users/zhengjinyang/Documents/球球大作战/bangbang-battle`

## 结论先行

本期 Top 1 仍建议推进“斗蛐蛐式 matchup prediction”，但要从泛泛的“自动对战”升级为“先猜谁赢，再看结果，再挑战反制阵容”。原因是当前工程已经有职业/道具/英雄自动战斗、结算推荐、战报分享、每日进度和核心埋点，MVP 改动小；外部信号也显示 auto-battler、backpack/idle auto battle、AI 互动小游戏和混合休闲仍有可买量测试空间。

本期不建议立刻开真实大预算投放。先做 100-300 USD 小预算学习批次：6 条 9:16 创意 -> cohort readout -> 改产品/商店/素材 -> scale or kill。判定不能只看 CTR 或安装量，必须看 `game_start`、`first_battle_complete`、`second_battle_start`、D1/D7 和早期 pLTV 假设。

## SourceLog

检索日期均为 2026-06-22。Google Trends 可作为手工复核入口；本次可追溯替代信号优先使用公开页面、商店页和行业文章。

| Source | Date signal | Used for |
| --- | --- | --- |
| Google Trends Explore: https://trends.google.com/trends/explore | live tool, checked 2026-06-22 | 手工复核 `auto battler`、`AI game maker`、`mini game`、`block puzzle` |
| Trends24 YouTube: https://youtube.trends24.in/ | checked 2026-06-22 | 游戏内容趋势替代信号，YouTube 游戏视频热度 |
| Exploding Topics Gaming: https://explodingtopics.com/gaming-regular-topics | June 2026 | 游戏趋势池、搜索增长替代源 |
| Deconstructor of Fun, State of Mobile 2026: https://www.deconstructoroffun.com/blog/2026/2/2/state-of-mobile-2026 | 2026-02 | hybridcasual revenue / hypercasual engagement macro signal |
| MiniReview auto-battlers: https://minireview.io/top-mobile-games/best-auto-battlers-mobile | 2026 | 移动 auto-battler 竞品集合 |
| Backpack Brawl Google Play: https://play.google.com/store/apps/details?id=com.rapidfiregames.backpackbrawl | checked 2026-06-22 | backpack + auto-battle 定位 |
| Super Auto Pets Google Play: https://play.google.com/store/apps/details?id=com.teamwood.spacewood.unity | checked 2026-06-22 | 轻策略宠物自动战斗定位 |
| Aippy Google Play: https://play.google.com/store/apps/details?id=com.nadaai.aippy | updated 2026-06 | AI game maker / interactive feed signal |
| Google I/O AI games post: https://blog.google/innovation-and-ai/technology/developers-tools/io-save-the-date-2026-gemini/ | 2026-03 | AI 影响小游戏机制的主流化信号 |
| Block Blast Google Play: https://play.google.com/store/apps/details?id=com.blockblast.vn | checked 2026-06-22 | 高可读、低门槛 puzzle 广告素材参照 |
| Mob Control Google Play: https://play.google.com/store/apps/details?id=com.vincentb.MobControl | checked 2026-06-22 | 数量增长、门槛倍增、轻策略爽点参照 |
| Supercell Squad Busters FAQ: https://supercell.com/en/news/squad-busters-faq/ | 2025-10 / servers into 2026 | 大厂轻队伍构筑产品也可能因循环不足退出，作为风险提醒 |
| Google Play release doc: `docs/google-play-release.md` | updated 2026-06-15 | Android 上架门禁 |
| Paid acquisition doc: `docs/paid-acquisition-small-budget-douququ.md` | updated 2026-06-16 | 小预算买量闭环 |

## OpportunityRadar

评分口径：`Fit` 当前工程适配度，`Market` 外部信号强度，`UA` 买量素材可测试性，`Risk` 反向扣分后综合。满分 100。

| Rank | Opportunity | Score | 风险 | 适合壳子 | SEO/ASO keywords | MVP | 买量角度 | 素材成本 | 广告/分享点位 |
| ---: | --- | ---: | --- | --- | --- | --- | --- | --- | --- |
| 1 | Matchup Prediction 斗蛐蛐 | 88 | 斗蛐蛐文案易误读成赌博/动物斗，需要避开赔率、下注和真实动物 | 现有 classic/super/heroes 自动对战 | auto battler, battle simulator, pixel arena, 斗球球, 自动对战, 谁会赢 | 1-2 天 | “长矛球 vs 盾牌球，谁会赢？” | 低：直接录 6 条 9:16 | 开局预测、结算反制、战报卡、下一场推荐 |
| 2 | Weird Item Arena | 81 | 随机性太强会削弱策略感；需要首 3 秒可读 | 现有 item mode | item battle, weapon pickup, random arena, chaos battle | 1-2 天 | “弓箭球捡到火箭筒会怎样？” | 低-中：需录爆点镜头 | 道具拾取特写、结算 MVP 道具、分享战报 |
| 3 | Daily Champion | 76 | D1 不一定起来，需足够每日变化 | daily progress + seeded matchup | daily challenge, champion, daily arena, 每日球王 | 2-3 天 | “今天的球王是谁？” | 低 | 首页每日入口、结算冠军卡、push/分享标题 |
| 4 | AI-style Commentary Battle | 73 | 真 AI 成本和审核不确定；先做模板，不接模型 | battle-danmaku + reports | AI commentary, battle recap, AI arena, 解说对战 | 2-4 天 | “AI 解说这场斗球有多离谱” | 中：需要字幕包装 | 战斗弹幕、结算三句点评、短视频字幕 |
| 5 | Backpack-lite Build Duel | 70 | 现有不是背包格子；若重做 UI 成本上升 | item mode + pre-match loadout | backpack battler, inventory battle, gear synergy | 4-7 天 | “3 件装备能不能打赢满血盾牌？” | 中 | 选择装备页、战斗 combo、装备结算 |
| 6 | Mob Multiplier Ball Clash | 66 | 偏离现有核心，物理/数量玩法可能要重平衡 | ballCount + gates prototype | mob control, crowd battle, multiply army, 球球倍增 | 5-8 天 | “穿过 x3 门，球群能反杀吗？” | 中 | 倍增门、数量反杀、失败重试 |
| 7 | AI Mini-game Feed / Remix | 58 | 平台级产品，内容供给和审核成本高；不适合当前单项目立刻做 | official-site / web wrapper | AI game maker, mini game feed, interactive meme | 8-15 天 | “每次打开一个新奇小局” | 高 | feed 卡片、生成/试玩、分享链接 |

## ProductThesis

```yaml
type: ProductThesis
project_or_opportunity: Matchup Prediction 斗蛐蛐
target_user:
  - 喜欢短视频式“先猜后看”的轻策略用户
  - 喜欢 auto-battler 但不想长时间配阵容的休闲玩家
  - 对像素、道具、职业反制有好奇心的低门槛玩家
core_loop: 选择或接受推荐 matchup -> 猜谁赢 -> 20-40 秒自动战斗 -> 看胜负 verdict -> 一键挑战反制阵容/分享战报
design_differentiation:
  - 竖屏像素球球竞技场，角色职业和道具一眼可读
  - 每局只回答一个强问题：谁会赢，为什么赢
  - 结算页不是结束页，而是下一场反制挑战入口
hybrid_casual_layer:
  - 每日球王/每日反制题
  - 战报图、胜率回顾、常胜职业统计
  - 后续可加外观收集或英雄/道具 mastery，不先做重养成
retention_logic:
  - D0: 用 prediction 和反制推荐拉第二局
  - D1: 每日 champion / 今日题目拉回访
  - D7: 常胜职业、战报历史、可分享 matchup 累积轻 meta
monetization_logic:
  - 当前版本无广告，先验证核心留存
  - 后续 IAA 优先：结算后 rewarded encore / battle report export / daily extra challenge
  - 不在首局前插广告，避免破坏 `first_battle_complete`
why_now:
  - auto-battler 和 backpack/idle auto battle 在移动端仍有商店信号
  - AI game maker 和互动小游戏 feed 抬高了用户对“快速可玩小局”的认知
  - 当前工程已有模式、战报、推荐、埋点和合规页面，能用小改动测试
risk_controls:
  - 不使用下注、赔率、赌、梭哈、现金等文案
  - 不使用真实动物斗争或未授权 IP
  - 不承诺“AI 生成”除非实际接入并完成合规披露
```

## PaidAcquisitionPlan

```yaml
type: PaidAcquisitionPlan
project: 斗球球 / Profession Ball Arena
objective: 小预算学习，而不是立即规模化
geo:
  first_batch: [PH, MY, TH, ID]
  zh_test: [TW, HK]
  avoid_initial: [US, JP, KR]
channel:
  primary: Meta Reels / Facebook feed traffic or app-event test
  secondary: TikTok traffic if short-video ops ready
budget_cap:
  first_batch: USD 100-300
  per_cell: USD 15-30
  duration: 3-5 days
audience_segments:
  competitive_prediction: 喜欢预测胜负/反制关系
  nonsense_fun: 喜欢随机道具和离谱反杀
  spectator: 低操作、看一场就懂
creative_matrix:
  intro:
    - counter_matchup: "长矛球 vs 盾牌球，谁会赢？"
    - weird_item: "弓箭球捡到火箭筒会怎样？"
    - daily_champion: "今天的球王是谁？"
  gameplay:
    - profession_duel
    - item_chaos
    - comeback_moment
  cta:
    - pick_a_side
    - try_next_match
    - watch_the_result
  endcard:
    - douqiuqiu_verdict
    - profession_ball_arena
    - daily_winner
events:
  acquisition_context:
    - campaign_id
    - adset_id
    - creative_id
    - creative_tags
    - geo
    - channel
    - landing_target
  product:
    - game_start
    - first_battle_complete
    - second_battle_start
    - daily_match_complete
    - report_card_click
    - next_match_recommend_click
    - next_day_return
kpis:
  ctr: hook quality only
  cvr: click-to-game_start or click-to-install
  cpi: directional, not scale trigger alone
  d1_retention: early product gate
  d7_retention: scale gate after enough cohort size
  arpdau: only after ads/reward placements are live
  ltv: pLTV based on retention x ad impressions x eCPM
  roas: do not use for first tiny batch except sanity check
readout_loop:
  - small_budget_learning
  - cohort_readout_by_creative_geo_landing
  - product_store_creative_iteration
  - second_learning_batch
  - scale_or_kill
kill_rules:
  - CTR wins but `first_battle_complete` weak: kill or rewrite promise; do not scale
  - `first_battle_complete` ok but `second_battle_start` weak: improve result recommendation before more spend
  - D1 remains weak after daily champion test: pause paid UA and fix retention layer
  - CPI far above plausible pLTV in two batches with no retention signal: kill channel/angle
scale_rules:
  - one angle wins CTR and has acceptable `game_start` conversion
  - `first_battle_complete` and `second_battle_start` both beat baseline
  - D1 has at least one cohort worth a second batch
  - compliance and store pages match actual SDK/ad behavior
```

## EngineeringHandoff

```yaml
type: EngineeringHandoff
repo: /Users/zhengjinyang/Documents/球球大作战/bangbang-battle
project: 斗球球 / Profession Ball Arena
suggested_branch: feature/matchup-prediction-radar
suggested_issue: "Add matchup prediction framing and UA cohort tags"
files_or_modules:
  - game.js
  - game-config.js
  - i18n.js
  - services.js
  - tests/services.test.js
  - tests/game-config.test.js
  - docs/analytics-events.md
  - docs/aso-store-listing.md
implementation_steps:
  - Add pre-battle prediction prompt for non-item scenes: "谁会赢？A / B".
  - Persist prediction choice per match and include it in result verdict copy.
  - Ensure result screen recommendation stays prominent and explains the counter reason.
  - Add URL/campaign param ingestion for `campaign_id`, `creative_id`, `creative_tags`, `geo`, `channel`, `landing_target` where available.
  - Forward acquisition context into analytics payloads without collecting personal identifiers.
  - Add/update i18n strings for zh-CN and en first; leave other locales with safe fallback if needed.
  - Update ASO screenshots/video scripts after UI change.
qa_commands:
  - npm run lint:syntax
  - npm test
  - npm run test:matchups
  - npm run build
  - npm run aso:screenshots
done_definition:
  - First launch consent still gates analytics.
  - A new player can start battle, choose prediction, finish battle, see verdict, and start recommended next match.
  - Existing events still fire; new acquisition fields appear only when provided.
  - No gambling/odds/stake wording appears in UI, store copy, or ad copy.
  - Google Play and Meta package builds still pass existing artifact checks.
```

## GooglePlayGate

如果本期测试落到 Android / Google Play，发版前必须复核：

| Gate | Current expected value / action |
| --- | --- |
| `privacy_url` | `https://professionballarena.top/privacy/` |
| `support_url` | `https://professionballarena.top/support/` |
| `data_deletion_url` | `https://professionballarena.top/data-deletion/` |
| `in_app_delete_path` | Settings / support path should point users to data deletion instructions; no account deletion because app has no account |
| `reviewer_access` | No login required; reviewer path: accept policy -> Start Game -> choose mode/profession -> Start -> result |
| Data safety | Must match Firebase Analytics / Facebook App Events and actual ad SDK behavior at submission time |
| Ads | Current build says no runtime ads; if rewarded/banner/app-open is added, Play Ads declaration and Data safety must change |
| Content rating | Mild cartoon/fantasy combat, no blood, no gambling, no UGC/chat |
| Target audience | Not child-directed; current guidance 13-15, 16-17, 18+ |

## ActionSplit

Codex 可直接代办：

- 实现 matchup prediction UI、结算 verdict、campaign param 透传和事件字段。
- 生成 6 条录屏候选素材与更新 ASO 截图脚本。
- 更新 `docs/analytics-events.md`、`docs/aso-store-listing.md`、Play/Meta handoff 文档。
- 执行本地 `npm run test:ci`、AAB/Meta ZIP 校验和官网构建。

需要用户本人处理：

- 登录 Meta / Google Play / 广告账户，上传、保存、提交、付款、提审。
- 确认是否开启真实广告 SDK、AdMob、Meta Audience Network 或付款方式。
- 提供真实投放预算上限、目标国家/地区和是否接受英文/中文双语素材。

需要工程协作 / PR：

- 如果要接真实归因 SDK 或 ad network SDK，需要单独 PR，且同步 Data safety、Ads declaration、隐私政策。
- 如果要做 backpack-lite 或 AI feed，需要新 issue 拆分产品范围，不应混入本期 Top 1 小改动。
- 如果要规模化 UA，需要补 cohort dashboard 或至少导出 Firebase/Meta event readout 表。

## NextBatch

1. 开分支 `feature/matchup-prediction-radar` 做 Top 1 P0。
2. UI 完成后录 6 条 9:16 素材：A1/A2 counter, B1/B2 item chaos, C1/C2 daily champion。
3. 小预算测试只启动一个 geo cluster，命名强制包含 creative tags。
4. 72 小时后按 cohort 读 `first_battle_complete`、`second_battle_start`、D1，而不是只按 CTR 排名。
