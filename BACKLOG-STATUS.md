# Ten-repair batch: current backlog status

As of 2026-09-06. Ten approved repair targets, not ten newly completed backlog items. All 42 status rows are reconciled in the accompanying workbook.

Tests: 254 Node tests pass (184 retained + 70 new); 50 of the new cases fail on the supplied baseline. Fixture release passes: 219 dramas, 101 recommendation lists, 341 HTML files, 338 sitemap entries, 834 checked streaming rows. The 26 reciprocal recommendation warnings remain non-blocking editorial work.

Browser status: the user reported a failed Chromium job. This batch improves its storage setup, but no green rerun is claimed. Playwright and Chromium are not installed here; the sandbox has no internet access to install them. Node callback tests are not a real browser. No live TMDB or full production build with live data was executed.

Preserved: build.mjs, styles, fonts, catalog/page data, TMDB identity matching/season lookup, metadata quality module, 95% poster safeguard, package/Vercel/CI configuration. Ads/analytics/affiliates remain disabled. No GitHub or deployment changes. Historical audit findings are retained as history, not assertions about current code.

## DR-01: Shelf implementation retained; browser rerun pending

**Implementation:** Shelf geometry and CSS are unchanged. The browser smoke runner now checks 25 combinations of 360/390/768/1366/1440px and 0/1/2/6/30 titles using synthetic loaded poster images, including aspect ratio, width cap and mobile columns. Browser fixture now skips non-test origins without touching storage and exposes failures on the test origin.

**Evidence:** 254 Node tests pass, including origin-scoped browser seeding regressions. Fixture structure checks pass across 341 HTML files. This is not a rendering pass.

**This pass:** Implementation changed in this batch; see checked evidence.

**Remaining acceptance:** The user-reported Chromium run failed on localStorage access. Updated fixture setup is supplied, but a green Chromium rerun has not been observed. Physical devices, other browsers and screen readers remain pending.

## DR-02: Implemented; browser QA pending

**Implementation:** Independent saved/watched state; persistent hide-watched filter; watched search badges; clear filters retains history.

**Evidence:** State persistence unit tests and watched-search DOM test.

**This pass:** Carried forward from inspected source status. Existing Node tests and fixture checks rerun as part of 254-test release; no new item-specific browser/editorial certification.

**Remaining acceptance:** Run multi-page real-browser watched/undo/focus tests.

## DR-03: Focus repairs implemented; real-browser verification pending

**Implementation:** Shelf title links and non-item controls retain focus across cross-tab rerendering. Removed title links focus a neighbor or discovery. Existing remove/Undo/comparison focus behavior is preserved.

**Evidence:** Actual app DOM regressions cover retained/removed/final shelf links, shared-import control, removal/Undo and comparison controls.

**This pass:** Carried forward from inspected source status. Existing Node tests and fixture checks rerun as part of 254-test release; no new item-specific browser/editorial certification.

**Remaining acceptance:** Configured Chromium cross-tab checks still need execution. Real keyboard, touch and assistive checks across browsers remain pending.

## DR-04: Capacity and stale-tab repairs implemented; simultaneous-write limitation remains

**Implementation:** Saved/watched writes reject more than 500 distinct valid IDs before normalization and after stale-tab merging. Whole writes fail without truncation, a false Saved message or false Undo confirmation. Original stale-tab merge and session fallback remain.

**Evidence:** 500-item boundaries, removals then additions, duplicate IDs, atomic multi-field rejection, stale-tab merging, session fallback and capacity-blocked Undo regressions pass.

**This pass:** Carried forward from inspected source status. Existing Node tests and fixture checks rerun as part of 254-test release; no new item-specific browser/editorial certification.

**Remaining acceptance:** localStorage is not atomic; genuinely simultaneous writes remain best-effort. The 500-item cap is retained, not expanded. Real multi-tab/private-browsing checks and cross-device sync remain outside this delivery.

## DR-05: Retry focus and schema repairs implemented; browser verification pending

**Implementation:** Successful shelf retry focuses a connected action or discovery; another failure focuses the replacement Retry. Late completion does not steal focus after the reader moves elsewhere. Existing schema rejection preserves saved IDs.

**Evidence:** DOM tests cover successful/empty/repeated-failure retry and late completion, with original catalog/network/retry regressions retained.

