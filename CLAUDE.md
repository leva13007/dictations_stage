# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Project Does

This is a **content repository** for a dictation learning app. It stores dictation exercises (text, metadata, and MP3 audio files) and publishes them via **GitHub Pages** so the [Dictation App](https://github.com/leva13007/dictation_app) can fetch them at runtime.

The app reads from:
```
https://leva13007.github.io/dictations/dics/index.json
https://leva13007.github.io/dictations/dics/<id>/dic.json
https://leva13007.github.io/dictations/dics/<id>/playlist.json
https://leva13007.github.io/dictations/dics/<id>/sounds/<id>-<nn>.mp3
```

To use a local/forked version of this repo with the app, paste the GitHub Pages URL into the app's `Source URL` field.

## Tech Stack

- **TypeScript** (ES2020, CommonJS) — two Node.js scripts in `src/`
- **tsx** — runs TypeScript scripts directly without a build step
- **mp3-duration** — measures MP3 file durations
- No build output: the scripts are run ad-hoc via `yarn`/`npm run`; there is no `dist/` that gets deployed

## Commands

```bash
# Generate playlist.json, dic.json, sounds/ folder, and update index.json from Text.md
yarn gen <dic-id>            # e.g. yarn gen 0007

# Measure MP3 durations and update duration_sec in playlist.json, dic.json, and index.json
yarn durations <dic-id>      # e.g. yarn durations 0007
```

Version bumping:
```bash
npm version patch -m "v%s"   # small fix or metadata change
npm version minor -m "v%s"   # new dictation added
npm version major -m "v%s"   # breaking structure change
git push && git push --tags
```

## Architecture

### Data flow for a new dictation

1. Author writes `dics/<id>/Text.md` — first line is the `# Title`, each subsequent non-empty line is one sentence.
2. `yarn gen <id>` reads `Text.md` and writes:
   - `dics/<id>/playlist.json` — array of `{id, text, audio}` entries (audio path relative to repo root: `dics/<id>/sounds/<id>-<nn>.mp3`)
   - `dics/<id>/dic.json` — metadata shell (level/voice/tags left `null`/empty for manual fill)
   - Upserts an entry in `dics/index.json`
3. Author places MP3 files in `dics/<id>/sounds/` named `<id>-01.mp3`, `<id>-02.mp3`, etc.
4. `yarn durations <id>` reads each MP3, fills `duration_sec` into every `playlist.json` entry and the total into `dic.json` and `index.json`.
5. Author manually fills metadata in `dic.json` (level, voice, tags, video URL) and the matching fields in `index.json`.
6. Push to `main` → GitHub Pages auto-deploys.

### Key invariant in `Text.md` parsing

`generate-playlist.ts` uses only the **last section** when the file contains a `---` separator — this lets authors keep draft notes above the separator without polluting the generated playlist.

The title (line 1, stripped of `#`) is also included as **sentence 1** in `playlist.json`, so `sentences` count in `dic.json` includes the title audio.

### `index.json` vs `dic.json`

`index.json` is the lightweight master list the app uses to populate its dictation selector. `dic.json` is the full per-dictation metadata including voice info. `playlist.json` is what the app loads during an active session (sentence text + audio path + duration).

## Ecosystem Context

This repo sits in a local `dic_app/` workspace alongside sibling projects:
- `dictation_app/` — the frontend app that consumes this content
- `dic_img/`, `dic_thumbnail/`, `dic_video/` — media-generation helpers
- `dics_testing/` — likely a sandbox for testing dictation content

Audio files are generated externally via ElevenLabs TTS (voice metadata stored in `dic.json`), then placed manually into `sounds/`.

## Checklist for a New Dictation

- [ ] Create `dics/<id>/Text.md` with `# Title` on line 1, one sentence per line
- [ ] `yarn gen <id>`
- [ ] Add MP3 files to `dics/<id>/sounds/` (`<id>-01.mp3`, `<id>-02.mp3`, …)
- [ ] `yarn durations <id>`
- [ ] Fill in `dic.json`: `level`, `voice`, `tags`, `video`
- [ ] Update matching fields in `index.json` if needed
- [ ] Bump version and update `CHANGELOG.md`
- [ ] `git push && git push --tags`
