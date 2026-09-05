# PLANS.md

**The one file for everything that is not editorial.** Roadmap, monetization, infrastructure,
features, traffic, and the plans that are dead and must stay dead.

**Version:** 1.1.0 · **Last updated:** 2026-09-05

---

## 0. How to use this file

**Jack shares this file when the session is about anything other than writing content.** Priorities,
money, features, SEO, deployment, what to build next.

**Read section 1 first.** It is the only part with a deadline on it. Everything below P2 is ordered
opinion, not a queue you have to clear.

**Rules for working from this file:**

- **Check the repo before you trust a line here.** Every item was verified against the actual files
  on the date shown, and code moves faster than docs. If a line here disagrees with `build.mjs`,
  the code wins and you fix the line.
- **Section 8 is a graveyard.** Items in it are already done or already wrong. Never resurrect one,
  and if a new plan proposes one, say so instead of building it.
- **Section 9 is a set of deliberate refusals**, each with a reason. Do not re-open them without a
  new argument.
- **Editorial work does not belong here.** Voice, schemas, meters, research method and the write
  queue live in `EDITORIAL.md`. Counts, settled decisions and site facts live in
  `PROJECT-STATE.json`.
- **Update this file when a priority closes or a new one lands**, and hand it back with the batch.

**The one-line call, as of 5 Sep 2026:** there is no build work left between this and a monetized
site. The affiliate layer is shipped and dormant, waiting on four env vars you cannot get without
applying. Apply to Rakuten today, finish batch 12, apply to AdSense in four to six weeks. Not this
week.

---

## 1. P0. The only genuinely urgent work

**No code is left on this list.** Both remaining items are things only Jack can do.

- [ ] **Apply to the affiliate programmes and set the env vars.** The wrapper shipped on
      5 September and it is live-but-dormant on all 341 pages. It needs, in this order:

      **Application requirements, researched 2026-09-05, so nobody has to look them up again.**

      *Rakuten Advertising, the network itself.* Free, and it can be done today. The stated
      requirements are a live site on its own domain, unique original content that is not thin or
      templated, and the FTC disclosure position. DramaRecs meets all of that already: 341 pages of
      original editorial, a privacy policy, a terms page, /how-we-pick/, and domain ownership
      provable through Search Console. Network review is manual and normally lands in 1 to 5
      business days. Signup asks for monthly unique visitors and page views: put in the honest
      expected figure, not zero, and Google Analytics can be linked instead of typing a number.

      *Viki and Kocowa, the individual advertiser programmes.* Separate approval, applied for from
      inside the dashboard after the network accepts you. Free, and you may apply to as many as you
      like. Expect this to be the slow part. Rakuten's own publisher help says advertisers may
      temporarily decline a publisher purely for being new, to see traffic and transaction history
      build up first, and that you may reapply after 15 days. So the realistic sequence is: apply,
      probably get deferred, get traffic, reapply. Also verify inside the dashboard that the Viki
      programme is actually open, because several third-party aggregators list the Viki affiliate
      offer as paused or withdrawn, and the wrapper assumes it is live.

      *Amazon Associates. Do not apply yet.* Signup is instant and hands over a tag on the spot,
      which is exactly the trap. The 180 day clock starts at signup and the account needs three
      qualifying sales inside it, personal orders excluded, or Amazon closes the account and
      unpaid earnings are forfeited. With no confirmed traffic yet, applying now spends the window
      on an empty site. Apply once organic search traffic is real and there are pages ranking.
      Two further details: India means amazon.in with a PAN for payouts, while most of the
      catalogue's audience is likely amazon.com, and Associates ids are per locale, so read
      `known_issues.amazon_tag_is_single_locale` in PROJECT-STATE.json before setting AMAZON_TAG.
      1. **Rakuten Advertising**, then apply to the **Rakuten Viki** programme. Viki Pass converts
         on drama fans and it is the only provider in the catalogue whose audience is exactly ours.
         Approval gives you a publisher id and an advertiser mid. Set `RAKUTEN_ID` and
         `RAKUTEN_MID_VIKI` in Vercel Production.
      2. **Kocowa**, same network, same shape. Set `RAKUTEN_MID_KOCOWA`.
      3. **Amazon Associates** for Prime Video. Set `AMAZON_TAG`.

      Nothing to write. Set a variable, redeploy, and the build log tells you which brands went
      live. Netflix, Disney+ and Apple TV+ have no programme worth taking and stay plain forever.
      **This is still very likely worth more per visit than AdSense will ever be on this niche.**
