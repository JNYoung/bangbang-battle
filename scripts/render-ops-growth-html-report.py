#!/usr/bin/env python3
import argparse
import html
import json
import os
from datetime import datetime
from pathlib import Path
import textwrap

import matplotlib.dates as mdates
import matplotlib.pyplot as plt
import matplotlib.ticker as mticker
import pandas as pd
import seaborn as sns


ROOT_DIR = Path(__file__).resolve().parents[1]
FONT_FAMILY = ["Aptos", "Inter", "Segoe UI", "DejaVu Sans", "Arial", "sans-serif"]
MONO_FONT_FAMILY = ["SF Mono", "Menlo", "Consolas", "DejaVu Sans Mono", "monospace"]

TOKENS = {
    "surface": "#FCFCFD",
    "panel": "#FFFFFF",
    "ink": "#1F2430",
    "muted": "#6F768A",
    "grid": "#E6E8F0",
    "axis": "#D7DBE7",
}

NEUTRAL_MARKS = {
    "open": TOKENS["panel"],
    "xlight": "#F4F5F7",
    "light": "#E2E5EA",
    "base": "#C5CAD3",
    "mid": "#7A828F",
    "dark": "#464C55",
}

COLOR_FAMILIES = {
    "blue": {
        "open": TOKENS["panel"],
        "xlight": "#EAF1FE",
        "light": "#CEDFFE",
        "base": "#A3BEFA",
        "mid": "#5477C4",
        "dark": "#2E4780",
    },
    "gold": {
        "open": TOKENS["panel"],
        "xlight": "#FFF4C2",
        "light": "#FFEA8F",
        "base": "#FFE15B",
        "mid": "#B8A037",
        "dark": "#736422",
    },
    "orange": {
        "open": TOKENS["panel"],
        "xlight": "#FFEDDE",
        "light": "#FFBDA1",
        "base": "#F0986E",
        "mid": "#CC6F47",
        "dark": "#804126",
    },
    "olive": {
        "open": TOKENS["panel"],
        "xlight": "#D8ECBD",
        "light": "#BEEB96",
        "base": "#A3D576",
        "mid": "#71B436",
        "dark": "#386411",
    },
    "pink": {
        "open": TOKENS["panel"],
        "xlight": "#FCDAD6",
        "light": "#F5BACC",
        "base": "#F390CA",
        "mid": "#BD569B",
        "dark": "#8A3A6F",
    },
}

PLAN_CHART_LABELS = {
    "restore-ga-readout": "Restore GA readout",
    "import-play-acquisition": "Import Play acquisition",
    "campaign-attribution": "Campaign attribution",
    "audit-ad-events": "Audit ad events",
    "activation-matchup-promise": "Matchup promise",
    "result-counter-loop": "Verdict to counter loop",
    "refresh-youtube-shorts": "Refresh Shorts pool",
    "daily-return-hook": "Daily matchup hook",
    "release-ga-smoke": "Release GA smoke",
}

HEALTH_CHART_LABELS = {
    "GA 事件读数": "GA event readout",
    "商店转化": "Store conversion",
    "YouTube 素材": "YouTube creative",
    "首局体验": "First battle UX",
    "二局留存": "Second battle loop",
}

EXPERIMENT_CHART_LABELS = {
    "weekly_aso_matchup_first_screen": "ASO first screen",
    "weekly_result_counter_loop": "Result counter loop",
    "weekly_youtube_hook": "Shorts hook",
    "monthly_positioning": "Positioning",
    "monthly_retention_hook": "Retention hook",
    "monthly_budget_gate": "Budget gate",
}


def main():
    parser = argparse.ArgumentParser(description="Render the ops growth loop HTML report with Seaborn charts.")
    parser.add_argument("--input", required=True, help="Path to ops-growth-loop JSON report.")
    parser.add_argument("--output-dir", default="", help="Output directory. Defaults to reports/ops-growth-loop/html/<runDate>.")
    args = parser.parse_args()

    report_path = Path(args.input).resolve()
    report = read_json(report_path)
    run_date = report.get("runDate") or datetime.now().strftime("%Y-%m-%d")
    output_dir = Path(args.output_dir).resolve() if args.output_dir else ROOT_DIR / "reports" / "ops-growth-loop" / "html" / run_date
    assets_dir = output_dir / "assets"
    output_dir.mkdir(parents=True, exist_ok=True)
    assets_dir.mkdir(parents=True, exist_ok=True)

    use_chart_theme()
    chart_paths = {
        "funnel": render_funnel_chart(report, assets_dir / "growth-funnel-rates.png"),
        "trend": render_daily_30d_chart(report, assets_dir / "daily-30d-trend.png"),
        "signals": render_signal_chart(report, assets_dir / "signal-priorities.png"),
        "priority": render_priority_chart(report, assets_dir / "optimization-priority-map.png"),
        "health": render_chain_health_heatmap(report, assets_dir / "growth-chain-health.png"),
        "ab": render_ab_experiment_chart(report, assets_dir / "ab-experiment-cadence.png"),
    }

    html_path = output_dir / "report.html"
    html_path.write_text(render_html(report, report_path, chart_paths), encoding="utf-8")
    print(f"HTML report: {html_path}")
    for label, path in chart_paths.items():
        print(f"{label} chart: {path}")


