# Upload the six-fix update through GitHub

This ZIP contains only changed replacement files and required new helper/test/report files. It is not the full repository. Each source file is complete, not a patch snippet. Folder paths are preserved.

## One upload, one commit

1. Download and extract `DramaRecs-six-fixes-changed-files.zip`. Do not upload the ZIP itself.
2. Open your repository root on GitHub, where `build.mjs` and `package.json` are visible. Choose **Add file > Upload files**.
3. Drag the extracted `src`, `lib`, `tools` and `tests` folders plus **all root files** into the upload area together. Do not upload an enclosing download folder. Preserve paths such as `lib/editorial-evidence.mjs`, not root-level `editorial-evidence.mjs`.
4. Check the upload paths against `CHANGED-FILES.json`. Commit the entire batch once, preferably to a new branch and pull request so Vercel builds a Preview before merging.
5. Leave the Vercel build command as **`npm run build`**, retain your existing TMDB token, and wait for a successful Preview before merging. Do not lower poster coverage or select fixture mode to bypass a failure.

Important: `tools/validate-data.mjs` imports the new `lib/editorial-evidence.mjs`. Upload both in the same commit. `build.mjs` is included this time, but its TMDB code is unchanged; only the shared-core import and short-collection predicate changed. There are no new dependencies.

If folder dragging is unavailable, use a desktop browser that accepts dragged folders. Do not flatten folder contents into the repository root or commit one folder at a time. Keep the previous working commit/deployment available as a rollback point.

## Preview checks

1. Open two tabs. Save different titles in each, then reload your shelf and confirm both remain. Mark a title watched, change a preference and remove/Undo a save. Watched history and saved state should remain independent. This is still localStorage, not a guaranteed simultaneous-write database.
2. Open a shared shelf, change its `#s=` fragment to another title, and use Back/Forward. Confirm the displayed shelf follows the link, not the previous fragment. Test a damaged link and return to your own shelf. Existing saved titles must not be replaced. If a copy field was visible, the old link should disappear after navigation.
3. Search using a Korean or other IME. Enter should finish text composition without navigating; a subsequent normal Enter should open the selected result. Arrows and Escape during composition belong to the IME. Test touch/native keyboards and Safari if available.
4. With developer tools or a test environment, make `/assets/search.json` fail, then restore it and press Retry. Search should recover and focus return to its input; shelf IDs must survive the failure. Do not commit intentionally malformed catalog data to production.
5. Check the short-drama collection, search and shelf on phone and desktop widths, along with the previously repaired comparison/streaming controls.
6. If the build flags an evidence URL/date or fractional episode count, inspect the named entry and supply a real correction. Do not invent a citation or weaken the validator to make it pass.

## Evidence and scope

128 tests and fixture HTML/link checks pass. A simulated-TMDB production pipeline also passes; real browser/live API behavior still requires your Preview. See TEST-RESULTS.md and BACKLOG-STATUS.md. Historical workbook statuses and old release notes are not the latest assessment.

Only the six approved defect groups were repaired. No redesign, data rewrite, advertising enablement, GitHub update or deployment was performed. CSS/fonts, the working TMDB repair, 95% poster floor and release snapshot safeguards remain intact.

## Rollback

If the Preview fails, do not merge it. If a merged update causes problems, return to your previous known-good Vercel deployment and reverse the entire repair commit, not individual files. This live rollback procedure has not been exercised for you.