- [ ] **Confirm GA Realtime shows a visit** after the next Production deployment. A verification
      step, not an implementation task.

### The affiliate layer, as built. Read this before touching a watch row.

Shipped 5 Sep 2026. Live on all 341 pages, dormant until the env vars land.

**The thing that shaped the whole design:** TMDB returns **one** watch link per *region*, not one
per provider, and it points at a JustWatch-backed page on `themoviedb.org`. That link is worthless
as an affiliate target, because the click lands on TMDB and the network sees nothing. So each
monetisable brand gets a **title-scoped search URL on its own domain** instead. For a catalogue that
is only ever Korean drama, a title search lands on the show, and a search URL on the advertiser's
own domain is a valid deeplink target for both networks.

- **One function, `affiliate(brand, target)`** in `build.mjs`. It is the only thing in the codebase
  that knows what an affiliate URL looks like. Do not add a second.
- **`WATCH_TABLE`** resolves brand and region to a final href template once at build time, then
  ships to the client as `window.DR_WATCH`. `{q}` is the encoded title. `{qq}` is the *double*
  encoded title, needed because a Rakuten deeplink carries the whole destination url-encoded inside
  `murl`.
- **A real bug got fixed on the way through.** `app.js` used to invent its own link on a region
  switch, using the single TMDB link for every brand in the row, while the build rendered plain
  spans. So the crawler and every first-time visitor got no link at all, and a returning visitor
  with a stored region got a different one. Both sides now read the one table.
- **`rel="sponsored nofollow noopener"` on links that pay, `rel="nofollow noopener"` on links that
  do not.** Google asks for the first and it is also the only honest version.
- **Disclosure is gated on `AFF_LIVE`, derived from the env vars.** With no ids set, no disclosure
  prints anywhere, because claiming a commission we do not earn is the same bug pointing the other
  way. With ids set it appears in the footer of every page, directly under the row on every detail
  page, a generated `/privacy/` section, and a new `/how-we-pick/` section. **The brand names in
  that prose are generated from the config, never typed**, for exactly the reason section 3 gives
  about the ads wording.
- **Amazon has a storefront per country** and none at all in the Philippines or Indonesia, where
  Prime Video still streams. Those two fall back to the `.com` store, which is what Prime Video
  itself does there.

### Closed, do not reopen

| Item | Status |
|---|---|
| `GA_ID` in Vercel | Done. Added to Production, the build reads it |
| Search Console | Done. `dramarecs.com` verified, `/sitemap.xml` submitted and processed, 285 pages discovered at the time |
| DNS | Done and **no migration is needed**. Vercel nameservers are active, apex serves DramaRecs, `www` 301s to apex. Hostinger's panel is inactive because Hostinger no longer controls DNS. Zoho MX, SPF, DKIM and verification records are present in Vercel DNS. **Do not move nameservers back and do not delete the Zoho records.** The earlier parked-page response was stale edge or DNS caching |
| MDL cache and title list | Done. 497 titles committed, `mdl-titles.txt` expanded, research workflow re-run |
| Mouse (2021) verification | Done in batch 12. Re-derived from the correct cache row |
| Byline and pen name | **Settled permanently.** See section 2 |
| Affiliate wrapper code | Done 5 Sep 2026. One function, `affiliate()`. Only the accounts are outstanding |
| Which repo this is | `PapayaOfficial/Dramarecs`, private. `similardramas` is deleted. Section 7 |

---

## 2. The byline. Settled, closed, do not reopen.

**`AUTHOR.name` is `Yuna`. That is Jack's own pen name and it is final.**

One string, at the top of `build.mjs`. Every byline, the footer credit, the `/about/` card and all
the Person JSON-LD follow it.

Why this is not an open question: the thing that was wrong, and was fixed on 3 September 2026, was a
**fictional 19-year-old editor called Yona** with an invented biography, an invented age, a drawn
portrait and a `sameAs` link pointing at an old blog the site was told to go and plant her name on.
That was manufacturing evidence for a person who does not exist. All of it is gone.

A pen name the owner answers to, presented as an editor, is a completely different thing and it is
fine. Jack is not comfortable publishing under his real name and does not have to be.

**The rules that remain in force:**

| Field | Value |
|---|---|
| Name | `Yuna`. Jack's pen name. Never anything else, never an invented character |
| Age | Never stated, anywhere |
| Role | Editor, sole writer. There is no team, never imply one |
| Avatar | `src/editor.svg`, a typographic editor's mark. Not a face, real or drawn |
| `sameAs` | None. Only ever add a link that already carries this name in public |
| Voice | First person is allowed on `/about/` only. Everywhere else, `EDITORIAL.md` section 2 applies |