def read_json(path):
    with Path(path).open("r", encoding="utf-8") as handle:
        return json.load(handle)


def use_chart_theme():
    sns.set_theme(
        style="whitegrid",
        rc={
            "figure.facecolor": TOKENS["surface"],
            "figure.edgecolor": "none",
            "savefig.facecolor": TOKENS["surface"],
            "savefig.edgecolor": "none",
            "axes.facecolor": TOKENS["panel"],
            "axes.edgecolor": TOKENS["axis"],
            "axes.labelcolor": TOKENS["ink"],
            "axes.grid": True,
            "axes.spines.top": False,
            "axes.spines.right": False,
            "grid.color": TOKENS["grid"],
            "grid.linewidth": 0.8,
            "font.family": "sans-serif",
            "font.sans-serif": FONT_FAMILY,
            "font.monospace": MONO_FONT_FAMILY,
            "patch.linewidth": 1.0,
        },
    )


def add_chart_header(fig, ax, title, subtitle, title_width=76, subtitle_width=104):
    title = textwrap.fill(str(title).strip(), width=title_width, break_long_words=False)
    subtitle = textwrap.fill(str(subtitle).strip(), width=subtitle_width, break_long_words=False)
    title_lines = title.count("\n") + 1
    subtitle_lines = subtitle.count("\n") + 1
    ax.set_title("")
    fig.subplots_adjust(top=max(0.62, 0.86 - 0.045 * (title_lines - 1) - 0.032 * (subtitle_lines - 1)))
    left = ax.get_position().x0
    fig.text(left, 0.985, title, ha="left", va="top", fontsize=13, fontweight="semibold", color=TOKENS["ink"], linespacing=1.08)
    fig.text(left, 0.93 - 0.045 * (title_lines - 1), subtitle, ha="left", va="top", fontsize=9, color=TOKENS["muted"], linespacing=1.18)
    sns.despine(ax=ax)


def render_funnel_chart(report, output_path):
    metrics = report.get("metrics", {})
    rows = [
        {"step": "Open -> start", "rate": metrics.get("initToGameStart"), "target": 0.50},
        {"step": "Start -> finish", "rate": metrics.get("gameStartToEnd"), "target": 0.55},
        {"step": "Start -> second battle", "rate": metrics.get("gameStartToSecondBattle"), "target": 0.20},
        {"step": "Result -> next match", "rate": metrics.get("resultToNextMatchClick"), "target": 0.20},
        {"step": "Active -> next-day return", "rate": metrics.get("activeUserNextDayReturnSignal"), "target": 0.20},
    ]
    df = pd.DataFrame(rows).fillna(0)
    df["pct"] = df["rate"] * 100
    df["target_pct"] = df["target"] * 100
    df["status"] = df["pct"] >= df["target_pct"]
    plot_df = df.sort_values("pct", ascending=True)
    colors = [COLOR_FAMILIES["olive"]["base"] if ok else COLOR_FAMILIES["orange"]["base"] for ok in plot_df["status"]]
    edges = [COLOR_FAMILIES["olive"]["dark"] if ok else COLOR_FAMILIES["orange"]["dark"] for ok in plot_df["status"]]

    fig, ax = plt.subplots(figsize=(9.6, 5.6), dpi=160)
    bars = ax.barh(plot_df["step"], plot_df["pct"], color=colors, edgecolor=edges, linewidth=1.0)
    for bar, value, target in zip(bars, plot_df["pct"], plot_df["target_pct"]):
        label_x = min(max(value + 2, 4), 96)
        ax.text(label_x, bar.get_y() + bar.get_height() / 2, f"{value:.1f}%", va="center", ha="left", fontsize=8.5, color=TOKENS["ink"])
        ax.plot([target, target], [bar.get_y(), bar.get_y() + bar.get_height()], color=NEUTRAL_MARKS["dark"], linewidth=1.0, linestyle=":")
    ax.set_xlim(0, 100)
    ax.xaxis.set_major_formatter(mticker.PercentFormatter(100))
    ax.set_xlabel("Conversion rate")
    ax.set_ylabel("")
    add_chart_header(
        fig,
        ax,
        "Core growth funnel rates",
        "June 23, 2026 GA events; dotted markers show conservative action thresholds.",
    )
    fig.savefig(output_path, bbox_inches="tight")
    plt.close(fig)
    return output_path


