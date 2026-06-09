# YouTube operations recording

This workflow records local match clips, stores them as local source material, and writes upload-ready YouTube metadata.

## Start the game locally

```bash
npm run dev -- --port 5173
```

Keep the dev server running while capturing.

## Capture local materials

```bash
npm run ops:capture-youtube -- --count=5
```

By default this writes a run folder under:

```text
ops-materials/youtube/YYYY-MM-DD-HHMMSS/
```

Each run contains:

- `videos/`: downloaded `.webm` match recordings with danmaku and result overlays.
- `metadata/`: one JSON file per clip with YouTube title, description, tags, and match stats.
- `manifest.json`: machine-readable run index.
- `youtube-upload-plan.md`: human-readable upload checklist for YouTube Studio.

## Useful options

```bash
npm run ops:capture-youtube -- --count=10 --out=/Users/you/Desktop/bangbang-youtube
npm run ops:capture-youtube -- --count=3 --locale=en --viewport=1280x720
npm run ops:capture-youtube -- --count=2 --realTime
```

- `--count`: number of matches to record.
- `--out`: output root directory.
- `--locale`: game and metadata locale, for example `zh` or `en`.
- `--viewport`: recording size, default `1280x720`.
- `--realTime`: disables quick settlement so matches keep normal pacing.
- `--headed`: opens a visible browser while recording.

## Upload to YouTube

Open YouTube Studio, upload files from `videos/`, then copy the matching title, description, and tags from `youtube-upload-plan.md` or the clip JSON in `metadata/`.

Automatic YouTube upload is intentionally not enabled here yet because it requires channel OAuth setup and account permission handling. Once the capture quality is stable, the next step can be a separate uploader that reads `manifest.json` and publishes through the YouTube Data API.
