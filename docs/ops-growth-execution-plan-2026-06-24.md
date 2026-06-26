# 运营增长执行计划：Play Console -> Matchup -> Counter Loop

日期：2026-06-24
基线数据：`reports/ops-growth-loop/ops-growth-loop-2026-06-24.json`，GA 数据日期为 2026-06-23。

## 目标

把当前日报里的三条关键动作变成可执行推进项：

1. 导入 Play Console store acquisition，让 ASO 不只看安装后 GA。
2. 把首屏承诺改成 matchup 行动，让新用户第一眼理解“选对阵 -> 开战”。
3. 强化 `verdict -> counter -> second battle`，让首局完成后自然进入第二局。

当前不要放量。先把商店转化、首局启动、结果页二局循环跑通，再决定是否进入小预算学习。

## 当前基线

| 指标 | 当前值 | 判断 |
| --- | ---: | --- |
| Active users | 16 | 样本小，只能看方向 |
| Events | 151 | 可用于日报趋势 |
| `game_start / game_init_success` | 35.3% | 首屏承诺和开局入口偏弱 |
| `game_end / game_start` | 66.7% | 首局完成率可用，先别大改战斗主体 |
| `second_battle_start / game_start` | 0.0% | 二局循环没有成立 |
| `next_match_recommend_click / game_end` | 0.0% | 结果页推荐动作没有被点击 |
| Play Console acquisition | 未导入 | 不能判断商店页是否提高安装转化 |

日报命令：

```sh
npm run ops:growth-loop -- --skip-refresh
npm run ops:growth-html
```

验证命令：

```sh
npm run lint:syntax
npm test
npm run test:matchups
```

## 执行顺序

| 顺序 | 模块 | 负责人动作 | 产出 | 完成判断 |
| ---: | --- | --- | --- | --- |
| 1 | Play Console store acquisition | 导出商店曝光、访问、安装、来源、国家数据 | `reports/play-console/*` | 日报能识别 Play Console export |
| 2 | Matchup 首屏承诺 | 更新商店短描述、截图顺序、首图文案、首页 CTA | Play store listing treatment + 截图素材 | 新用户第一眼看到 matchup 问题 |
| 3 | Verdict -> counter -> second battle | 强化结果页 verdict 和 counter 主按钮 | 产品内结果页改动 + ASO 第 3 张截图 | `next_match_recommend_click` 和 `second_battle_start` 不再为 0 |
| 4 | 日/周复盘 | 每天跑报告，周末判定 keep / iterate / revert | HTML 报告 + 执行日志 | 周实验能给出下一轮动作 |

## 1. 导入 Play Console store acquisition

### 输入

从 Play Console 导出能覆盖这些口径的报表，优先 CSV/TSV/XLSX/JSON：

| 数据 | 必要性 | 用途 |
| --- | --- | --- |
| Date | 必须 | 和 GA `reportDate` 对齐 |
| Store listing visitors | 必须 | 看商店页访问 |
| Installers / acquisitions | 必须 | 看访问到安装转化 |
| Country / region | 推荐 | 判断 zh-CN / en-US 素材权重 |
| Traffic source | 推荐 | 区分 search、explore、external、campaign |
| Search term / keyword | 可选 | 后续 ASO 关键词优化 |

### 动作清单

- [ ] 在仓库创建目录：`reports/play-console/`
- [ ] 导出 Store listing acquisition / Store performance 报表。
- [ ] 文件命名为：`reports/play-console/play-store-acquisition-YYYY-MM-DD.csv`
- [ ] 如果还有来源、国家、关键词拆分，分别保存为：

```text
reports/play-console/play-store-acquisition-country-YYYY-MM-DD.csv
reports/play-console/play-store-acquisition-source-YYYY-MM-DD.csv
reports/play-console/play-store-acquisition-search-YYYY-MM-DD.csv
```

- [ ] 保留原始导出字段，不要先手工改列名。
- [ ] 在执行日志里记录导出时间、日期范围、是否包含国家/来源/搜索词。
- [ ] 重跑日报：

```sh
npm run ops:growth-loop -- --skip-refresh
npm run ops:growth-html
```

### 验收标准

- [ ] `reports/play-console/` 下至少有一份 Play Console 导出。
- [ ] `ops-growth-loop` 报告的 `sources.playConsoleExports` 能列出文件。
- [ ] 后续报告可以把 `store visitors -> installers` 和 `game_start / game_init_success` 并排判断。

### 后续增强

当前脚本先识别是否存在 Play Console 导出。下一步可以给 `scripts/ops-growth-loop.mjs` 增加 Play Console CSV 解析，把这些指标写进报告：