def render_daily_30d_chart(report, output_path):
    daily = report.get("analysis", {}).get("daily", {})
    trend = daily.get("trendRows", []) or report.get("chain", {}).get("ga", {}).get("sevenDayTrend", [])
    df = pd.DataFrame(trend)
    if df.empty:
        df = pd.DataFrame([{"date": report.get("reportDate", ""), "activeUsers": report.get("metrics", {}).get("activeUsers", 0)}])
    df["date_dt"] = pd.to_datetime(df["date"].astype(str), errors="coerce")
    df["activeUsers"] = pd.to_numeric(df.get("activeUsers", 0), errors="coerce").fillna(0)
    df["eventCount"] = pd.to_numeric(df.get("eventCount", 0), errors="coerce").fillna(0)
    first_active = df["activeUsers"].replace(0, pd.NA).dropna()
    first_events = df["eventCount"].replace(0, pd.NA).dropna()
    active_base = float(first_active.iloc[0]) if not first_active.empty else 1
    event_base = float(first_events.iloc[0]) if not first_events.empty else 1
    df["Active users"] = df["activeUsers"] / active_base * 100
    df["Events"] = df["eventCount"] / event_base * 100
    plot_df = df.melt(id_vars=["date_dt"], value_vars=["Active users", "Events"], var_name="metric", value_name="index_value")
    palette = {
        "Active users": COLOR_FAMILIES["blue"]["base"],
        "Events": COLOR_FAMILIES["olive"]["base"],
    }

    fig, ax = plt.subplots(figsize=(9.8, 5.2), dpi=160)
    sns.lineplot(
        data=plot_df,
        x="date_dt",
        y="index_value",
        hue="metric",
        palette=palette,
        marker="o",
        linewidth=1.4,
        ax=ax,
    )
    ax.axhline(100, color=NEUTRAL_MARKS["dark"], linewidth=1.0, linestyle=":")
    ax.set_xlabel("")
    ax.set_ylabel("Index, first observed day = 100")
    ax.legend(title="", loc="upper left", frameon=False)
    ax.xaxis.set_major_locator(mdates.AutoDateLocator(minticks=3, maxticks=7))
    ax.xaxis.set_major_formatter(mdates.ConciseDateFormatter(ax.xaxis.get_major_locator()))
    add_chart_header(
        fig,
        ax,
        "Daily 30-day trend is still sample-limited",
        f"{daily.get('coverageLabel', 'available days observed')}; indexed active users and events from GA aggregate reports.",
    )
    fig.savefig(output_path, bbox_inches="tight")
    plt.close(fig)
    return output_path


def render_signal_chart(report, output_path):
    metrics = report.get("metrics", {})
    rows = [
        {"signal": "Ad-related events", "count": metrics.get("adEvents", 0), "family": "orange"},
        {"signal": "Game init success", "count": metrics.get("gameInitSuccess", 0), "family": "blue"},
        {"signal": "Next-day return", "count": metrics.get("nextDayReturn", 0), "family": "olive"},
        {"signal": "Game start", "count": metrics.get("gameStart", 0), "family": "gold"},
        {"signal": "Game end", "count": metrics.get("gameEnd", 0), "family": "pink"},
        {"signal": "Second battle start", "count": metrics.get("secondBattleStart", 0), "family": "orange"},
        {"signal": "Next-match click", "count": metrics.get("nextMatchRecommendClick", 0), "family": "blue"},
    ]
    df = pd.DataFrame(rows).sort_values("count", ascending=True)
    colors = [COLOR_FAMILIES[row["family"]]["base"] for _, row in df.iterrows()]
    edges = [COLOR_FAMILIES[row["family"]]["dark"] for _, row in df.iterrows()]
    fig, ax = plt.subplots(figsize=(9.6, 5.2), dpi=160)
    bars = ax.barh(df["signal"], df["count"], color=colors, edgecolor=edges, linewidth=1.0)
    for bar, value in zip(bars, df["count"]):
        ax.text(value + 0.6, bar.get_y() + bar.get_height() / 2, f"{int(value)}", va="center", ha="left", fontsize=8.5, color=TOKENS["ink"])
    ax.set_xlim(0, max(45, df["count"].max() + 6))
    ax.set_xlabel("Event count")
    ax.set_ylabel("")
    add_chart_header(
        fig,
        ax,
        "Signals point to compliance, activation, and replay gaps",
        "June 23, 2026 event counts from the latest ops growth loop report.",
    )
    fig.savefig(output_path, bbox_inches="tight")
    plt.close(fig)
    return output_path


