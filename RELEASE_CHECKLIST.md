# Public release checklist — v0.4.1

## Code

- [x] Manifest V3
- [x] YouTube-only host permissions
- [x] `permissions` and `host_permissions` unchanged from v0.4.0
- [x] No new permission of any kind
- [x] No remote runtime code
- [x] No analytics / ads / tracking
- [x] No npm/runtime dependencies
- [x] No build step
- [x] Full transcript copy
- [x] Readable paragraph copy
- [x] Timestamped copy
- [x] Markdown copy
- [x] TXT / MD download
- [x] Click timestamp to seek
- [x] Duplicate-transcript safeguards
- [x] Four caption-recovery fallbacks, order unchanged
- [x] Capture-diagnostics panel (shown only on failure)
- [x] Side Panel **JP** / **EN** toggle unchanged (`src/i18n.js` untouched)

## Package localization (new in 0.4.1)

- [x] `_locales/en/messages.json` present
- [x] `_locales/ja/messages.json` present
- [x] `default_locale` is `en`, and `_locales/en/` exists
- [x] `en` and `ja` message keys match exactly
- [x] Every `__MSG_*__` reference in `manifest.json` resolves in both locales
- [x] `name` ≤ 45 characters in both locales
- [x] `short_name` ≤ 12 characters in both locales
- [x] `description` ≤ 132 characters in both locales (en 123, ja 66)
- [x] Every message carries a `description` field for maintainers
- [x] All JSON files parse and contain no BOM
- [x] `chrome --pack-extension` succeeds with `default_locale: en`
- [x] `chrome --pack-extension` succeeds with `default_locale` temporarily set to `ja`, proving the ja bundle resolves every reference

## Manual verification in Chrome

Automated browser testing is not part of this project: there is no Playwright
setup, and adding one would introduce npm dependencies the project deliberately
does not have. The following are verified by hand before release.

### English Chrome

- [ ] `chrome://extensions` shows the name **Transcript Sidecar**
- [ ] `chrome://extensions` shows the English description
- [ ] Toolbar tooltip reads **Open Transcript Sidecar**
- [ ] Side Panel opens from the toolbar icon
- [ ] With no stored choice, the panel starts in English

### Japanese Chrome

- [ ] `chrome://extensions` shows the name **Transcript Sidecar**
- [ ] `chrome://extensions` shows the Japanese description
- [ ] Toolbar tooltip reads **Transcript Sidecarを開く**
- [ ] Side Panel opens from the toolbar icon
- [ ] With no stored choice, the panel starts in Japanese

### Side Panel behavior (either Chrome language)

- [ ] **JP** / **EN** toggle switches the interface immediately, with no reload
- [ ] The active button shows `aria-pressed="true"`, and its tooltip and `aria-label` match the active language
- [ ] The choice survives closing and reopening the panel
- [ ] The choice survives restarting Chrome
- [ ] The current status message re-renders in the new language when switched
- [ ] Caption text, video title, video URL, and caption-track names stay untranslated in both languages
- [ ] Transcript loads on a captioned video
- [ ] Copy full transcript
- [ ] Copy readable
- [ ] Copy with timestamps
- [ ] Copy as Markdown
- [ ] Save TXT
- [ ] Save MD
- [ ] Clicking a timestamp seeks the video
- [ ] Toasts appear in the active language
- [ ] Error text appears in the active language (test with a non-YouTube tab)
- [ ] Diagnostics panel labels appear in the active language
- [ ] Long English and long Japanese strings do not break the header, buttons, or footer at the narrowest usable panel width
- [ ] No regression on videos that worked in v0.4.0

## GitHub

- [x] README
- [x] README_JA
- [x] LICENSE (GPL-3.0-only)
- [x] TRADEMARKS.md
- [x] PRIVACY.md
- [x] CHANGELOG.md
- [x] CONTRIBUTING.md
- [x] SECURITY.md
- [x] Public repository
- [ ] Merge `feat/store-i18n-v0.4.1` into `main`
- [ ] Tag `v0.4.1`
- [ ] Create GitHub Release

## Chrome Web Store

- [x] Store listing draft, English
- [x] Store listing draft, Japanese
- [x] Single-purpose draft
- [x] Permission-justification drafts
- [x] Remote-code declaration draft
- [x] Data-use disclosure draft
- [ ] Prepare upload-ready runtime ZIP for v0.4.1 (must include `_locales/`)
- [ ] Set the default listing language to English
- [ ] Add Japanese as an additional listing language
- [ ] Upload the English screenshot set (see `STORE_LISTING.md`)
- [ ] Upload the Japanese screenshot set (see `STORE_LISTING.md`)
- [ ] Confirm both listings describe the same features
- [ ] Publish privacy policy at a stable public URL
- [ ] Complete Store listing tab
- [ ] Complete Privacy practices tab
- [ ] Confirm distribution settings
- [ ] Confirm the permission set is unchanged from the published version, so review is not delayed by a permission diff
- [ ] Submit for review
