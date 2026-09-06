# Current verification: seven-item follow-up repair

Date: 2026-09-06. Runtime: Node 22.23.1.

This report supersedes the 29-test figures in the historical first-pass release notes. The supplied, already-repaired archive passed 39 tests before this pass. The user reports that its Vercel deployment is now clean; that live deployment was not independently inspected here.

## Executed

- **80 mandatory Node tests passed**, zero failures or skipped tests. This includes the prior search/TMDB checks, focus-aware DOM-mock client tests, streaming/model/freshness tests, snapshot validation, regional degradation checks, provenance reporting and release-orchestrator integration tests.
- Full `node tools/release-build.mjs fixture`: passed for 219 dramas and 101 recommendation lists. Content validation retained 26 existing reciprocity warnings, not new confirmed editorial errors.
- Generated output: 341 HTML files, 338 sitemap entries, 834 streaming rows. Internal destination checks and static structure checks passed. No duplicate IDs or nested interactive controls were found in the generated HTML.
- Full production pipeline with **simulated TMDB responses**: passed, including all five provider models across synthetic regional data. A 219-entry synthetic snapshot was saved only after downstream checks. None of those fake IDs, images, snapshots or caches is included in the delivery.
- Production without a token or snapshot: failed intentionally at the unchanged 95% minimum poster coverage requirement. Fixture mode remained prohibited under `VERCEL_ENV=production`.
- Sample old advertising, GA and affiliate environment variables were present during the simulated production run. Generated tracking/ad tag scans still passed: monetization remains disabled.
- Release failure scenarios: failing smoke checks, changed streaming templates and production quality failures restored the prior snapshot's exact bytes. Failed first builds left no snapshot. Invalid snapshots stopped the release before the builder. Fixture builds and unhealthy previews did not replace last-good snapshots.
- `build.mjs`, `lib/tmdb-identity.mjs`, `data/dramas.json`, all recommendation JSON, `src/styles.css` and font assets are unchanged from the supplied archive. The working title-fallback/season-lookup repair is retained.

## What these tests do NOT establish

There is no installed browser binary here, and the sandbox has no internet access. DOM mocks test application behavior but do not certify visual layout, Safari/Firefox, real keyboard or screen-reader behavior. No live TMDB poster coverage, production network behavior, Core Web Vitals, consent flow, editorial facts or spoiler-safe prose was certified. No GitHub commit or Vercel deployment was made.

Snapshot persistence is local to the build filesystem. A durable CI artifact or reviewed repository snapshot still needs owner configuration. Direct `node build.mjs` is a low-level generator, not the checked release command; deploy with the existing `npm run build`.

## Repair scope

DR-03: shelf focus and ordered Undo. DR-16: reject unknown/non-positive/fractional episode counts in the short filter. DR-23: regional uncertainty and dated freshness on both initial HTML and region changes. DR-25: distinct subscription, free, ad-supported, rental and purchase labels, retaining channel identity. DR-27: valid poster URLs, regional coverage and checked snapshot lifecycle. DR-41: actual revision evidence plus source fingerprint and refreshed status. DR-42: comparison action/removal focus and honest spoiler caveat.

See `BACKLOG-STATUS.md` for the full 42-item status, including unfinished external/editorial work.
