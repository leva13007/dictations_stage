# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/),
and this project adheres to [Semantic Versioning](https://semver.org/).

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