**This pass:** Carried forward from inspected source status. Existing Node tests and fixture checks rerun as part of 254-test release; no new item-specific browser/editorial certification.

**Remaining acceptance:** Chromium CI retry checks are configured but unexecuted here. Real slow-network, caching and browser testing remain pending.

## DR-06: Shared-size and clipboard repairs implemented; browser QA pending

**Implementation:** Shared imports no longer truncate before state validation: an over-capacity import is all-or-nothing and reports Nothing changed. Shared controls retain focus on cross-tab updates; fragment navigation and clipboard safeguards are preserved. Shared links with more than 500 distinct valid titles now fail explicitly, rather than truncating. Clipboard getter/method exceptions, promise rejection and missing API retain manual copying. Attempt IDs suppress stale completion after navigation or overlapping copies.

**Evidence:** New regressions cover 500/501 unique-title boundaries, duplicates, invalid IDs, no partial import, clipboard getter/write/rejection/missing cases, hash round trips and overlapping requests. All 254 Node tests pass.

**This pass:** Implementation changed in this batch; see checked evidence.

**Remaining acceptance:** Native clipboard permissions, mobile/touch, real Back/Forward and cross-browser checks remain pending. 500-title cap is retained. No cross-device storage synchronization added.

## DR-07: Schema failure and retry recovery repaired; browser QA pending

**Implementation:** Malformed catalog data produces a retryable load error rather than a search crash. Retry prevents its removed button from being treated as an outside click and returns keyboard focus to the search input.

**Evidence:** Malformed response followed by valid retry, keyboard focus and delayed-index/error/explicit-title regressions pass.

**This pass:** Carried forward from inspected source status. Existing Node tests and fixture checks rerun as part of 254-test release; no new item-specific browser/editorial certification.

**Remaining acceptance:** Real browser/network checks remain pending; unrecognized queries are not replaced with unrelated titles.

## DR-08: Implemented

**Implementation:** Natural query normalization, aliases and typo matching; Recommendations/Review labels; homepage missing-list destinations corrected.

**Evidence:** Title/alias/typo/phrase unit tests and full local-link scan.

**This pass:** Carried forward from inspected source status. Existing Node tests and fixture checks rerun as part of 254-test release; no new item-specific browser/editorial certification.

**Remaining acceptance:** No actor-name search added; unrecognized titles stay unrecognized.

## DR-09: Filter focus and input-method repairs implemented; assistive verification pending

**Implementation:** Clearing filters moves focus away from a newly hidden Clear or empty-state button to a visible filter. Original composition/isComposing/keyCode 229 handling and search ARIA remain.

**Evidence:** DOM regressions for both clear controls pass, along with all prior composition, delayed-input and search-focus cases.

**This pass:** Carried forward from inspected source status. Existing Node tests and fixture checks rerun as part of 254-test release; no new item-specific browser/editorial certification.

**Remaining acceptance:** Configured Chromium clear-focus tests await execution. Native Korean/Chinese/Japanese IMEs, mobile keyboards, other browsers and screen readers remain pending.

## DR-10: Partial

**Implementation:** Wide rows retained; short fit and caveat extracted from existing prose; full comparison expandable; commitment separated.

**Evidence:** Generated markup smoke check; existing fonts/palette preserved.

**This pass:** Carried forward from inspected source status. Existing Node tests and fixture checks rerun as part of 254-test release; no new item-specific browser/editorial certification.

**Remaining acceptance:** Automated extraction is not an editorial rewrite. Manually refine summaries and test layouts.

## DR-11: Experimental pilot

**Implementation:** My Liberation Notes has three reason-specific subsets and explicit connection explanations; original order always available.

**Evidence:** Schema/source checks; optional browser pilot test supplied.

**This pass:** Carried forward from inspected source status. Existing Node tests and fixture checks rerun as part of 254-test release; no new item-specific browser/editorial certification.

**Remaining acceptance:** One seed only. Fan testing and human editorial approval required before extending.

## DR-12: Implemented

**Implementation:** Removed visible match percentages and probability-like method copy; retained legacy numbers only as internal source data.

**Evidence:** All 341 generated HTML files scanned for match percentages.

**This pass:** Carried forward from inspected source status. Existing Node tests and fixture checks rerun as part of 254-test release; no new item-specific browser/editorial certification.

**Remaining acceptance:** Editorial quality of each fit/caveat remains a separate review.

## DR-13: Implemented