**Claims that are allowed:** every page is read, edited and signed off by a human before it
publishes. Corrections get dated. Every pick is checked against the complete run of the show. No pick
ships without a reason you can check.

**Claims that are banned:** any statement that a specific title was watched to the end, any age, any
team, any "not a script pointed at an API". The site claims a standard, not a viewing history. Also
deliberately not shipped: a `watched: true` flag. A per-title first-hand claim needs a per-title
first-hand note, and a promise with no mechanism behind it is the same bug in a smaller box.

**No "AI-assisted" disclosure.** Jack's call and it holds. AdSense does not require it. What matters
is that nothing on the site *denies* it either, and the one sentence that did is gone.

---

## 3. P2. AdSense: four to six weeks out, not this week

Every blocker is closed. Applying now is still wrong. A young domain plus near-zero indexed pages is
the single most common route to a low-value-content rejection, a rejection costs weeks and makes the
resubmission harder, and India-based applicants get slower, fussier reviews. Give them nothing.

**The sequence:** Search Console verified (done), ship batch 12, let real organic traffic land,
resubmit the sitemap, then apply.

### Approval-day checklist

- [ ] Set `ADSENSE_CLIENT` in Vercel. `ads.txt` writes itself on the next build, nothing else to do
- [ ] Turn on Privacy and messaging, European regulations, in the AdSense dashboard
- [ ] Rewrite the `/privacy/` ads section from future tense to present, bump the updated date
- [ ] Ad slots need no work. Verified in `build.mjs`: inline fires after pick 2, mid after pick 5,
      foot below the anti-picks, one mid-drama-page. Height is reserved so a late unit cannot wreck
      CLS. Nothing on the homepage, correctly

---

## 4. P4. Features, after approval, in the order I would build them

The stated goal has two halves. **What should I watch next** is built well. **Is the thing I planned
to watch worth it** is barely built, and it sits on query volume that AI Overviews handle worse,
because the answer is a judgement call.

1. **Content notes block.** A spoiler-safe what-is-in-it checklist: animal harm, infidelity,
   terminal illness, on-screen assault, open ending, major time skip, love triangle resolved or not.
   One new field on `dramas.json`, derivable from the cached MDL tags. Half the questions in any
   r/KDRAMA thread are exactly this. **This is the moat, not the recommendations.**
2. **`/endings/` and `/when-it-gets-good/` as real index pages**, plus a properly headed section per
   drama page. The `hook`, `ending` and `heavy` fields already answer does it get good, does it end
   happy, will it wreck me. Nobody serves those well and an overview cannot commit to them without
   spoiling.
3. **Seen-it marking, so lists hide what the reader already watched.** One localStorage set, one
   client-side filter, one "3 hidden, show them" line. Someone arriving at a My Liberation Notes list
   has already seen My Mister.
4. **Multi-seed input plus the mood matcher, client-side.** "I loved A and B" narrows infinitely
   better than one title, and it is the one thing a single AI answer cannot do. `assets/search.json`
   and the meters already ship, so score in the browser over one JSON file. Zero runtime cost, no
   backend, and it finally makes the static site the tool it set out to be.
5. **Comparison pages.** Squid Game vs Alice in Borderland. Real volume, trivially writable from the
   meters, honest reason to exist.
6. **Real 1200x630 OG cards.** Needs an image pipeline in the build, so it is a proper job. Do it
   before pushing anything on Pinterest, because the card is the ad.
7. **Newsletter.** A weekly "three worth your time, one to skip" in the house voice. Cheapest
   insurance against Google, and sponsorable at a few thousand subscribers. Signup at the bottom of
   every dramas-like page, never a popup.
8. **One-click up or down on each pick**, even if it only fires a GA event. "Wrong pick" as a mailto
   gets almost nothing, and editorial revisions currently run on vibes.
9. **Actor and couple pages, hand-written line each.** Real demand, but auto-generated ones are the
   exact scaled-content shape that gets applications refused. After approval, with editorial.

---

## 5. P5. Traffic that is not Google

