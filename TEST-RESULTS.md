# Current test evidence: ten-repair batch

As of 2026-09-06. Supersedes earlier six-fix delivery totals.

- Supplied source baseline: 184 existing Node tests pass.
- New regression suite: 70 tests. On the unmodified baseline, 50 fail and 20 boundary/guard cases already pass.
- Repaired release: 254 tests pass, 0 failures, 0 skipped.
- Command executed: `node tools/release-build.mjs fixture`. This executes both validators, all Node tests, fixture build, streaming output checks, HTML smoke checks and inventory generation.
- Current validators: 219 dramas / 101 lists, 26 non-blocking reciprocity warnings.
- Fixture output: 341 HTML files, 338 sitemap entries, 834 streaming rows checked. Local links/required controls/no-tracking checks pass.
- Replacement JavaScript files pass Node syntax checks.
- Browser setup is tested by invoking its actual serialized initialization callback in a Node VM. This does not execute Chromium.

## Ten target results

- B10-01: Browser fixture origin guard and seed readback. Skips opaque/unrelated origins; actual-origin denial and discarded writes surface; existing state retained. (DR-01 / DR-37; `tests/browser-smoke.mjs`)
- B10-02: Reject oversized shared shelves. 500 valid unique slugs accepted; 501 rejected without partial import. (DR-06; `src/core.js`)
- B10-03: Synchronous clipboard failures and missing API. Getter/write throws and promise rejection keep a copyable field and manual instructions. (DR-06; `src/app.js`)
- B10-04: Stale clipboard completion across navigation. Navigation and copy-attempt sequence invalidates old success/failure feedback, including return to same hash. (DR-06; `src/app.js`)
- B10-05: Recommendation array and entry schema. Malformed picks/against and entries return field diagnostics, not method/type crashes. (DR-22; `tools/validate-pages.mjs`)
- B10-06: Calendar-valid recommendation review dates. Real YYYY-MM-DD required; impossible/future dates rejected with bounded date-only time-zone allowance. (DR-22; `tools/validate-pages.mjs`)
- B10-07: Prose field type validation. Non-string standfirst, pick/anti-pick why and catalog verdict/endingText/hookNote rejected before lint. (DR-22; `tools/validate-pages.mjs`)
- B10-08: Positive whole season identifiers. Explicit season requires positive safe integer and existing parent/label rules. (DR-19 / DR-22; `tools/validate-pages.mjs`)
- B10-09: Explicit invalid TMDB IDs. Explicit zero/null/false/string/fractional/negative IDs rejected; absent or positive safe integer allowed. (DR-20; `tools/validate-data.mjs`)
- B10-10: Full catalog-title exemption from filler lint. Captivating the King allowed in prose; unrelated masterpiece or partial title Captivating the Kingdom still rejected. (DR-22; `tools/validate-pages.mjs`)

## Limits

The user-reported Chromium job failed. A green rerun is still required after uploading these files. Playwright/Chromium are not installed in this sandbox; it has no internet access for installation. Native clipboard, physical-device, screen-reader, Safari/Firefox and field-performance checks remain pending.

Fixture mode intentionally produces no live poster data and does not demonstrate production poster coverage. This delivery did not run live TMDB or a full simulated-TMDB production build. Existing isolated release-pipeline and metadata regression tests passed as part of the 254-test suite. The 95% production poster floor was not lowered; no production guard or browser exception assertion was disabled.

No editorial truth, identity certification, consent/CMP approval, revenue, live deployment or remote repository state is certified. Ads, analytics and affiliate tracking remain disabled.

## Reproducibility

Input ZIP comment: `a21c723f5eb58c442a1cc12c81220ce0bf1d668a` (archive-provided reference, not independent GitHub verification).
Input archive SHA-256: `e89b1872b1d79b0d5535d146efd543165a8ff19cd4e430d93cd34f87313e260d`.
Tested source fingerprint: `d936a5a1f0d8d8f6d5dc044a7e791bd5f65ad72ea0125c74d57cb0cecd25c9e9`. Generated status/workbook/manifest files are not in the source fingerprint scope.