**Implementation:** Own curated picks take precedence; fallback co-occurrences rank deterministically and disclose the relationship basis.

**Evidence:** Curated preference and file-order invariance unit tests.

**This pass:** Carried forward from inspected source status. Existing Node tests and fixture checks rerun as part of 254-test release; no new item-specific browser/editorial certification.

**Remaining acceptance:** Fallback explanation is overlap, not a personalized taste claim.

## DR-14: Partial

**Implementation:** Conditional section framing; zero to three anti-picks permitted by validation.

**Evidence:** Validator passes; title/slug data excluded from prose lint.

**This pass:** Carried forward from inspected source status. Existing Node tests and fixture checks rerun as part of 254-test release; no new item-specific browser/editorial certification.

**Remaining acceptance:** Existing individual negative comparisons need human rewriting; reciprocity warnings retained.

## DR-15: Reveal controls implemented; spoiler-safe prose audit still partial

**Implementation:** Removed unsupported spoiler-safety promises from homepage, browse, ending-collection metadata and terms templates. Ending collections explicitly disclose that membership reveals tone. Existing reveal controls remain unchanged.

**Evidence:** Template regression and generated HTML scans reject the identified blanket safety language; all prior ending-control checks remain.

**This pass:** Carried forward from inspected source status. Existing Node tests and fixture checks rerun as part of 254-test release; no new item-specific browser/editorial certification.

**Remaining acceptance:** Removing a promise is not removing every spoiler. Legacy verdicts, fit/caveat prose and all factual ending labels still need editorial review.

## DR-16: Collection/client parity repaired; metadata review pending

**Implementation:** The static short-drama collection now calls the same positive-whole-episode predicate as the client filter. Data validation rejects fractional catalog episode counts. The builder's TMDB enrichment and existing identity/season repair are unchanged.

**Evidence:** Actual builder predicate evaluated against client boundary cases; real validator rejects fractional episodes; fixture and simulated-production builds pass with unchanged source data.

**This pass:** Carried forward from inspected source status. Existing Node tests and fixture checks rerun as part of 254-test release; no new item-specific browser/editorial certification.

**Remaining acceptance:** Catalog-wide episode/runtime/season verification is still pending. This is not a total-viewing-time filter and adds no invented duration facts.

## DR-17: Implemented; browser QA pending

**Implementation:** Detail title and verdict now precede sidebar in source; mobile filter strip is non-sticky at narrow widths.

**Evidence:** Generated detail source-order smoke check.

**This pass:** Carried forward from inspected source status. Existing Node tests and fixture checks rerun as part of 254-test release; no new item-specific browser/editorial certification.

**Remaining acceptance:** Check 200% zoom, sticky controls and focused elements on devices.

## DR-18: Known correction implemented

**Implementation:** Removed incorrect shared-director claim; retained traceable source URLs and correction scope/date.

**Evidence:** Fresh public credits checked; regression guard for the known claim.

**This pass:** Carried forward from inspected source status. Existing Node tests and fixture checks rerun as part of 254-test release; no new item-specific browser/editorial certification.

**Remaining acceptance:** Other writer/director/cast claims remain in the review queue.

## DR-19: Season schema repaired; catalog metadata review remains partial

**Implementation:** Editorial episode/runtime values take precedence, season fallback cannot take whole-series counts; Trauma Code stays at eight with Netflix source. Explicit season identifiers must now be positive safe whole numbers; invalid types/zero/fractions are blocked before generation.

**Evidence:** Season schema rejection/acceptance regressions and existing TMDB identity, episode precedence and season lookup tests pass. Trauma Code 8-episode structure check passes.

**This pass:** Implementation changed in this batch; see checked evidence.

**Remaining acceptance:** Catalog-wide season/broadcast normalization and identity pins still pending.

## DR-20: Explicit-ID validation repaired; identity certification still pending

**Implementation:** No first-result fallback: auto candidates require exact title/alias, year and KR origin; ambiguity declines a match; identity review status explicit. Explicit tmdb_id values, including zero, null and false, must be positive safe integers; absence remains allowed without fabricated mappings.

**Evidence:** New real-validator regressions and existing identity resolution tests pass. Fresh inventory still reports zero verified catalog identity mappings.

**This pass:** Implementation changed in this batch; see checked evidence.

**Remaining acceptance:** ZERO catalog mappings certified as verified. Manually confirm IDs and provenance.