def render_priority_chart(report, output_path):
    plan = report.get("optimizationPlan", [])
    if not plan:
        plan = [{
            "title": "Continue daily readout",
            "priority": "P2",
            "priorityScore": 20,
            "lane": "Observe",
        }]
    df = pd.DataFrame(plan)
    df["priorityScore"] = pd.to_numeric(df.get("priorityScore", 0), errors="coerce").fillna(0)
    df["label"] = df.apply(lambda row: PLAN_CHART_LABELS.get(row.get("id"), str(row.get("title", ""))), axis=1)
    df = df.sort_values("priorityScore", ascending=True).tail(8)
    family_by_priority = {"P0": "orange", "P1": "blue", "P2": "olive"}
    colors = [COLOR_FAMILIES[family_by_priority.get(priority, "gold")]["base"] for priority in df["priority"]]
    edges = [COLOR_FAMILIES[family_by_priority.get(priority, "gold")]["dark"] for priority in df["priority"]]

    fig, ax = plt.subplots(figsize=(9.8, 5.7), dpi=160)
    bars = ax.barh(df["label"], df["priorityScore"], color=colors, edgecolor=edges, linewidth=1.0)
    for bar, value, priority in zip(bars, df["priorityScore"], df["priority"]):
        ax.text(value + 1.4, bar.get_y() + bar.get_height() / 2, f"{priority} / {value:.0f}", va="center", ha="left", fontsize=8.5, color=TOKENS["ink"])
    ax.set_xlim(0, max(100, df["priorityScore"].max() + 10))
    ax.set_xlabel("Priority score")
    ax.set_ylabel("")
    add_chart_header(
        fig,
        ax,
        "Optimization priority map",
        "Composite score from urgency, expected impact, confidence, and data blockage in the latest ops report.",
    )
    fig.savefig(output_path, bbox_inches="tight")
    plt.close(fig)
    return output_path


def render_chain_health_heatmap(report, output_path):
    rows = report.get("chainHealth", [])
    if not rows:
        rows = [{
            "lane": "No chain data",
            "evidenceScore": 0,
            "actionabilityScore": 0,
            "experienceScore": 0,
            "scaleScore": 0,
        }]
    df = pd.DataFrame(rows)
    score_cols = ["evidenceScore", "actionabilityScore", "experienceScore", "scaleScore"]
    display_cols = ["Evidence", "Actionability", "Experience", "Scale readiness"]
    matrix = df[score_cols].apply(pd.to_numeric, errors="coerce").fillna(0)
    matrix.columns = display_cols
    matrix.index = df["lane"].astype(str).map(lambda value: HEALTH_CHART_LABELS.get(value, value))
    cmap = sns.color_palette([
        NEUTRAL_MARKS["xlight"],
        COLOR_FAMILIES["blue"]["xlight"],
        COLOR_FAMILIES["blue"]["light"],
        COLOR_FAMILIES["blue"]["base"],
        COLOR_FAMILIES["blue"]["mid"],
    ], as_cmap=True)

    fig, ax = plt.subplots(figsize=(9.8, 5.8), dpi=160)
    sns.heatmap(
        matrix,
        ax=ax,
        cmap=cmap,
        vmin=0,
        vmax=100,
        annot=True,
        fmt=".0f",
        linewidths=1,
        linecolor=TOKENS["panel"],
        cbar_kws={"label": "Score"},
    )
    ax.set_xlabel("")
    ax.set_ylabel("")
    ax.tick_params(axis="x", labelrotation=0)
    ax.tick_params(axis="y", labelrotation=0)
    add_chart_header(
        fig,
        ax,
        "Growth chain health",
        "0-100 operating scores across source evidence, next-action clarity, in-product experience, and scale readiness.",
    )
    fig.savefig(output_path, bbox_inches="tight")
    plt.close(fig)
    return output_path


def render_ab_experiment_chart(report, output_path):
    weekly = report.get("analysis", {}).get("weekly", {}).get("experiments", [])
    monthly = report.get("analysis", {}).get("monthly", {}).get("experiments", [])
    rows = []
    for experiment in weekly + monthly:
        rows.append({
            "label": EXPERIMENT_CHART_LABELS.get(experiment.get("id"), experiment.get("title", "")),
            "cadence": "Weekly" if experiment.get("cadence") == "weekly" else "Monthly",
            "priorityScore": experiment.get("priorityScore", 0),
        })
    if not rows:
        rows = [{"label": "No A/B plan", "cadence": "Weekly", "priorityScore": 0}]
    df = pd.DataFrame(rows).sort_values("priorityScore", ascending=True)
    palette = {"Weekly": COLOR_FAMILIES["blue"]["base"], "Monthly": COLOR_FAMILIES["gold"]["base"]}
    edge_palette = {"Weekly": COLOR_FAMILIES["blue"]["dark"], "Monthly": COLOR_FAMILIES["gold"]["dark"]}
    colors = [palette.get(value, COLOR_FAMILIES["olive"]["base"]) for value in df["cadence"]]
    edges = [edge_palette.get(value, COLOR_FAMILIES["olive"]["dark"]) for value in df["cadence"]]

    fig, ax = plt.subplots(figsize=(9.8, 5.4), dpi=160)
    bars = ax.barh(df["label"], df["priorityScore"], color=colors, edgecolor=edges, linewidth=1.0)
    for bar, value, cadence in zip(bars, df["priorityScore"], df["cadence"]):
        ax.text(value + 1.2, bar.get_y() + bar.get_height() / 2, f"{cadence} / {value:.0f}", va="center", ha="left", fontsize=8.5, color=TOKENS["ink"])
    ax.set_xlim(0, max(100, df["priorityScore"].max() + 10))
    ax.set_xlabel("A/B priority score")
    ax.set_ylabel("")
    add_chart_header(
        fig,
        ax,
        "Continuous A/B cadence",
        "Weekly tests optimize execution details; monthly tests choose positioning, retention hooks, and budget gates.",
    )
    fig.savefig(output_path, bbox_inches="tight")
    plt.close(fig)
    return output_path


