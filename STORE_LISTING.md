# Chrome Web Store submission notes — Transcript Sidecar 0.4.1

This file is for the publisher and is not required at runtime.

## Two separate language mechanisms

Transcript Sidecar has two independent language layers. They are not the same
feature and must not be described as one.

| Layer | Controlled by | Applies to | User can change it |
| --- | --- | --- | --- |
| Package / Store localization | `manifest.json` `default_locale` + `_locales/en`, `_locales/ja` | Extension name, short name, description, toolbar tooltip — and the Store listing itself | No. Chrome picks it from the browser UI language. |
| Side Panel interface language | `src/i18n.js` + the **JP** / **EN** toggle in the panel header | Wording the panel renders: tagline, buttons, status, toasts, errors, diagnostics, footer, accessibility labels | Yes, at any time, applied immediately |

Consequence for the listing: a user running Chrome in English sees the English
Store description and English tooltip, but can still switch the panel itself to
Japanese, and the reverse. Do not claim in either listing that the browser
language locks the interface.

## Product name

Transcript Sidecar

Same in every locale. `short_name` is `Sidecar` in every locale.

## Publisher

Tokumaru Labs

## Manifest-supplied strings

These come from `_locales/<locale>/messages.json`. Chrome limits: name 45
characters, short name 12, description 132.

| Key | English | Japanese |
| --- | --- | --- |
| `extensionName` | Transcript Sidecar | Transcript Sidecar |
| `extensionShortName` | Sidecar | Sidecar |
| `extensionDescription` | View, copy, format, and export YouTube transcripts in Chrome's Side Panel. No account, ads, tracking, or transcript server. | YouTube動画の文字起こしをChromeのサイドパネルで表示・コピー・整形・保存。アカウント・広告・追跡・外部字幕サーバーなし。 |
| `actionTitle` | Open Transcript Sidecar | Transcript Sidecarを開く |

`extensionDescription` is the single source of truth for the Store's package
summary. Chrome Web Store takes the summary from the localized manifest, so:

- Do not hand-enter a separate short description in the Developer Dashboard.
- Do not keep an alternative summary draft in this file. To change the summary,
  edit `extensionDescription` in `_locales/en/messages.json` and
  `_locales/ja/messages.json`, and nowhere else.
- Only the **detailed description** is entered per language in the Developer
  Dashboard, using the two sections below.

## Detailed description — English

Transcript Sidecar is a small open-source extension that shows the captions
available on a YouTube video in Chrome's Side Panel, so you can copy or save
them quickly.

Features:
- Copy the full transcript in one click
- Removes the fine-grained line breaks that captions introduce
- **Copy readable**: adds paragraph breaks based on timing and length, without changing the wording
- Copy with timestamps
- Copy as Markdown, including the video title, URL, and caption track information
- Save as TXT or Markdown
- Click a timestamp in the transcript to jump to that point in the video
- Choose among the video's caption tracks
- Japanese / English interface, switchable at any time from the **JP** / **EN** toggle in the panel header

Privacy:
- No account
- No ads
- No analytics or tracking
- Transcripts are never sent to a developer-operated server
- No third-party JavaScript dependencies at runtime
- No host permissions outside YouTube

Transcript Sidecar works with videos for which YouTube already provides
captions. It does not transcribe audio with AI.

Open source by Tokumaru Labs.

## Detailed description — Japanese

Transcript Sidecarは、YouTube動画で利用できる字幕をChromeのサイドパネルに表示し、すばやくコピー・保存するためのシンプルなオープンソース拡張機能です。

主な機能:
- 全文をワンクリックでコピー
- 字幕特有の細かい改行を除去
- 内容を変更せず、タイミングと文章量をもとに段落を整える**読みやすくコピー**
- タイムスタンプ付きコピー
- 動画タイトル、URL、字幕トラック情報を含むMarkdownコピー
- TXT / Markdown保存
- Transcript内の時刻をクリックして動画の該当位置へ移動
- 複数の字幕トラックから選択
- 日本語 / 英語のUI表示。パネルヘッダーの**JP** / **EN**からいつでも切り替え可能

プライバシー:
- アカウント不要
- 広告なし
- Analytics / Trackingなし
- 開発者が運営する外部サーバーへTranscriptを送信しません
- 実行時の第三者JavaScript依存なし
- YouTube以外のサイトへのホスト権限なし