## DR-21: Public blanket-review copy corrected; editorial verification remains partial

**Implementation:** Homepage metadata and catalog headings/descriptions/structured data no longer claim universal hand review. Catalog copy states that review coverage varies. Prior Melo Movie wording repair remains.

**Evidence:** Source regression and all 341 generated HTML files checked for the identified blanket review/safety claims. No catalog or recommendation prose was rewritten in this pass.

**This pass:** Carried forward from inspected source status. Existing Node tests and fixture checks rerun as part of 254-test release; no new item-specific browser/editorial certification.

**Remaining acceptance:** Full 219-title factual/authorship certification, editor identity and remaining public process/byline claims require owner/editorial confirmation. This is not a claim that all public copy is now verified.

## DR-22: Page schema, review dates and title-aware lint repaired; facts unverified

**Implementation:** Structured claims, verified identities and episode citations require well-formed HTTPS sources and valid calendar dates. Credential-bearing/malformed URLs, impossible dates, future timestamps, malformed claim arrays and mismatched episode evidence fail with item-level diagnostics. Recommendation arrays and entries, prose types and catalog prose are checked before use. Reviewed dates require a real, non-future calendar date. Full catalog-title spans are exempt from banned-word lint; unrelated filler still fails.

**Evidence:** New real-validator tests cover malformed arrays/entries, dates, prose, full-title boundaries and filler outside title spans. Current catalog/page validation passes with 26 non-blocking reciprocal recommendation warnings.

**This pass:** Implementation changed in this batch; see checked evidence.

**Remaining acceptance:** Validation proves syntax/shape, not source truth, link reachability or actual human review. Legacy prose attribution, negative comparisons, ending spoilers and full identity review remain pending.

## DR-23: Implemented; live upstream QA pending

**Implementation:** Initial HTML and region changes share the same streaming renderer and region-specific freshness wording. Empty results remain unconfirmed, dates age after 24 hours, and fallback data is marked potentially outdated.

**Evidence:** Renderer parity, empty-region, invalid/future date, stale-cache and actual region-change DOM tests; synthetic production output.

**This pass:** Carried forward from inspected source status. Existing Node tests and fixture checks rerun as part of 254-test release; no new item-specific browser/editorial certification.

**Remaining acceptance:** Real API failure/staleness and browser integration checks still required. Retrieval dates are not independent provider verification.

## DR-24: Implemented

**Implementation:** Netflix collection explicitly fixed to US metadata; no in-your-region/today promise; unknown coverage has an honest empty state.

**Evidence:** Generated fixed-US page smoke check; source region filter verified.

**This pass:** Carried forward from inspected source status. Existing Node tests and fixture checks rerun as part of 254-test release; no new item-specific browser/editorial certification.

**Remaining acceptance:** No live region-dependent collection membership; that is deliberately not promised.

## DR-25: Plan presentation implemented; live/browser QA pending

**Implementation:** All available subscription, free, ad-supported, rent and buy records now receive distinct labels. Channel/reseller names remain intact. Rent/buy options use an availability source instead of a subscription search destination; filtering still uses the subscription/free/ad-supported data.

**Evidence:** Model/identity/link tests, static/client parity, rental exclusion from Netflix filtering, and simulated token-backed production output.

**This pass:** Carried forward from inspected source status. Existing Node tests and fixture checks rerun as part of 254-test release; no new item-specific browser/editorial certification.

**Remaining acceptance:** Verify live regional provider results and compact layouts. No price or direct-title-link certification, affiliate approval or purchase availability guarantee is implied.

## DR-26: Implemented for current plain links

**Implementation:** Shared resolver retained; destination copy says Search or Check availability; tracking disabled.

**Evidence:** Generated/client source consistency review and tracking-tag scans.

**This pass:** Carried forward from inspected source status. Existing Node tests and fixture checks rerun as part of 254-test release; no new item-specific browser/editorial certification.

**Remaining acceptance:** Verified direct title URLs and approved affiliate locale tests remain external.

## DR-27: Snapshot validation strengthened; durable storage and live verification pending

**Implementation:** Hydrated overview/network, genre/provider arrays, rating bounds, availability status, retrieval dates, season dates and HTTPS link syntax are checked. Impossible dates fail; scheduled future season dates remain valid. Poster floor and retained-title/regional-loss guards are unchanged.

