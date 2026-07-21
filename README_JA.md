# Transcript Sidecar

[English](README.md) | [日本語](README_JA.md)

YouTube動画の文字起こし(トランスクリプト)をコピー・整形・エクスポートするための、プライバシー重視の小さなManifest V3 Chrome拡張機能です。

**現在のバージョン: 0.3.3**
**発行者: Tokumaru Labs**

> アカウント登録不要。トラッキングなし。広告なし。開発者運営の文字起こしサーバーもありません。

## 機能

- Chromeのサイドパネルで開く
- 現在再生中のYouTube動画から利用可能な字幕トラックを読み取る
- ワンクリックの**全文コピー**(字幕特有の不自然な改行を除去)
- 字幕の文言はそのままに、読みやすいように段落分けを行う**読みやすいコピー**
- タイムスタンプ付きコピー
- 動画タイトル・元URL・字幕の言語・段落整形済みの文字起こしを含むMarkdownとしてコピー
- 読みやすい文字起こしを`.txt`としてダウンロード
- `.md`としてダウンロード
- 文字起こしのタイムスタンプをクリックしてYouTube動画をシーク
- アカウント不要
- アナリティクスなし
- 広告なし
- 開発者運営のバックエンドサーバーなし
- サードパーティのランタイムJavaScript依存なし

## v0.3.3での変更点

- Chrome Web Storeの文字数制限に合わせて、manifestのdescriptionを短縮。
- 機能面の変更はなし。

## 過去リリースのハイライト(v0.3.2)

- YouTubeの新しい文字起こしパネルDOMに対応する、4番目の字幕取得フォールバックを追加。既存の取得経路が何も返さなかった場合のみ実行される。
- この新しいフォールバックが取得する文字起こしテキストに、ローカライズされたアクセシビリティ用の時間ラベルが混入していた不具合を修正。
- 文字起こしの読み込みに失敗した場合のみ表示される、コピーボタン付きの取得診断パネルを追加。
- 1番目〜3番目の字幕取得経路に変更なし。

## v0.3.0での変更点

- 字幕の文言を要約・翻訳・書き換えすることなく段落分けを行う**読みやすいコピー**を追加。
- **全文コピー**は、字幕特有の不自然な改行を除去したシンプルな連続テキストのエクスポートのまま維持。
- MarkdownとTXTのエクスポートが、読みやすい段落整形を使用するように変更。
- プロジェクトのライセンス(GPL-3.0-only)と、GitHubおよびChrome Web Store公開準備のための公開プロジェクト向けドキュメントを追加。
- Chrome Web Store掲載情報、権限の正当性説明、プライバシー開示、リリースチェックリストのドラフトを追加。
- サイドパネルのフッターにTokumaru Labsのクレジット表記を追加。

## プライバシーと権限

この拡張機能が要求する権限は以下のみです。

- `scripting` — 対応するYouTubeページ上で、プレイヤー/字幕情報の読み取りと動画のシークを行うため、範囲を限定したコードを実行する。
- `sidePanel` — Chromeのサイドパネルに文字起こしインターフェースを表示する。
- YouTube限定のホストアクセス:
  - `https://www.youtube.com/*`
  - `https://youtube.com/*`
  - `https://m.youtube.com/*`

`<all_urls>`のような広範な権限は要求していません。

この拡張機能は、現在再生中のYouTube動画に紐づく字幕リソースを取得します。文字起こしテキストが開発者運営のアプリケーションサーバーへ送信されることはありません。

プライバシーポリシーの全文は[PRIVACY.md](PRIVACY.md)を参照してください。

## ローカルへのインストール

1. リリースZIPを、恒久的に使用するフォルダへ展開する。
2. Chromeで`chrome://extensions/`を開く。
3. **デベロッパーモード**をONにする。
4. **パッケージ化されていない拡張機能を読み込む**をクリックする。
5. 展開した`transcript-sidecar-v0.3.3`フォルダを選択する。
6. 字幕のあるYouTube動画を開く。
7. **Transcript Sidecar**拡張機能のアイコンをクリックする。
8. **全文をコピー**または**読みやすくコピー**を選択する。

## 出力形式

### 全文書き起こし

字幕セグメント特有の不自然な改行を除去し、ひとつながりの連続した文字起こしを生成します。この拡張機能は文言の要約や書き換えを行いません。

### 読みやすい書き起こし

タイミングの間隔、経過時間、文末の句読点、段落の長さを手がかりに段落分けを行います。テキスト自体は空白の正規化を除いてそのまま保持されます。

### タイムスタンプ付き書き起こし

字幕の各キューを1行ずつ、タイムスタンプ付きで保持します。

### Markdown

動画タイトル、元URL、字幕トラック情報、および段落整形済みの読みやすい文字起こしを含みます。

## プロジェクト構成

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

この拡張機能には意図的に**ビルドステップがなく**、**npm依存関係もありません**。ソースフォルダをそのままChromeに読み込めるため、コードの監査がしやすくなっています。

## 字幕取得戦略

この拡張機能は、以下の方法を順番に試行します。

1. 拡張機能のコンテキストから、YouTubeのtimed-textエンドポイントを利用(`json3`、XML/SRV、WebVTT)
2. 同じtimed-textリクエストを、YouTubeページのコンテキストから実行
3. フォールバックとして、YouTube自体がレンダリングする文字起こしパネルを利用
4. レガシーな`ytd-transcript-*`マークアップに依存しない、表示中の文字起こしパネルの読み取り専用スキャン(最終フォールバック。クリックなし、独自のネットワークリクエストなし)

この多段階のアプローチを採用しているのは、YouTube内部の字幕まわりの挙動が動画ごとに異なり、また時間の経過とともに変化しうるためです。

## 現在の制限事項

- YouTubeが字幕を提供している動画のみサポートしています。
- 字幕のない動画を音声から文字起こしすることはありません。
- 段落整形はヒューリスティックな方法によるものであり、意図的に外部のAIサービスを使用していません。
- YouTubeはドキュメント化されていないページ/プレイヤー内部の仕様を変更することがあるため、今後もメンテナンスが必要になる場合があります。
- ライブ配信では、字幕が利用可能になるまで安定した文字起こしが得られない場合があります。

## 開発思想

Transcript Sidecarは、「小さなツールが役に立つのであれば、トラッキングやサブスクリプション、不要な権限を裏に隠すことなく、それを共有できるはずだ」というシンプルな発想から始まりました。

このプロジェクトが目指しているのは、次のような姿を保ち続けることです。

- 小さいこと
- 監査可能であること
- 依存関係がないこと
- 権限について明示的であること
- ローカルファーストであること
- 巧妙さより有用性を優先すること

## Contributing

[CONTRIBUTING.md](CONTRIBUTING.md)を参照してください。

## Security

[SECURITY.md](SECURITY.md)を参照してください。

## License

Transcript SidecarはGNU General Public License v3.0 only(GPL-3.0-only)の下でライセンスされています。詳細は[LICENSE](LICENSE)を参照してください。

**Transcript Sidecar**および**Tokumaru Labs**の名称・ロゴはGPLの対象には含まれません。詳細は[TRADEMARKS.md](TRADEMARKS.md)を参照してください。

---

**Tokumaru Labs**によるオープンソースツールです。