def render_html(report, report_path, chart_paths):
    m = report.get("metrics", {})
    status = report.get("status", {}).get("label", "unknown")
    run_date = escape(report.get("runDate", ""))
    report_date = escape(report.get("reportDate", ""))
    title = "斗球球运营闭环优化报告"
    funnel_src = rel(chart_paths["funnel"], chart_paths["funnel"].parents[1])
    trend_src = rel(chart_paths["trend"], chart_paths["trend"].parents[1])
    signals_src = rel(chart_paths["signals"], chart_paths["signals"].parents[1])
    priority_src = rel(chart_paths["priority"], chart_paths["priority"].parents[1])
    health_src = rel(chart_paths["health"], chart_paths["health"].parents[1])
    ab_src = rel(chart_paths["ab"], chart_paths["ab"].parents[1])
    actions_html = "\n".join(render_action(action) for action in report.get("actions", [])[:7])
    plan_html = "\n".join(render_plan_item(item) for item in report.get("optimizationPlan", [])[:6])
    health_html = "\n".join(render_health_lane(item) for item in report.get("chainHealth", []))
    gate_html = render_gate(report.get("growthGates", {}).get("budget", {}))
    timeframe_html = render_timeframe_analysis(report.get("analysis", {}))
    experiments_html = render_experiment_cards(report.get("analysis", {}))
    source = report.get("sources", {})
    next_day_note = "有回访信号，但样本仍小；先作为素材方向，不作为放量凭据。"
    if pct(m.get("activeUserNextDayReturnSignal")) == "n/a":
        next_day_note = "次日回访信号不可读，先补 cohort 数据。"

    return f"""<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{title}</title>
  <style>
    :root {{
      --ink: #1f2430;
      --muted: #626b7f;
      --line: #dbe1ec;
      --panel: #ffffff;
      --surface: #f7f8fb;
      --blue: #5477c4;
      --orange: #cc6f47;
      --olive: #71b436;
      --gold: #b8a037;
      --pink: #bd569b;
    }}
    * {{ box-sizing: border-box; }}
    body {{
      margin: 0;
      background: var(--surface);
      color: var(--ink);
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }}
    main {{
      max-width: 1080px;
      margin: 0 auto;
      padding: 40px 22px 72px;
    }}
    header, section {{ margin-bottom: 34px; }}
    h1 {{ margin: 0 0 10px; font-size: clamp(30px, 5vw, 52px); line-height: 1.05; letter-spacing: 0; }}
    h2 {{ margin: 0 0 14px; font-size: 24px; line-height: 1.18; letter-spacing: 0; }}
    h3 {{ margin: 0 0 8px; font-size: 17px; line-height: 1.25; letter-spacing: 0; }}
    p, li {{ line-height: 1.68; }}
    p {{ margin: 0 0 12px; }}
    .meta {{ color: var(--muted); font-size: 14px; }}
    .summary {{
      border-left: 5px solid var(--blue);
      background: var(--panel);
      padding: 18px 20px;
      box-shadow: 0 10px 24px rgba(31, 36, 48, 0.06);
    }}
    .summary ul {{ margin: 0; padding-left: 20px; }}
    .summary li + li {{ margin-top: 9px; }}
    .kpis {{
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 12px;
      margin-top: 18px;
    }}
    .kpi {{
      background: var(--panel);
      border: 1px solid var(--line);
      padding: 14px 16px;
    }}
    .kpi strong {{ display: block; font-size: 24px; line-height: 1; margin-bottom: 8px; }}
    .kpi span {{ color: var(--muted); font-size: 13px; line-height: 1.35; display: block; }}
    figure {{
      margin: 18px 0 8px;
      background: var(--panel);
      border: 1px solid var(--line);
      padding: 12px;
      overflow: hidden;
    }}
    figure img {{ width: 100%; height: auto; display: block; }}
    figcaption {{ color: var(--muted); font-size: 13px; line-height: 1.5; margin-top: 10px; }}
    .actions {{
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 14px;
    }}
    .plan-grid {{
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 14px;
      margin-top: 16px;
    }}
    .health-grid {{
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 12px;
      margin-top: 14px;
    }}
    .timeframe-grid {{
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 14px;
      margin-top: 16px;
    }}
    .experiment-grid {{
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 14px;
      margin-top: 14px;
    }}
    .action, .plan-card, .health-card, .gate, .timeframe-card, .experiment-card {{
      background: var(--panel);
      border: 1px solid var(--line);
      padding: 16px;
    }}
    .plan-card ul, .gate ul, .timeframe-card ul, .experiment-card ul {{ margin: 8px 0 0; padding-left: 18px; }}
    .plan-card li, .gate li, .timeframe-card li, .experiment-card li {{ font-size: 13px; line-height: 1.55; }}
    .badge {{
      display: inline-block;
      font-size: 12px;
      font-weight: 700;
      padding: 3px 8px;
      margin-bottom: 10px;
      color: white;
      background: var(--orange);
    }}
    .badge.p1 {{ background: var(--blue); }}
    .badge.p2 {{ background: var(--olive); }}
    .pill {{
      display: inline-block;
      color: var(--muted);
      font-size: 12px;
      line-height: 1.35;
      margin-bottom: 8px;
    }}
    .score {{
      font-family: "SF Mono", Menlo, Consolas, monospace;
      font-weight: 700;
      color: var(--ink);
    }}
    .gate {{
      border-left: 5px solid var(--orange);
      margin-top: 14px;
    }}
    .source-note {{
      color: var(--muted);
      border-top: 1px solid var(--line);
      padding-top: 16px;
      font-size: 13px;
      line-height: 1.6;
    }}
    code {{
      font-family: "SF Mono", Menlo, Consolas, monospace;
      background: #eef1f7;
      padding: 2px 5px;
    }}
    @media (max-width: 760px) {{
      main {{ padding: 28px 16px 52px; }}
      .kpis, .actions, .plan-grid, .health-grid, .timeframe-grid, .experiment-grid {{ grid-template-columns: 1fr; }}
      figure {{ padding: 8px; }}
    }}
  </style>
</head>
<body>
  <main data-report-audience="product stakeholders">
    <header data-contract-section="title">
      <h1>{title}</h1>
      <p class="meta">Run date: {run_date} · GA data date: {report_date} · Status: {escape(status)}</p>
    </header>

    <section class="summary" data-contract-section="executive-summary">
      <h2>Executive Summary</h2>
      <ul>
        <li><strong>先补数据和合规阻塞，再谈放量。</strong> Play Console acquisition 缺失，GA 只能解释安装后承接；同时昨日仍有 {intnum(m.get("adEvents"))} 个广告相关事件，需要确认是否来自旧包、测试包或当前包。</li>
        <li><strong>当前最大产品断点是首局启动和二局循环。</strong> 打开后开局率只有 {pct(m.get("initToGameStart"))}，但开局后的完赛率为 {pct(m.get("gameStartToEnd"))}，说明优先级应放在商店承诺、首屏入口和结算页下一局动机。</li>
        <li><strong>YouTube 要重新变成素材学习入口。</strong> 最新 manifest 已经 {escape(report.get("chain", {}).get("youtube", {}).get("ageDays", "n/a"))} 天前生成，建议每日刷新 3 条 Shorts 候选，并用 UTM/creative id 回流到 GA 漏斗。</li>
      </ul>
    </section>

    <section>
      <h2>Headline Metrics</h2>
      <div class="kpis">
        <div class="kpi"><strong>{intnum(m.get("activeUsers"))}</strong><span>Active users</span></div>
        <div class="kpi"><strong>{intnum(m.get("eventCount"))}</strong><span>Events</span></div>
        <div class="kpi"><strong>{pct(m.get("initToGameStart"))}</strong><span>game_start / game_init_success</span></div>
        <div class="kpi"><strong>{pct(m.get("gameStartToSecondBattle"))}</strong><span>second_battle_start / game_start</span></div>
      </div>
    </section>

    <section>
      <h2>优化方向总览</h2>
      <p><strong>优化方向不再只是一组建议，而是每天可复盘的实验队列。</strong> 当前最靠前的是 Play Console acquisition、广告事件来源、首局启动承诺、结果页反制循环和 YouTube Shorts 刷新；每项都绑定了验证指标和成功判据。</p>
      <figure>
        <img src="{priority_src}" alt="Optimization priority map">
        <figcaption>优先级分数综合阻塞程度、预期影响、证据强度和紧急度；P0 先清数据与合规，P1 再修增长承接。</figcaption>
      </figure>
      <div class="plan-grid">
        {plan_html}
      </div>
    </section>

    <section data-contract-section="key-findings">
      <h2>首局启动弱，二局循环还没有成立</h2>
      <p><strong>优化方向：先把“选对阵 -> 开战 -> verdict -> 反制下一局”讲清楚。</strong> 开局率低于 50% 的继续线，二局和 next-match 点击为 0；不要把 ASO 或 Shorts 继续包装成泛泛自动战斗，要把第一张图、短描述和结果页按钮都改成同一句 matchup/counter 承诺。</p>
      <figure>
        <img src="{funnel_src}" alt="Core growth funnel rates">
        <figcaption>漏斗率来自 2026-06-23 GA 聚合事件。完赛率可用，但开局、二局和 next-match 是当前最需要修的断点。</figcaption>
      </figure>
    </section>

    <section>
      <h2>按日、按周、按月分析</h2>
      <p><strong>日分析看 30 天趋势，周分析跑持续 A/B，月分析决定方向和预算。</strong> 当前样本仍小，所以日报强调趋势和断点，周/月强调实验节奏和停止条件。</p>
      <figure>
        <img src="{trend_src}" alt="Daily 30-day trend">
        <figcaption>30 天窗口内的日趋势采用指数化展示；样本不足时只用于观察方向，不用于自动加预算。</figcaption>
      </figure>
      <div class="timeframe-grid">
        {timeframe_html}
      </div>
      <figure>
        <img src="{ab_src}" alt="Continuous A/B cadence">
        <figcaption>周实验优化具体执行，月实验决定定位、留存机制和预算档位；低样本阶段不强行宣布统计赢家。</figcaption>
      </figure>
      <div class="experiment-grid">
        {experiments_html}
      </div>
    </section>

    <section>
      <h2>链路健康与放量门槛</h2>
      <p><strong>当前结论是 Hold，不是 Scale。</strong> 数据源和玩法承接都还没有达到自动加预算的条件；预算应该服务于学习素材和验证首局/二局承接。</p>
      <figure>
        <img src="{health_src}" alt="Growth chain health">
        <figcaption>热力图用 0-100 分展示每段链路的数据证据、可行动性、体验承接和放量准备度。</figcaption>
      </figure>
      {gate_html}
      <div class="health-grid">
        {health_html}
      </div>
    </section>

    <section>
      <h2>事件信号把优先级压到三件事</h2>
      <p><strong>优化方向：P0 查广告事件来源，P1 修开局表达和结算页，P1 刷新 YouTube 素材池。</strong> 广告事件数量高于核心对局事件，且第二局和下一局点击为 0；这会同时影响商店合规、ASO 可信表达和留存体验。</p>
      <figure>
        <img src="{signals_src}" alt="Signal priorities">
        <figcaption>事件计数不是结论本身，而是用于排队：先处理合规/数据阻塞，再处理首局和二局承接。</figcaption>
      </figure>
    </section>

    <section data-contract-section="recommended-next-steps">
      <h2>Recommended Next Steps</h2>
      <div class="actions">
        {actions_html}
      </div>
    </section>

    <section data-contract-section="further-questions">
      <h2>Further Questions</h2>
      <p><strong>Play Console 商店漏斗什么时候可读？</strong> 没有 impressions、store listing visitors、installers、country/source/search 报表，就只能优化安装后承接，无法判断 ASO 首屏是否真的提高安装。</p>
      <p><strong>广告事件到底来自哪里？</strong> 如果来自旧包或测试包，报告中标注即可；如果当前包仍在发，需要先修 Data safety 和商店口径。</p>
      <p><strong>next-day return 是否来自真实回访？</strong> {escape(next_day_note)}</p>
    </section>

    <section data-contract-section="caveats-and-assumptions">
      <h2>Caveats and Assumptions</h2>
      <p>本报告使用本地生成的 GA daily、ASO insight、ops growth loop 和 YouTube manifest。样本量仍小，当前建议是运营优先级和链路修复建议，不是统计显著的增长结论。</p>
      <p class="source-note">
        Sources: {escape(source.get("gaReportPath", ""))}<br>
        {escape(source.get("asoInsightPath", ""))}<br>
        {escape(str(source.get("youtubeManifestPath", "")))}<br>
        Report JSON: {escape(str(report_path))}
      </p>
    </section>
  </main>
</body>
</html>
"""


