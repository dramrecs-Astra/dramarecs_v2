# Executed verification

Date: 2026-09-06 (user timezone). Runtime: Node 22.23.1.

- Original source: 219 dramas, 101 recommendation JSON files. Validator: zero errors, 26 warnings. Original no-token build: 337 sitemap entries.
- Repaired full fixture pipeline: passed. 29 Node unit/DOM-mock tests, zero failures. Data/schema checks passed; 26 existing reciprocity warnings retained.
- Generated output: 338 sitemap entries, 341 HTML files including utility and 404 variants. The additional sitemap entry is the fixed-US Netflix collection, now present with an honest unconfirmed-data empty state even without metadata.
- All generated local href/src destinations checked; no missing targets remain.
- HTML structure checked using BeautifulSoup: no duplicate IDs or nested interactive controls in generated static markup. This does not test dynamically rendered browser DOM.
- Client delayed-index search, keyboard ARIA, Escape-before-load, failed-search retry, watched search visibility and shelf HTTP-error behavior tested using DOM mocks, not a real rendering engine.
- State migration, malformed values, quota/denied/discarded writes, share parsing, aliases/typos/natural queries and fetch timeouts tested.
- Editorial episode/runtime precedence, season fallback, exact/ambiguous identity selection, deterministic relationships and true shared-set counts tested.
- Full fixture build with sample ADSENSE_CLIENT/GA_ID/FC_ID/AMAZON_TAG variables passed and emitted no ad, analytics, CMP or affiliate tracking scripts.
- Production build without posters intentionally exited with failure at the metadata coverage gate.
- Recommendation source filename sets before/after match exactly. No recommendation JSON files were removed or fabricated.

## Not executed or established

No Chromium binary was installed, and the sandbox has no internet access to download it. Optional Playwright checks are supplied but were not run. No actual viewport screenshots, mobile usability, Safari/Firefox, screen-reader, zoom, live Core Web Vitals, TMDB network responses, certified consent request matrix, deployment or rollback was tested. No real posters were supplied with the source and none could be fetched in the sandbox. No full 219-title factual/spoiler audit or analytics verification was completed.
