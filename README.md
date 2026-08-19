# Transcript Sidecar

[English](README.md) | [日本語](README_JA.md)

A small, privacy-focused Manifest V3 Chrome extension for copying, formatting, and exporting transcripts from YouTube videos.

**Current version: 0.4.1**
**Publisher: Tokumaru Labs**

> No account. No tracking. No ads. No developer-operated transcript server.

## Features

- Opens in Chrome Side Panel
- **Japanese / English interface**, switchable at any time from the **JP** / **EN** toggle in the header
- Reads available caption tracks from the current YouTube video
- One-click **Copy full transcript** with artificial caption line breaks removed
- **Readable copy** that keeps the caption wording while inserting paragraph breaks for easier reading
- Copy with timestamps
- Copy as Markdown with video title, source URL, caption language, and a paragraph-formatted transcript
- Download readable transcript as `.txt`
- Download as `.md`
- Click a transcript timestamp to seek the YouTube video
- No account
- No analytics
- No ads
- No developer-operated backend server
- No third-party runtime JavaScript dependencies

## What changed in v0.4.0

- Added a **JP / EN** language toggle to the Side Panel header, next to the reload button.
- Interface wording owned by the extension — tagline, buttons, status messages, toasts, errors, diagnostics panel, footer, and accessibility labels — now follows the selected language.
- Switching language applies immediately, with no reload and no refetching of the transcript.
- The choice is remembered between sessions. On first run the language follows the browser: Japanese for a Japanese browser, English otherwise.
- Caption text, video titles, video URLs, and YouTube's own caption-track labels are never translated.
- No new permissions, no external libraries, and no change to the caption-extraction strategy.

## What changed in v0.4.1

- When both timed-text paths return no cues, the extension can read YouTube's transcript-panel data silently through request metadata already present on the current video page.
- Transcript acquisition no longer expands the description or opens, closes, or clicks YouTube's own transcript panel.
- If all silent routes fail, Transcript Sidecar fails closed with local diagnostics. An already user-opened transcript panel may still be inspected read-only.
- No new permissions, external services, runtime dependencies, or developer-operated backend were added.

## UI language

The header has a compact **JP** / **EN** toggle. The active language is highlighted and exposed to assistive technology via `aria-pressed`.

- **First run** — the language is chosen from `navigator.languages` / `navigator.language`: Japanese if the browser prefers Japanese, English otherwise.
- **Persistence** — the choice is saved in `localStorage` under `transcriptSidecar.uiLanguage` and restored when the Side Panel reopens. This is extension-origin storage, so it needs no additional Chrome permission and is never sent anywhere.
- **Scope** — only wording the extension itself renders is translated. Video titles, video URLs, transcript text, and caption-track labels supplied by YouTube are always shown exactly as received, so an English interface with Japanese captions (or the reverse) is expected and intentional.

## Previous release highlights (v0.3.3)

- Shortened the manifest description to meet Chrome Web Store length requirements.
- No functional changes.

## Previous release highlights (v0.3.2)

- Added a fourth caption-recovery fallback that supports YouTube's newer transcript-panel DOM. It runs only when the existing retrieval paths return nothing.
- Fixed localized accessibility time labels leaking into transcript text captured by the new fallback.
- Added a capture-diagnostics panel with a copy button, shown only when transcript loading fails.
- The first-through-third caption-retrieval paths are unchanged.

## What changed in v0.3.0

- Added **Readable copy**, which inserts paragraph breaks without summarizing, translating, or rewriting caption wording.
- Kept **Full transcript copy** as a simple continuous-text export with artificial caption line breaks removed.
- Markdown and TXT exports now use readable paragraph formatting.
- Added the project license (GPL-3.0-only) and public-project documentation for GitHub and Chrome Web Store release preparation.
- Added Chrome Web Store listing, permission-justification, privacy-disclosure, and release-checklist drafts.
- Added Tokumaru Labs attribution in the Side Panel footer.

## Privacy and permissions

The extension requests only:

