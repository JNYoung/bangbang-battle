# 小预算买量学习计划：斗蛐蛐方向

Updated: 2026-06-16

This is a learning-first paid acquisition plan for `斗球球` / `Profession Ball Arena`. The goal is not immediate scale. The goal is to discover which "斗蛐蛐" premise can attract users and lead to a second battle.

## Budget

Start with one learning batch:

```yaml
budget_cap: USD 100-300
duration: 3-5 days
goal: creative/product learning
do_not_optimize_for: installs alone
primary_question: which promise makes users start and complete battles?
```

Suggested split:

| Cell | Spend |
| --- | ---: |
| 3 creative angles x 2 variants | USD 15-30 each |
| Reserve for winner mutation | 20-30% of budget |

If budget is closer to USD 100, test 3 angles with 1-2 variants each. If budget is closer to USD 300, test 3 angles x 3 variants.

## Channel

First choice:

- Meta / Facebook Reels traffic or app event test when setup is ready.

Second choice:

- TikTok Spark/traffic test if short-video operations are ready.

Avoid for first batch:

- broad install optimization without clean event readout.
- multiple geos at once.
- expensive tier-1-only testing before creative signal exists.

## Landing Target

Use one of:

1. Web playable / official site if the goal is fastest creative learning.
2. Google Play closed/internal listing if install-event tracking is already clean.
3. Meta Instant Games if the ad + playable path is smoother.

For first learning, a Web playable can be enough if events are captured:

- `game_start`
- `first_battle_complete`
- `second_battle_start`
- `daily_match_complete`
- `report_card_click`
- `next_match_recommend_click`

## Creative Matrix

### Audience Segments

```yaml
competitive:
  promise: predict the winner, beat the matchup
  emotion: challenge
  hook: "长矛球 vs 盾牌球，谁会赢？"
nonsense_fun:
  promise: weird item chaos
  emotion: surprise
  hook: "弓箭球捡到火箭筒会怎样？"
spectator:
  promise: quick low-effort watch battle
  emotion: curiosity
  hook: "30 秒看一场像素斗技"
```

### Module Tags

```yaml
intro:
  - counter_matchup
  - weird_item
  - daily_champion
gameplay:
  - profession_duel
  - item_chaos
  - comeback_moment
cta:
  - pick_a_side
  - try_next_match
  - watch_the_result
endcard:
  - profession_ball_arena
  - douqiuqiu_verdict
  - daily_winner
```

### First Batch

| Creative | Intro | Gameplay | CTA | Endcard |
| --- | --- | --- | --- | --- |
| A1 | counter_matchup | profession_duel | pick_a_side | douqiuqiu_verdict |
| A2 | counter_matchup | comeback_moment | try_next_match | profession_ball_arena |
| B1 | weird_item | item_chaos | watch_the_result | douqiuqiu_verdict |
| B2 | weird_item | comeback_moment | pick_a_side | profession_ball_arena |
| C1 | daily_champion | profession_duel | try_next_match | daily_winner |
| C2 | daily_champion | item_chaos | watch_the_result | daily_winner |

## Event Readout

Existing project events already cover most of the first readout.

| Question | Event / field |
| --- | --- |
| Did ad promise lead to play? | click -> `game_start` |
| Did user understand first round? | `first_battle_complete` |
| Did user want one more? | `second_battle_start` |
| Did result create share/report interest? | `report_card_click` |
| Did recommendation work? | `next_match_recommend_click` |
| Did ads hurt the flow? | `ad_request`, `ad_show`, `ad_close`, `rewarded_ad_grant` |
| Did user return later? | `next_day_return` |

Recommended extra fields when campaign data is available:

```yaml
campaign_id:
adset_id:
creative_id:
creative_tags:
geo:
channel:
landing_target:
```

If these are not in the app yet, preserve them in campaign naming and readout spreadsheets until attribution plumbing is ready.

## First Readout Thresholds

Use these as directional gates, not final business targets:

| Signal | Continue if | Action if weak |
| --- | --- | --- |
| CTR | one creative angle clearly beats others | change first 3 seconds |
| Play start rate | clicks become `game_start` at a reasonable rate | fix landing/store promise |
| First battle complete | users finish the first fight | simplify start flow and battle clarity |
| Second battle start | users start another fight | improve result screen recommendation |
| D1 return | at least one segment shows promise | add daily champion / daily matchup |

Do not scale from CTR alone. A clicky video that does not produce `first_battle_complete` is a misleading promise.

## Product Iterations To Prepare

P0 before spend:

- Ensure landing/store screenshots show actual gameplay.
- Confirm analytics consent and event upload path.
- Confirm privacy/support/data deletion URLs are valid.
- Keep real-money/gambling wording out of ad copy.

P1 for the first batch:

- Add or emphasize matchup title before battle.
- Make result verdict clearer.
- Add next-match recommendation button on result screen if not already prominent.
- Capture clean 9:16 videos for profession duel and item chaos.

P2 after first readout:

- Daily champion card.
- Saved favorite matchup.
- Lightweight AI-style commentary templates.
- Creative-specific landing screenshots.

## PaidAcquisitionPlan

```yaml
type: PaidAcquisitionPlan
project: 斗球球 / Profession Ball Arena
geo: start with one low-to-mid cost English-friendly geo, then compare zh-CN audience separately
channel: Meta Reels or TikTok traffic/app event test
campaign_goal: validation
budget_cap: USD 100-300
target_audience_segments:
  - competitive / prediction
  - nonsense_fun / item chaos
  - spectator / quick watch battle
creative_matrix:
  intro: [counter_matchup, weird_item, daily_champion]
  gameplay: [profession_duel, item_chaos, comeback_moment]
  cta: [pick_a_side, try_next_match, watch_the_result]
  endcard: [profession_ball_arena, douqiuqiu_verdict, daily_winner]
tracking:
  attribution: campaign/adset/creative naming first; SDK attribution later
  events: [game_start, first_battle_complete, second_battle_start, daily_match_complete, report_card_click, next_match_recommend_click, next_day_return]
  cohorts: creative_tag x geo x landing_target
kpis:
  cpi: directional only in first batch
  ctr: creative hook signal
  cvr: ad-to-play or ad-to-install signal
  d1_retention: early product signal
  d7_retention: only after enough users
  arpdau: not primary in first batch
  ltv: pLTV estimate after retention and ad events
  payback_window: not used for first batch scaling
kill_rules:
  - two batches fail to produce first_battle_complete and second_battle_start lift
  - winning creative promise cannot be represented honestly in product/store
  - CPI is far above plausible pLTV with no retention signal
scale_rules:
  - one angle wins CTR and produces first-battle completion
  - second-battle start is healthy enough to justify product iteration
  - store/compliance gates are clean
product_iteration:
  - strengthen result screen verdict
  - add daily matchup/champion if D1 is weak
  - improve battle readability if first completion is weak
store_iteration:
  - test screenshots around matchup prediction
  - use actual gameplay and result card, not abstract title cards
next_action: prepare 6 short creatives and a campaign readout sheet before spend
```

## One-Sentence Creative Brief

```text
Make users curious enough to predict a matchup, then prove the game gives a fast, readable, surprising result.
```

