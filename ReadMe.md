# Dictation Content Repository

This repository contains dictation content (playlists, audio files, and texts) for the [Dictation App](https://github.com/leva13007/dictation_app). It is published via **GitHub Pages** and serves as the data source for the app.

You can open that app by following the link above, or by visiting:

[open in new tab](https://leva13007.github.io/dictation_app/)

and insert build URL of this repository to the `Source URL` field:

```
https://leva13007.github.io/dictations/
``` 

## Repository Structure

```
dics/
├── index.json                  # Master index of all dictations
├── 0001/
│   ├── dic.json                # Dictation metadata (level, voice, tags, etc.)
│   ├── playlist.json           # Ordered list of sentences with audio references
│   ├── Text.md                 # Full dictation text (source for generation)
│   ├── ReadMe.md               # Description, video link, etc. **optional**
│   └── sounds/
│       ├── 0001-01.mp3         # Audio for sentence 1
│       ├── 0001-02.mp3         # Audio for sentence 2
│       └── ...
└── ...
src/
├── generate-playlist.ts        # Generation script
└── update-durations.ts         # Measures MP3 durations and updates metadata
```

## Available Dictations

| ID | Title | Level | Video |
|---|---|---|---|
| 0001 | The Reading Crisis in Modern Society | B2 | — |
| 0002 | Is Reading Always Beneficial? | B2 | [▶ YouTube](https://youtu.be/SYihTCG_9Xk) |
| 0003 | Addressing the Reading Crisis | B2 | — |
| 0004 | Living in a City | B2 | — |
| 0005 | Working from Home | B2 | — |
| 0006 | Studying English online | B2 | — |

## File Descriptions

| File | Purpose |
|---|---|
| `dics/index.json` | Master index with metadata for every dictation. The app reads this to populate the dictation selector. |
| `dics/<id>/dic.json` | Per-dictation metadata: level, sentence count, voice info, tags, video link, creation date. |
| `dics/<id>/playlist.json` | Ordered array of sentences. Each entry has an `id`, `text`, and `audio` path. |
| `dics/<id>/ReadMe.md` | *(optional)* Human-readable description for GitHub browsing: difficulty level, companion video, usage tips. |
| `dics/<id>/Text.md` | The full dictation text. Used as the source document for generating `playlist.json` and `dic.json`. |
| `dics/<id>/sounds/*.mp3` | MP3 audio files, one per sentence. Named `<dic-id>-<sentence-number>.mp3`. |

---

## How to Create a New Dictation

### 1. Choose an ID

Pick the next available four-digit ID (e.g. if `0006` exists, use `0007`).

### 2. Create the folder and write the text

Create the folder `dics/<id>/` and add a `Text.md` file inside. The first line should be the title as a Markdown heading. Each subsequent line is **one sentence** that will become a separate audio clip:

```markdown
# My Dictation Title
This is the first sentence of the dictation.
This is the second sentence.
Numbers should be written out as words, for example twenty five.
```

> **Tip:** Write numbers as words (e.g. "twenty five" instead of "25") since learners will be typing what they hear.

If the file contains a `---` separator, the script uses only the **last section** (useful for keeping drafts/notes at the top).

### 3. Run the generation script

```bash
yarn gen <dic-id>
```

This single command does everything:

- Creates `playlist.json` from the sentences in `Text.md`
- Creates `dic.json` with metadata (unknown fields set to `null` / empty arrays)
- Creates the `sounds/` folder if it doesn't exist
- Adds (or updates) the entry in `dics/index.json`

### 4. Add audio files

Place one MP3 file per sentence in the `sounds/` folder using the naming convention:

```
<dic-id>-<sentence-number>.mp3
```

For example, dictation `0007` with 5 sentences:

```
sounds/
├── 0007-01.mp3
├── 0007-02.mp3
├── 0007-03.mp3
├── 0007-04.mp3
└── 0007-05.mp3
```

Sentence numbers are zero-padded to two digits (`01`, `02`, … `99`).

### 5. Update durations

Once all audio files are in place, run:

```bash
yarn durations <dic-id>
```

This measures each MP3 file and:

- Adds `duration_sec` to every entry in `playlist.json`
- Sets the total `duration_sec` in `dic.json`
- Updates `duration_sec` in `dics/index.json`

### 6. Fill in metadata (optional)

Edit the generated `dic.json` to fill in known values:

```json
{
  "id": "0007",
  "title": "My Dictation Title",
  "level": "B2",
  "sentences": 5,
  "duration_sec": null,
  "voice": {
    "voice_name": "Rowan – Gentle, Soft-Spoken & Warm",
    "voice_id": "kLhAstPcnnPxqzk6gS5i",
    "provider": "ElevenLabs",
    "type": "man"
  },
  "features": [],
  "tags": ["business"],
  "video": "https://youtu.be/...",
  "created_at": "2026-03-19T12:00:00Z"
}
```

You can also update the matching fields in `dics/index.json` (`level`, `tags`, `has_video`, etc.).

### 7. Commit and push

Once pushed to the `main` branch, GitHub Pages will publish the new content automatically.

---

## Data Formats

### `dics/index.json`

```json
{
  "language": "en",
  "url": "https://leva13007.github.io/dictations/dics",
  "repository": "https://github.com/leva13007/dictations",
  "created_at": "2024-03-19T12:00:00Z",
  "updated_at": "2026-03-19T19:10:41.368Z",
  "dics": [
    {
      "id": "0001",
      "title": "The Reading Crisis in Modern Society",
      "level": "B2",
      "sentences": 13,
      "duration_sec": 70.9,
      "tags": [],
      "features": [],
      "type": "general",
      "has_video": null
    }
  ]
}
```

### `dics/<id>/dic.json`

```json
{
  "id": "0001",
  "title": "The Reading Crisis in Modern Society",
  "level": "B2",
  "sentences": 13,
  "duration_sec": 70.9,
  "voice": {
    "voice_name": null,
    "voice_id": null,
    "provider": "ElevenLabs",
    "type": "man"
  },
  "features": [],
  "tags": [],
  "video": null,
  "created_at": "2024-03-19T12:00:00Z"
}
```

### `dics/<id>/playlist.json`

```json
[
  {
    "id": 1,
    "text": "The Reading Crisis in Modern Society",
    "audio": "0001-01.mp3",
    "duration_sec": 1.72
  },
  {
    "id": 2,
    "text": "Over the past twenty years several studies have highlighted a decline in reading habits.",
    "audio": "0001-02.mp3",
    "duration_sec": 5.87
  }
]
```

---

## GitHub Pages

This repository is published via GitHub Pages. The dictation app fetches content from the published URL:

```
https://leva13007.github.io/dictations/dics/index.json
https://leva13007.github.io/dictations/dics/<id>/dic.json
https://leva13007.github.io/dictations/dics/<id>/playlist.json
https://leva13007.github.io/dictations/dics/<id>/sounds/<id>-<nn>.mp3
```

---

## Checklist for a New Dictation

- [ ] Created folder `dics/<id>/` with `Text.md`
- [ ] Ran `yarn gen <id>` (generates `playlist.json`, `dic.json`, `sounds/`, updates `index.json`)
- [ ] Added MP3 audio files to `sounds/`
- [ ] Ran `yarn durations <id>` (updates `duration_sec` in `playlist.json`, `dic.json`, and `index.json`)
- [ ] *(optional)* Filled in metadata in `dic.json` (level, voice, tags, video)
- [ ] *(optional)* Updated matching fields in `index.json` (level, tags, has_video)
- [ ] *(optional)* Added `ReadMe.md` with description, level, video link
- [ ] Bumped the version and updated `CHANGELOG.md` (see below)
- [ ] Pushed to `main` and confirmed GitHub Pages deployment

---

## Versioning & Releasing

The project version lives in `package.json` and is mirrored in `CHANGELOG.md`.

### Bump the version

Use `npm version` to bump the version automatically — it updates `package.json` and creates a git commit + tag in one step:

```bash
# Patch (0.0.1 → 0.0.2) — small fixes, metadata changes
npm version patch -m "v%s"

# Minor (0.0.2 → 0.1.0) — new dictation added
npm version minor -m "v%s"

# Major (0.1.0 → 1.0.0) — breaking structure changes
npm version major -m "v%s"
```

### Update the changelog

Add a new section at the top of `CHANGELOG.md` describing what changed:

```markdown
## [0.1.0] — 2026-03-19

### Added

- Dictation 0007 — "My New Dictation Title"
```

### Push with tags

```bash
git push && git push --tags
```

This pushes both the commit and the version tag to GitHub.