- `scripting` — execute narrowly scoped code on supported YouTube pages to read player/caption information and seek the video.
- `sidePanel` — display the transcript interface in Chrome's Side Panel.
- YouTube-only host access for:
  - `https://www.youtube.com/*`
  - `https://youtube.com/*`
  - `https://m.youtube.com/*`

There is no broad `<all_urls>` permission.

The extension retrieves caption resources associated with the current YouTube video. Transcript text is not sent to a developer-operated application server.

See [PRIVACY.md](PRIVACY.md) for the full privacy policy.

## Install locally

1. Extract the release ZIP to a permanent folder.
2. Open `chrome://extensions/` in Chrome.
3. Turn on **Developer mode**.
4. Click **Load unpacked**.
5. Select the extracted `transcript-sidecar-v0.4.1` folder.
6. Open a YouTube video that has captions.
7. Click the **Transcript Sidecar** extension icon.
8. Pick **JP** or **EN** in the header if you want to change the interface language.
9. Choose **Copy full transcript** or **Copy readable**.

## Export modes

### Full transcript

Removes artificial caption-segment line breaks and produces one continuous transcript. The extension does not summarize or rewrite the wording.

### Readable transcript

Uses timing gaps, elapsed time, sentence-ending punctuation, and paragraph length to insert paragraph breaks. The text itself is preserved apart from whitespace normalization.

### Timestamped transcript

Keeps one caption cue per line with its timestamp.

### Markdown

Includes the video title, source URL, caption track information, and readable paragraph-formatted transcript.

## Project structure

```text
Transcript Sidecar
├─ manifest.json
├─ background.js
├─ sidepanel.html
├─ sidepanel.css
├─ src/
│  ├─ app.js              # application flow and event wiring
│  ├─ captions.js         # caption-loading fallback strategy
│  ├─ caption-parsers.js  # JSON3 / XML / WebVTT parsers
│  ├─ youtube.js          # isolated YouTube page interactions
│  ├─ text.js             # normalization and export formatting
│  ├─ i18n.js             # ja/en UI dictionaries and language selection
│  ├─ ui.js               # DOM rendering and status/toast helpers
│  └─ files.js            # clipboard and download helpers
├─ icons/
├─ README.md
├─ PRIVACY.md
├─ CHANGELOG.md
├─ CONTRIBUTING.md
├─ SECURITY.md
├─ STORE_LISTING.md
├─ RELEASE_CHECKLIST.md
├─ LICENSE
├─ TRADEMARKS.md
└─ .editorconfig
```

The extension intentionally has **no build step** and **no npm dependencies**. The source folder can be loaded directly into Chrome, which keeps the code easy to audit.

## Caption extraction strategy

The extension tries several methods in order:

1. YouTube timed-text endpoint from the extension context (`json3`, XML/SRV, WebVTT)
2. The same timed-text requests from the YouTube page context
3. YouTube transcript-panel data fetched silently from request metadata already present on the current video page
4. A read-only scan of an already user-opened legacy transcript panel
5. A read-only scan of an already user-opened visible transcript panel that does not rely on legacy `ytd-transcript-*` markup

This multi-step approach is used because YouTube's internal caption behavior can vary by video and can change over time.

## Current limitations

- Only videos for which YouTube exposes captions are supported.
- Videos without captions are not transcribed from audio.
- Paragraph formatting is heuristic and intentionally does not use an external AI service.
- YouTube can change undocumented page/player internals, so future maintenance may be required.
- Live streams may not expose a stable transcript until captions are available.

## Development philosophy

Transcript Sidecar started from a simple idea: if a small tool is useful, it should be possible to share it without hiding tracking, subscriptions, or unnecessary permissions behind it.

The project aims to stay:

- small
- auditable
- dependency-free
- explicit about permissions
- local-first
- useful before clever

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## Security

See [SECURITY.md](SECURITY.md).

## License

Transcript Sidecar is licensed under the GNU General Public License v3.0 only (GPL-3.0-only). See [LICENSE](LICENSE).

The **Transcript Sidecar** and **Tokumaru Labs** names and logos are not covered by the GPL. See [TRADEMARKS.md](TRADEMARKS.md).

---

An open-source tool by **Tokumaru Labs**.
