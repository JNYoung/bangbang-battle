# 斗球球增长闭环

Updated: 2026-06-16

This is the project-local operating loop for moving `斗球球` toward a "斗蛐蛐" style game discovery and growth system.

## Current Focus

```text
斗蛐蛐类型发掘 -> 产品论证 -> 差异化设计 -> 小预算买量学习 -> 数据分析 -> 产品/素材/商店页迭代 -> 上架/运营
```

## Growth Efficiency Readout

This file is useful because it turns growth work into a short learning loop instead of a vague content backlog. For `斗球球`, the highest-efficiency lever is:

```text
external matchup signal -> playable matchup in-game -> short-video proof -> second-battle recommendation -> event readout
```

What already works:

- It focuses the game promise on prediction, counter-pick, verdict, and next-match intent.
- It names the exact funnel events needed to decide whether a creative is only good at CTR or actually creates another battle.
- It keeps paid acquisition gated behind honest store copy, compliance URLs, and kill/scale rules.

What must be added each update cycle:

- A weekly content-intake note with source, observed hook, and how it maps to role / hero / item / mode.
- At least one playable in-game matchup for every external creative angle before spend.
- A result-screen next-match route for the new content, so a new role is not a dead-end novelty.
- A short-video capture script for each new matchup, with the first 3 seconds written before recording.

Engineering expansion rule:

- New roles, heroes, and modes may add richer animation, collision, projectile, trap, summon, terrain, or physics behavior when the first 3 seconds become more readable because of it.
- Prefer extending shared combat primitives when a mechanic can be reused by future content.
- Strongly recommend a refactor before adding a feature that requires repeated one-off branches across update, collision, skill, and render paths.
- Refactor trigger examples: a third bespoke projectile family, a second independent collision side-effect pipeline, hero skills needing per-hero hard-coded dispatch, or any feature that makes matchup simulation hard to reason about.

Current integrated update:

- `docs/growth-content-intake-2026-06-16.md`
- New super profession: `railgun` / 磁轨球.
- New hero: `stormEngineer` / 磁暴工匠.
- New daily matchup entries: `railgunCheck`, `loopBreaker`, `stormLab`.

## Local Docs

Use these docs together:

- `docs/douququ-opportunity-radar.md`: "斗蛐蛐" category definition, market signals, product thesis, opportunity directions.
- `docs/growth-content-intake-2026-06-16.md`: external trend intake, playable content mapping, and update queue.
- `docs/paid-acquisition-small-budget-douququ.md`: small-budget creative/product learning plan.
- `docs/analytics-events.md`: existing event schema and Firebase/Facebook event paths.
- `docs/ad-flow.md`: current AdMob / Meta / mock ad placement flow.
- `docs/aso-store-listing.md`: store listing, positioning, screenshots, compliance URLs.
- `docs/google-play-release.md`: Google Play release details.
- `docs/social-sharing-deeplinks.md`: share/deeplink loop.
- `docs/review-feedback-retention.md`: review and retention prompts.

## Workflow

### 1. Research

Goal: keep discovering "watch battle / matchup prediction / auto battler" opportunities.

Inputs:

- Chinese "电子斗蛐蛐 / 赛博斗蛐蛐" references.
- overseas `auto battler`, `creature arena`, `pet battler`, `team builder` references.
- ad-library and short-video patterns.
- current store ranking and competitor pages.

Output:

- 3-5 opportunity cards.
- one selected experiment.

### 2. Product Thesis

For each selected experiment, answer:

- Who is watching?
- What do they predict or compare?
- What makes the first 3 seconds readable?
- Why will they start a second battle?
- What daily/progression hook exists after the first session?

Default thesis:

```text
斗球球 should shift from "auto-battle description" to "matchup prediction and verdict".
```

### 3. Design Differentiation

Prioritize:

- matchup title before battle.
- visible profession/item contrast.
- readable outcome and winner verdict.
- next-match recommendation.
- shareable result card.

Avoid:

- generic "many roles and items" copy without conflict.
- long tutorial before first battle.
- gambling words or real-money implication.

### 4. Store / Landing Page

Store promise should match ads:

```text
Pick a matchup. Watch the arena. Try the counter.
```

Screenshot order should show:

1. active battle.
2. profession matchup setup.
3. item chaos.
4. result verdict / next matchup.
5. settings/privacy transparency.

### 5. Paid Acquisition

Run small-budget learning batches only after:

- landing/store page is honest.
- events are uploadable.
- privacy/support/data deletion URLs are valid.
- no real-money or gambling framing exists.

First test:

```text
长矛球 vs 盾牌球，谁会赢？
```

### 6. Operations

Weekly operating questions:

- Which matchup produced the strongest second battle rate?
- Which creative tag won?
- Which result-screen recommendation produced another match?
- Which mode is best for short video: profession, item, or hero?
- Did ads disrupt retention or result-screen actions?

### 7. Data Analysis

Read events by creative tag if possible:

- `game_start`
- `first_battle_complete`
- `second_battle_start`
- `daily_match_complete`
- `report_card_click`
- `next_match_recommend_click`
- `next_day_return`
- `ad_show`
- `rewarded_ad_grant`

Decision map:

| Signal | Decision |
| --- | --- |
| CTR high, game_start weak | ad/store mismatch |
| game_start strong, first_battle_complete weak | first flow unclear |
| first_battle_complete strong, second_battle_start weak | result/next-match hook weak |
| second_battle_start strong, next_day_return weak | add daily champion/matchup |
| retention strong, ARPDAU weak | tune ad placement/reward value |

## Near-Term Backlog

P0:

- Prepare 6 short creative scripts for the first matchup-prediction batch.
- Capture clean 9:16 videos from profession and item modes.
- Build a campaign readout sheet with `creative_id`, `creative_tags`, spend, clicks, play starts, first completion, second battle.

P1:

- Improve result-screen verdict copy.
- Make next-match recommendation more prominent.
- Add daily matchup/champion design spec.

P2:

- Add templated AI-style commentary after battle.
- Add share/deeplink for exact matchup.
- Add creative-specific landing page variants.

## Done Definition For First Batch

- 6 creatives exist.
- one landing/store page promise exists.
- event readout path is known.
- budget cap is written.
- kill/scale rules are written.
- user confirms before any real ad spend.
