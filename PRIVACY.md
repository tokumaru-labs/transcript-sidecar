# Privacy Policy — Transcript Sidecar

Last updated: 2026-08-19

Transcript Sidecar is designed to provide its YouTube transcript feature without user accounts, analytics, advertising, tracking, or a developer-operated transcript-processing server.

## Information processed for the transcript feature

When the user opens or refreshes Transcript Sidecar on a supported YouTube video, the extension temporarily accesses and processes the following information in the user's browser:

- the current YouTube URL and video identity, to confirm that caption results belong to the video currently open in YouTube and to prevent stale results from a previous video;
- the video title, available caption tracks and labels, YouTube-provided caption identifiers and request information, and relevant state from the current YouTube page;
- the selected caption text and timing information; and
- an already-open YouTube transcript panel's text and timestamps when that read-only fallback can be used safely.

This information is used only to acquire the current video's captions and provide the extension's disclosed features: displaying and formatting the transcript, seeking the current video from a selected timestamp, copying or exporting transcript text at the user's request, and showing local acquisition diagnostics.

## Local processing, storage, and browsing activity

The current YouTube URL, video identity, page information, caption metadata, and transcript are processed locally in the browser and held only in the extension's active in-memory state as needed to provide the current Side Panel session. Transcript Sidecar does not save this information as browsing history, a viewing profile, or an activity log. It does not transmit this information to Tokumaru Labs, a Tokumaru Labs-operated server, an analytics service, an advertising service, or a tracking service.

The extension stores only the user's Japanese or English interface-language preference in extension-local browser storage. That preference does not contain YouTube URLs, video identities, page information, or transcript content and is not transmitted to Tokumaru Labs.

Copy and TXT or Markdown export actions are initiated by the user. Clipboard content and exported files are created locally and remain under the user's browser and operating-system controls.

## Caption acquisition and YouTube communication

To retrieve captions, Transcript Sidecar necessarily communicates with YouTube-provided resources associated with the YouTube video currently open in the browser. This includes fetching a selected YouTube caption resource and, when silent caption acquisition is needed, requesting YouTube's transcript-panel data using request information and context already provided by the current YouTube page.

Silent caption acquisition uses only YouTube-provided resources on YouTube domains. It does not send the current YouTube URL, video identity, page information, caption metadata, or transcript text to Tokumaru Labs, a third-party transcript provider, an external AI service, or any other developer-operated service. Silent acquisition does not open, click, or reconfigure YouTube's visible transcript interface.

YouTube is a third-party service governed by its own terms and privacy policies. Communication with YouTube uses the secure HTTPS resources provided for the current YouTube page and video.

## Formatting and diagnostics

Full-text, readable-paragraph, timestamped, TXT, and Markdown formatting is performed locally in the extension. The readable-paragraph feature uses local timing and text-length heuristics and does not send transcript text to an external AI service.

Local diagnostics may show the acquisition method, status, counts, approximate response size, or an error message needed to explain a caption-loading result. Transcript Sidecar does not use diagnostics to log transcript text, build browsing history, or track the user, and it does not transmit diagnostics to Tokumaru Labs.

## Permissions

- `scripting`: allows narrowly scoped code to run on supported YouTube pages to read the current URL, video identity, video title, caption and page information, and to seek playback when the user selects a transcript timestamp.
- `sidePanel`: displays the transcript interface in Chrome's Side Panel.
- YouTube-only host permissions: allow the extension to operate on `youtube.com` and `m.youtube.com` pages and retrieve YouTube-provided caption resources. The extension does not request broad `<all_urls>` access.

## Purpose limitation and sharing

Information accessed from YouTube is used only to provide Transcript Sidecar's disclosed, user-facing transcript feature. It is not sold, used for advertising, used to create a browsing or viewing profile, used to track the user, or used for an unrelated purpose. Tokumaru Labs does not receive or share this information through the extension, and no human at Tokumaru Labs reads it through the extension.

Transcript Sidecar's use of information is limited to its disclosed single purpose and complies with the Chrome Web Store User Data Policy, including its Limited Use requirements.

## Remote code

The extension does not load or execute remotely hosted JavaScript or WebAssembly. Executable extension code is packaged with the extension. YouTube caption and transcript-panel responses are treated as data, not executable code.

## Changes

If a future version changes these data practices or adds optional cloud transcription, analytics, advertising, or other external data processing, this policy and the Chrome Web Store disclosures must be updated before that version is released.
