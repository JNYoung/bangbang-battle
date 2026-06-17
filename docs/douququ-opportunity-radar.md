# 斗蛐蛐类型机会雷达

Updated: 2026-06-16

This document moves the mini-game opportunity radar into `斗球球` / `Profession Ball Arena`, with a specific focus on "斗蛐蛐" style games: choose, configure, watch, compare, and iterate.

## Definition

For this project, "斗蛐蛐" does not mean gambling or real animal fighting. It means:

```text
select contender -> set matchup/rules -> watch automatic battle -> compare result -> try another build
```

Good variants:

- auto-battle arena.
- creature / pet / ball matchup simulator.
- AI commentary battle.
- roster draft + watch fight.
- item/skill build experiment.
- asynchronous "my build vs your build" challenge.

Avoid:

- real-money betting.
- gambling language such as stake, odds, cashout,本金.
- real animal cruelty themes.
- unlicensed characters, sports teams, or celebrity/IP matchups.

## Market Signals

### Chinese "electronic cricket fighting" signal

Chinese users use "电子斗蛐蛐" for games where the pleasure is watching simulated or AI-controlled fighters resolve a battle. Examples and observations:

- Bilibili/YouTube list-style content recommends Steam war-simulation and auto-battle titles under "电子斗蛐蛐".
- 游戏陀螺 reported "赛博斗蛐蛐" livestream rooms for AI-native real-time PvP, where viewers enjoy prompt/strategy choices and watching AI adjudicate battles.
- Steam Workshop descriptions for "电子斗蛐蛐" emphasize "pick a fighter", build styles/skills/equipment, then watch rounds resolve.
- Zhihu discussions frame auto-battle as low-effort entertainment, fast strategy validation, and content suitable for watching.

### Overseas auto-battler signal

Adjacent overseas tags:

- `auto battler`
- `creature arena`
- `asynchronous battle`
- `idle battle`
- `team builder`
- `pet battler`
- `arena simulator`

Useful references:

- MiniReview lists mobile auto-battlers such as Super Auto Pets, TFT, Vivid Knight, and Backpack Brawl.
- Google Play's Super Auto Pets listing positions the game as building a team of cute pets and battling at your own pace.
- itch.io defines auto battler games as battles where units, heroes, or teams fight automatically, usually emphasizing preparation and composition.
- Reddit threads show demand for low-effort games where players build teams or creatures and watch them compete.

## Fit For 斗球球

Current project strengths:

- It already has a portrait Canvas auto-battle core.
- It already supports profession, item, and hero modes.
- It has analytics events for first battle, second battle, daily completion, ads, review prompts, and next-day return.
- It has Google Play / ASO / privacy / ad-flow docs.
- It has AdMob and Meta Instant Games paths.

Current gaps for "斗蛐蛐" positioning:

- The product promise is still descriptive: "auto-battle arena".
- The stronger hook should be comparative: "who wins this matchup?"
- The result screen needs to push one more matchup or shareable verdict.
- Store screenshots and short ads should emphasize matchup prediction and surprising outcomes.

## Product Thesis

```yaml
type: ProductThesis
project_or_opportunity: 斗球球 / Profession Ball Arena
target_audience:
  - casual viewers who like quick simulated fights
  - strategy-curious users who enjoy matchup experiments
  - short-video users who react to surprising win/loss outcomes
core_loop: choose two professions/items/heroes -> watch 20-40s auto battle -> see verdict -> try recommended counter-matchup
design_differentiation:
  - compact portrait pixel arena
  - fast matchup setup
  - visible profession/item contrast
  - result-card verdict and next-match recommendation
hybrid_casual_layers:
  - daily matchup challenge
  - collection/cosmetic unlocks later
  - hero/item meta progression later
monetization:
  - IAA first: banner/app-open/rewarded encore
  - IAP later only if progression/cosmetics become meaningful
retention_hooks:
  - daily matchup
  - "can this counter beat yesterday's winner?"
  - saved favorite lineup
why_now:
  - auto-battler interest remains visible in mobile and web communities
  - Chinese "赛博斗蛐蛐" language is good for product/creative positioning
  - current project can test this without rebuilding core combat
risks:
  - "斗蛐蛐" can imply gambling if copy is careless
  - battle readability must be strong in first 3 seconds
  - retention may be weak without daily challenge or progression
test_plan:
  - run small-budget creative learning test before scaling
  - compare matchup-prediction creatives against generic gameplay creatives
decision_gate:
  - continue if first_battle_complete and second_battle_start improve from baseline
```

## Opportunity Directions

### 1. Matchup Prediction

Pitch:

```text
长矛球 vs 盾牌球，谁会赢？
```

Why it fits:

- instantly understandable.
- maps directly to existing profession mode.
- easy to make short ads and store screenshots.

Needed product work:

- show matchup title before battle.
- result screen says "prediction correct?" or "winner verdict".
- next-match recommendation uses counter logic.

### 2. Weird Item Arena

Pitch:

```text
让弓箭球捡到火箭筒，会发生什么？
```

Why it fits:

- random items create surprising short-video moments.
- supports multiple creative variants.

Needed product work:

- record item pickup highlights.
- show top item in result summary.
- make item names clear in screenshots.

### 3. Daily Champion

Pitch:

```text
今天的球王是谁？
```

Why it fits:

- adds daily return reason.
- can power social/share loop.

Needed product work:

- deterministic daily matchup seed.
- daily winner card.
- share/deeplink to the same matchup.

### 4. AI Commentary Layer

Pitch:

```text
AI 解说这场斗球：谁的阵容更离谱？
```

Why it fits:

- closer to "赛博斗蛐蛐" livestream language.
- can start as local templated commentary before real AI.

Needed product work:

- post-battle commentary templates.
- highlight three battle moments.
- avoid relying on paid model calls for first MVP.

## Research Sources

- https://www.youxituoluo.com/534408.html
- https://minireview.io/top-mobile-games/best-auto-battlers-mobile
- https://play.google.com/store/apps/details?id=com.teamwood.spacewood.unity
- https://itch.io/games/html5/tag-auto-battler
- https://steamcommunity.com/sharedfiles/filedetails/?id=3147450491&l=schinese
- https://post.smzdm.com/p/a82zvewn
- https://www.reddit.com/r/ShouldIbuythisgame/comments/182gbfz/what_is_your_best_autobattlerlow_effort_game/

## Next Radar Questions

1. Which creative premise wins: profession counter, weird item, daily champion, or AI commentary?
2. Does "斗蛐蛐" copy work better in Chinese than "auto battle" in English?
3. Do users start a second battle after a result-card next-match recommendation?
4. Does item mode produce better short-video hooks than profession mode?
5. Can the store page explain the game in three screenshots without long text?

