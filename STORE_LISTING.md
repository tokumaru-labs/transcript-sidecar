# Chrome Web Store submission notes — Transcript Sidecar v0.4.1

Current released runtime: **0.4.0**. The approved upload package prepared from this branch is **0.4.1**.

This file is publisher material only and is not required at runtime. Do not submit or publish from this branch.

## Product name

Transcript Sidecar

## Publisher

Tokumaru Labs

## Short description — Japanese (`ja`, 75 characters)

YouTubeの字幕をChromeサイドパネルで表示・コピー・保存。YouTube側の文字起こしパネルを開かず、説明欄をふさぎません。追跡・広告なし。

## Short description — English (`en`, 126 characters)

View, copy, and export YouTube transcripts in Chrome's Side Panel while the video page stays unobstructed. No tracking or ads.

Both summaries are packaged as the localized `extensionDescription` value in `_locales/ja/messages.json` and `_locales/en/messages.json`. They are within the Chrome Web Store 132-character item-summary limit.

## Detailed description — Japanese

Transcript Sidecarは、YouTube動画で利用できる字幕をChromeのサイドパネルに表示し、すばやくコピー・保存するためのシンプルなオープンソース拡張機能です。

字幕の取得中も、YouTube側の文字起こしパネルを開いたり、説明欄を展開・折りたたみしたりしません。動画ページの説明、コメント、関連情報をそのまま使いながら、右側のChromeサイドパネルで文字起こしを読めます。すべてのsilent取得経路が失敗した場合も、YouTubeのUIを操作せず、サイドパネル内で診断情報を表示します。

主な機能:
- Chromeサイドパネルで文字起こしを表示
- 全文をワンクリックでコピー
- 字幕特有の細かい改行を除去
- 内容を変更せず、タイミングと文章量をもとに段落を整える「読みやすくコピー」
- タイムスタンプ付きコピー
- 動画タイトル、URL、字幕情報を含むMarkdownコピー
- TXT / Markdown保存
- Transcript内の時刻をクリックして動画の該当位置へ移動
- 複数の字幕トラックから選択
- 日本語 / 英語の拡張機能UI切り替え
- 取得に失敗した場合のローカル診断情報

プライバシー:
- アカウント不要
- 広告なし
- Analytics / Trackingなし
- 文字起こしをTokumaru Labs運営の外部サーバーへ送信しません
- 実行時の第三者JavaScript依存なし
- YouTube以外のサイトへのホスト権限なし

Transcript Sidecarは、現在開いている動画に関連するYouTubeの字幕リソースだけを取得します。YouTube側で字幕が提供されている動画が対象であり、音声そのものをAIで文字起こしする機能は含まれていません。

Open source by Tokumaru Labs.

## Detailed description — English

Transcript Sidecar is a small open-source Chrome extension for viewing, copying, and saving the captions available for the current YouTube video in Chrome's Side Panel.

Transcript acquisition does not open or close YouTube's own transcript panel and does not expand or collapse the video description. You can keep the description, comments, and related page information usable while reading the transcript in the Side Panel on the right. If every silent retrieval route fails, the extension leaves the YouTube UI untouched and shows local capture diagnostics in the Side Panel.

Main features:
- View the transcript in Chrome's Side Panel
- Copy the full transcript in one click
- Remove artificial caption-segment line breaks
- Copy readable paragraphs without rewriting the caption wording
- Copy with timestamps
- Copy Markdown with the video title, URL, and caption details
- Save TXT and Markdown files
- Click a transcript timestamp to seek the video
- Choose from multiple caption tracks
- Switch the extension interface between Japanese and English
- View local capture diagnostics when loading fails

Privacy:
- No account
- No ads
- No analytics or tracking
- Transcript text is not sent to a Tokumaru Labs-operated server
- No third-party runtime JavaScript dependencies
- No host permissions outside YouTube

Transcript Sidecar retrieves only YouTube-owned caption resources associated with the video currently open in the browser. It supports videos for which YouTube provides captions and does not transcribe audio with AI.

Open source by Tokumaru Labs.

## Single purpose description

YouTube動画で利用可能な字幕を取得してChromeのサイドパネルに表示し、ユーザーがテキスト、読みやすい段落、タイムスタンプ付きテキスト、Markdownとしてコピーまたはローカル保存できるようにすること。字幕取得のためにYouTubeページの説明欄や文字起こしパネルの開閉状態は変更しません。

