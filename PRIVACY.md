# Privacy Policy — Transcript Sidecar

Last updated: 2026-07-19

Transcript Sidecar is designed to work without user accounts, analytics, advertising, tracking, or a developer-operated transcript-processing server.

## Data collection

Transcript Sidecar does not intentionally collect, store, sell, or transmit personal information to Tokumaru Labs.

## Transcript data

When the user opens the extension on a YouTube video, the extension accesses caption information associated with that video and displays it in the browser's Side Panel.

Transcript text is processed in the user's browser. The extension does not send transcript text to a Tokumaru Labs-operated application server.

## Formatting

Full-text, readable-paragraph, timestamped, TXT, and Markdown formatting is performed locally in the extension. The readable-paragraph feature uses local timing and text-length heuristics and does not send transcript text to an external AI service.

## Permissions

- `scripting`: allows narrowly scoped code to run on supported YouTube pages to read video/caption information and seek playback.
- `sidePanel`: displays the transcript interface in Chrome's Side Panel.
- YouTube-only host permissions: allow the extension to operate on `youtube.com` and `m.youtube.com` pages. The extension does not request broad `<all_urls>` access.

## Local actions

Copy and file-export actions are initiated by the user. Exported files are created locally through the browser.

## Third-party services

The extension operates on YouTube pages and retrieves caption resources associated with YouTube videos. YouTube is a third-party service governed by its own terms and privacy policies.

## Remote code

The extension does not load or execute remotely hosted JavaScript or WebAssembly. Executable extension code is packaged with the extension.

## Changes

If a future version adds optional cloud transcription, analytics, advertising, or other external data processing, this policy and the extension's disclosures must be updated before release.
