# Upload the ten-repair batch using GitHub in your browser

This is a changed-files-only package, not a full repository. It contains 13 files: five existing code files, one new test file, the refreshed inventory/status/test reports, this guide, a manifest and the updated workbook. The standalone Excel download is identical to the workbook inside this ZIP.

1. Download and extract the ZIP locally. Do not upload the ZIP itself.
2. Open the repository root on the intended branch in GitHub. Choose Add file > Upload files.
3. Drag the extracted `src`, `tools`, and `tests` folders plus the root-level files together. Keep every folder path intact. Do not flatten them into the repository root, and do not add an enclosing ZIP-name folder. This package does not change `.github`.
4. Confirm that existing paths are being replaced and `tests/batch-ten.test.mjs` is added. Commit all files together in one commit. If your browser does not preserve folders, use GitHub's web editor for the exact paths instead; do not upload source files to the wrong folder.
5. Inspect the new GitHub Validate and build run, including the Chromium smoke job and its uploaded diagnostics. Inspect Vercel separately. Vercel succeeding does not prove Chromium passed, and the reverse is also true.

The design, fonts, catalog data, TMDB search/season repair, 95% poster floor, package.json, Vercel configuration and CI workflow are unchanged. Ads, analytics and affiliate tracking remain disabled. Nothing was committed or deployed by this delivery.

## Exact paths in this ZIP

- `BACKLOG-STATUS.md`
- `CHANGED-FILES.json`
- `DramaRecs-action-plan.xlsx`
- `INVENTORY.json`
- `TEST-RESULTS.md`
- `UPLOAD-BATCH-10.md`
- `backlog-status.json`
- `src/app.js`
- `src/core.js`
- `tests/batch-ten.test.mjs`
- `tests/browser-smoke.mjs`
- `tools/validate-data.mjs`
- `tools/validate-pages.mjs`

## Evidence and limits

254 Node tests pass (184 retained + 70 new). The 70 new tests expose 50 failures on the original source. Fixture release checks pass across 341 HTML files and 834 streaming rows. All 42 Backlog Status cells are updated, with implementation, verification, and remaining acceptance separated.

The user-reported browser CI failed; its fixture initialization is repaired, but there is no observed green Chromium rerun. The sandbox lacks Playwright/Chromium and has no internet access to install them. Real-browser, live-TMDB, physical-device, full editorial, consent and external-approval checks remain pending. Fixture mode is not a production coverage result. Do not change Vercel to build:fixture or lower the poster gate.

`TEST-RESULTS.md`, `BACKLOG-STATUS.md`, `backlog-status.json` and the workbook are current for this batch. Earlier six-fix instructions and older narrative research notes are historical. This package does not delete those files.

If a later check fails, keep the failure log and correct the reported cause. Do not bypass validation or swallow actual-site exceptions to force a green check. The manifest records baseline hashes to help identify accidental mixing with another version; it is not proof of the current remote commit.
