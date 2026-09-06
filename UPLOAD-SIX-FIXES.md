# Upload this six-target follow-up using GitHub's website

This is the latest capacity/focus/snapshot/copy/fingerprint/browser-CI follow-up, not the earlier six-fix package. Your supplied full repository already contains the earlier patch. This ZIP contains **16 complete changed/new files only**, with original folder paths. It is not a full repository, and it is not a diff that needs Git installed.

184 Node tests and fixture checks across 341 HTML files passed. The isolated simulated-TMDB production build passed too. **Real Chromium checks have not run here**; the workflow will run them in GitHub Actions after upload. This is not completion of all 42 backlog items.

## Upload together

1. Extract `DramaRecs-followup-changed-files.zip`. Do not upload the ZIP itself or an enclosing folder. Keep every nested path intact, including `.github/workflows/validate.yml`.
2. Open `dramrecs-Astra/dramarecs_v2` on GitHub and go to the repository root, where `build.mjs` and `package.json` live. Choose **Add file > Upload files**. Drag the extracted folders and root files together onto the upload page. Review the paths below before committing.
3. Commit all 16 files together. Suggested message: `fix: capacity, focus, snapshot validation and browser CI`. For safest review, choose a new branch and open a pull request, then wait for the **Validate and build** check before merging. No terminal is needed. If you commit straight to `main`, your existing Vercel integration may deploy immediately; GitHub Actions does not automatically hold that deployment.
4. In **Actions > Validate and build**, check the commit you uploaded. The workflow installs pinned Playwright only in CI, installs Chromium, runs the tests, and uploads `chromium-smoke-<run number>` diagnostics. Its first green browser result is still pending. Also check the Vercel build independently. Keep **`npm run build`** and your existing **TMDB_TOKEN** unchanged.

## Do not miss the hidden folder

The `.github` folder can be hidden in file pickers. On macOS, Command+Shift+Period toggles hidden files in Finder. Confirm that the upload preview includes `.github/workflows/validate.yml`, not `validate.yml` at the repository root. If your browser cannot upload that folder, use GitHub's editor for the existing workflow and copy the supplied file exactly; the source repairs can still run, but browser CI is not installed until that workflow update is committed. Prefer uploading all paths together when possible.

## Exact paths

```text
.github/workflows/validate.yml
BACKLOG-STATUS.md
CHANGED-FILES.json
INVENTORY.json
TEST-RESULTS.md
UPLOAD-SIX-FIXES.md
backlog-status.json
build.mjs
lib/data-quality.mjs
src/app.js
src/core.js
tests/browser-smoke.mjs
tests/followup.test.mjs
tests/release-pipeline.test.mjs
tools/inventory.mjs
tools/smoke.mjs
```

Only `tests/followup.test.mjs` is a new repository path; the other 15 paths replace existing files. No file deletion is required. `CHANGED-FILES.json` records sizes, hashes and original attachment hashes for comparison. Do not mix `src/app.js` from this package with an older `src/core.js`.

## What this fixes

- The saved/watched 500-title cap now rejects oversized writes and imports as a whole, with no false Saved or Undone feedback. It does not expand the cap.
- Shelf retry, cross-tab title links/shared controls and clear-filter focus have connected, visible fallbacks.
- Snapshot fields and calendar dates receive stronger validation; malformed data stops release instead of silently being used.
- Identified blanket hand-review and spoiler-safety promises are corrected in public templates and checked during the build. Editorial truth is not certified by wording changes.
- Fingerprints include CI/deployment/runtime source configuration.
- Browser smoke checks are wired into read-only GitHub CI, with a pinned test-tool version and failure artifacts.

## What stays unchanged

Design, fonts, CSS/assets, catalog/recommendation data, working TMDB identity/search/season repair, package.json, Vercel settings, the 95% poster floor and snapshot promotion/rollback mechanism remain. Ads, analytics and affiliate tracking stay disabled. This delivery contains no generated `dist`, metadata snapshot, API cache, browser installation, secret or simulated production data.

## If a check fails

Use the log for the new commit, not a previous run. For browser failures, download the Actions artifact: it contains a JSON result report and, for application-test failures, a screenshot, HTML and Playwright trace. Browser installation failures may have no artifact because the runner has not started yet. Share the failing log/artifact for diagnosis rather than changing the build to fixture mode or disabling validation.

If stricter snapshot validation identifies a bad field, correct that specific source/metadata row. Do not delete the last-good snapshot or lower the 95% requirement just to make deployment green. If the live repository has changed since the supplied ZIP, compare the changed paths first rather than overwriting newer work blindly.

To undo this delivery using GitHub, revert the single commit or merged pull request. Deployment rollback and required-check/branch-protection settings remain under your control; neither was changed here.

Current evidence: `TEST-RESULTS.md`. All 42 statuses and remaining dependencies: `BACKLOG-STATUS.md` / `backlog-status.json`.
