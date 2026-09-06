# Current DR-01 through DR-42 implementation status

Approved six-target follow-up, 2026-09-06: capacity, keyboard focus, snapshot schema, unsupported public promises, source fingerprint coverage and browser CI. These are six repair targets spanning several backlog IDs, not six newly completed backlog items.

Both supplied ZIPs agree: the full repository already includes the prior 14-file patch. Its baseline passes 128 Node tests and the fixture release. This follow-up passes 184 Node tests (128 retained plus 56 added), fixture checks across 341 generated HTML files and a full isolated production build with simulated TMDB responses. There are 219 dramas, 101 recommendation lists, 338 sitemap entries and 834 checked streaming rows. The 26 reciprocal recommendation warnings remain non-blocking editorial work.

The 56 added tests produce 52 failures against the original implementation; four guard/boundary cases already passed. All pass with the supplied replacements. Chromium CI is configured, not certified: local launch could not start because the sandbox has no browser binary and no internet access to download one. The runner defines 31 browser checks; none completed here.

Only the approved six targets received functional changes. Other statuses are carried forward, not newly certified. CSS, fonts, catalog/recommendation data, TMDB identity/search/season logic, package.json, Vercel settings, the 95% poster requirement and release-snapshot promotion/rollback mechanism are preserved. Ads, analytics and affiliate tracking remain disabled. No GitHub or deployment change was made.

TEST-RESULTS.md and UPLOAD-SIX-FIXES.md are current. Historical workbook, audit and release notes are not rewritten. Removing an unsupported promise is not factual/editorial certification. Partial and pending items are not closed.

## DR-01: Implemented; Chromium CI configured, execution pending

**Changed:** Shelf geometry and CSS are unchanged. The browser smoke runner now checks 25 combinations of 360/390/768/1366/1440px and 0/1/2/6/30 titles using synthetic loaded poster images, including aspect ratio, width cap and mobile columns.

**Checked:** Existing automated tests and the full fixture build pass. Browser runner syntax and workflow source checks pass; no Chromium execution completed in this sandbox.

**Remaining:** Wait for the first GitHub Actions browser result after upload. Safari/Firefox, physical devices and screen-reader checks remain pending.

## DR-02: Implemented; browser QA pending

**Changed:** Independent saved/watched state; persistent hide-watched filter; watched search badges; clear filters retains history.

**Checked:** State persistence unit tests and watched-search DOM test.

**Remaining:** Run multi-page real-browser watched/undo/focus tests.

## DR-03: Focus repairs implemented; real-browser verification pending

**Changed:** Shelf title links and non-item controls retain focus across cross-tab rerendering. Removed title links focus a neighbor or discovery. Existing remove/Undo/comparison focus behavior is preserved.

**Checked:** Actual app DOM regressions cover retained/removed/final shelf links, shared-import control, removal/Undo and comparison controls.

**Remaining:** Configured Chromium cross-tab checks still need execution. Real keyboard, touch and assistive checks across browsers remain pending.

## DR-04: Capacity and stale-tab repairs implemented; simultaneous-write limitation remains

**Changed:** Saved/watched writes reject more than 500 distinct valid IDs before normalization and after stale-tab merging. Whole writes fail without truncation, a false Saved message or false Undo confirmation. Original stale-tab merge and session fallback remain.

**Checked:** 500-item boundaries, removals then additions, duplicate IDs, atomic multi-field rejection, stale-tab merging, session fallback and capacity-blocked Undo regressions pass.

**Remaining:** localStorage is not atomic; genuinely simultaneous writes remain best-effort. The 500-item cap is retained, not expanded. Real multi-tab/private-browsing checks and cross-device sync remain outside this delivery.

## DR-05: Retry focus and schema repairs implemented; browser verification pending

**Changed:** Successful shelf retry focuses a connected action or discovery; another failure focuses the replacement Retry. Late completion does not steal focus after the reader moves elsewhere. Existing schema rejection preserves saved IDs.

**Checked:** DOM tests cover successful/empty/repeated-failure retry and late completion, with original catalog/network/retry regressions retained.

**Remaining:** Chromium CI retry checks are configured but unexecuted here. Real slow-network, caching and browser testing remain pending.

## DR-06: Shared import capacity and fragment repairs implemented; browser verification pending

**Changed:** Shared imports no longer truncate before state validation: an over-capacity import is all-or-nothing and reports Nothing changed. Shared controls retain focus on cross-tab updates; fragment navigation and clipboard safeguards are preserved.

**Checked:** Full and nearly-full shared imports, retained focus, shared-to-personal/fragment transitions and prior clipboard regressions pass in DOM tests.

**Remaining:** Real Back/Forward and import checks are configured in Chromium CI but not run here. Native clipboard/touch/assistive checks remain pending.

