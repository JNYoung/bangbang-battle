# 2026-06-24 执行记录

## 今天改了什么

- Play Console: 已创建 `reports/play-console/`，等待从 Play Console 导出原始 acquisition / store performance CSV。
- ASO / 首屏: Google Play treatment 改成 matchup 承诺，首屏标题、摘要、主 CTA 改成“选对阵 -> 开战”。
- Verdict / counter: 结果页标题前置 verdict，推荐下一局按钮下方增加 counter/revenge/draw-breaker 理由，点击继续沿用 `start_source=result_recommendation`。

## 今天发布了什么

- Play Console export: 未导入，需人工从 Play Console 导出。
- Store listing treatment: 已在 `docs/aso-store-listing.md` 准备短描述、首段、截图顺序和 feature graphic 文案。
- App build / metadata: 本地代码已更新，尚未发布商店 metadata。
- Screenshot assets: `scripts/capture-aso-screenshots.mjs` 已切到 matchup/counter 截图顺序，待跑 `npm run aso:screenshots` 生成新素材。

## 今天指标

| 指标 | 昨日 | 今日 | 判断 |
| --- | ---: | ---: | --- |
| store visitors -> installers | n/a | n/a | 等 Play Console |
| game_start / game_init_success | 35.3% | 35.3% | 今日先改承接链路 |
| game_end / game_start | 66.7% | 66.7% | 战斗主体暂不大改 |
| next_match_click / game_end | 0.0% | 0.0% | 等结果页 counter 发布后观察 |
| second_battle_start / game_start | 0.0% | 0.0% | 等结果页 counter 发布后观察 |

## 明天只做一件事

- 导入 `reports/play-console/play-store-acquisition-YYYY-MM-DD.csv` 并重跑 `npm run ops:growth-loop -- --skip-refresh`。
