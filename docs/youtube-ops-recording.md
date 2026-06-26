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
- Alternates fresh Item Mode and Hero Mode captures by default instead of reusing the Quick Start playlist.
- Item Mode daily captures default to 4 balls for denser Shorts footage; Hero Mode uses randomized hero 1v1 starts.
- Selects the top 1 clip by topic score for upload.
- Uses YouTube Shorts vertical size, `1080x1920`.
- Writes only selected clips into `videos/`.
- Keeps all candidates under `candidates/` for review.
- Account warmup cadence is intentionally capped at 1 Short/day; extra good candidates should stay in the hold queue until the next day.

## Capture custom local materials

```bash
npm run ops:capture-youtube -- --count=5
npm run ops:capture-youtube -- --count=3 --candidates=12 --format=landscape
npm run ops:capture-youtube -- --count=1 --candidates=9 --format=short
npm run ops:daily-youtube:en
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
- `youtube-upload-plan.md`: human-readable upload/API checklist with the selected title, description, and tags.
- `daily-ops-brief.md`: daily producer brief with the selected clip, story arc, hook, and candidate ranking.

## Useful options

```bash
npm run ops:capture-youtube -- --count=10 --out=/Users/you/Desktop/bangbang-youtube
npm run ops:capture-youtube -- --count=3 --locale=en --viewport=1280x720
npm run ops:capture-youtube -- --count=2 --realTime
npm run ops:capture-youtube -- --daily --count=1 --candidates=9 --format=short
npm run ops:capture-youtube -- --daily --scenes=items,heroes --dailyItemBallCount=4 --locale=en
```

- `--count`: number of final selected clips.
- `--candidates`: number of matches to record before selecting the final clips.
- `--out`: output root directory.
- `--locale`: game and metadata locale, for example `zh` or `en`.
- `--format`: recording preset, `landscape` (`1280x720`), `short` (`1080x1920`), or `square` (`1080x1080`).
- `--viewport`: custom recording size. This overrides `--format`.
- `--scenes`: comma-separated capture scenes. Daily mode defaults to `items,heroes`; omit it in manual mode to keep Quick Start behavior.
- `--dailyItemBallCount`: ball count for daily Item Mode captures. Defaults to `4`.
- `--realTime`: disables quick settlement so matches keep normal pacing.
- `--headed`: opens a visible browser while recording.
- `--daily`: daily producer mode; defaults to 1 selected clip from 9 candidates.

## Post-publish metrics

### One-time API authorization

Create an OAuth desktop client in Google Cloud with these APIs enabled:

- YouTube Data API v3
- YouTube Analytics API
- Google Analytics Data API

Save the downloaded client secret JSON outside the repo:

```text
~/.config/profession-ball-arena/google-oauth-client.json
```

Then run:

```bash
npm run auth:google
```

This opens a local OAuth flow, stores a refreshable token at:

```text
~/.config/profession-ball-arena/google-oauth-token.json
```

The token is reused by `ops:youtube-metrics`; when it expires, the script refreshes it automatically.

After one Short is live, bind it to the run and pull metrics:

```bash
YOUTUBE_ACCESS_TOKEN=... npm run ops:youtube-metrics -- --run=2026-06-24-231930 --video-url="https://www.youtube.com/shorts/VIDEO_ID"
```

The script updates `manifest.json`, the selected clip metadata, `youtube-publish-tracking-YYYY-MM-DD.md/json`, and `youtube-efficiency-YYYY-MM-DD.md/json`.

If OAuth is already configured, this shorter command is enough:

```bash
npm run ops:youtube-metrics -- --run=2026-06-24-231930 --video-url="https://www.youtube.com/shorts/VIDEO_ID"
```

If `--video-url` is omitted and OAuth is configured, the script attempts to auto-bind the latest video owned by the authenticated channel for the publish date. Passing the URL is still safest for the first run.

- `YOUTUBE_API_KEY` can read public video stats through the YouTube Data API, but cannot read private channel analytics.
- OAuth with YouTube Analytics readonly access is required for per-video subscribers gained, shares, average view duration, average percentage viewed, and `engagedViews`.
- GA4 attribution is attempted through the Google Analytics Data API using the same OAuth token or `GOOGLE_APPLICATION_CREDENTIALS` / `GA4_SERVICE_ACCOUNT_JSON`.
- Google Play direct-link clicks still need GA/UTM or a YouTube Studio export because YouTube's video APIs do not reliably expose per-Short store-link clicks.

For English promotional output, use `npm run ops:daily-youtube:en`. It records vertical Shorts and writes English upload titles, descriptions, hooks, thumbnail prompts, editing prompts, and the daily producer brief.

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

After OAuth is configured and the daily capture has finished, upload the selected rank 1 Short through the YouTube Data API:

```bash
npm run ops:youtube-upload -- --run=YYYY-MM-DD-HHMMSS --rank=1 --privacy=public
```

If `--run` is omitted, the uploader uses the latest run under `ops-materials/youtube/`. The uploader reads the selected clip metadata, uploads the video, then writes `youtube-upload-result-YYYY-MM-DD.md/json` and updates `manifest.json`.

For a scheduled post, pass an ISO timestamp and the script will upload it as a private scheduled video:

```bash
npm run ops:youtube-upload -- --run=YYYY-MM-DD-HHMMSS --rank=1 --publishAt=2026-06-27T02:30:00Z
```

Manual YouTube Studio upload still works: upload files from `videos/`, then copy the matching title, description, and tags from `youtube-upload-plan.md` or the clip JSON in `metadata/`.
