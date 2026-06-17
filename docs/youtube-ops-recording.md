# YouTube operations recording

This workflow records local match clips, scores the most topic-worthy matches, stores selected YouTube source material locally, and writes upload-ready metadata plus prompt packs for editing, thumbnails, and story optimization.

## Start the game locally

```bash
npm run dev -- --port 5173
```

Keep the dev server running while capturing.

## Daily ops capture

```bash
npm run ops:daily-youtube
```

Default daily behavior:

- Records 9 candidate matches.
- Selects the top 3 clips by topic score.
- Uses YouTube Shorts vertical size, `1080x1920`.
- Writes only selected clips into `videos/`.
- Keeps all candidates under `candidates/` for review.

## Capture custom local materials

```bash
npm run ops:capture-youtube -- --count=5
npm run ops:capture-youtube -- --count=3 --candidates=12 --format=landscape
npm run ops:capture-youtube -- --count=3 --candidates=9 --format=short
```

By default this writes a run folder under:

```text
ops-materials/youtube/YYYY-MM-DD-HHMMSS/
```

Each run contains:

- `videos/`: selected `.webm` match recordings with danmaku and result overlays.
- `metadata/`: one JSON file per selected clip with YouTube title, description, tags, match stats, topic score, and story prompt pack.
- `candidates/videos/`: every recorded candidate clip before ranking.
- `candidates/metadata/`: one JSON file per candidate, including selection status and score reasons.
- `manifest.json`: machine-readable run index.
- `youtube-upload-plan.md`: human-readable upload checklist for YouTube Studio.
- `daily-ops-brief.md`: daily producer brief with the selected 3 clips, story arcs, hooks, and candidate ranking.

## Useful options

```bash
npm run ops:capture-youtube -- --count=10 --out=/Users/you/Desktop/bangbang-youtube
npm run ops:capture-youtube -- --count=3 --locale=en --viewport=1280x720
npm run ops:capture-youtube -- --count=2 --realTime
npm run ops:capture-youtube -- --daily --count=3 --candidates=9 --format=short
```

- `--count`: number of final selected clips.
- `--candidates`: number of matches to record before selecting the final clips.
- `--out`: output root directory.
- `--locale`: game and metadata locale, for example `zh` or `en`.
- `--format`: recording preset, `landscape` (`1280x720`), `short` (`1080x1920`), or `square` (`1080x1080`).
- `--viewport`: custom recording size. This overrides `--format`.
- `--realTime`: disables quick settlement so matches keep normal pacing.
- `--headed`: opens a visible browser while recording.
- `--daily`: daily producer mode; defaults to 3 selected clips from 9 candidates.

## Topic scoring

The daily selector scores clips with a simple operations heuristic:

- High-value tags: no-damage win, comeback, low-HP clutch, double KO, signature move.
- Pacing: 18-75 seconds is favored for short-form cuts.
- Drama: close damage totals, underdog wins, and high interaction count add score.
- Story value: generated win reason and replay lesson add context for captions.

Selection also tries to avoid picking the same matchup or same primary topic three times when the candidate pool allows variety.

## Prompt and story tuning

Each selected metadata JSON includes:

- `topic.score`: numeric topic score.
- `topic.reasons`: why the clip was selected.
- `story.angle`: current story route, such as `逆风反杀局` or `残血极限收割`.
- `story.hook`: opening idea for the edit.
- `story.openingCaption`: first on-screen caption.
- `story.threeActStory`: setup, turn, and payoff.
- `story.retentionBeats`: suggested edit rhythm.
- `story.thumbnailPrompt`: thumbnail generation prompt.
- `story.editingPrompt`: full prompt for a video editor or LLM-assisted editing workflow.

When optimizing prompts recently, start with these fields:

1. Low click-through: rewrite `story.titleIdeas[0]` and `story.thumbnailPrompt`.
2. Low retention: shorten `story.retentionBeats` and cut long middle sections.
3. Low comments: make `story.openingCaption` a judgment question, especially for draw, clutch, and close matches.

## Upload to YouTube

Open YouTube Studio, upload files from `videos/`, then copy the matching title, description, and tags from `youtube-upload-plan.md` or the clip JSON in `metadata/`.

Automatic YouTube upload is intentionally not enabled here yet because it requires channel OAuth setup and account permission handling. Once the capture quality is stable, the next step can be a separate uploader that reads `manifest.json` and publishes through the YouTube Data API.