One channel is not a business, and the entire thesis (people who finish a drama search "dramas like
X") is precisely the query class Google is absorbing into AI Overviews. In order of fit:

- **Pinterest.** Drama fans make watchlist boards, posters are the asset, pins send traffic for
  years, and the OG pipeline doubles as the pin pipeline.
- **r/KDRAMA and r/kdramas.** Be the best answer in the thread. Link only when the page genuinely
  answers it.
- **YouTube Shorts and Reels.** "Three dramas that end kindly." The data is already list-shaped.
- **Tumblr.** Still a large slice of drama fandom, almost nobody bothers.

---

## 6. P6. Ad networks, after volume

AdSense is the approval gate, not the business.

- **Ezoic:** effectively no minimum, typically 1.5x to 3x AdSense RPM. Move early.
- **Mediavine:** 50,000 sessions in 30 days. The real target.
- **Raptive:** 100,000 pageviews. Later.

Cap the ad density yourself, because these networks will happily wreck the reading experience.

**The arithmetic, so the goal is honest.** Entertainment RPM is roughly 2 to 6 USD, lower as the
traffic mix drifts to India, the Philippines and Indonesia, which it will. At 4 USD, 179 USD a month
needs about **45,000 pageviews a month**. That is a real SEO property, not a weekend.

---

## 7. Infrastructure and deployment facts

Everything below is verified, not planned.

**Stack.** Custom zero-dependency Node static site generator, `build.mjs`. Node 20+, Node 22
verified. Flat JSON in the repo. No database, no ORM, no server, no runtime AI.

**Repo.** `github.com/PapayaOfficial/Dramarecs`, branch `main`, and **private since 5 September
2026**. Jack made it private on purpose so the catalogue cannot be lifted, and it is staying that
way. The old `PapayaOfficial/similardramas` repo was **deleted** and resolves to nothing: if you
find that name anywhere, it is a stale line to fix, not a URL to try.

**You will never open the repo.** The code reaches you as a zip attached to the chat, and that zip
is the session's source of truth. `raw.githubusercontent.com` and the GitHub tree API both 404 on a
private repo, so a 404 there is not evidence a file is missing.

**Deploy.** Vercel auto-builds from `main` in about two minutes. **A failed build leaves the live
site untouched**, so a broken commit cannot take the site down.

**Env vars.**

| Name | Value | Notes |
|---|---|---|
| `SITE_URL` | `https://dramarecs.com` | Drives canonical tags, sitemap, og:url and every JSON-LD `@id`. Single switch. No www, no trailing slash |
| `TMDB_TOKEN` | API Read Access Token | Build-time only. Never commit it. Rotate it if it has ever been pasted into a chat |
| `GA_ID` | `G-XXXXXXXXXX` | Set in Production |
| `ADSENSE_CLIENT` | `ca-pub-...` | Unset. Setting it is the entire ad activation |
| `ADSENSE_SLOT_INLINE` | ad unit ID | Set with the above |
| `RAKUTEN_ID` | publisher id | Unset. Rakuten Advertising, the `id` in a linksynergy deeplink |
| `RAKUTEN_MID_VIKI` | advertiser mid | Unset. Issued when the Viki programme is approved. Viki links stay plain until it is set |
| `RAKUTEN_MID_KOCOWA` | advertiser mid | Unset. Same, for Kocowa |
| `AMAZON_TAG` | `yourtag-20` | Unset. Amazon Associates tracking tag for Prime Video |
| `AFF_LIVE_DATE` | `YYYY-MM-DD` | Optional. Pins the `/privacy/` date the day affiliate goes live, like `ADS_LIVE_DATE` |

**Every affiliate variable is optional and the build is correct without any of them.** Unset, the
watch rows are still real outbound links, nothing carries `rel="sponsored"`, and no page claims a
commission. Set one and that brand routes through the network and every disclosure switches on from
the same flag.

Build command `node build.mjs`, output directory `dist`, framework preset Other.

**TMDB.** Used at build time only, for titles, posters, episode counts, runtime, air dates, ratings
and US watch providers. It **overrides** `episodes`, `runtime` and `network` from `dramas.json`, so
rough catalog numbers are fine. The build never fails because of TMDB: worst case a page shows a
coloured tile instead of a poster. Deleting `.tmdb-cache.json` forces a fresh pull.

**The vercel.app host returns `X-Robots-Tag: noindex`** via `vercel.json`, so previews and the old
host cannot compete with production.

**Research tooling lives in GitHub Actions** behind a Run workflow button, because Jack does not use
a terminal. Anything he runs himself has to work from a browser or arrive as a finished file.

**Design system, current.** The "MARQUEE" redesign is what ships: warm bone paper, one persimmon
accent for anything clickable, acid-lime for live facts, an ultramarine footer slab, Bricolage
Grotesque 800 for display and Schibsted Grotesk for reading. Each title's `hue` drives its colour
block, rank numeral and match bar, so the palette changes as you scroll and the UI never fights the
artwork. Mobile-first: every rule is a phone rule until a `min-width` says otherwise, every tap
target is 44px+, no hover-only affordance carries meaning, no hamburger. Every text pair is WCAG AA
and nothing encodes meaning by colour alone. `prefers-reduced-motion` kills the stagger.

**Eight streaming regions already ship** (US, GB, CA, AU, IN, PH, ID, BR) with a localStorage region
picker. US stays the crawler default.

---

## 8. Dead plans. Already done, or wrong. Never resurrect these.

| What some plan file says | Reality |
|---|---|
| The Next.js, Drizzle, Supabase, Upstash and Hostinger roadmap | **Dead. Keep it dead.** The static generator does the job at zero cost. The old `similardramas-implementation-roadmap.md` describes it and is historical context only |
| The "Hanji and Ink" celadon design system | Superseded by MARQUEE. The old `similardramas-frontend-design-spec-v2.yaml` and `DESIGN-NOTES.md` describe the previous palette and typography |
| Move the ad slot off pick 1 | Already correct. Inline fires after pick 2, mid after pick 5 |
| Add UK, CA, AU streaming regions | Eight regions already ship with a region picker |
| Build the mood matcher | Shipped as static collection pages, deliberately. The interactive version is section 4 item 4, and it is an addition, not a fix |
| Squid Game is not in the catalog | In since batch 9, with seasons |
| D.P. Season 2 page owed | Already has a page. The pages actually owed are `taxi-driver` and `tale-of-the-nine-tailed`, season one |
| 112 entries need pages | Wrong then and wrong now. Count it from the data, never from a doc |
| Apply to AdSense now, every blocker is closed | The blockers are closed. Applying now is still wrong. See section 3 |
| Change `AUTHOR.name` off the pen name | **Wrong.** The pen name is the decision. See section 2 |
| The parked-domain warning, migrate DNS off Hostinger | No action required. See section 1 |
| `dramas-patch.json` from batch 4 | Unrecoverable, and it does not matter. Audited 2026-09-04 against the cache: 186 of 195 entries matched and every episode count is right. The four apparent conflicts (Goblin, My Dearest, The Glory, Death's Game) are MDL splitting a run into parts or specials where our number is the full run. Closed |

---

## 9. Deliberately not doing

Each of these is a refusal with a reason, not an oversight.

- **No login.** localStorage is enough. An account system means a database, a privacy rewrite and a
  support burden for zero revenue.
- **No runtime AI.** The zero-runtime-cost architecture is a real advantage. A per-request LLM call
  gives you a cost that scales with traffic and a quality floor you cannot control.
- **No C-drama or J-drama** until K-drama list coverage is nearer 80 percent. It is 40 percent today.
- **No merch, no paid tier, no API product, no courses.**
- **No new filter-shaped index pages before approval.** Eight thin indexes the week before a review
  is the exact scaled-content signal we are avoiding.
- **No `watched: true` flag.** See section 2.

---

## 10. Housekeeping debts

Small, real, not urgent.

- [ ] The 18 reciprocity warnings. Some are deliberate and explained in `EDITORIAL.md` section 6.
      Each of the rest needs to be either explained or fixed
- [ ] Re-run MDL with exact titles on the four sequel lines that resolved to season one: Bloodhounds
      2, A Shop for Killers 2, Yumi's Cells 3, Flex X Cop 2
- [ ] Finish 2023: about 20 cached titles still have no entry
- [ ] Secret Forest 2 has no entry, and Sweet Home needs a season group before Sweet Home 2 can be
      added. Adding `kingdom` created a new gap: no entry for Kingdom Season 2 or Ashin of the North
- [ ] Resubmit the sitemap in Search Console after batch 12 lands

---

## 11. The honest read, in four lines

1. **The content is not the problem, the plan is.** This is genuinely good and it is about to be
   under-monetized and over-rushed into an application.
2. **AdSense was never the business.** It is a gate. Affiliate revenue on rows that already render,
   plus an audience you own, is the actual model.
3. **The real risk is the traffic thesis, not the quality.** "Dramas like X" is being absorbed into
   AI Overviews. Weight hard toward the spoiler-anxious, opinionated, per-title "is it worth it"
   questions where a reader wants a human on the hook, and build one non-Google channel now.
4. **Content notes is the single most differentiated thing you could ship.** It is the only item on
   this page no competitor and no AI overview will match, and it is one derivable field.