**Evidence:** Malformed fields/date/URL cases, legacy omissions, leap dates, rating bounds and five-minute clock skew pass. Release tests prove invalid candidates restore exact last-good bytes and invalid baselines stop before generation. Full isolated simulated-TMDB production build passes.

**This pass:** Carried forward from inspected source status. Existing Node tests and fixture checks rerun as part of 254-test release; no new item-specific browser/editorial certification.

**Remaining acceptance:** Live metadata accuracy/coverage and durable snapshot storage remain pending. Stricter validation intentionally blocks malformed snapshots; correct the identified row rather than deleting the baseline or lowering the 95% floor.

## DR-28: Partial

**Implementation:** TMDB notice/link retained and visible JustWatch attribution/source check added.

**Evidence:** Generated footer/provider template review.

**This pass:** Carried forward from inspected source status. Existing Node tests and fixture checks rerun as part of 254-test release; no new item-specific browser/editorial certification.

**Remaining acceptance:** Approved TMDB logo asset and commercial-contract-specific requirements still need confirmation. Licensing itself was treated as resolved.

## DR-29: Safeguarded; integration pending

**Implementation:** Ads, CMP, GA and tracking are intentionally disabled in this repair release even if old environment variables are present.

**Evidence:** Build with sample ad/GA/affiliate variables produced no tracking tags.

**This pass:** Carried forward from inspected source status. Existing Node tests and fixture checks rerun as part of 254-test release; no new item-specific browser/editorial certification.

**Remaining acceptance:** This is NOT a functioning certified CMP implementation. Consent acceptance/denial/withdrawal/failure testing is still required before monetization.

## DR-30: Partial

**Implementation:** Policy describes local state, share disclosure, IP/hosting/contact processing, disabled analytics and uncertain retention honestly.

**Evidence:** Generated policy and source behavior reviewed.

**This pass:** Carried forward from inspected source status. Existing Node tests and fixture checks rerun as part of 254-test release; no new item-specific browser/editorial certification.

**Remaining acceptance:** Owner/legal review and actual hosting/contact retention settings remain pending.

## DR-31: Safeguarded

**Implementation:** All routes are currently ad-ineligible because monetization is disabled globally, including utility pages and staging.

**Evidence:** 341 generated HTML files scanned for ad/analytics scripts, including configured-variable fixture build.

**This pass:** Carried forward from inspected source status. Existing Node tests and fixture checks rerun as part of 254-test release; no new item-specific browser/editorial certification.

**Remaining acceptance:** Per-page eligibility must be implemented and tested before re-enabling ads; noindex is not being used as an ad gate.

## DR-32: Deferred; ads disabled

**Implementation:** No live ad slots are emitted in this release.

**Evidence:** No-ad smoke check.

**This pass:** Carried forward from inspected source status. Existing Node tests and fixture checks rerun as part of 254-test release; no new item-specific browser/editorial certification.

**Remaining acceptance:** Actual reserved sizes, uniform labels, no-fill and consent layout tests remain unimplemented.

## DR-33: Safeguarded; placement work pending

**Implementation:** Client filter changes cannot request or refresh ads; no active ad units are shipped.

**Evidence:** No-ad smoke check and client source review.

**This pass:** Carried forward from inspected source status. Existing Node tests and fixture checks rerun as part of 254-test release; no new item-specific browser/editorial certification.

**Remaining acceptance:** Visible-content-aware placement must be implemented before monetization; disabling ads is not completion of that feature.

## DR-34: External; safely disabled

**Implementation:** Affiliate environment variables cannot activate tracking in this release.

**Evidence:** Sample-variable build confirms no affiliate wrappers.

**This pass:** Carried forward from inspected source status. Existing Node tests and fixture checks rerun as part of 254-test release; no new item-specific browser/editorial certification.

**Remaining acceptance:** Program acceptance, allowed destinations and country-specific tracking must be verified externally.

## DR-35: Deferred; planning corrected

**Implementation:** Unsupported current analytics/bot conclusions moved out of current status and labeled unverified history; telemetry remains off.

**Evidence:** Generated inventory and current planning reviewed.

**This pass:** Carried forward from inspected source status. Existing Node tests and fixture checks rerun as part of 254-test release; no new item-specific browser/editorial certification.

**Remaining acceptance:** No analytics exports available and no consent-aware funnel shipped. Instrument only after consent integration.