## DR-07: Schema failure and retry recovery repaired; browser QA pending

**Changed:** Malformed catalog data produces a retryable load error rather than a search crash. Retry prevents its removed button from being treated as an outside click and returns keyboard focus to the search input.

**Checked:** Malformed response followed by valid retry, keyboard focus and delayed-index/error/explicit-title regressions pass.

**Remaining:** Real browser/network checks remain pending; unrecognized queries are not replaced with unrelated titles.

## DR-08: Implemented

**Changed:** Natural query normalization, aliases and typo matching; Recommendations/Review labels; homepage missing-list destinations corrected.

**Checked:** Title/alias/typo/phrase unit tests and full local-link scan.

**Remaining:** No actor-name search added; unrecognized titles stay unrecognized.

## DR-09: Filter focus and input-method repairs implemented; assistive verification pending

**Changed:** Clearing filters moves focus away from a newly hidden Clear or empty-state button to a visible filter. Original composition/isComposing/keyCode 229 handling and search ARIA remain.

**Checked:** DOM regressions for both clear controls pass, along with all prior composition, delayed-input and search-focus cases.

**Remaining:** Configured Chromium clear-focus tests await execution. Native Korean/Chinese/Japanese IMEs, mobile keyboards, other browsers and screen readers remain pending.

## DR-10: Partial

**Changed:** Wide rows retained; short fit and caveat extracted from existing prose; full comparison expandable; commitment separated.

**Checked:** Generated markup smoke check; existing fonts/palette preserved.

**Remaining:** Automated extraction is not an editorial rewrite. Manually refine summaries and test layouts.

## DR-11: Experimental pilot

**Changed:** My Liberation Notes has three reason-specific subsets and explicit connection explanations; original order always available.

**Checked:** Schema/source checks; optional browser pilot test supplied.

**Remaining:** One seed only. Fan testing and human editorial approval required before extending.

## DR-12: Implemented

**Changed:** Removed visible match percentages and probability-like method copy; retained legacy numbers only as internal source data.

**Checked:** All 341 generated HTML files scanned for match percentages.

**Remaining:** Editorial quality of each fit/caveat remains a separate review.

## DR-13: Implemented

**Changed:** Own curated picks take precedence; fallback co-occurrences rank deterministically and disclose the relationship basis.

**Checked:** Curated preference and file-order invariance unit tests.

**Remaining:** Fallback explanation is overlap, not a personalized taste claim.

## DR-14: Partial

**Changed:** Conditional section framing; zero to three anti-picks permitted by validation.

**Checked:** Validator passes; title/slug data excluded from prose lint.

**Remaining:** Existing individual negative comparisons need human rewriting; reciprocity warnings retained.

## DR-15: Reveal controls implemented; spoiler-safe prose audit still partial

**Changed:** Removed unsupported spoiler-safety promises from homepage, browse, ending-collection metadata and terms templates. Ending collections explicitly disclose that membership reveals tone. Existing reveal controls remain unchanged.

**Checked:** Template regression and generated HTML scans reject the identified blanket safety language; all prior ending-control checks remain.

**Remaining:** Removing a promise is not removing every spoiler. Legacy verdicts, fit/caveat prose and all factual ending labels still need editorial review.

## DR-16: Collection/client parity repaired; metadata review pending

**Changed:** The static short-drama collection now calls the same positive-whole-episode predicate as the client filter. Data validation rejects fractional catalog episode counts. The builder's TMDB enrichment and existing identity/season repair are unchanged.

**Checked:** Actual builder predicate evaluated against client boundary cases; real validator rejects fractional episodes; fixture and simulated-production builds pass with unchanged source data.

**Remaining:** Catalog-wide episode/runtime/season verification is still pending. This is not a total-viewing-time filter and adds no invented duration facts.

## DR-17: Implemented; browser QA pending

**Changed:** Detail title and verdict now precede sidebar in source; mobile filter strip is non-sticky at narrow widths.

**Checked:** Generated detail source-order smoke check.

**Remaining:** Check 200% zoom, sticky controls and focused elements on devices.

## DR-18: Known correction implemented

**Changed:** Removed incorrect shared-director claim; retained traceable source URLs and correction scope/date.

**Checked:** Fresh public credits checked; regression guard for the known claim.

**Remaining:** Other writer/director/cast claims remain in the review queue.

## DR-19: Partial

**Changed:** Editorial episode/runtime values take precedence, season fallback cannot take whole-series counts; Trauma Code stays at eight with Netflix source.

**Checked:** Metadata precedence/season tests and generated Trauma Code smoke check.

**Remaining:** Catalog-wide season/broadcast normalization and identity pins still pending.

## DR-20: Partial