def render_action(action):
    priority = escape(action.get("priority", "P2"))
    cls = priority.lower()
    return f"""
        <article class="action">
          <span class="badge {cls}">{priority} · {escape(action.get("area", ""))}</span>
          <h3>{escape(action.get("title", ""))}</h3>
          <p>{escape(action.get("detail", ""))}</p>
        </article>
    """


def render_plan_item(item):
    priority = escape(item.get("priority", "P2"))
    cls = priority.lower()
    actions = "".join(f"<li>{escape(action)}</li>" for action in item.get("actions", [])[:2])
    evidence = "; ".join(str(value) for value in item.get("evidence", [])[:2])
    return f"""
        <article class="plan-card">
          <span class="badge {cls}">{priority} · {escape(item.get("lane", ""))}</span>
          <h3>{escape(item.get("title", ""))}</h3>
          <p><span class="pill">Status: {escape(item.get("status", ""))} · Score <span class="score">{escape(item.get("priorityScore", ""))}</span></span></p>
          <p>{escape(item.get("hypothesis", ""))}</p>
          <p class="meta">{escape(evidence)}</p>
          <ul>{actions}</ul>
        </article>
    """


def render_health_lane(item):
    return f"""
        <article class="health-card">
          <h3>{escape(item.get("lane", ""))} · <span class="score">{escape(item.get("healthScore", ""))}</span></h3>
          <p class="meta">Status: {escape(item.get("status", ""))}</p>
          <p>{escape(item.get("summary", ""))}</p>
          <p><strong>下一步：</strong>{escape(item.get("nextAction", ""))}</p>
        </article>
    """