```text
storeListingVisitors
installers
visitorToInstallerRate
sourceBreakdown
countryBreakdown
searchTermBreakdown
```

## 2. 把首屏承诺改成 matchup 行动

### 核心假设

现在 `game_start / game_init_success = 35.3%`，说明用户打开后还没有足够快地理解“我现在应该做什么”。首屏和商店页应该从“自动对战功能介绍”改成“matchup 行动题”：

```text
Pick a matchup. Watch the battle. Try the counter.
```

中文口径：

```text
选一组对阵，看谁会赢，再挑战反制阵容。
```

### Google Play listing 动作

- [ ] Short description 第一轮使用：

```text
Pick a matchup, watch pixel-ball battles, then try the counter.
```

- [ ] 备用短描述：

```text
Who wins the pixel arena? Pick a matchup and watch the counter.
```

- [ ] Full description 首段改成：

```text
Profession Ball Arena is a fast portrait auto-battle game about compact pixel matchups. Pick two professions, watch the arena decide the result, then try the counter in the next round.
```

- [ ] 截图顺序改成：

| 顺序 | 截图主题 | 图上文案 |
| ---: | --- | --- |
| 1 | `matchup-question-battle` | `Spear vs Shield: who wins?` |
| 2 | `pick-matchup` | `Pick a side, test the counter` |
| 3 | `result-verdict-next` | `Verdict is in. Try the counter.` |
| 4 | `item-chaos` | `Random items, different battles` |
| 5 | `settings-privacy` | `Clear settings and privacy controls` |

- [ ] Feature graphic 第一轮只测 matchup 问题，不同时改 icon：

```text
Spear VS Shield
Who wins?
```

- [ ] Product Page Optimization 第一轮只改截图/文案/feature graphic，不同时测试 icon、视频和关键词大改。

### 产品内首屏动作

目标是让商店页和打开后的首屏说同一件事。

- [ ] 检查首页/开局入口文案，避免只写泛泛的 auto battle。
- [ ] 首页主 CTA 改成 matchup 行动，例如：

```text
Pick a matchup
Start the duel
Try this counter
```

- [ ] 如果当前首屏先露设置/职业配置，把默认推荐 matchup 提前，让用户可一键开始。
- [ ] 事件 `game_start` 继续带 `start_source`，用于判断首屏 CTA 是否有效。

### 需要检查的文件

| 文件 | 检查点 |
| --- | --- |
| `docs/aso-store-listing.md` | Google Play 文案与截图说明 |
| `i18n.js` | 首页 CTA、结果页按钮、多语言文案 |
| `game.js` | 首页入口、默认 matchup、start source |
| `scripts/capture-aso-screenshots.mjs` | 截图顺序和截图状态 |
| `store-assets/screenshots/google-phone/` | Google Play 截图素材 |

### 验收标准

- [ ] 商店短描述、截图 #1、截图 #3 都表达 matchup/counter，而不是只展示功能。
- [ ] 打开应用后 3 秒内能看到可执行动作：pick / start / counter。
- [ ] 跑完截图命令后，Google Play 截图素材可用于上传：

```sh
npm run aso:screenshots
```

- [ ] 发布或开始实验后记录准确发布时间，方便和 GA 日期对齐。
- [ ] 48-72 小时后看 `game_start / game_init_success` 是否从 35.3% 向 50% 靠近。

## 3. 强化 verdict -> counter -> second battle

### 核心假设

当前首局完成率可用，但 `next_match_recommend_click` 和 `second_battle_start` 都是 0。问题不是用户完全不能完成第一局，而是结果页没有把“看完 verdict 后再打一局”的动机放到足够强。

目标路径：

```text
finish first battle -> clear winner verdict -> show counter reason -> primary button -> second battle starts
```

### 已有基础

当前代码已经有推荐下一局逻辑：

| 位置 | 作用 |
| --- | --- |
| `game.js` 的 `getResultNextRecommendation()` | 根据胜负生成 challenge / revenge / draw breaker 推荐 |
| `game.js` 的 `startRecommendedMatch()` | 点击推荐后上报 `next_match_recommend_click` 并启动下一局 |
| `docs/analytics-events.md` | 已记录 `next_match_recommend_click` 和 `second_battle_start` |

### 产品动作

- [ ] 结果页标题先给 verdict，而不是只给结算信息：

```text
Verdict: Spear wins by pressure
```

- [ ] 结果页主按钮使用 counter 语言，不能只是“下一局”：