**Changed:** No first-result fallback: auto candidates require exact title/alias, year and KR origin; ambiguity declines a match; identity review status explicit.

**Checked:** Exact/ambiguous identity unit tests.

**Remaining:** ZERO catalog mappings certified as verified. Manually confirm IDs and provenance.

## DR-21: Public blanket-review copy corrected; editorial verification remains partial

**Changed:** Homepage metadata and catalog headings/descriptions/structured data no longer claim universal hand review. Catalog copy states that review coverage varies. Prior Melo Movie wording repair remains.

**Checked:** Source regression and all 341 generated HTML files checked for the identified blanket review/safety claims. No catalog or recommendation prose was rewritten in this pass.

**Remaining:** Full 219-title factual/authorship certification, editor identity and remaining public process/byline claims require owner/editorial confirmation. This is not a claim that all public copy is now verified.

## DR-22: Evidence syntax strengthened; factual verification remains partial

**Changed:** Structured claims, verified identities and episode citations require well-formed HTTPS sources and valid calendar dates. Credential-bearing/malformed URLs, impossible dates, future timestamps, malformed claim arrays and mismatched episode evidence fail with item-level diagnostics.

**Checked:** URL/date boundary tests, time-zone handling, malformed shapes, valid/legacy examples and actual validator subprocess tests pass.

**Remaining:** Syntax does not prove link reachability, source contents, factual truth or human review. Legacy prose and the full identity/editorial review queue remain unverified. Date-only records allow up to UTC+14; timestamps require a zone.

## DR-23: Implemented; live upstream QA pending

**Changed:** Initial HTML and region changes share the same streaming renderer and region-specific freshness wording. Empty results remain unconfirmed, dates age after 24 hours, and fallback data is marked potentially outdated.

**Checked:** Renderer parity, empty-region, invalid/future date, stale-cache and actual region-change DOM tests; synthetic production output.

**Remaining:** Real API failure/staleness and browser integration checks still required. Retrieval dates are not independent provider verification.

## DR-24: Implemented

**Changed:** Netflix collection explicitly fixed to US metadata; no in-your-region/today promise; unknown coverage has an honest empty state.

**Checked:** Generated fixed-US page smoke check; source region filter verified.

**Remaining:** No live region-dependent collection membership; that is deliberately not promised.

## DR-25: Plan presentation implemented; live/browser QA pending

**Changed:** All available subscription, free, ad-supported, rent and buy records now receive distinct labels. Channel/reseller names remain intact. Rent/buy options use an availability source instead of a subscription search destination; filtering still uses the subscription/free/ad-supported data.

**Checked:** Model/identity/link tests, static/client parity, rental exclusion from Netflix filtering, and simulated token-backed production output.

**Remaining:** Verify live regional provider results and compact layouts. No price or direct-title-link certification, affiliate approval or purchase availability guarantee is implied.

## DR-26: Implemented for current plain links

**Changed:** Shared resolver retained; destination copy says Search or Check availability; tracking disabled.

**Checked:** Generated/client source consistency review and tracking-tag scans.

**Remaining:** Verified direct title URLs and approved affiliate locale tests remain external.

## DR-27: Snapshot validation strengthened; durable storage and live verification pending

**Changed:** Hydrated overview/network, genre/provider arrays, rating bounds, availability status, retrieval dates, season dates and HTTPS link syntax are checked. Impossible dates fail; scheduled future season dates remain valid. Poster floor and retained-title/regional-loss guards are unchanged.

**Checked:** Malformed fields/date/URL cases, legacy omissions, leap dates, rating bounds and five-minute clock skew pass. Release tests prove invalid candidates restore exact last-good bytes and invalid baselines stop before generation. Full isolated simulated-TMDB production build passes.

**Remaining:** Live metadata accuracy/coverage and durable snapshot storage remain pending. Stricter validation intentionally blocks malformed snapshots; correct the identified row rather than deleting the baseline or lowering the 95% floor.

## DR-28: Partial

**Changed:** TMDB notice/link retained and visible JustWatch attribution/source check added.

**Checked:** Generated footer/provider template review.

**Remaining:** Approved TMDB logo asset and commercial-contract-specific requirements still need confirmation. Licensing itself was treated as resolved.

## DR-29: Safeguarded; integration pending

**Changed:** Ads, CMP, GA and tracking are intentionally disabled in this repair release even if old environment variables are present.

**Checked:** Build with sample ad/GA/affiliate variables produced no tracking tags.

**Remaining:** This is NOT a functioning certified CMP implementation. Consent acceptance/denial/withdrawal/failure testing is still required before monetization.

## DR-30: Partial

**Changed:** Policy describes local state, share disclosure, IP/hosting/contact processing, disabled analytics and uncertain retention honestly.

