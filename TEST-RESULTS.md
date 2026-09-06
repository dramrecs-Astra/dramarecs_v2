# Six-fix repair: verification and limits

Date: 2026-09-06. Source: the user-supplied dramarecs_v2-main ZIP, which already contains every file of the prior 16-file update. This is not an independently inspected live GitHub revision. Delivery contains full changed/new files only, not a repository replacement.

## Automated results

- Baseline: 80 Node tests passed before changes.
- Final: **128 tests pass, 0 failures** (80 retained plus 48 new).
- Regression proof: running the 48 new cases against the original application/builder/validator yields 35 failures. Cases that already worked, or exercise the new helper on its own, account for the other 13. The final implementation passes all 48.
- Fixture release: validation, all tests, generation, streaming normalization, local-link and structural smoke checks, and inventory pass across **341 HTML files**, **834 streaming rows**, **219 dramas**, **101 lists**, **338 sitemap entries**.
- The generated 219-entry search index passes the stricter schema. Static short-collection filtering uses the same predicate as the browser; boundary tests evaluate the actual builder predicate.
- Full production-mode pipeline also passes with **simulated TMDB responses in an isolated copy**, including snapshot promotion after downstream checks. All 219 simulated entries have posters. These are test responses, not verified IDs, artwork or live coverage. No simulated response, metadata snapshot, cache or token is shipped.
- Production without a token or cached posters is intentionally blocked at 0% coverage. The 95% floor remains unchanged (at least 209 of 219 posters).
- Configured sample ad/analytics/affiliate values cannot activate monetization: simulated-production HTML passes the no-tracking smoke checks.
- The 26 existing reciprocal recommendation warnings remain non-blocking and unresolved. Citation syntax validation does not adjudicate these comparisons.

## Checks by repair

1. **DR-04, stale-tab writes:** unseen saves, removals, independent watched history/preferences, Undo position, shared import, cleared records and denied storage. Existing malformed storage/quota/session tests remain.
2. **DR-05/07, catalog validation and Retry:** malformed aliases/names/images/year/hue/destination flag, duplicate slugs, empty responses and titles; search/shelf recovery without lost saved IDs; focus and keyboard selection after Retry.
3. **DR-06, share fragments:** shared-to-shared, damaged-to-valid, empty, personal return, fragment change during loading, useful connected focus, cleared copy fields and delayed clipboard feedback.
4. **DR-09, input methods:** composing Enter/arrows/Escape, legacy 229, completed Korean query, completion after blur, and delayed network completion during composition. Real native IMEs are not simulated by this mock.
5. **DR-16, episode parity:** one shared predicate; rejects missing, fractional, malformed and out-of-range counts. Validator rejects fractional editorial episode counts before generation.
6. **DR-22, evidence syntax:** HTTPS authority/credentials/format, real calendar dates, bounded time-zone allowance, future timestamps, malformed claim arrays, identity fields and episode source/count agreement. Legacy prose is not falsely certified.

## Commands and environment

Runtime: Node v22.23.1. The sandbox has no internet access, no npm executable and no installed browser binary. Dependency-free commands were run directly:

```sh
node --test tests/*.test.mjs
node tools/release-build.mjs fixture
node tools/release-build.mjs production
```

The last command was tested both with no metadata (expected failure) and with an isolated test-only fetch preloader supplying synthetic TMDB responses (expected success). The preloader never made network calls and is not included in this deployment bundle. Existing repository tests include identity/fallback/season and release-orchestrator simulations.

On Vercel **keep `npm run build` and your existing TMDB token**. Do not switch production to fixture mode. No npm packages, runtime upgrade, environment changes or generated files are required by this update.

## Verified unchanged

Byte comparisons confirm unchanged lib/tmdb-identity.mjs, lib/data-quality.mjs, tools/release-build.mjs, tools/streaming-output.mjs, package.json, catalog/recommendation data, CSS and fonts. build.mjs has exactly two scoped edits: importing the existing shared core and calling its short-episode predicate. TMDB enrichment/search/season code is unchanged. Streaming renderer functions in core remain unchanged.

## Remaining checks and limitations

- Real Chrome/Safari/Firefox, mobile layouts, Back/Forward, native input methods, screen readers and clipboard behavior need your Preview checks.
- localStorage does not offer atomic compare-and-swap. The reproduced stale-tab overwrite is repaired by merging the latest stored state, but genuinely simultaneous writes cannot be guaranteed conflict-free. No cross-device synchronization was added.
- The stricter loader treats an empty catalog as an error, appropriate for this 219-title site; empty saved/shared shelves still work.
- Valid URL/date syntax is not proof of source reachability, contents, factual truth or human review. Zero identity mappings are newly certified. Existing director and Trauma Code guards remain intact.
- Actual TMDB coverage, provider correctness, durable snapshot storage, native performance/accessibility, editorial review, consent, legal and monetization work remain pending.
- No repository commit, external message or deployment was performed.