```text
Try the counter
Challenge with Shield
Run the revenge matchup
```

- [ ] 按钮下方给一句推荐理由：

```text
Shield can slow Spear's opening burst.
```

- [ ] 让推荐按钮成为结果页主行动，分享、战报、设置等动作降级为次级。
- [ ] 点击推荐按钮必须继续调用 `startRecommendedMatch()`，保持 `start_source = result_recommendation`。
- [ ] 截图 #3 必须展示这个结果页和 counter 按钮。

### 文案模板

英文：

```text
Verdict is in
Try the counter
Can Shield stop Spear next?
```

中文：

```text
胜负已定
马上挑战反制
盾牌能挡住长矛吗？
```

### 埋点验收

- [ ] 点击 counter 主按钮时上报 `next_match_recommend_click`。
- [ ] 推荐下一局开始时上报 `second_battle_start`。
- [ ] `next_match_recommend_click` payload 带：

```text
recommendation_reason
recommended_matchup
winner_side
own_result
```

- [ ] `second_battle_start` payload 带：

```text
start_source=result_recommendation
total_matches_before
daily_match_index
```

### 验收标准

- [ ] 手动跑一局后，结果页第一视觉是 verdict。
- [ ] 结果页主按钮是 counter / revenge / draw breaker。
- [ ] 点击主按钮能直接进入第二局。
- [ ] 下一次 GA daily 里 `next_match_recommend_click` > 0。
- [ ] 下一次 GA daily 里 `second_battle_start` > 0。
- [ ] 周目标：`second_battle_start / game_start` 先达到 10%，再冲 20%。

## 4. 7 天推进节奏

| 日期 | 动作 | 当天必须产出 |
| --- | --- | --- |
| Day 0 | 导出 Play Console acquisition；确认广告事件来源；确定 matchup 文案 | `reports/play-console/*` + 执行日志 |
| Day 1 | 改商店短描述、截图顺序、feature graphic 文案 | Play listing treatment 草稿 |
| Day 2 | 强化结果页 verdict/counter 主按钮；补截图 #3 | 产品改动 + 新截图 |
| Day 3 | 发布 Play listing experiment 或 metadata update；记录发布时间 | 发布记录 |
| Day 4-6 | 每天跑日报和 HTML；记录指标变化 | `ops-growth-loop` 报告 |
| Day 7 | 判定 keep / iterate / revert | 一页复盘结论 |

## 5. 每日复盘模板

复制到当天执行日志：

```md
## YYYY-MM-DD 执行记录

### 今天改了什么

- Play Console:
- ASO / 首屏:
- Verdict / counter:

### 今天发布了什么

- Play Console export:
- Store listing treatment:
- App build / metadata:
- Screenshot assets:

### 今天指标

| 指标 | 昨日 | 今日 | 判断 |
| --- | ---: | ---: | --- |
| store visitors -> installers | n/a | n/a | 等 Play Console |
| game_start / game_init_success | 35.3% |  |  |
| game_end / game_start | 66.7% |  |  |
| next_match_click / game_end | 0.0% |  |  |
| second_battle_start / game_start | 0.0% |  |  |

### 明天只做一件事

-
```

## 6. Go / Hold / Stop

Go：

- Play Console acquisition 已导入，能看 store visitors -> installers。
- `game_start / game_init_success` 连续向 50% 靠近。
- `next_match_recommend_click` 和 `second_battle_start` 不再为 0。
- YouTube / ASO / 产品内首屏都使用同一套 matchup/counter 承诺。

Hold：

- 只有 GA 安装后数据，没有 Play Console 商店转化。
- 二局仍为 0。
- 广告事件来源还没有解释清楚。
- 样本低于 100 active users，只做方向判断。

Stop / revert：

- 改成 matchup 承诺后 `game_start / game_init_success` 下降。
- 结果页 counter 按钮提高点击，但 `game_end / game_start` 明显下降。
- 商店转化下降，同时安装后开局没有改善。

## 7. 本轮完成定义

- [ ] Play Console export 已放入 `reports/play-console/`。
- [ ] Google Play 首屏文案和截图 treatment 已准备或发布。
- [ ] 产品内结果页主路径变成 verdict -> counter -> second battle。
- [ ] 截图 #3 展示 verdict/counter。
- [ ] `npm run lint:syntax` 通过。
- [ ] `npm test` 通过。
- [ ] `npm run test:matchups` 通过。
- [ ] `npm run ops:growth-loop -- --skip-refresh` 已刷新报告。
- [ ] `npm run ops:growth-html` 已刷新 HTML 报告。