## Permission justification: `sidePanel`

YouTube動画の字幕一覧、字幕本文、コピー・保存操作をChromeのサイドパネル内に表示するために使用します。

## Permission justification: `scripting`

現在開いている対応YouTube動画ページから、その動画のタイトル、URL、字幕トラック、およびYouTubeが同ページに提供した字幕取得情報を読み取り、Transcript内の時刻をクリックした際に動画の再生位置を変更するために使用します。字幕取得のためにYouTubeページのボタンはクリックしません。

## Host permission justification: YouTube domains

拡張機能の単一目的であるYouTube字幕の取得・表示に必要なページ情報と、現在の動画に関連するYouTube所有の字幕リソースへアクセスするため、YouTubeドメインのみに限定して使用します。`<all_urls>` は要求しません。

## Remote code declaration

No. The extension does not load or execute remotely hosted JavaScript or WebAssembly. All executable extension code is packaged with the extension.

## Data-use disclosure draft

The extension does not intentionally collect or transmit personal information to Tokumaru Labs. Transcript text is processed in the user's browser and is not sent to a developer-operated application server. The extension necessarily communicates with YouTube-owned resources associated with the currently opened YouTube video to retrieve caption data. It adds no analytics, telemetry, advertising, or third-party transcript service.

Before any submission, compare the current Developer Dashboard checkboxes with `PRIVACY.md`, `manifest.json`, and the final release diff.

## Privacy policy URL

Use the stable public repository URL for `PRIVACY.md`:

`https://github.com/tokumaru-labs/transcript-sidecar/blob/main/PRIVACY.md`

Verify that the file is public and current immediately before entering the URL in the Developer Dashboard.

## Repository-side localization

- `_locales/en/messages.json` provides the English item summary and extension metadata.
- `_locales/ja/messages.json` provides the Japanese item summary and extension metadata.
- `manifest.json` declares `default_locale: "en"` and references the localized metadata keys.
- The Side Panel's existing JP / EN runtime switch remains implemented separately in `src/i18n.js`.

## Manual Chrome Web Store Developer Dashboard steps — Toku only

The localized detailed descriptions and localized screenshots are entered manually. Do not perform these steps until the final versioned ZIP has Toku's approval.

1. Upload the approved release ZIP containing `_locales/en` and `_locales/ja`; do not submit it for review yet.
2. Open the item's **Store listing** tab.
3. Use the language dropdown at the top of the listing details and select **English (`en`)**.
4. Paste **Detailed description — English** above into the detailed-description field. Add English localized screenshots or a localized promo video if approved.
5. Switch the language dropdown to **Japanese (`ja`)**.
6. Paste **Detailed description — Japanese** above. Add Japanese localized screenshots or a localized promo video if approved.
7. Confirm that the localized item summaries shown by the package match the two short descriptions above and that the feature set is consistent across both locales.
8. Save the listing draft. Review any localization-consistency warning; do not dismiss it until the two descriptions have been compared.
9. Recheck the **Privacy practices** and **Distribution** tabs against the final package.
10. Stop before **Submit for review**. Submission and publication require Toku's explicit approval.

Chrome's official listing documentation states that the locale dropdown is populated from `_locales/LOCALE_CODE` directories included in the uploaded extension package. It also allows localized descriptions, screenshots, and promo videos; small and marquee promo tiles remain global.

Official reference: https://developer.chrome.com/docs/webstore/cws-dashboard-listing#localize-your-listing

## Store assets still needed

- At least one current 1280x800 screenshot showing the v0.4.1 Side Panel with a loaded transcript while YouTube's own transcript panel remains closed and the description remains usable.
- Prefer separate Japanese and English localized screenshots when both are available.
- Review current Chrome Web Store image guidance immediately before upload.

Recommended screenshots:
1. Side Panel with a transcript loaded beside an unobstructed YouTube page.
2. The two main copy actions: full text and readable paragraphs.
3. Timestamped transcript and click-to-seek behavior.
4. Japanese and English interface variants.

Do not reuse screenshots that show the old auto-opened YouTube transcript panel, errors, or UI that no longer matches the approved release.