Transcript Sidecarは、YouTube側で字幕が提供されている動画を対象としています。音声そのものをAIで文字起こしする機能は現在含まれていません。

Open source by Tokumaru Labs.

> The English and Japanese descriptions above list the same nine features and
> the same six privacy statements, in the same order. If one is edited, edit
> the other in the same commit.

## Single purpose description

YouTube動画で利用可能な字幕を取得してChromeのサイドパネルに表示し、ユーザーがテキスト、読みやすい段落、タイムスタンプ付きテキスト、Markdownとしてコピーまたはローカル保存できるようにすること。

English: retrieve the captions available on a YouTube video, show them in
Chrome's Side Panel, and let the user copy or locally save them as text,
readable paragraphs, timestamped text, or Markdown.

## Permission justification: `sidePanel`

YouTube動画の字幕一覧、字幕本文、コピー・保存操作をChromeのサイドパネル内に表示するために使用します。

## Permission justification: `scripting`

現在開いている対応YouTube動画ページから、その動画のタイトル・URL・字幕トラック情報を読み取り、Transcript内の時刻をクリックした際に動画の再生位置を変更するために使用します。

## Host permission justification: YouTube domains

拡張機能の単一目的であるYouTube字幕の取得・表示に必要なページ情報へアクセスするため、YouTubeドメインのみに限定して使用します。`<all_urls>` は要求しません。

v0.4.1 does not add, remove, or widen any permission. `permissions` and
`host_permissions` are byte-for-byte identical to v0.4.0.

## Remote code declaration

No. The extension does not load or execute remotely hosted JavaScript or WebAssembly. All executable extension code is packaged with the extension.

`_locales/en/messages.json` and `_locales/ja/messages.json` are static data
files read by Chrome itself. They are not executable code and do not change
this declaration.

## Data-use disclosure draft

The extension does not intentionally collect or transmit personal information to Tokumaru Labs. Transcript text is processed in the user's browser and is not sent to a developer-operated application server. The extension necessarily communicates with YouTube resources associated with the currently opened YouTube video in order to retrieve caption data.

Review the exact checkboxes shown in the current Developer Dashboard and ensure they remain consistent with `PRIVACY.md` before submission.

## Privacy policy URL

The repository is public, so `PRIVACY.md` already has a stable public URL. Use
it, or a GitHub Pages privacy-policy page, in the Chrome Web Store privacy
field:

<https://github.com/tokumaru-labs/transcript-sidecar/blob/main/PRIVACY.md>

## Store listing language setup

- Set the default listing language to **English**, matching `default_locale`.
- Add **Japanese** as an additional listing language.
- Leave the summary field alone in both listings: it is supplied by
  `extensionDescription` from `_locales/`.
- Fill the detailed description of each listing from the matching section above.
- Upload a separate screenshot set per listing language (see below).

## Screenshot checklist — English listing

Capture with Chrome's UI language set to English and the panel toggle on **EN**.

- [ ] 1. Side Panel with a transcript loaded, on an English-caption video
- [ ] 2. The two main copy actions visible: **Copy full transcript** and **Copy readable**
- [ ] 3. Timestamped transcript, showing click-to-seek
- [ ] 4. Markdown export result
- [ ] 5. Header close-up showing the **JP** / **EN** toggle with **EN** active
- [ ] Toolbar tooltip reads "Open Transcript Sidecar"
- [ ] No Japanese text anywhere in the frame
- [ ] Version shown/implied is 0.4.1

## Screenshot checklist — Japanese listing

Capture with Chrome's UI language set to Japanese and the panel toggle on **JP**.

- [ ] 1. サイドパネルに字幕を読み込んだ状態(日本語字幕の動画)
- [ ] 2. 主要な2つのコピー操作が見える状態: **全文をコピー** と **読みやすくコピー**
- [ ] 3. タイムスタンプ付き表示と、クリックによる動画移動
- [ ] 4. Markdown出力の結果
- [ ] 5. ヘッダー拡大: **JP** / **EN** 切替で **JP** が選択中
- [ ] ツールバーのツールチップが「Transcript Sidecarを開く」になっている
- [ ] フレーム内に英語UIが混在していない
- [ ] バージョンが0.4.1であること

## Screenshot rules for both sets

- Both sets must show the same features, in the same order, so the two listings
  stay consistent.
- Do not reuse screenshots from an older version that show errors or UI that no
  longer matches the release.
- Review the current Chrome Web Store image guidance before uploading
  promotional graphics.
