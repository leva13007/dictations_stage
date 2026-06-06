# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [0.0.12] — 2026-06-06

### Added
- Dictation `0012` — Complaint about poor delivery service (18 sentences, 70.87s, voice: M~ark, level: B2)

## [0.0.11] — 2026-05-19

### Added
- Dictation `0011` — Complaint About School Dance Catering Service (18 sentences, 73.53s, voice: Sam, level: B2)

## [0.0.10] — 2026-05-18

### Added
- Dictation `0010` — International Visitor Numbers (2016–2025) (21 sentences, 142.37s, voice: Sam, level: B2)

## [0.0.9] — 2026-05-10

### Added
- Dictation `0008` — Linkin Park — Review (26 sentences, 155.01s, voice: Jarnathan, level: B2)
- Dictation `0009` — "We Will Rock You" — Review (30 sentences, 167.81s, voice: Shelley, level: B2)

### Fixed
- `src/generate-audio.ts` (`phaseDurations`): resolved audio paths relative to `sounds/` directory instead of repo root — MP3 files were silently skipped when `playlist.json` stores only the bare filename (e.g. `0008-01.mp3`)

## [0.0.8] — 2026-05-05

### Added
- `src/generate-audio.ts` — full TTS pipeline script: parses `Text.md`, generates `playlist.json`/`dic.json`, calls ElevenLabs API, measures durations, updates `index.json` in a single run
- `yarn tts <dic-id> [--voice <voice_id>]` npm script
- `.env.example` — documents required and optional ElevenLabs env variables
- `dotenv` dev dependency
- `CLAUDE.md` — project guidance for Claude
- Dictation `0007` — Silicon Valley — Review (27 sentences, 162.04s, voice: Sam)

## [0.0.7] — 2026-05-05

### Fixed
- Smoke tests in `.github/workflows/release-to-prod.yml`

## [0.0.6] — 2026-04-20

### Added
- `.github/workflows/release-to-prod.yml` — GitHub Actions workflow for production releases

## [0.0.5] — 2026-04-10

### Changed
- Simplified audio paths in `playlist.json`: from `dics/<id>/sounds/<id>-NN.mp3` to `<id>-NN.mp3`
- Updated `ReadMe.md`

## [0.0.4] — 2026-03-31

### Changed
- Simplified `index.json`: removed `api` object and `path` field from each dictation entry
- Updated `url` in `index.json` from `/dictations` to `/dictations/dics`
- Updated `ReadMe.md` data format examples to match the new `index.json` structure

## [0.0.3] — 2026-03-21

### Added

- `src/update-durations.ts` script — measures MP3 durations and updates `playlist.json`, `dic.json`, and `index.json`
- `yarn durations <id>` npm script
- `duration_sec` field populated for all existing dictations (0001–0006)

### Changed

- Updated `ReadMe.md` with durations script documentation, updated data format examples, and revised checklist

## [0.0.2] — 2026-03-19

### Added
- added JS scripts for generating `index.json` and `playlist.json` from source data
- added dics `0004`, `0005` and `0006` with source data and generated playlists
- added new `dic.json` format for source data of dictations

### Changed
- updated `index.json` structure
- updated `ReadMe.md` with new dictations and updated instructions for adding new dictations

## [0.0.1] — 2026-03-16

### Added

- YouTube video link for dictation 0002 (`video` field in `index.json`)
- Per-dictation `ReadMe.md` (starting with `dics/0002/ReadMe.md`)
- `package.json` with project metadata

### Changed

- Updated `ReadMe.md` with available dictations table, video documentation, and checklist


## [0.0.0] — 2026-03-16

### Added

- Initial release with 3 dictations:
  - `0001` — The Reading Crisis in Modern Society
  - `0002` — Is Reading Always Beneficial?
  - `0003` — Addressing the Reading Crisis
- `dics/index.json` master index
- Playlist and audio files for each dictation
- `ReadMe.md` with full project documentation and contribution guide
- GitHub Pages deployment
