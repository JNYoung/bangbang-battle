# 运营闭环：GA -> ASO -> YouTube -> 玩法

这个链路的目标是把每天的真实用户行为翻译成一个明确动作：改 ASO、刷新 YouTube 素材、修首局体验、强化二局循环，或暂停放量。

## 每日命令

```sh
npm run ops:growth-loop
```

它会先刷新 `npm run aso:insights`，再生成：

- `reports/ops-growth-loop/ops-growth-loop-YYYY-MM-DD.json`
- `reports/ops-growth-loop/ops-growth-loop-YYYY-MM-DD.md`

如果当天不想重新请求 GA，只读取已有报告：

```sh
npm run ops:growth-loop -- --skip-refresh
```

生成 HTML + Seaborn PNG 图表报告：

```sh
npm run ops:growth-html
```

默认输出：

- `reports/ops-growth-loop/html/YYYY-MM-DD/report.html`
- `reports/ops-growth-loop/html/YYYY-MM-DD/assets/*.png`

本机如果没有安装 `seaborn` 和 `matplotlib`，可以先把依赖装到临时目录，不污染项目依赖：

```sh
env -u ALL_PROXY -u HTTPS_PROXY -u HTTP_PROXY \
  /Users/zhengjinyang/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3 \
  -m pip install --only-binary=:all: --target /tmp/codex-seaborn-deps \
  -i https://pypi.tuna.tsinghua.edu.cn/simple seaborn matplotlib
```

## 数据源

| 数据 | 来源 | 用途 |
| --- | --- | --- |
| GA 聚合事件 | `reports/ga-daily/` | 判断开局、完赛、二局、次日回访、广告事件和 7 日趋势 |
| ASO insight | `reports/aso-insights/` | 把 GA 漏斗断点翻译成 ASO/商店页待办 |
| YouTube manifest | `ops-materials/youtube/*/manifest.json` | 判断素材池是否新鲜、候选数是否足够 |
| Play Console acquisition | `reports/play-console/` | 判断商店曝光 -> 安装转化；缺失时不能判断 ASO 是否提高安装 |
| Campaign attribution | URL UTM + `creative_id` | 把素材、活动、来源带入核心 GA 漏斗事件 |

## 新增结构化输出

`ops-growth-loop-YYYY-MM-DD.json` 现在除了基础 `metrics` 和 `actions`，还输出四组用于执行和复盘的结构：

| 字段 | 用途 |
| --- | --- |
| `optimizationPlan` | 把优化方向结构化成假设、证据、动作、验证指标、成功判据和下一次复盘时间 |
| `chainHealth` | 按 GA 事件读数、商店转化、YouTube 素材、首局体验、二局留存给出 0-100 链路健康分 |
| `growthGates` | 给出 Go / Hold / Stop 放量门槛，避免在数据或体验断点未清时过早加预算 |
| `analysis` | 按日、按周、按月拆分运营分析：日报看 30 天趋势，周/月用于持续 A/B 和方向选择 |

Markdown 日报会把这些字段展开成：

1. 优化方向与验证计划
2. 链路健康
3. Go / Hold / Stop 放量门槛
4. 三维度数据分析

三维度分析的判读方式：

| 维度 | JSON 字段 | 用途 | 复盘节奏 |
| --- | --- | --- | --- |
| 按日 | `analysis.daily` | 汇总最近 30 天 GA 日趋势、观测覆盖率、DAU 和事件趋势 | 每天跑数，只看趋势和断点，不直接判放量 |
| 按周 | `analysis.weekly` | 聚合最近 4 周，生成 ASO、结果页、YouTube hook 的持续 A/B 队列 | 每周保留赢家、停止明显输的变体、新增 1-2 个变体 |
| 按月 | `analysis.monthly` | 聚合最近 3 个月，规划定位、留存机制、预算闸门的方向性 A/B | 每月选择下月主定位、渠道组合和预算档位 |

HTML 报告会额外生成四张 Seaborn 图：

| 图表 | 文件 | 读法 |
| --- | --- | --- |
| 30 天日趋势图 | `daily-30d-trend.png` | 把活跃用户和事件数指数化，判断最近 30 天方向和异常波动 |
| 优化优先级图 | `optimization-priority-map.png` | 按阻塞程度、影响、信心和紧急度排序当天该先做什么 |
| 增长链路健康热力图 | `growth-chain-health.png` | 对比每段链路的数据证据、可行动性、体验承接和放量准备度 |
| 持续 A/B 节奏图 | `ab-experiment-cadence.png` | 区分周实验和月实验，避免把小样本周波动误判为战略结论 |

## UTM 链接规则

YouTube、ASO 实验、Meta/Google 小预算素材都使用同一套命名：

```text
utm_source=youtube
utm_medium=shorts
utm_campaign=organic_daily_YYYYMMDD
utm_content=<clip_or_angle_id>
creative_id=<creative_id>
campaign_id=<campaign_id_if_any>
```

运行时会把这些字段保存 30 天，并附加到核心漏斗事件：`game_init_success`、`game_start`、首局/二局/每日完成、结果页点击、评分提示和 `next_day_return`。原始点击 ID（如 `gclid`、`fbclid`）不会写进事件 payload。

## 判读顺序

1. 先看 P0：GA 是否可读、Play Console acquisition 是否导入、广告事件是否与商店口径冲突。
2. 再看 `growthGates`：如果仍是 Hold，只做学习型预算，不自动放量。
3. 再看 P1：`game_start / game_init_success`、二局、next-match、YouTube 素材是否新鲜。
4. 最后看 P2：D1 回访素材、release GA smoke、长期玩法诊断事件。

当前放量前的硬限制：没有 Play Console acquisition 时，GA 只能说明安装后的承接，不能证明 ASO 首屏或关键词提高了安装转化。

## Deep Research 输入

更深的增长策略研究任务书在：

```text
docs/deep-research-growth-strategy-brief-2026-06-24.md
```

它适合直接交给 GPT Deep Research，用来研究竞品、ASO、YouTube Shorts、低预算买量、留存机制和 30/60/90 天增长路线图。Deep Research 产出的策略可以回填到 `optimizationPlan` 的假设、动作、验证指标和成功判据里。