def render_gate(gate):
    go = "".join(f"<li>{escape(item)}</li>" for item in gate.get("goWhen", [])[:5])
    hold = "".join(f"<li>{escape(item)}</li>" for item in gate.get("holdWhen", [])[:3])
    stop = "".join(f"<li>{escape(item)}</li>" for item in gate.get("stopWhen", [])[:3])
    rationale = "；".join(str(item) for item in gate.get("rationale", [])[:4])
    return f"""
      <div class="gate">
        <h3>{escape(gate.get("recommendation", "继续小额学习"))}</h3>
        <p class="meta">Status: {escape(gate.get("status", "unknown"))} · {escape(rationale)}</p>
        <p><strong>Go 条件</strong></p>
        <ul>{go}</ul>
        <p><strong>Hold 条件</strong></p>
        <ul>{hold}</ul>
        <p><strong>Stop 条件</strong></p>
        <ul>{stop}</ul>
      </div>
    """


def render_timeframe_analysis(analysis):
    daily = analysis.get("daily", {})
    weekly = analysis.get("weekly", {})
    monthly = analysis.get("monthly", {})
    daily_trend = daily.get("trend", {})
    daily_meta = (
        f"{daily.get('coverageLabel', '0/30 days observed')} · "
        f"Avg DAU {number(daily_trend.get('avgActiveUsers'))} · "
        f"Events {intnum(daily_trend.get('totalEvents'))}"
    )
    weekly_meta = f"{intnum(weekly.get('observedWeeks'))}/{intnum(weekly.get('windowWeeks'))} weeks observed"
    monthly_meta = f"{intnum(monthly.get('observedMonths'))}/{intnum(monthly.get('windowMonths'))} months observed"
    return "\n".join([
        render_timeframe_card(
            "按日：30 天趋势",
            daily_meta,
            daily.get("summary", "暂无日趋势。"),
            daily.get("nextActions", [])[:3],
        ),
        render_timeframe_card(
            "按周：持续 A/B",
            weekly_meta,
            weekly.get("summary", "暂无周分析。"),
            [
                f"{item.get('lane', '')}: {item.get('title', '')}"
                for item in weekly.get("experiments", [])[:3]
            ],
        ),
        render_timeframe_card(
            "按月：方向性 A/B",
            monthly_meta,
            monthly.get("summary", "暂无月分析。"),
            [
                f"{item.get('lane', '')}: {item.get('title', '')}"
                for item in monthly.get("experiments", [])[:3]
            ],
        ),
    ])


