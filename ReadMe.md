# Dictation Content Repository

This repository contains dictation content (playlists, audio files, and texts) for the [Dictation App](https://github.com/leva13007/dictation_app). It is published via **GitHub Pages** and serves as the data source for the app.

You can open that app by following the link above, or by visiting:

[open in new tab](https://leva13007.github.io/dictation_app/)

## Repository Structure

```
dics/
├── index.json                  # Master list of all dictations
├── 0001/
│   ├── playlist.json           # Ordered list of sentences with audio references
│   ├── Text.md                 # Full dictation text (for reference / authoring) **optional**
│   └── sounds/
│       ├── 0001-01.mp3         # Audio for sentence 1
│       ├── 0001-02.mp3         # Audio for sentence 2
│       └── ...
├── 0002/
│   ├── playlist.json
│   ├── Text.md
│   └── sounds/
│       └── ...
└── ...
```

## File Descriptions

| File | Purpose |
|---|---|
| `dics/index.json` | Master index listing every available dictation (id + title). The app reads this to populate the dictation selector. |
| `dics/<id>/playlist.json` | Ordered array of sentences. Each entry contains the sentence text, a sequential id, and the relative path to its audio file. |
| `dics/<id>/Text.md` | The full dictation text in Markdown. Used as a source document when creating audio files — not consumed by the app directly. |
| `dics/<id>/sounds/*.mp3` | MP3 audio files, one per sentence. Named `<dic-id>-<sentence-number>.mp3`. |

---

## How to Create a New Dictation

### 1. Choose an ID

Pick the next available four-digit ID (e.g. if `0003` exists, use `0004`).

### 2. Create the folder structure

```
dics/
└── 0004/
    ├── playlist.json
    ├── Text.md
    └── sounds/
```

### 3. Write the text

Create `Text.md` with the full dictation text. The first line should be the title as a Markdown heading. Each subsequent line is **one sentence** that will become a separate audio clip:

```markdown
# My Dictation Title
This is the first sentence of the dictation.
This is the second sentence.
Numbers should be written out as words, for example twenty five.
```

> **Tip:** Write numbers as words (e.g. "twenty five" instead of "25") since learners will be typing what they hear.

### 4. Generate audio files

Record or generate one MP3 file per sentence. Place them in the `sounds/` folder using the naming convention:

```
<dic-id>-<sentence-number>.mp3
```

For example, dictation `0004` with 5 sentences:

```
sounds/
├── 0004-01.mp3
├── 0004-02.mp3
├── 0004-03.mp3
├── 0004-04.mp3
└── 0004-05.mp3
```

Sentence numbers are zero-padded to two digits (`01`, `02`, … `99`).

### 5. Create the playlist

Create `playlist.json` — a JSON array where each object has:

| Field | Type | Description |
|---|---|---|
| `id` | number | Sequential sentence number, starting at 1 |
| `text` | string | The sentence text (must match `Text.md`) |
| `audio` | string | Relative path to the audio file from the repo root |

Example `dics/0004/playlist.json`:

```json
[
  {
    "id": 1,
    "text": "My Dictation Title",
    "audio": "dics/0004/sounds/0004-01.mp3"
  },
  {
    "id": 2,
    "text": "This is the first sentence of the dictation.",
    "audio": "dics/0004/sounds/0004-02.mp3"
  },
  {
    "id": 3,
    "text": "This is the second sentence.",
    "audio": "dics/0004/sounds/0004-03.mp3"
  }
]
```

> **Note:** The `audio` path is relative to the site root (e.g. `dics/0004/sounds/0004-01.mp3`), not an absolute path.

### 6. Register the dictation in the index

Add an entry to `dics/index.json`:

```json
{
  "dics": [
    { "id": "0001", "title": "The Reading Crisis in Modern Society" },
    { "id": "0002", "title": "Is Reading Always Beneficial?" },
    { "id": "0003", "title": "Addressing the Reading Crisis" },
    { "id": "0004", "title": "My Dictation Title" }
  ]
}
```

### 7. Commit and push

Once pushed to the `main` branch, GitHub Pages will publish the new content automatically.

---

## GitHub Pages

This repository is published via GitHub Pages. The dictation app fetches content from the published URL:

```
https://<username>.github.io/<repo-name>/dics/index.json
https://<username>.github.io/<repo-name>/dics/<id>/playlist.json
https://<username>.github.io/<repo-name>/dics/<id>/sounds/<id>-<nn>.mp3
```

To use these dictations in the app, configure the app's data base URL to point to this GitHub Pages site.

---

## Checklist for a New Dictation

- [ ] Created folder `dics/<id>/` with `sounds/` subfolder
- [ ] Wrote `Text.md` with title + one sentence per line
- [ ] Generated MP3 files named `<id>-<nn>.mp3` (one per sentence)
- [ ] Created `playlist.json` with correct `id`, `text`, and `audio` fields
- [ ] Added entry to `dics/index.json`
- [ ] Verified JSON files are valid (no trailing commas, proper quoting)
- [ ] Pushed to `main` and confirmed GitHub Pages deployment