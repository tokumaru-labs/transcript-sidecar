# Public release checklist — v0.4.1

The approved release-package version is `0.4.1`. Publication remains separately approval-gated.

## Code

- [x] Manifest V3
- [x] YouTube-only host permissions
- [x] No remote runtime code
- [x] No analytics / ads / tracking
- [x] No npm/runtime dependencies
- [x] Full transcript copy
- [x] Readable paragraph copy
- [x] Timestamped copy
- [x] Markdown copy
- [x] TXT / MD download
- [x] Click timestamp to seek
- [x] Duplicate-transcript safeguards
- [x] JP / EN Side Panel UI and persisted language choice
- [x] Extension-context timed-text retrieval preserved
- [x] Page-context timed-text retrieval preserved
- [x] Silent YouTube `get_panel` transcript-data fallback
- [x] No automatic description expansion
- [x] No automatic YouTube transcript-panel open or close
- [x] Read-only fallback for an already user-opened transcript panel
- [x] Local acquisition-method diagnostics without transcript-text logging
- [ ] Automated regression suite green on the final release commit
- [ ] Real Chrome: previously auto-opening video loads silently
- [ ] Real Chrome: transcript panel closed state preserved
- [ ] Real Chrome: description expanded/collapsed state preserved
- [ ] Real Chrome: Side Panel close / reopen
- [ ] Real Chrome: YouTube SPA navigation to a second video
- [ ] Real Chrome: caption-track switch where available
- [ ] Real Chrome: JP → EN → JP
- [ ] Real Chrome: timestamp click-to-seek
- [ ] Real Chrome: full/readable/timestamp/Markdown copy
- [ ] Real Chrome: TXT / Markdown download
- [ ] Real Chrome: no-caption failure path stays fail-closed

## Localization and store material

- [x] `_locales/en/messages.json`
- [x] `_locales/ja/messages.json`
- [x] English item summary within 132 characters
- [x] Japanese item summary within 132 characters
- [x] English detailed-description draft
- [x] Japanese detailed-description draft
- [x] Manual Developer Dashboard localization steps documented
- [ ] Localized listing screenshots approved
- [ ] Final listing/privacy consistency check

## GitHub

- [x] README
- [x] LICENSE (GPL-3.0-only)
- [x] TRADEMARKS.md
- [x] PRIVACY.md
- [x] CHANGELOG.md
- [x] CONTRIBUTING.md
- [x] SECURITY.md
- [ ] Merge approved local branch to `main`
- [ ] Tag the approved version
- [ ] Create GitHub Release

## Chrome Web Store

- [ ] Prepare upload-ready runtime ZIP with the approved version number
- [x] JA / EN Store listing draft
- [x] Single-purpose draft
- [x] Permission-justification drafts
- [x] Remote-code declaration draft
- [x] Data-use disclosure draft
- [ ] Upload current localized screenshot(s)
- [ ] Verify the stable public privacy-policy URL
- [ ] Enter English and Japanese localized listing fields
- [ ] Complete Privacy practices tab
- [ ] Confirm Distribution settings
- [ ] Submit for review only after Toku approval
