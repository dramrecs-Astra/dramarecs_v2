# Six-target follow-up: verification and limits

Date: 2026-09-06. Source: the two user-supplied ZIPs. Every file of the smaller patch matches the full repository. No live GitHub revision was independently inspected.

## Results

- Baseline: 128 Node tests passed and fixture checks passed across 341 HTML files.
- Final: **184 Node tests pass, zero failures**: 128 retained plus 56 added.
- Regression proof: the 56 added cases yield 52 failures against the original implementation; four compatibility/boundary cases already passed. The nine existing release-orchestrator cases also passed in that comparison.
- Fixture pipeline: validation, tests, generation, streaming normalization, local links, source-order/structural checks, known public-claim scans and inventory pass.
- Fixture inventory: 219 dramas, 101 recommendation lists, 341 HTML files, 338 sitemap entries, 834 streaming rows. Zero newly certified identity mappings.
- Isolated simulated-TMDB production pipeline: passes, including snapshot validation and promotion after downstream checks. Synthetic posters cover all 219 titles. Sample ad/GA/affiliate environment variables still emit no tracking tags. No simulated snapshot, cache, response, token or generated HTML is shipped.
- No-token/no-snapshot production: intentionally fails at 0% poster coverage. The 95% gate still requires at least 209 of 219 valid posters. Do not use fixture mode to bypass it on Vercel.
- The 26 existing reciprocal-recommendation warnings remain non-blocking and unresolved.

## Scope of the six repairs

1. **Capacity:** distinct valid-ID limits are checked before decoding and after cross-tab merging. Over-capacity writes/imports/Undo are rejected as a whole, with an explicit message and no false Saved/Undone feedback. Saved and watched caps are independent. Session fallback and 500-item limits remain.
2. **Keyboard focus:** shelf retry success/empty/failure restores useful focus without stealing it after the user moves away. Cross-tab updates preserve title links and shared controls, or move to a neighbor/discovery when removed. Clear-filter controls no longer retain focus while hidden. Existing removal, Undo, comparison, search and input-method behavior stays covered.
3. **Snapshot validation:** checks hydrated text/list/rating/status fields, strict real calendar dates, zoned retrieval timestamps, five-minute clock skew and HTTPS link syntax. Valid legacy omissions and future scheduled season dates remain supported. Integration tests verify exact last-good restoration after malformed candidates and early rejection of malformed baselines.
4. **Public copy:** identified Hand-reviewed, universal catalog-review and spoiler-safety promises are replaced with scoped wording across homepage, catalog, collection metadata and terms. Generated HTML and source guards reject regressions. This does not verify remaining bylines, underlying claims or all prose.
5. **Inventory:** fingerprint v2 includes CI/deployment/runtime source files and exact snapshot exclusions. It is not a deployment attestation and cannot observe remote settings or secrets.
6. **Browser CI:** pinned Playwright 1.58.2 is installed only in GitHub Actions, with Chromium and Linux dependencies; the runner uploads JSON results, and screenshots/HTML/traces on test failure. The read-only validation job has a 20-minute timeout. It does not commit changes or deploy.

## Browser status: configured, execution still pending

The browser runner parses, and workflow source assertions pass. Local launch was attempted but could not start because the browser executable is absent. The sandbox has no internet access to download it. **No real-browser check passed here.**

The runner defines 31 Chromium checks: 25 shelf width/count combinations with synthetic loaded images, plus delayed search, watched/persistence/Undo/ending/pilot interactions, retry and actual storage events, clear-filter focus, capacity/import rejection, and shared-fragment Back/Forward. External requests are blocked; fixture artwork never becomes production metadata. The first green Actions run is still required after upload. Safari/Firefox, screen readers, physical devices, native IMEs, real clipboard restrictions, live APIs and measured CWV are not covered by this result.

GitHub Actions and Vercel run independently. Adding tests does not make them a required deployment gate. Branch protection and required-check settings were not changed.

## Environment and commands

Node v22.23.1. Dependency-free verification ran directly:

```sh
node --test tests/*.test.mjs
node tools/release-build.mjs fixture
node tools/release-build.mjs production
node --check tests/browser-smoke.mjs
node tests/browser-smoke.mjs
```

Production was tested with a test-only fetch preloader in an isolated copy (pass) and with no token/metadata (expected block). Browser invocation stopped at launch, not at an application assertion. No npm installation or internet request was performed by this sandbox.

## Preserved and remaining

CSS/fonts/assets, all catalog and recommendation data, lib/tmdb-identity.mjs, tools/release-build.mjs, tools/streaming-output.mjs, package.json and vercel.json are unchanged. build.mjs changes public strings only; identity/search/season enrichment is unchanged. The 95% poster and regional degradation checks retain their behavior.

localStorage remains non-atomic; true simultaneous writes are best-effort. Catalog-wide editorial, source, metadata and identity verification; durable snapshot storage; commercial/consent/legal integrations; real devices and live data remain pending. Ads, analytics and affiliate tracking remain disabled. No repository commit, deployment or external message was made.
