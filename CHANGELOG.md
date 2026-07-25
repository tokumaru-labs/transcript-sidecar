# Changelog

## 0.4.1 — 2026-07-25

### Added

- `_locales/en/messages.json` and `_locales/ja/messages.json`: the extension package itself is now localized, so Chrome shows the extension name, short name, description, and toolbar tooltip in English or Japanese according to the browser's UI language.
- `default_locale: "en"` in `manifest.json`. English is the fallback whenever Chrome's UI language has no bundle of its own.
- Each message carries a `description` field recording what the string is for and the Chrome length limit that applies to it, so the limits are visible at the point of editing rather than only at submission time.

### Changed

- `manifest.json` now references messages instead of hard-coding text: `name` → `__MSG_extensionName__`, `short_name` → `__MSG_extensionShortName__`, `description` → `__MSG_extensionDescription__`, and `action.default_title` → `__MSG_actionTitle__`.
- `STORE_LISTING.md` now carries a matched English/Japanese pair for the short description, the detailed description, and the screenshot checklist. Both descriptions list the same nine features and the same six privacy statements, in the same order.
- Version bumped to 0.4.1.

### Preserved

- **The Side Panel's own JP / EN toggle is unchanged.** It remains driven by `src/i18n.js` and `localStorage`, still applies immediately, and is still independent of Chrome's UI language. Package localization was added alongside it, not in place of it. A user on English Chrome can still read the panel in Japanese, and the reverse.
- No dictionary merge and no i18n restructuring: `src/i18n.js` is byte-for-byte unchanged.
- `permissions` and `host_permissions` are byte-for-byte identical to 0.4.0. `_locales` requires no Chrome permission.
- All four caption-retrieval paths, transcript parsing, formatting, copying, saving, and click-to-seek are unchanged.
- Caption text, video titles, video URLs, and YouTube-supplied caption-track labels are still never translated.
- No external libraries, npm dependencies, or build step. The `_locales` files are static data read by Chrome, not executable code.
- No account, analytics, ads, tracking, remote runtime code, or developer-operated transcript server.

## 0.4.0 — 2026-07-22

### Added

- Japanese / English UI language toggle (**JP** / **EN**) in the Side Panel header, next to the reload button.
- `src/i18n.js`: a dependency-free translation layer holding the `ja` and `en` dictionaries, with `{placeholder}` substitution and a safe fallback chain (active language → English → key name).

### Changed

- Interface wording that the extension owns — tagline, caption label, buttons, transcript heading, status messages, toasts, error messages, diagnostics panel, footer, and `title` / `aria-label` attributes — now follows the selected language.
- Switching language re-renders immediately, without reloading the Side Panel or refetching the transcript. The current status message, segment count, caption-track marker, and cue tooltips all update in place.
- The language choice is stored in `localStorage` under `transcriptSidecar.uiLanguage` and restored the next time the Side Panel opens. With no stored choice, the initial language is taken from `navigator.languages` / `navigator.language`: `ja` for Japanese, English otherwise.

### Fixed

- The caption-track dropdown no longer appends its own "auto-generated" marker on top of the one YouTube already includes in the track label (for example `English (auto-generated) (auto-generated) · en`). Tracks are now shown as `label · languageCode`, using YouTube's text verbatim.
- The segment count beside the **Transcript** heading no longer risks being clipped in a narrow Side Panel: the Japanese form is now `{count}件`, and the count is pinned to the heading's line.

### Preserved

- All four caption-retrieval paths are unchanged, as are transcript parsing, formatting, copying, saving, and click-to-seek.
- Caption track labels supplied by YouTube, along with their `languageCode` and `kind`, are displayed as received and are never translated.
- Video titles, video URLs, and transcript text are never translated or rewritten. Mixed-language output remains possible by design when the interface language differs from the caption language.
- No change to `permissions` or `host_permissions`, and no new Chrome permission: `localStorage` on the extension origin requires none.
- No external libraries, npm dependencies, or build step.
- No account, analytics, ads, tracking, remote runtime code, or developer-operated transcript server.

## 0.3.3 — 2026-07-19

### Changed

- Shortened the manifest description to meet Chrome Web Store length requirements.
- No functional changes.

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
