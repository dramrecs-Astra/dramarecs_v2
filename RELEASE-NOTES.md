# DramaRecs v2 repair release

## Read this before deploying

This is a replacement repository ZIP, not a deployed website. It preserves the current design, fonts, route structure and static delivery. Nothing was pushed to GitHub or Vercel.

**Ads, Google Analytics, CMP tags and affiliate tracking are deliberately disabled, even if their old environment variables are set.** This is a fail-closed interim safeguard, not a finished consent implementation. Do not turn them back on without the consent and placement work in the backlog.

**The supplied archive contains 219 titles and 101 recommendation lists.** Its included planning incorrectly claimed 152 lists. No recommendation JSON was deleted by this pass. Two homepage/footer destinations pointed at missing Reply 1988/The Glory recommendation pages; they now lead to the existing review pages with clearer labels.

## What changed

- Bounded shelf posters, direct remove/watched controls, Undo, safe migration from sd.shelf and visible session-only fallback.
- Persistent hide-watched filter, independent saved/watched states and watched badges in explicit title search.
- Asynchronous search loading/retry, natural queries, aliases/typos and synchronized keyboard/ARIA state.
- Wide readable recommendation rows, compact fit/caveat, expandable original comparisons, approximate commitment and optional three-title comparison.
- One experimental reason-aware pilot on My Liberation Notes. It uses the existing relationship prose, not a new generated recommendation engine.
- Ending buttons start hidden and can collapse again; tone labels are opt-in. **Legacy review prose is not yet certified spoiler-safe.**
- Known director error corrected; Melo Movie batch/rating claim removed; Trauma Code editorial eight-episode count protected.
- Exact/ambiguous metadata matching guards, editorial value precedence, dated availability, no-data uncertainty, cache TTL/retry and last-good snapshot support.
- Fixed-US Netflix labeling, honest provider-search labels, preserved channel names and JustWatch attribution.
- Stable secondary recommendations and correct set-intersection overlap counts.
- Validation/tests/output-link checks in the actual Vercel build; generated inventory and an explicit editorial review queue.

See BACKLOG-STATUS.md or DramaRecs-action-plan.xlsx for all 42 items, including unfinished work. The original audit DOCX remains historical reference, not a claim that every finding has been fixed.

## Build and test

Node 20+ is required (tested with Node 22). The application and mandatory tests have no npm dependencies.

```sh
node tools/release-build.mjs fixture
```

Equivalent with npm: `npm run build:fixture`. `npm run build` runs the checked build used by Vercel. Build mode follows VERCEL_ENV for production. `npm run build:production` explicitly enables production checks.

Fixture builds allow missing TMDB data. In this environment they have **no real posters**, exactly because no token or metadata snapshot was supplied and the sandbox has no internet access. That is not a measurement of the deployed site.

Production rejects poster coverage below 95%, a greater-than-5% drop from a previous poster snapshot, or greater-than-20% provider coverage loss. A no-token production run was verified to fail intentionally. A fixture override is rejected inside a Vercel production deployment.

## Safe v2 deployment

1. Keep the current v2 commit/deployment available as your rollback point. Do not copy this over the live dramarecs.com repository.
2. Put this source tree on a new branch of dramarecs_v2 and let Vercel create a **Preview** deployment. No merge or deployment was done for you.
3. Configure TMDB_TOKEN for that Preview if you want real posters and availability. Treat auto-resolved IDs as unverified until reviewed.
4. Review the preview at the widths below, then complete the spoiler/editorial and metadata checks. If using v2's default Production deployment rather than a branch preview, the production coverage gate applies even though the project itself is a staging site.
5. Promote only after review. To roll back, restore/redeploy your prior v2 commit. Rollback was not exercised here. The new browser key dr.state.v1 leaves legacy sd.shelf intact, but saves created only in v2 state are not read by the old app after rollback.

## Optional actual-browser tests

Browser tests are supplied but **were not executed here**: Playwright's Chromium binary is not installed and cannot be downloaded from this sandbox.

```sh
npm install --no-save playwright
npx playwright install chromium
node tests/browser-smoke.mjs
```

The script starts its own local static server and checks 360/390/768/1366/1440 CSS px with 0/1/2/6/30 saved titles, delayed search, basic keyboard state, watched persistence, spoiler buttons, the reason pilot and shelf undo. Screen-reader behavior, zoom, Safari/Firefox, slow images, privacy requests and real-user usability still need manual checks. Installing test tooling is local development work, not a production application dependency.

## Metadata operations

- Cache records are timestamped and expire after 24 hours. Requests have a 10-second timeout and one retry. Old unversioned cache data is not silently treated as fresh.
- data/metadata-snapshot.json is generated after a successful token-backed build with posters. It can retain last-good values on an upstream failure. **This delivery has no populated snapshot.**
- Vercel build filesystems are not assumed durable. Review and persist an approved snapshot through your repository or a configured durable CI artifact process before relying on last-good behavior. No scheduled refresh or external storage was provisioned.
- Availability date means metadata retrieval date, not a fresh independent provider check. Empty results remain unconfirmed, never proof of unavailability.
- All 219 identities still need human ID/year/season verification. Existing raw IDs are not invented or mass-certified.

## Remaining highest-risk work

Full spoiler-safe and factual editorial review; verified title identities/season scope; actual phone/browser and assistive testing; approved TMDB logo and contract-specific attribution; certified CMP and consent matrix; deliberate page/ad-slot eligibility; real analytics exports and consent-aware product events; configured correction-form backend. Actor/couple discovery was not fabricated.

## Evidence

Mandatory tests: 29 pass. Content validation: zero errors, 26 pre-existing reciprocity warnings retained. Generated smoke checks: 341 HTML files and internal destinations pass, including with sample old monetization variables set. Fixture sitemap: 338 entries. Production without posters: intentionally fails. These are automated/local results, not live-site performance or AdSense certification.

Public correction references checked in this pass: https://asianwiki.com/My_Liberation_Notes ; https://en.wikipedia.org/wiki/Ahn_Pan-seok ; https://www.netflix.com/title/81677629 . Full catalog verification is not implied.
