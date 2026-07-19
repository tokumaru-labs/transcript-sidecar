# Chrome Web Store submission notes — Transcript Sidecar 0.3.2

This file is for the publisher and is not required at runtime.

## Product name

Transcript Sidecar

## Publisher

Tokumaru Labs

## Short description — Japanese

YouTubeの字幕をサイドパネルで表示し、全文・読みやすい段落・タイムスタンプ付き・Markdownでコピーできます。追跡・広告・外部字幕サーバーなし。

## Short description — English

Copy and export YouTube transcripts as plain text, readable paragraphs, timestamps, or Markdown. No account, tracking, ads, or external transcript server.

## Detailed description — Japanese

Transcript Sidecarは、YouTube動画で利用できる字幕をChromeのサイドパネルに表示し、すばやくコピー・保存するためのシンプルなオープンソース拡張機能です。

主な機能:
- 全文をワンクリックでコピー
- 字幕特有の細かい改行を除去
- 内容を変更せず、タイミングと文章量をもとに段落を整える「読みやすくコピー」
- タイムスタンプ付きコピー
- 動画タイトル、URL、字幕情報を含むMarkdownコピー
- TXT / Markdown保存
- Transcript内の時刻をクリックして動画の該当位置へ移動
- 複数の字幕トラックから選択

プライバシー:
- アカウント不要
- 広告なし
- Analytics / Trackingなし
- 開発者が運営する外部サーバーへTranscriptを送信しません
- 実行時の第三者JavaScript依存なし
- YouTube以外のサイトへのホスト権限なし

Transcript Sidecarは、YouTube側で字幕が提供されている動画を対象としています。音声そのものをAIで文字起こしする機能は現在含まれていません。

Open source by Tokumaru Labs.

## Single purpose description

YouTube動画で利用可能な字幕を取得してChromeのサイドパネルに表示し、ユーザーがテキスト、読みやすい段落、タイムスタンプ付きテキスト、Markdownとしてコピーまたはローカル保存できるようにすること。

## Permission justification: `sidePanel`

YouTube動画の字幕一覧、字幕本文、コピー・保存操作をChromeのサイドパネル内に表示するために使用します。

## Permission justification: `scripting`

現在開いている対応YouTube動画ページから、その動画のタイトル・URL・字幕トラック情報を読み取り、Transcript内の時刻をクリックした際に動画の再生位置を変更するために使用します。

## Host permission justification: YouTube domains

拡張機能の単一目的であるYouTube字幕の取得・表示に必要なページ情報へアクセスするため、YouTubeドメインのみに限定して使用します。`<all_urls>` は要求しません。

## Remote code declaration

No. The extension does not load or execute remotely hosted JavaScript or WebAssembly. All executable extension code is packaged with the extension.

## Data-use disclosure draft

The extension does not intentionally collect or transmit personal information to Tokumaru Labs. Transcript text is processed in the user's browser and is not sent to a developer-operated application server. The extension necessarily communicates with YouTube resources associated with the currently opened YouTube video in order to retrieve caption data.

Review the exact checkboxes shown in the current Developer Dashboard and ensure they remain consistent with `PRIVACY.md` before submission.

## Privacy policy URL

After the GitHub repository is public, use a stable public URL for `PRIVACY.md` (or a GitHub Pages privacy-policy page) in the Chrome Web Store privacy field.

## Store assets still needed

- At least one current screenshot showing the real v0.3.2 Side Panel in use.
- Review the current Chrome Web Store image guidance before uploading promotional graphics.

Recommended screenshots:
1. Side Panel with a transcript loaded.
2. The two main copy actions: full text and readable paragraphs.
3. Timestamped transcript and click-to-seek behavior.
4. Markdown export example.

Do not use screenshots from an older version that show errors or UI that no longer matches the release.