def render_timeframe_card(title, meta, summary, bullets):
    items = "".join(f"<li>{escape(item)}</li>" for item in bullets)
    return f"""
        <article class="timeframe-card">
          <h3>{escape(title)}</h3>
          <p class="meta">{escape(meta)}</p>
          <p>{escape(summary)}</p>
          <ul>{items}</ul>
        </article>
    """


def render_experiment_cards(analysis):
    weekly = analysis.get("weekly", {}).get("experiments", [])
    monthly = analysis.get("monthly", {}).get("experiments", [])
    experiments = (weekly[:2] + monthly[:2]) or [{
        "cadence": "weekly",
        "lane": "观察",
        "title": "继续积累样本",
        "hypothesis": "先让 GA、Play Console 和 creative_id 链路稳定可读。",
        "primaryMetric": "30-day trend coverage",
        "guardrailMetric": "growthGates.status",
        "minimumRun": "每日跑数，周/月复盘。",
        "status": "planned",
        "priorityScore": 0,
    }]
    return "\n".join(render_experiment_card(item) for item in experiments)


def render_experiment_card(item):
    cadence = "周实验" if item.get("cadence") == "weekly" else "月实验"
    variants = " / ".join(str(value) for value in item.get("variants", [])[:2])
    return f"""
        <article class="experiment-card">
          <span class="pill">{escape(cadence)} · {escape(item.get("lane", ""))} · Score <span class="score">{escape(item.get("priorityScore", ""))}</span></span>
          <h3>{escape(item.get("title", ""))}</h3>
          <p>{escape(item.get("hypothesis", ""))}</p>
          <p class="meta">Variants: {escape(variants or "n/a")}</p>
          <ul>
            <li>主指标：{escape(item.get("primaryMetric", ""))}</li>
            <li>护栏：{escape(item.get("guardrailMetric", ""))}</li>
            <li>周期：{escape(item.get("minimumRun", ""))}</li>
            <li>状态：{escape(item.get("status", ""))}</li>
          </ul>
        </article>
    """


def escape(value):
    return html.escape(str(value if value is not None else ""))


def pct(value):
    if value is None:
        return "n/a"
    try:
        return f"{float(value) * 100:.1f}%"
    except (TypeError, ValueError):
        return "n/a"


def intnum(value):
    try:
        return f"{int(round(float(value)))}"
    except (TypeError, ValueError):
        return "0"


def number(value):
    try:
        return f"{float(value):.1f}"
    except (TypeError, ValueError):
        return "0.0"


def rel(path, base):
    return os.path.relpath(path, base).replace(os.sep, "/")


if __name__ == "__main__":
    main()