**Checked:** Generated policy and source behavior reviewed.

**Remaining:** Owner/legal review and actual hosting/contact retention settings remain pending.

## DR-31: Safeguarded

**Changed:** All routes are currently ad-ineligible because monetization is disabled globally, including utility pages and staging.

**Checked:** 341 generated HTML files scanned for ad/analytics scripts, including configured-variable fixture build.

**Remaining:** Per-page eligibility must be implemented and tested before re-enabling ads; noindex is not being used as an ad gate.

## DR-32: Deferred; ads disabled

**Changed:** No live ad slots are emitted in this release.

**Checked:** No-ad smoke check.

**Remaining:** Actual reserved sizes, uniform labels, no-fill and consent layout tests remain unimplemented.

## DR-33: Safeguarded; placement work pending

**Changed:** Client filter changes cannot request or refresh ads; no active ad units are shipped.

**Checked:** No-ad smoke check and client source review.

**Remaining:** Visible-content-aware placement must be implemented before monetization; disabling ads is not completion of that feature.

## DR-34: External; safely disabled

**Changed:** Affiliate environment variables cannot activate tracking in this release.

**Checked:** Sample-variable build confirms no affiliate wrappers.

**Remaining:** Program acceptance, allowed destinations and country-specific tracking must be verified externally.

## DR-35: Deferred; planning corrected

**Changed:** Unsupported current analytics/bot conclusions moved out of current status and labeled unverified history; telemetry remains off.

**Checked:** Generated inventory and current planning reviewed.

**Remaining:** No analytics exports available and no consent-aware funnel shipped. Instrument only after consent integration.

## DR-36: Partial

**Changed:** Netflix inventory no longer claims best-to-worst curation or current local availability.

**Checked:** Generated copy inspected.

**Remaining:** Genuinely selected need-based shortlists for collections remain editorial work.

## DR-37: Build tests implemented; Chromium CI configured, first run pending

**Changed:** GitHub validation now installs pinned Playwright 1.58.2 as CI-only tooling, installs Chromium, runs browser smoke checks and uploads failure diagnostics. Read-only workflow permissions and a 20-minute job timeout are set. Vercel build command and package.json are unchanged.

**Checked:** 184 Node tests, fixture release, 341-file link/structure/claim scans and isolated simulated-TMDB production release pass. Browser driver parses; launch is blocked by missing browser binaries in the sandbox.

**Remaining:** A green browser result is not yet available. GitHub Actions and Vercel are independent: branch protections/required checks and deployment gating are owner settings, not configured here. Native/other-browser/assistive/live/rollback testing remains pending.

## DR-38: Implemented

**Changed:** Displayed shared-pick count is set intersection; ranking cross-links kept separately; lower link totals no longer treated as automatic breakage in current notes.

**Checked:** Intersection/ranking unit test.

**Remaining:** Editorial suitability still outranks graph metrics.

## DR-39: Partial

**Changed:** Responsive TMDB srcset/sizes, lazy shelf images, intrinsic image dimensions; self-hosted fonts retained.

**Checked:** Source/generated markup review; optional browser matrix supplied.

**Remaining:** No real-browser screenshots or measured LCP/INP/CLS; above-fold image priority still needs profiling.

## DR-40: Deferred

**Changed:** Existing email/contact fallback retained; no fake form success or unconfigured server endpoint shipped.

**Checked:** No external messages sent.

**Remaining:** A server-side submission destination, anti-spam/rate limits and success/failure tests must be configured.

## DR-41: Fingerprint coverage repaired; historical reconciliation pending

**Changed:** Fingerprint v2 includes .github source configuration, vercel.json and supported root runtime/ignore files. Exclusions are exact generated snapshot paths rather than broad filename patterns. Current inventory, status and test reports are refreshed.

**Checked:** Content-change regressions cover CI/deployment/runtime files and similarly named source files; actual revision evidence remains null for the supplied ZIP. Current fixture counts are 219 dramas, 101 lists, 341 HTML files and 338 sitemap entries.

**Remaining:** A source fingerprint does not attest to remote secrets, branch protection, production settings or deployments. Historical workbook/research/release notes still require owner reconciliation; TEST-RESULTS.md is current.

## DR-42: Comparison repaired; actor/couple discovery deferred

**Changed:** Comparison save/watched actions preserve focus through rerendering. Direct removal controls focus a neighboring comparison or a visible original/filter control. The unsupported no-ending-spoilers promise is replaced with an explicit caveat about legacy plot prose.

**Checked:** Actual app DOM tests for save, watched, Undo, multiple/final comparison removal and hidden original rows.

**Remaining:** Real-browser/assistive checks and a full spoiler-safe prose audit remain pending. Actor/couple data and pages are still deliberately not fabricated.