## DR-36: Partial

**Implementation:** Netflix inventory no longer claims best-to-worst curation or current local availability.

**Evidence:** Generated copy inspected.

**This pass:** Carried forward from inspected source status. Existing Node tests and fixture checks rerun as part of 254-test release; no new item-specific browser/editorial certification.

**Remaining acceptance:** Genuinely selected need-based shortlists for collections remain editorial work.

## DR-37: Build tests pass; browser fixture repaired, Chromium rerun pending

**Implementation:** Browser init seeding now runs only on the exact local test-server origin, preserves existing state and checks storage readback. Denial or silently discarded writes on the real origin can no longer be swallowed. Existing CI workflow and exception assertions remain enabled.

**Evidence:** 254 Node tests pass: 184 retained and 70 added. The new suite produces 50 failures on the input source and zero on the repaired source. Fixture release and 341-HTML/834-streaming-row checks pass. Browser driver syntax and serialized callback tests pass, not a Chromium execution.

**This pass:** Implementation changed in this batch; see checked evidence.

**Remaining acceptance:** User-reported browser run failed. No successful rerun is available. Playwright/Chromium are unavailable in this sandbox, which has no internet access to install them. Live TMDB, real devices, assistive tools, field performance and owner-managed deployment gating remain pending.

## DR-38: Implemented

**Implementation:** Displayed shared-pick count is set intersection; ranking cross-links kept separately; lower link totals no longer treated as automatic breakage in current notes.

**Evidence:** Intersection/ranking unit test.

**This pass:** Carried forward from inspected source status. Existing Node tests and fixture checks rerun as part of 254-test release; no new item-specific browser/editorial certification.

**Remaining acceptance:** Editorial suitability still outranks graph metrics.

## DR-39: Partial

**Implementation:** Responsive TMDB srcset/sizes, lazy shelf images, intrinsic image dimensions; self-hosted fonts retained.

**Evidence:** Source/generated markup review; optional browser matrix supplied.

**This pass:** Carried forward from inspected source status. Existing Node tests and fixture checks rerun as part of 254-test release; no new item-specific browser/editorial certification.

**Remaining acceptance:** No real-browser screenshots or measured LCP/INP/CLS; above-fold image priority still needs profiling.

## DR-40: Deferred

**Implementation:** Existing email/contact fallback retained; no fake form success or unconfigured server endpoint shipped.

**Evidence:** No external messages sent.

**This pass:** Carried forward from inspected source status. Existing Node tests and fixture checks rerun as part of 254-test release; no new item-specific browser/editorial certification.

**Remaining acceptance:** A server-side submission destination, anti-spam/rate limits and success/failure tests must be configured.

## DR-41: All 42 workbook statuses reconciled; historical research notes remain historical

**Implementation:** Fingerprint v2 includes .github source configuration, vercel.json and supported root runtime/ignore files. Exclusions are exact generated snapshot paths rather than broad filename patterns. Current inventory, status and test reports are refreshed. Supplied workbook now maps every DR-01 through DR-42 row to current implementation, this-pass evidence and remaining acceptance. Fresh counts replace outdated Read first inventory; historical findings are explicitly labeled.

**Evidence:** Workbook IDs compared one-to-one with all 42 source status records. 42 Status cells updated; no duplicate or missing IDs. Original seven worksheets preserved; Current evidence and Batch 10 sheets added. New source fingerprint and package manifest generated.

**This pass:** Implementation changed in this batch; see checked evidence.

**Remaining acceptance:** Workbook update does not certify historical research, all editorial claims, deployment state, remote settings or external approvals. Older narrative notes remain historical; this report and refreshed statuses govern this delivery.

## DR-42: Comparison repaired; actor/couple discovery deferred

**Implementation:** Comparison save/watched actions preserve focus through rerendering. Direct removal controls focus a neighboring comparison or a visible original/filter control. The unsupported no-ending-spoilers promise is replaced with an explicit caveat about legacy plot prose.

**Evidence:** Actual app DOM tests for save, watched, Undo, multiple/final comparison removal and hidden original rows.

**This pass:** Carried forward from inspected source status. Existing Node tests and fixture checks rerun as part of 254-test release; no new item-specific browser/editorial certification.

**Remaining acceptance:** Real-browser/assistive checks and a full spoiler-safe prose audit remain pending. Actor/couple data and pages are still deliberately not fabricated.
