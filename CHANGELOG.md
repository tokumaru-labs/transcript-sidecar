# Changelog

## 0.3.2 — 2026-07-19

### Added

- Fourth caption-recovery fallback that supports YouTube's newer transcript-panel DOM: a read-only scan of the visible transcript panel that does not rely on legacy `ytd-transcript-*` markup (no clicks, no network requests of its own).
- Collapsible capture-diagnostics panel in the Side Panel with a one-tap copy button, shown only when transcript loading fails.

### Changed

- The fourth fallback runs only when the existing three caption-retrieval paths return nothing.

### Fixed

- Localized accessibility time labels (e.g. "1 分 5 秒") are no longer mixed into transcript text captured by the fourth fallback: timestamp-UI DOM nodes — the visible clock and its screen-reader label — are excluded structurally from body collection instead of being deleted from the finished text.

### Preserved

- The first-through-third caption-retrieval paths are unchanged.
- No account, analytics, ads, tracking, remote runtime code, or developer-operated transcript server.

## 0.3.1 — 2026-07-19

### Changed

- Renamed the extension from **TokuTube Transcript** to **Transcript Sidecar**.
- Updated the Chrome action title, Side Panel branding, documentation, privacy policy, and store-listing copy.
- Bumped the manifest version so the renamed package can replace the previously uploaded 0.3.0 draft.
- License finalized as GPL-3.0-only before the initial public release.
- Added `TRADEMARKS.md`: the Transcript Sidecar and Tokumaru Labs names and logos are not covered by the GPL.

### Preserved

- Full transcript copy.
- Readable paragraph copy using local heuristics only.
- Timestamped copy.
- Markdown copy/export and TXT export.
- YouTube-only host permissions.
- No account, analytics, ads, tracking, remote runtime code, or developer-operated transcript server.

All notable changes to Transcript Sidecar are documented here.

## 0.3.0 — 2026-07-19

### Added

- **Readable copy** action with local, heuristic paragraph formatting.
- Separate full-text and readable-text export modes.
- Project license (now GPL-3.0-only).
- `CONTRIBUTING.md` and `SECURITY.md`.
- Chrome Web Store submission notes and public-release checklist.
- Tokumaru Labs publisher attribution in the Side Panel.

### Changed

- Markdown exports now use paragraph-formatted transcript text.
- TXT exports now use paragraph-formatted transcript text.
- Plain full-text copy remains a continuous transcript with artificial caption line breaks removed.
- Documentation updated for the first public release workflow.

### Privacy

- No new permissions.
- No analytics, advertising, tracking, remote runtime code, external transcript-processing service, or third-party runtime JavaScript dependencies added.

## 0.2.0 — 2026-07-19

### Added

- Readable transcript formatting for plain-text, TXT, and Markdown exports.
- Language-aware spacing when merging caption segments.
- Modular source layout under `src/`.
- `.editorconfig` for consistent formatting.

### Changed

- Refactored caption loading, parsing, YouTube page interaction, UI, and export logic into separate modules.
- Reused one caption-parser implementation for both extension-context and page-context fetches.
- Corrected permission documentation to match the YouTube-only host permissions actually used by the extension.
- Updated project documentation for public code review.

### Preserved

- Timestamped copy output keeps one cue per line.
- Duplicate cue and repeated-full-transcript safeguards remain enabled.
- No account, analytics, ads, external application server, npm dependencies, or build step.
