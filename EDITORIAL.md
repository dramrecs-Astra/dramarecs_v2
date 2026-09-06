> Repair-pass notice (2026-09-06): historical guidance below may conflict with the supplied source and this repair. Current counts and acceptance status are in INVENTORY.json and BACKLOG-STATUS.md. Do not treat old match percentages, exactly-three anti-picks, full-viewing claims or environment-variable monetization activation as current behavior. No full editorial audit has been completed.

# EDITORIAL.md

**The one file for all editorial work.** Replaces `ADDING-PAGES.md`, `VOICE.md`,
`CONTENT-QUEUE.md`, every `BATCH-*-NOTES.md` and every `VERDICT-BACKFILL-*.md`.

**Version:** 1.0.4 · **Last updated:** 2026-09-05 · **Reflects:** 219 entries, 152 pages, 388 built URLs

---

## 0. How to use this file

**Jack shares this file at the start of any editorial session (writing entries, verdicts or pages).**
It is self-contained. You do not need any other document to write a batch.

**Read it in this order:** section 1 (the workflow) tells you what to do. Section 2 (voice) and
section 3 (schemas) tell you how to write it. Section 4 (meters) tells you where the numbers come
from. Section 5 (research) tells you how to get the raw signal without burning budget. Section 6 is
the gate you must pass before handing anything over. Section 7 is what to write next. Section 8 is
how you hand the batch back.

**You must update this file at the end of every batch and ship the updated copy inside the batch
zip.** Sections 7 and 8 exist for that. A batch delivered without an updated `EDITORIAL.md` is
incomplete, because the next chat starts blind.

**What belongs here:** anything that decides what the writing says or how it is checked. Voice,
schemas, meter derivation, research method, the validator, the write queue, per-batch results.

**What does not belong here:** roadmap, monetization, features, infrastructure, SEO strategy. Those
live in `PLANS.md`. Site facts, counts and settled decisions live in `PROJECT-STATE.json`.

---

## 1. The batch workflow

This is the loop. Follow it in order every time.

### Step 1: read the repo before you write a word

**The repo is private and always arrives as a zip attached to the chat.** Unzip it and read the real
files from there. Do not try `github.com` or `raw.githubusercontent.com`: both 404 on a private repo,
and that 404 tells you nothing about whether a file exists. If no zip is attached, ask for it rather
than working from a doc.

Never derive anything from the file names or the docs alone. Open the actual data.

1. `data/dramas.json`: how many entries, which slugs exist, what the meters on comparable titles
   already look like. **Calibrate against the existing catalog.** A new comfort 4 has to sit
   sensibly beside the comfort 4s already shipped.
2. `data/pages/`: which seeds already have a page. The filename is the slug.
3. `data/mdl-cache.json` and `data/mdl-digest.json`: confirm every title in the batch actually
   resolves, and confirm it resolves to the **right show**. Check the year and the episode count,
   not just the name. This is how the Mouse (2021) / Mousetrap (2026) error shipped.
4. `PROJECT-STATE.json`: the counts, the open items, and the settled decisions you must not reopen.

### Step 2: confirm the batch is not blocked

A batch is blocked if any title in it is missing from the cache, resolves to the wrong row, or has
not aired. Say so immediately and work the unblocked part instead of guessing. Never fill a meter
from general knowledge to unblock yourself.

Unaired titles get **no meters, no ending label and no verdict**. Ever.

### Step 3: research upstream, write downstream

Run the research (section 5) **before** the writing, never during. The research produces numbers and
arguments. The writing produces flat declarative judgement. Nothing from the research appears as
attribution in the prose (section 2).

**Both sources, every title, in this order: Reddit first, then MyDramaList.** Reddit gives you the
argument and the caveat, MDL gives you the meters. Reading fan voice on two platforms is the point of
the project, so a title researched from the cache alone is not researched. If Reddit really is thin
for a seed, write down what you searched and what came back before you fall back to the cache.

### Step 4: write in this order

1. New catalog entries with meters (section 4) and verdicts.
2. Then pages, because a page cannot ship until every pick in it resolves in `dramas.json` and
   carries a real `hookNote` and `endingText`.
3. Highest search demand first inside each group. Section 7 holds the order.

### Step 5: gate it

Run the checks in section 6. `node tools/validate-pages.mjs` exits 0, `node build.mjs` passes with
zero broken picks, and **all three internal link totals go up**. A total that drops means a link loop
broke, and that is a real defect, not noise.

### Step 6: hand it back

Section 8. The zip carries the data files, the updated `PROJECT-STATE.json`, and the updated copy of
this file.

### The rule that saves the most time

**Say what is wrong.** If a doc, a plan or a previous batch got something wrong, name it in the
handoff rather than quietly working around it. The Mouse error, the stale page-owed line and the
comfort rule all survived several batches because nobody wrote them down.

---

## 2. House voice

The one rule that matters: **we state judgements as ours.**

The research happens *before* the writing. It never appears *inside* the writing. A reader should
finish a sentence knowing what we think, not what a sample of strangers thinks.

### The three registers, and why two of them are wrong

**1. Reported voice. Banned. The validator fails the build on it.**

> Viewers who loved the first nine episodes routinely describe the last stretch as anticlimactic.

Reads as a research summary, which is what an aggregator or an AI overview does. It also holds the
writer at arm's length from the opinion, which is the one thing we are selling.

**2. Personal-diary voice. Also wrong.**

> I found the ending anticlimactic.

We are not writing up a private viewing session, and claiming one is dishonest about how these pages
get made. First person is allowed on `/about/` only.

**3. Flat declarative. This is the house voice.**

> The last stretch is where it wobbles: the pace that carried the first nine episodes goes slack,
> and one relationship the show spent all season building never actually resolves.

No attribution tag, no hedge, no pronoun needed. Critic voice is confidence, not first person.

### Banned attribution

Banned in `standfirst`, in every `why`, in `endingText`, in `hookNote` and in `verdict`. The full
list lives in the `ATTRIBUTION` array at the top of `tools/validate-pages.mjs`, which is
authoritative and fails the build.

- viewers, fans, fandom, the audience, the crowd, regulars, commenters, reviewers
- Reddit, MyDramaList, threads ("in threads", "every thread", "threads are full of")
- most people, a lot of people, people say / describe / call / complain
- routinely, widely described, the consensus, is said to, reportedly, is often called
- the complaint, complaints, critics say

Note `fans` with a trailing space is on the list, so "fans of X" fails too.

**The traps that actually keep landing, in order of frequency:** `the audience`, `MyDramaList`,
`the crowd`, `a lot of people`, `every thread`. Grep your own draft for these before you run the
validator.

### Rewrites that work

| Instead of | Write |
|---|---|
| The pairing viewers make themselves | The obvious pairing |
| Named constantly by X fans | The same shape for the same reason |
| Named in nearly every thread as the one to watch first | Watch this one first |
| The most-repeated answer in these threads | The right answer |
| Fans routinely warn people not to start it looking for comfort | Do not start it looking for comfort |
| A large part of the audience has never forgiven the last episode | The last episode cheapens the sixteen hours in front of it |
| Viewers split hard on whether it lands | Whether it lands is a coin toss |
| Circulates as the other X | The other X, and the resemblance stops at the logline |

The pattern: the attribution clause is almost always **deletable**. The sentence gets shorter and
better. If deleting it leaves nothing behind, the sentence had no judgement in it and should not
have shipped.

### The one allowed exception: anti-picks

The `against` block exists to rebut a recommendation the reader will meet elsewhere, so it may name
*that a comparison is commonly made* in a short structural opener. It may never source an opinion.

- Fine: "The default romcom pick." / "Paired for the action, and the action is genuinely good."
- Not fine: "Threads are full of viewers who bounced off it." / "Fans who came for the Alchemy tone
  often find it airless."

### Facts are not opinions

Hard numbers stay, stated plainly. "An 8.9 from a hundred thousand ratings" is data. "A top review
page full of people calling it repetitive" is a poll. Keep the first, cut the second, and if the
poll was right then say the thing yourself: "the middle is repetitive".

### Mechanics

- **Zero em dashes and en dashes.** Anywhere, including in this file and every notes file. Commas,
  colons, parentheses, short sentences.
- **Banned filler:** masterpiece, tapestry, rollercoaster, delves into, testament to, seamlessly,
  captivating, navigates, poignant reminder, a must-watch, in today's fast-paced.
- Lead with the exact match dynamic. Never "fans of X will enjoy Y".
- Every pick gets one literal `Difference:` sentence.
- Spoiler-safe ending framing, always. No names, no deaths, no reveals.

---

## 3. Schemas

Two file types. That is the entire content system.

### 3a. A drama entry, `data/dramas.json`

```json
{
  "slug": "strong-girl-bong-soon",
  "title": "Strong Girl Bong-soon",
  "native": "REPLACE_hangul_from_mdl_native_title",
  "year": 2017,
  "query": "Strong Girl Bong-soon",
  "network": "JTBC",
  "episodes": 16,
  "runtime": 60,
  "hue": 320,
  "pace": 0,
  "romance": 0,
  "heavy": 0,
  "comfort": 0,
  "hook": 0,
  "hookNote": "REPLACE. Episode N, and what changes at it.",
  "ending": "REPLACE with Happy | Hopeful | Bittersweet | Tragic | May divide viewers",
  "endingText": "REPLACE. Spoiler-safe: no names, no deaths, no reveals.",
  "verdict": "REPLACE. 3 to 5 sentences of flat judgement. Becomes the meta description. Name one honest flaw.",
  "verdictUpdated": "2026-09-05",
  "aliases": ["Ssen Han Yeoja Do Bong Soon", "Strong Woman Do Bong Soon"]
}
```

Placeholders are deliberately marked so an unfilled one fails the eye before it fails the build.

| Field | What it is |
|---|---|
| `slug` | The URL. Lowercase, hyphens. **Never change it after publishing.** |
| `query` | What TMDB is searched for. English title, plus the year if the title is generic. |
| `tmdb_id` | Optional. Only if TMDB matched the wrong show. |
| `native` | Real Hangul, verified against the MDL `native_title`. Never transliterate from memory. |
| `hue` | Fallback tile colour, 0 to 360. Also drives the colour block, rank numeral and match bar. |
| `hookNote` | The episode number **and what changes at it**. A bare number is not a note. |
| `endingText` | Spoiler-safe. |
| `verdict` | 3 to 5 sentences of plain judgement. **This is the indexation gate, see below.** |
| `verdictUpdated` | `YYYY-MM-DD`. Feeds `<lastmod>` in the sitemap. Bump it when you revise. |
| `aliases` | Alternate names for the search box only, never rendered. Five or so. Never another catalog title. The build already adds the Hangul, the `query` and the initials, so `CLOY` works without listing it. |
| `score` | Optional, 1 to 10. The only thing that unlocks `reviewRating` in the Review markup. Never derive it from the meters: an invented rating is a Google violation. |
| `meta` | Optional hand-written meta description. Otherwise the build clips the verdict under 155 chars. |

TMDB overrides `episodes`, `runtime` and `network` with live values when it can, so rough numbers
are fine.

**The indexation gate.** A drama page enters `sitemap.xml` only if its entry has a `verdict`.
Without one the page still builds and is still crawlable, but it renders
`<meta name="robots" content="noindex,follow">`. Reason: a verdict-less page is a metadata table and
four meters, around 130 words, and both Google's scaled-content rules and AdSense's low-value-content
rejection judge a site by its weakest indexed page. As of 2026-09-05 all 219 entries carry a
verdict, so the gate is a tripwire for future entries rather than a filter.

### 3b. Later-season entries

A second season is a separate product. Somebody who finished season one should not have to read a
review of season one to find out whether season two is worth it.

```json
{
  "slug": "show-name-season-2",
  "title": "Show Name Season 2",
  "native": "REPLACE_hangul",
  "year": 2026,
  "seriesYear": 2023,
  "season": 2,
  "seasonOf": "show-name",
  "seasonLabel": "Season 2",
  "query": "Show Name"
}
```

Plus every normal field. Rules:

- **Season one keeps its slug and its plain title.** `bloodhounds`, "Bloodhounds". Never rename a
  published slug and never retitle it to "Season 1", because "dramas like bloodhounds" is the search
  we are trying to win.
- Later seasons get their own slug and title. `seasonOf` is **always season one's slug**.
- Each season needs its **own** meters, `hook`, `hookNote`, `ending`, `endingText` and `verdict`.
  Never copy season one's numbers. A worse season has to read worse.
- **One `dramas-like` page per show, not per season.** Two near-identical pick lists is duplicate
  content and an AdSense risk. The switcher does the work.
- A pick list must never contain two seasons of the same show. The validator fails on this.

**Do not write pages for these 11 later-season entries:** `squid-game-season-2`,
`squid-game-season-3`, `dp-season-2`, `taxi-driver-season-2`, `taxi-driver-season-3`,
`hospital-playlist-season-2`, `alchemy-of-souls-part-2`, `weak-hero-class-2`,
`bloodhounds-season-2`, `gyeongseong-creature-season-2`, `tale-of-the-nine-tailed-1938`.

### 3c. A page, `data/pages/<seed-slug>.json`

The filename must equal the seed slug. That is what creates
`dramarecs.com/dramas-like/<slug>/`. `picks` objects take `slug`, `match` and `why` and
**nothing else**.

```json
{
  "seed": "whats-wrong-with-secretary-kim",
  "reviewed": "2026-09-05",
  "meta": "REPLACE, optional. Hand-written, under 155 characters. Worth it on pages you want to rank.",
  "standfirst": "REPLACE. Two to four sentences, 120+ characters. Name what people actually loved, specifically. Google shows part of this. Flat declarative, no attribution.",
  "picks": [
    {
      "slug": "REPLACE_must_exist_in_dramas_json",
      "match": 96,
      "why": "<b>Lead with the exact match dynamic.</b> Then two or three sentences on the real connection: same writer, same director, the same specific kind of loneliness. Difference: one honest sentence on how it is not the same, and this word must literally appear."
    },
    { "slug": "REPLACE", "match": 90, "why": "<b>Hook sentence.</b> Shared ground. Difference: the honest caveat." },
    { "slug": "REPLACE", "match": 85, "why": "<b>Hook sentence.</b> Shared ground. Difference: the honest caveat." },
    { "slug": "REPLACE", "match": 81, "why": "<b>Hook sentence.</b> Shared ground. Difference: the honest caveat." },
    { "slug": "REPLACE", "match": 76, "why": "<b>Hook sentence.</b> Shared ground. Difference: the honest caveat." },
    { "slug": "REPLACE", "match": 71, "why": "<b>Hook sentence.</b> Shared ground. Difference: the honest caveat." }
  ],
  "against": [
    { "title": "REPLACE, free text, needs no catalog entry", "why": "The default pick. Then why it is wrong for this specific reader. One short structural opener may say a comparison is commonly made. It may never source an opinion." },
    { "title": "REPLACE", "why": "REPLACE. Pick the recommendations that actually circulate, not straw men." },
    { "title": "REPLACE", "why": "REPLACE." }
  ]
}
```

### 3d. Internal linking, all generated

Nothing here is hand-maintained. Add a pick and every link below appears on the next build.

- **Drama page to the lists that recommend it.** Up to twelve pick lists, highest match first.
  Taxi Driver is on sixteen.
- **Pick row to that title's own list.** A pick with its own `data/pages/` file gets a
  "Dramas like X" link. Everything else gets a quiet link to its drama page.
- **Anti-pick to the page we host.** A "Skip these" title is matched to the catalog by name and
  linked when we have it, so a rejection is still a route somewhere.
- **List to lists that overlap it.** Any two lists sharing two or more picks are related, sorted by
  overlap, six shown. Cross-picking each other's seed counts double.

The build prints the totals every run. Current baseline: **891 reverse, 843 list-to-list, 237
anti-picks linked.** If any number drops after an edit, a link loop broke.

Batch 12 part A is the proof that this compounds: 18 new lists with no new catalog entries moved
list-to-list from 249 to 396, because every new list overlaps several existing ones. Writing a
cluster of pages from the same few years is worth more in links than the same number scattered.

**Batch 14 found the lever that beats clustering: cross-pick back.** Before writing a page, list the
existing pages that already pick your seed. Every one of those that also belongs in your pick list
turns a one-way link into a mutual one, and mutual seed picks count double for list-to-list. 23 pages
built that way moved list-to-list from 575 to 843, which is 268 new relations from 23 files and zero
new catalog entries, against 142 reverse links for the same work. Do this first, then rank.

### 3e. Collections

Collections live in the `HUBS` array near the top of `build.mjs`, one object each: `slug`, `nav`,
`word`, `line`, `h1`, `title`, `standfirst`, `criterion`, `where` (a predicate over an entry),
`sort`. Entries need a verdict to appear, and a collection with fewer than 6 matches is skipped
rather than published thin. `criterion` prints on the page, so say what the filter is instead of
implying a judgement the data does not support.

---

## 4. Meter derivation

**Never fill a meter from general knowledge.** No public API exposes pace, romance, heaviness or
comfort as numbers. This was researched and closed out. Do not re-litigate it. Derive from the
cached MDL signals plus the Reddit language, and calibrate against the entries already shipped.

| Field | 1 | 2 | 3 | 4 | 5 |
|---|---|---|---|---|---|
| `pace` | glacial | slow | steady | brisk | fast |
| `romance` | background | present | central | the whole point | (0 = none) |
| `heavy` | light | easy | moderate | heavy | devastating |
| `comfort` | no | rarely | sometimes | often | always |

`hook` is the episode number where it stops being work. **3 or higher renders a "Slow start" flag,
1 or 2 renders a quiet "Hooks early".** Do not inflate it to make a page look cautious. A curve that
falls monotonically from episode one means hook 1, not hook 3: there is no episode where it stops
being work. See See You in My 19th Life and Alchemy of Souls Part 2.

### comfort

Base mapping from the average of the per-review **Rewatch Value** scores:

| Average rewatch | comfort |
|---|---|
| 8.5 and up | 5 |
| 7.0 to 8.4 | 4 |
| 5.5 to 6.9 | 3 |
| 4.0 to 5.4 | 2 |
| under 4.0 | 1 |

Then apply all three clamps, in order. **Amended 2026-09-05 after seven titles in batch 12 produced
values that could not ship.** Rewatch value measures rewatchability, not consolation, and a 12
review sample is small.

1. **18+ cap.** An 18+ neo-noir or survival title never exceeds comfort 3, whatever its rewatch
   score. Consistent with Bloodhounds, Karma and The Worst of Evil (rewatch 9.08, comfort 3).
2. **Genre cap.** A genre list including Thriller, Horror or Crime caps at comfort 3, and at **2**
   when `heavy` is 4 or 5. This is what produced the Vagabond, SKY Castle, Save Me, Kingdom and
   Memories of the Alhambra clamps.
3. **Unrepresentative sample test.** When the review sample's overall average diverges from the MDL
   aggregate by more than **1.5 points**, the sample is not the show. Weight the genre and tag set
   instead of the rewatch number. Strong Girl Bong-soon (5.67 review average against an 8.7
   aggregate, a 3.03 gap) went to comfort 4, not 1. Cheese in the Trap (9.38 against 7.3, a 2.08 gap
   the other way) went to 3, not 5.

### pace

Per-review **Story** score, plus whether the per-episode ratings decline, plus the pacing language
in the research. Repeated "drawn out" or "should have ended at episode N" pulls pace down. Mouse:
story 7.83 across 20 hours, and the length is the standing objection, so pace 3 not 4.

### romance

Vote-ranked tags plus the genre list. Love Triangle, Fake Marriage and similar push it up. A tag set
with no romance terms pushes it to 0 or 1.

### heavy

Tags such as Gore, Suicide, Graphic Violence, Depression, plus the content rating, plus the review
vocabulary.

### hook

The per-episode rating curve, cross-checked against what the reviews say changes. **Prefer Reddit
when the two conflict**, because MDL episode voter counts are tiny.

### The gap signal, which is the most valuable thing in the pipeline

The gap between the MDL **aggregate** score and the written-review **Rewatch Value** exposes the
shape where a crowd score and a critical verdict point in opposite directions. Examples worth
keeping: Lovely Runner 8.9 aggregate against 1.08 rewatch. The Wonderfools 8.5 aggregate with 9.25
rewatch, underrated. Good Boy 8.4 aggregate with 4.08 rewatch and 5.12 story, overrated. Our
Universe 7.5 aggregate with 1.29 rewatch and a curve falling from 8.4 to 4.9. My Demon 8.3 from
105,157 ratings against a 5.04 written average and a 3.29 rewatch, the widest gap in the catalog.

---

## 5. Research pipeline

**Two sources doing two different jobs. Never substitute one for the other.**
Reddit gives fan **voice**, arguments and caveats. MyDramaList gives **structured signal** for
deriving meters.

### 5a. MyDramaList: the cache is the primary source

`data/mdl-cache.json` holds **497 titles**, the most popular titles of every year 2010 to 2026. Per
title: details, `native_title`, aliases, genres, vote-ranked tags, director, screenwriter, cast,
synopsis, the full per-episode rating curve and 12 written reviews with per-category scores.
`mdl-digest.json` is the trimmed version. **No further MDL run is needed for 2010 to 2026.**

**Reading gotcha.** The cache is 21MB and the digest is 4MB, so any web-fetch tool truncates near
40KB and you cannot page through them over HTTP. **Parse the file locally with a script and print
only the fields you need.** If you do not have the file, hit kuryana per title instead.

**Fallback tool:** `tbdsux/kuryana`, public instance `https://kuryana.tbdh.app`. No key. Endpoints
`/search/q/{query}`, `/id/{slug}`, `/id/{slug}/cast`, `/id/{slug}/episodes`, `/id/{slug}/reviews`,
`/seasonal/{year}/{quarter}`. Slug format is `{numeric-id}-{name}` and it is **not guessable**:
always search first. MDL files shows under romanisation, so My Mister is `25172-my-ajusshi`.

**Known bad rows. Ignore their data.** Four sequel lines in `mdl-titles.txt` resolved to their
season one pages: "Bloodhounds 2 (2026)" to `701881-hounds` (2023), "A Shop for Killers 2 (2026)" to
the 2024 season one, "Yumi's Cells 3 (2026)" to the 2021 season one, "Flex X Cop 2 (2026)" to
`746193-gold-spoon` (2024). These need re-running with exact titles.

**Titles cached under a different name.** `moonlight-drawn-by-clouds` is cached as Love in the
Moonlight, `thirty-but-seventeen` as Still 17, `romantic-doctor-teacher-kim` as Dr. Romantic. Slugs
stay as planned, the MDL title goes into `aliases`, and `query` gets the name TMDB is most likely to
match.

**Unaired 2026 lines with zero score and zero reviews.** Mousetrap, New Recruit 4, Four Hands Two
Sonatas, Made in Korea 2, The Scandal, The Ordinary Jackpot, A Love Other Than Yours, 100 Days of
Deception, The Perfect Lie, Portraits of Delusion, The Sacred Jewel, Tantara. Never write meters or
an ending for these.

**Always verify the row is the right show.** Check the year and the episode count, not just the
name. Mouse (2021) shipped with meters derived from Mousetrap (2026) because nobody did.

### 5b. Reddit scraper: read this before you run it

**Tool:** the dedicated `harshmaur/reddit-scraper-pro` MCP tool via the Apify credential named
**Reddit scraper**. Billed per result, about $1.50 per 1,000 items, so an item is a sixth of a cent
and a full 24-title batch costs roughly two dollars. Budget in items, never in runs: **runs are free.**
**Dead, do not use:** `trudax/reddit-scraper`, paid rental only.

**Retracted, 2026-09-05.** A previous handoff claimed "Reddit is exhausted" for pre-2020 titles. That
was wrong and it was wrong because of query shape, not because the material is missing. Re-run against
the same 24 batch 13 seeds with the recipe below, **all 24 returned real per-title threads with real
comment sections**, including 2014 and 2016 titles. There is no such thing as an exhausted seed until
you have run the four index sweeps below and come back empty. Delete the idea.

#### The rule that overrides everything else

**Every title gets Reddit before it gets MDL, and both go in every page.** Reddit supplies fan voice:
the argument, the caveat, the drop point, the thing people fight about. MDL supplies structured signal
for the meters. A page written from one source is half a page. If Reddit is thin for a title, say so
in the research notes and name what you checked, rather than silently falling back to the cache.

**The other half of the rule: research that is not in the pages is not done.** A finished research file
is a work-in-progress, not a deliverable. When fan voice lands for a title that already has a page, the
page gets rewritten in the same batch, and the handoff says which pages changed. All 24 batch 13 pages
were originally written from the cache alone and were reworked on 2026-09-05 from
`reddit-batch13-fan-voice.md`, which is the correction that produced this paragraph.

#### The subreddit map, and how to add to it

**Jack's standing rule, set 2026-09-05, and it replaces the old three-subreddit allowlist.** There is
no fixed permit list. **If the subreddit's name tells you it is about dramas, it is in. If it does not,
discard the hit no matter how good it looks.** When a new sub earns its place, add it to this map with
one line on what it was actually good for, so the map becomes the record of where our material lives.

**The core three. Highest yield, always sweep these.**

- **r/KDRAMA** is the archive: per-episode discussion threads back to 2016 with the nationwide ratings
  table in the post body, plus long structured review posts. Scores here run five to ten times higher
  than the other two subs, so **never compare upvotes across subreddits**, only within one.
- **r/kdramas** is where the blunt verdict lives: "I watched X", "unpopular opinion", hot takes, and the
  dissent posts that make a page honest. Highest hit rate for recent opinion.
- **r/kdramarecommends** is the highest-precision sub for a bare title, and its **"Is <Title> worth
  watching?"** threads are still the single best artefact in the pipeline. Its "dramas like X" threads
  also hand you a vote-ranked pick pool for free.

**Approved by Jack and now standing, added 2026-09-05.**

- **r/KdramaCasualTalk** earned it twice in one run: the head-to-head *The Glory vs My Name* thread at
  156up with 180 comments, and the sharpest Mouse dissent anywhere. Go here for **head-to-head
  comparisons** and for dissent on titles the big subs treat as settled.
- **r/KDramasWorld** carries a one-author structured **"KDrama Review: <Title> (year)"** series. Small
  comment counts, but the reviews themselves are usable craft notes, strongest on 2022 titles.
- **r/KDRAMACHINGU** carries a pre-2019 spotlight series, which is the cheapest route into older titles.

**Proven in the batch 14 run and now on the map.**

- **r/KDramaDiscussions**: "which was your first kdrama" style polls. Weak on craft, genuinely useful as
  a **demand and gateway signal** (which is how we learned My Love from Another Star is a gateway title).
- **r/dramasect**: opinion polls with real comment volume, e.g. "Mr. Queen is the funniest, what is
  number two?" at 61up/102c. Treat as a comparison source, not a verdict source.

**Source-material subs. Adaptation questions only.**

**r/manhwa** and **r/webtoons** are the only non-drama-named subs allowed, and only for one job:
**how the adaptation differs from its source.** They gave us the Reborn Rich ending divergence and the
Cheese in the Trap second-lead war. Never take a drama-quality opinion from them.

**Named and rejected, so nobody re-tests them.**

`r/reviewsofkdramas` is crossposts with zero comments. `r/FranceKDrama` and the other language mirrors
repost the same review text with no discussion. `r/CDrama`, `r/JDorama` and `r/AsianCinema` are adjacent
and off-topic for our seeds. And a common-word title will drag in `r/AmItheAsshole`, `r/worldnews`,
`r/ProRevenge`, `r/CasualUK`, `r/kpoppers`, `r/badminton` and `r/KoreanFood`. Those are query bugs, not
sources. See gotcha 9.

#### The recipe: index cheap, then fetch deep

**Stage 1, three index runs, comments off, posts only.** All 24 titles go in one run each time, because
`maxPostsCount` is per search term and every item carries the `searchTerm` that produced it, so
attribution is free. About 400 items for a 24-title batch, roughly 60 cents. It was four runs until
batch 14 proved the scoped r/KDRAMA sweep redundant, see gotcha 11.

```json
{ "searchTerms": ["<Title> kdrama", "..."],
  "searchPosts": true, "searchSort": "relevance", "searchTime": "all",
  "maxPostsCount": 8, "crawlCommentsPerPost": false, "includeNSFW": true, "waitSecs": 0 }
```

1. Unscoped sweep, `"<Title> kdrama"` for every distinctive seed, 8 posts each. This is the run that
   reaches every sub at once, surfaces r/KDRAMA's episode threads without a scoped run, and finds the
   cross-title recommendation threads. **Skip the unscoped sweep for one and two-word titles**, which it
   cannot disambiguate, see gotcha 9.
2. Same list, bare titles, `"withinCommunity": "kdramarecommends"`, 4 posts each. Highest precision, and
   where the "worth watching?" threads are.
3. Same list, bare titles, `"withinCommunity": "kdramas"`, 4 posts each. Where the dissent is.
4. Optional and usually skippable: `"withinCommunity": "KDRAMA"`, 6 posts each. Run it only when the
   unscoped sweep came back without r/KDRAMA rows, or for a pre-2018 title where you want the
   per-episode threads and their ratings tables.

Read the index with `get-dataset-items` and a narrow projection:
`fields=searchTerm,communityName,title,score,commentsCount,createdAt,postUrl`.

**Stage 2, two URL runs with comments on.** Pick **two threads per title** and pass them as
`startUrls`: one **verdict** thread and one **caveat or dissent** thread. `crawlCommentsPerPost: true`,
`maxCommentsPerPost: 15`. About 380 items per 24-URL run.

Title shapes that pay, in order: `Is <Title> worth watching?` / `<Title> worth it?` ·
`Does it get better?` / `Should I continue <Title>?` · `Why was <Title> disliked?` ·
`Nth Korean Drama Review: <Title>` · `<Title> appreciation post` ·
`Why isn't <Title> as popular as <Other>?` (the best single artefact type there is, it hands you the
comparison pair and the reason) · per-episode discussion threads for anything pre-2018.

Take the dissent thread even when it has 6 upvotes. A 6-upvote post with 67 comments is an argument,
and arguments are what the prose needs.

#### The gotchas that have each cost a run

1. **`searchSort` must be `relevance`.** `top` and `hot` ignore the query and return Reddit's global
   popularity: "cheese in the trap kdrama" on `top` returned r/cats, r/AITAH and a Terraria seed post
   at 10,000 upvotes. Verified 2026-09-05. This single wrong field is what produced the false
   "Reddit is dry" conclusion.
2. **`maxPostsCount` is PER SEARCH TERM, not a total.** This corrects the old gotcha, which had it
   backwards and caused batches to be run one title at a time for no reason. Verified twice: 2 terms
   at a cap of 20 returned 40 items, 3 terms at a cap of 8 returned 24. **Batch every title into one
   run.**
3. **Always pass `waitSecs: 0`, and never poll with `get-actor-run`.** A completed actor call returns
   the dataset's full field schema, 574 fields, about 15,000 tokens of nothing. `waitSecs: 0` returns
   a small run stub instead. Wait out of band, then read the dataset with an explicit `fields` list.
4. **Append `kdrama` only on the unscoped sweep.** With `withinCommunity` set, the bare title is
   sharper; the extra word starts matching the word "kdrama" in unrelated posts.
5. **Never add an angle word to an unscoped search.** `"A Korean Odyssey review"` returns r/Games and
   r/PS5 review megathreads for Saros, Astro Bot and Alan Wake 2. `review`, `worth watching` and
   `ending` are safe only inside `withinCommunity`, or when they happen to be in the post title you
   already found in the index.
6. **The thread-series route is a bonus, not the main road.** Searching `Let's Rewind` or
   `Review Megathread` inside r/KDRAMA still returns a clean index in one run, and it is still the
   cheapest way to get a long retrospective. It is not a substitute for per-title search, and treating
   it as one is what emptied batch 13's research.
6b. **Both thread series are fully enumerated. Do not re-run the indexes.** Verified 2026-09-05, 80
   items. `Let's Rewind` has covered exactly **eleven shows**: Moon Lovers, I'm Not A Robot, Faith,
   Secret Garden, The Heirs, The Package, Coffee Prince, Marriage Not Dating, Weightlifting Fairy,
   Reply 1997, Couple or Trouble. `Review Megathread` is **nine**: It's Okay To Not Be Okay, Vincenzo,
   Extraordinary Attorney Woo, The King Eternal Monarch, Start-Up, Love Alarm, Hometown Cha-Cha-Cha,
   Moon Lovers, Marriage Not Dating. Check a seed against those twenty before spending anything.
7. **Strip the bots before you read.** Both r/kdramarecommends and r/kdramas AutoModerator reply to
   every post, and the r/kdramarecommends bot quotes the entire OP back, which reads exactly like a
   real comment. Drop any comment whose body contains `I am a bot`.
8. **Confirm the thread is about the right show.** `searchTerm` tells you which query produced a row,
   not that the row is on topic. A "Save Me" search returns Kim Sae-ron news; a "Kingdom" search
   returns The East Palace. Check the title before you quote it.
9. **Common-word titles need a disambiguator, and `kdrama` is not enough.** Verified 2026-09-05:
   `"Run On kdrama"` returned r/AmItheAsshole, r/CDrama and a freelancing rant; `"Lost 2021 kdrama"`
   returned only year-in-review roundups; `"Mouse kdrama"` surfaced an r/worldnews politics post at
   34,969 upvotes. **Fix: for one and two-word titles, skip the unscoped sweep and search the bare title
   inside r/kdramarecommends**, where the "worth it?" thread sits at the top. Reserve the unscoped
   `<Title> kdrama` sweep for distinctive titles.
10. **An actor token in a scoped run cuts both ways.** `"My Name Han So Hee"` found the show, because she
   is inseparable from it. `"Mouse Lee Seung Gi"` returned four posts about the actor's career and none
   about the drama. Use an actor name only when that actor has exactly one title worth searching.
11. **Do not run the scoped r/KDRAMA index if the unscoped sweep is already returning r/KDRAMA threads.**
   Verified 2026-09-05: the 138-item scoped r/KDRAMA sweep added nothing the unscoped sweep had not
   already surfaced, and it billed anyway. Three index runs is usually the right number. Never fire an
   index run you do not intend to read.
12. **Mega-threads are the wrong Stage 2 target unless the show is pre-2018.** The Tomorrow finale thread
   has 523 comments and the top twelve are Johnny Depp jokes. A verdict or caveat post with 20 to 100
   comments beats a finale thread with 500 every time, because the comments are answers to a question.
13. **The r/kdramarecommends bot contaminates across threads.** Gotcha 7 already says strip anything
   containing `I am a bot`. This run the bot's archival copy of one post's body arrived attached to a
   different thread, so an unstripped read can hand you a quote from the wrong drama. Strip first, then
   read, and never quote text you only saw inside a bot copy.

14. **The attribution ranking is a weak signal on standalone titles.** Scoring the catalog by shared
   screenwriter, then director, then cast, then tags produced the top pick on 14 of 18 pages in batch
   12 part A and 16 of 24 in batch 13. In batch 14 it produced **3 of 20**, and on eight seeds its
   number one was tonally wrong: same writer, opposite show (Navillera and Tunnel, Mystic Pop-up Bar
   and Dynamite Kiss, My Name and Flex X Cop). The reason is the batch: 2020 to 2022 standalones by
   one-off writer and director teams have no creative-team cluster to find. **On a seed with no
   repeated writer or director in the catalog, the Reddit comparison thread is the stronger signal**,
   and it handed over the top pick outright five times this run (My Love from Another Star to Crash
   Landing on You, My Name to The Glory, Lost to My Mister, Navillera to Dear My Friends and My
   Mister, Mystic Pop-up Bar to its own four-title fan cluster). Run the ranking, then let the
   research overrule it, and do not spend a pick slot on a shared writer whose other show has nothing
   in common with this one.
15. **Not every catalog entry is in the cache, and the lookup is case-sensitive.** `lost`,
   `revenge-of-others`, `summer-strike`, `divorce-attorney-shin` and `bon-appetit-your-majesty` have
   complete entries with meters and verdicts and **no row in `mdl-cache.json` or `mdl-digest.json` at
   all**, and `sky-castle` is cached as `Sky Castle (2018)` while its `query` field reads `SKY Castle`,
   so an exact-match lookup misses it. Match on a lowercased key. Section 1 step 2 says a title
   missing from the cache blocks the batch: that is too strict now. **Check `dramas.json` first.** If
   the entry already carries derived meters, a hook note, an ending and a verdict from an earlier
   batch, the page is writable and the cache absence only means you have no review text to lean on.
   Say so in the handoff instead of stalling the batch.

**Weight by upvotes, within a subreddit.** One 47-upvote "that drama is a mess" outweighs thirty
one-upvote agreements. A thread whose comments are all at 1 or 2 upvotes is a thread with no consensus:
report the split, do not pick a side from it.

**Comments on or off.** Off for every index run, always. On only for the two chosen URLs per title, at
`maxCommentsPerPost` 15. Comments are roughly 90 percent of item count and 100 percent of the value.

**Verified runs:** three runs 2026-08-25 (~1,400 items), two 2026-08-26 (~500), five 2026-09-04
(~1,150), one scoped r/KDRAMA run 2026-09-05 (505), two index-then-URL runs 2026-09-05 (40 then 91),
the full re-run of batch 13 on 2026-09-05 (four index runs at ~500 items plus two 24-URL comment runs at
~766, about $2, usable material on **24 of 24 seeds**), and the batch 14 run on 2026-09-05: four index
sweeps (178 + 138 + 92 + 92 items) plus two 23-URL comment runs (293 + 299), about **1,090 items for
roughly $1.65**, usable material on **22 of 23 seeds**. The single miss is `lost`, and it is documented
in `data/research/reddit-batch14-fan-voice.md` with what was checked. Output for batch 13 lives in
`reddit-batch13-fan-voice.md`, batch 14 in `reddit-batch14-fan-voice.md`, with thread URLs in the
matching `-threads.json`. Zero blocks throughout. Access has never been the problem.

---

## 6. The gate

### Per page, before it goes in the zip

- [ ] 5 to 7 picks. Fewer looks thin, more looks generated
- [ ] Exactly 3 `against` entries
- [ ] `match` strictly descending, nothing above 96, editorial not calculated
- [ ] Every pick slug resolves in `dramas.json`
- [ ] Never two seasons of the same show on one pick list
- [ ] Every `why` carries a literal `Difference:` sentence
- [ ] Every pick has a real `endingText` and a real `hookNote` on its entry
- [ ] `standfirst` is 120+ characters and leads with the match dynamic, never "fans of X will enjoy Y"
- [ ] `why` uses only `<b>`, `<i>`, `<em>`, `<strong>`, `<a href>`
- [ ] Zero em dashes and en dashes, including in notes files
- [ ] No banned filler, no reported voice
- [ ] `reviewed` set to today
- [ ] No ending label on anything still airing

### Per batch, before you hand it over

- [ ] `node tools/validate-pages.mjs` exits 0
- [ ] `node build.mjs` passes with 0 broken picks and 0 noindex
- [ ] All three internal link totals went **up**. A drop means a loop broke
- [ ] Any surviving reciprocity warning is deliberate and explained in section 8

### The validator trap that is not your fault

`BANNED` in `tools/validate-pages.mjs` is grepped against `JSON.stringify(page)`, and `captivating`
is on that list. The catalog contains an entry titled **Captivating the King**, so picking
`captivating-the-king` fails the validator with `banned phrase "captivating"` even though the prose
is clean. This landed for real on `moon-lovers-scarlet-heart-ryeo`, where it was a good pick and had
to be swapped for `youth-of-may`. **Until the check is scoped to the prose fields the way the
`ATTRIBUTION` check already is, `captivating-the-king` cannot appear on any pick list.** Do not
rewrite good copy trying to find a filler word that was never there.

### Reciprocity warnings are often correct

Page A recommends what page B says to skip. **Taste travels one way**, so many of these are right
and are kept on purpose. Current baseline: **37 warnings, 0 errors.** The 17 inherited ones plus
`itaewon-class` picks Misaeng while Misaeng anti-picks Itaewon Class, which is deliberate: Itaewon
Class to Misaeng is an upgrade, because Misaeng is the show Itaewon Class keeps gesturing at and
never becomes. The reverse offers a revenge fantasy to somebody who just watched a show about a
system that does not lose.

**New in batch 12 part A, all deliberate, all one-way upgrades.** In each case the pick direction is
somebody trading up in weight and the anti-pick direction is somebody being handed consolation they
did not ask for:

- `alchemy-of-souls` picks Moon Lovers, Moon Lovers anti-picks Alchemy of Souls. Alchemy resets its
  stakes between arcs, which is exactly the comfort Moon Lovers spends twenty episodes refusing.
- `business-proposal` picks Because This Is My First Life, First Life anti-picks Business Proposal.
  Farce to deadpan is a graduation. Deadpan to farce is a tonal crash.
- `goblin` picks Hotel del Luna, Hotel del Luna anti-picks Goblin. Goblin exists so loss can be
  undone. Hotel del Luna is a sentence being served.
- `hospital-playlist` picks Dear My Friends, Dear My Friends anti-picks Hospital Playlist. Warmth to
  weight works. Weight to warmth is a dodge.
- `reply-1988` picks Weightlifting Fairy, Weightlifting Fairy anti-picks Reply 1988. Reply is an
  ensemble about a street. Somebody who wanted one relationship handled well gets the wrong show.

**New in batch 14, four of them, and every one is the deliberate one-way shape.** Baseline is now
**41 warnings, 0 errors.**

- `extraordinary-attorney-woo` picks Juvenile Justice, and `juvenile-justice` anti-picks Extraordinary
  Attorney Woo. Warmth to weight is a graduation. Weight to warmth, straight out of ten hours where no
  outcome feels like justice, is being handed a comfort blanket you did not ask for.
- `its-okay-to-not-be-okay` picks Navillera, and `navillera` anti-picks It's Okay to Not Be Okay.
  Stylised to restrained is an upgrade. Restrained to stylised hands somebody who just watched a show
  where nobody performs their pain a show built entirely on performance.
- `reborn-rich` picks Vincenzo, and `vincenzo` anti-picks Reborn Rich. Same appetite, and only one of
  them lands its ending, so the pick direction is a repair and the reverse is a sixteenth episode
  nobody deserves.
- `reborn-rich` picks Misaeng, and `misaeng` anti-picks Reborn Rich. Chaebol fantasy to corporate
  reality is trading up. The reverse offers a revenge fantasy to somebody who just spent twenty hours
  learning that the system does not lose.

**New in batch 13, twelve of them, all the same one-way shape.** The pick direction is somebody
trading up in momentum, weight or craft. The anti-pick direction is somebody being handed a slower,
meaner or less finished show than the one they enjoyed:

- `sky-castle` picks Little Women, Pyramid Game and The Glory, and all three anti-pick SKY Castle.
  Correct in both directions and the cleanest example on the site. SKY Castle earns the right to
  send you somewhere faster after nineteen hours of arguing. A thriller cannot send you back to
  nineteen hours of arguing.
- `extraordinary-you` picks Lovely Runner, Lovely Runner anti-picks Extraordinary You. Same premise,
  and only one of them commits to it. Broken idea to fixed idea is a repair. The reverse hands
  somebody a show that abandons its own hook in the thirties.
- `the-k2` picks Vagabond, Vagabond anti-picks The K2. Written into both pages on purpose. Same
  appetites, and a 6.38 written-review average against 9.5.
- `descendants-of-the-sun` picks Vagabond, Vagabond anti-picks Descendants of the Sun. Romance to
  conspiracy is an escalation. Conspiracy to romance removes the reason to watch.
- `cheese-in-the-trap` picks Weightlifting Fairy, Weightlifting Fairy anti-picks Cheese in the Trap.
  Unease to warmth is a palate cleanser. Warmth to unease is an ambush.
- `kingdom` picks Gyeongseong Creature and Strangers from Hell, both anti-pick Kingdom. Kingdom can
  spend a recommendation on either warmth or claustrophobia. Neither can spend one on scale.
- `something-in-the-rain` picks Love Next Door and My Liberation Notes, both anti-pick it. A show
  that collapses in its second half is allowed to hand you a soft landing. A comfort show is not
  allowed to hand you a collapse.
- `the-legend-of-the-blue-sea` picks Destined with You, Destined with You anti-picks Blue Sea.
  Comedy to sincerity works. Sincerity to a show four episodes too long does not.
- `strong-girl-bong-soon` picks Suspicious Partner, Suspicious Partner anti-picks Strong Girl
  Bong-soon. Inherited direction, kept: the comedy-with-a-killer balance only works in one of them.

Every warning must be either fixed or explained. A reader who follows both pages sees a site
contradicting itself.

---

## 7. The write queue

**Current state: 219 entries, 152 pages, 56 entries with no page** (excluding the 11 later-season
entries that correctly get none). Order is search demand, not preference. **Tiers 1 and 2 are empty.**
Everything left is tier 3, 4 or 5, which means everything left is 2024 or newer.

### Batch 13 is closed, and its pages now carry their research

All 24 pages shipped 2026-09-05: `its-okay-thats-love`, `taxi-driver`, and a page for every one of the
22 batch 12 part C entries. **The deliberately-pageless list is now empty.** They were written from the
MDL cache alone, then **all 24 were reworked the same day** once the Reddit research existed. What the
rework changed, so nobody repeats it: a fan-voice fact in every standfirst, six new picks that came out
of the research (`king-the-land`, `marry-my-husband`, `its-okay-to-not-be-okay`, `strong-girl-bong-soon`,
`whats-wrong-with-secretary-kim`, `chicago-typewriter`), Alchemy of Souls promoted over Hotel del Luna on
`a-korean-odyssey` because it is the show fans send droppers to, and Goblin added as an anti-pick on
`the-legend-of-the-blue-sea` because they aired opposite each other. Links went 768 to 774 reverse,
569 to 575 list to list, 205 to 206 anti-picks. Two things in the plan were wrong and are corrected here:

- Section 7 previously said `its-okay-thats-love` needed **an entry and a page**. It already had a
  complete entry with meters, hook note, ending and verdict. It was pages only, and so was
  `taxi-driver`. Count from `dramas.json`, not from the last checklist.
- **Batch 12 parts B and C were already complete in the repo.** `strong-girl-bong-soon` and
  `descendants-of-the-sun` had entries and pages, and all 22 part C entries existed. Any checklist
  still listing them as open is stale.

`taxi-driver` was the worst internal-linking hole on the site at 17 inbound pick lists and no page.
That is now closed, which is most of why list-to-list jumped 396 to 569.

### Batch 14 is closed. 23 pages, and tier 2 is finished

All 23 shipped 2026-09-05, pages only, `dramas.json` untouched: `my-love-from-another-star`,
`reply-1997`, `our-blues`, `thirty-nine`, `juvenile-justice`, `my-name`, `mouse`, `mr-queen`, `run-on`,
`tale-of-the-nine-tailed`, `mystic-pop-up-bar`, `lost`, `law-school`, `navillera`, `racket-boys`,
`youth-of-may`, `at-a-distance-spring-is-green`, `reborn-rich`, `tomorrow`, `through-the-darkness`,
`if-you-wish-upon-me`, `revenge-of-others`, `summer-strike`. **Every one was written from
`reddit-batch14-fan-voice.md` first and the cache second**, which is the order section 1 step 3 now
requires, and no scraping was needed because the research was already on disk.

The three structural instructions from the research all shipped in the opening lines where they
belong: Our Blues explains the anthology and gives permission to skip the first three episodes,
Thirty-Nine corrects the mis-sell in sentence one, and Mouse opens with do not read anything first,
including the poster. Four more turned out to be worth the same treatment: Tale of the Nine-Tailed
answers the ending question before anything else because that is the only reason anyone searches it,
Run On warns about the dialogue and names episode three, Racket Boys names episodes one and two as the
worst two, and Reborn Rich says the romance is skippable and the sixteenth episode is the problem.

**What the fan voice changed that the cache would never have produced:** The K2 style verdicts on what
a show is actually for, Mr. Queen's drop points at nine and eleven, the Reborn Rich romance being
literally skippable, Summer Strike's murder plot carrying both the complaint and its own best defence,
Thirty-Nine's third friend being the best-written and least-served, and Tomorrow never once putting a
professional on screen, which is why `daily-dose-of-sunshine` is a pick on that page.

### Tier 3 is next, and one title in it is blocked

**21 pages, 2024, writing only.** Meters and verdicts exist for all of them. `captivating-the-king` is
the one that cannot ship: `BANNED` in the validator is grepped against the whole page blob, and the
seed slug itself contains the word, so the file fails the moment it exists. Proven by test on
2026-09-05, not inferred. Writing that page needs the ten-line validator fix in
`known_issues.captivating_collision` first, so write the other twenty and leave it.

Order inside tier 3 is demand, and the cross-pick rule in 3d applies harder here than anywhere: most
of these titles are already picks on existing pages, so check the inbound list before ranking.

### Tier 3: the 2024 writing backlog, 21 pages

Meters and verdicts exist, so this is writing only. Reddit first, per section 5b, and it has not been
run on any of these.

`hierarchy`, `the-trunk`, `jeongnyeon`, `good-partner`, `chief-detective-1958`, `the-frog`,
`the-whirlwind`, `knight-flower`, `uncle-samsik`, `blood-free`, `captivating-the-king`,
`no-gain-no-love`, `miss-night-and-day`, `brewing-love`, `the-auditors`, `connection`, `doubt`,
`nothing-uncovered`, `bitter-sweet-hell`, `serendipitys-embrace`, `the-impossible-heir`

### Tier 4: 2025, 19 pages

`karma`, `mercy-for-none`, `nine-puzzles`, `dear-hongrang`, `hyper-knife`, `buried-hearts`,
`the-tale-of-lady-ok`, `love-scout`, `the-price-of-confession`, `trigger`, `tastefully-yours`,
`the-potato-lab`, `dynamite-kiss`, `beyond-the-bar`, `law-and-the-city`, `oh-my-ghost-clients`,
`the-haunted-palace`, `genie-make-a-wish`, `typhoon-family`

### Tier 5: 2026, 16 pages. Last, on purpose.

**Check airing status on every one before writing. Never write an ending label for a show mid-run.**

`phantom-lawyer`, `gold-land`, `if-wishes-could-kill`, `notes-from-the-last-row`,
`the-legend-of-kitchen-soldier`, `reborn-rookie`, `the-apartment-job`, `bloody-flower`,
`our-universe`, `our-sticky-love`, `sirens-kiss`, `spooky-in-love`, `spring-fever`,
`the-art-of-sarah`, `the-judge-returns`, `see-you-at-work-tomorrow`

### Entries still owed, not just pages

- **Finish 2023.** About 20 cached titles have no entry. Best of them by watcher count: Perfect
  Marriage Revenge, A Time Called You, Behind Your Touch, Celebrity, Doctor Cha, Doona!, Agency,
  Song of the Bandits, Our Blooming Youth, Duty After School (cache holds Part 1 only, 6 episodes),
  Numbers, Payback, Pandora: Beneath the Paradise, The Escape of the Seven.
- **Skip on purpose:** Strong Girl Nam-soon (7.2, and it needs a Strong Girl Bong-soon season group
  that does not exist), Heartbeat (7.4, collapses after episode 4), The Uncanny Counter 2 (cache
  line resolved to the wrong page), Ask the Stars (resolved to When the Stars Gossip, 2025).
- **Season group gaps:** Stranger / Secret Forest 2 (2020) has no entry. Sweet Home has no group at
  all and needs one before Sweet Home 2 can be added. Kingdom Season 2 and Kingdom: Ashin of the
  North have no entries, and `kingdom` now has a page, which makes that gap more visible. The Glory
  stays **one** entry.
- **Re-run MDL with exact titles** on the four sequel lines in 5a.

### Rules of thumb

- A page is only finished when every pick in it has a real `endingText` and a real `hookNote`.
- Never publish a page with fewer than five picks.
- Never write an ending label for a show that is still airing.
- Revisit any page older than a year: streaming rights and taste both move.
- Write the page for whatever people search most, not whatever you watched most recently.
- **Check the entry before you plan the work.** Two of the three "needs an entry and a page" items
  in the last cut of this section already had complete entries.

---

## 8. Batch handoff

### What goes in the zip

1. `data/dramas.json`, complete, if any entry changed.
2. Every new or changed `data/pages/<slug>.json`.
3. `PROJECT-STATE.json`, updated: counts, build totals, a new batch block, open items.
4. **This file**, updated: section 7 re-cut, the results table below appended, any new gotcha
   written into section 4 or 5 so the next batch does not rediscover it.

Jack commits from the GitHub web UI, so hand over complete copy-paste-ready files with the folder
structure intact, never fragments and never diffs. Anything he runs himself has to work from a
browser or arrive as a finished file.

### What the handoff message says

The numbers before and after, what shipped, what is still open, every warning that survived and why,
and anything in the plan you found to be wrong. Then one question: what next.

### Batch results log

Keep this short. One row per batch, newest first.

| Batch | Date | Entries | Pages | Sitemap | Reverse | List to list | Anti-picks | Notes |
|---|---|---|---|---|---|---|---|---|
| 14 | 2026-09-05 | 219 | 129 to 152 | 365 to 388 | 774 to 891 | 575 to 843 | 206 to 237 | Tier 2 closed. 23 pages, zero entries touched, Reddit-first on every one from research already on disk, so no scraping and no spend. Biggest link jump of any batch: cross-picking the pages that already picked each seed. Warnings 37 to 41, all four deliberate |
| 13R | 2026-09-05 | 219 | 129 | 365 | 768 to 774 | 569 to 575 | 205 to 206 | Rework, not new pages. All 24 batch 13 pages rewritten from reddit-batch13-fan-voice.md, plus 6 new picks and 1 new anti-pick. Batch 14 research done in the same session: 23 titles, ~1,090 items, ~$1.65, 22 of 23 rich |
| 13 | 2026-09-05 | 219 | 105 to 129 | 341 to 365 | 626 to 768 | 396 to 569 | 195 to 205 | 24 pages, zero entries touched. its-okay-thats-love, taxi-driver and a page for all 22 former part C entries, which empties the pageless-by-design list. The 'Reddit confirmed exhausted' claim in the original row was wrong, see 5b |
| 12A | 2026-09-05 | 219 | 87 to 105 | 323 to 341 | 525 to 626 | 249 to 396 | 165 to 195 | The 18 remaining part A pages. Pages only, zero entries touched. Picks ranked by shared writer then director then cast then tags. Found the captivating validator trap and the Reddit index route |
| 12 | 2026-09-05 | 195 to 219 | 83 to 87 | 296 to 323 | 508 to 525 | 239 to 249 | 135 to 165 | Parts B and C complete, 2 part A pages, misaeng rebuilt, Mouse re-derived, comfort rule amended |
| 11 | 2026-08-26 | 183 to 195 | 64 to 83 | | | | | The 2023 slate. Year-end roundup did the whole research job |
| 10 | 2026-08-26 | 183 | 54 to 64 | | | | | Pages only, 2024 slate |
| 9 | 2026-08-26 | 142 to 183 | 48 to 54 | | | | | The 2024 line plus the Squid Game and Gyeongseong season groups |
| 8 | 2026-08-25 | 89 to 142 | 31 to 48 | | | | | 2025 and 2026 built from the MDL cache |

### Corrections shipped in batch 14, 2026-09-05

- **A missing cache row does not block a batch.** Five catalog entries have no cache row at all and one
  is cached under different capitalisation. Section 5b gotcha 15 has the list and the rule: check
  `dramas.json` first, and match cache keys case-insensitively.
- **The attribution ranking degrades on standalone titles.** 3 of 20 top picks this batch against 16 of
  24 last batch. Section 5b gotcha 14 explains when to trust it and when to let the research overrule
  it. This is not a reason to skip the ranking, it is a reason to stop treating its number one as an
  answer.
- **`captivating-the-king` cannot have a page, not just a pick row.** The old note said it could not
  appear on a pick list. Tested 2026-09-05: the seed slug alone fails the validator, so the page itself
  is blocked until the check is scoped to the prose fields.
- **Cross-picking is the highest-return move in the linking model** and it was not written down
  anywhere. Now in 3d, with the batch 14 numbers.
- **GA and Search Console now have real data**, which closes the check that had been open for three
  deploys. Numbers and what they mean live in `PROJECT-STATE.json` under `current_status.analytics` and
  `search_console`. The short version for editorial purposes: the `dramas-like` list pages average
  position 8.3 in search while the drama pages average 25.4, so pages are the asset and this queue is
  pointed the right way.

### Corrections shipped in the batch 13 rework and batch 14 research, 2026-09-05

- **Research that is not in the pages is not done.** The batch 13 handoff shipped a research file and
  left the 24 pages exactly as the cache had written them. Fixed: all 24 reworked. Rule now in 5b.
- **The three-subreddit allowlist is gone**, replaced by Jack's name-tells-you rule plus a living map.
  r/KdramaCasualTalk, r/KDramasWorld, r/KDRAMACHINGU are in, r/KDramaDiscussions and r/dramasect were
  added on evidence from this run, r/manhwa and r/webtoons are allowed for adaptation questions only.
- **`maxPostsCount` is per search term. Confirmed a third time**, 23 terms at a cap of 8 returned 178.
- **Common-word titles cannot be searched unscoped**, even with `kdrama` appended. Run On, Lost, Mouse
  and Tomorrow all proved it in one sweep. Gotcha 9.
- **The scoped r/KDRAMA index run is usually redundant**, because the unscoped sweep already returns
  r/KDRAMA rows. 138 items bought nothing. Gotcha 11. Stage 1 is three runs now, not four.
- **Mega-threads are not verdict threads.** 523 comments on the Tomorrow finale, top twelve were jokes.
- **`lost` is genuinely thin on Reddit**, and that is now a documented finding rather than an assumption:
  four sweeps, two fetches, nothing above 20 upvotes. It is also the one title whose Reddit contribution
  is a single fact, the My Mister pairing, which is worth having.

### Corrections shipped in batch 13, so nobody re-argues them

- **`its-okay-thats-love` and `taxi-driver` already had entries.** The section 7 line claiming they
  needed entries was wrong for both. Pages only.
- **Batch 12 parts B and C were already in the repo.** Verify against `dramas.json` and
  `data/pages/` before accepting any checklist as open work.
- **Both Reddit thread series are exhausted, and now enumerated.** Twenty titles between them, none
  of them a batch 13 seed. See 5b gotcha 6b. Do not spend another run proving this.
- **The gap-signal sentence is an attribution minefield.** Writing about an aggregate score versus a
  written-review average pulls "the crowd" and "the audience" out of you without noticing. Three
  errors in batch 13, all of that exact shape. Name the numbers, never the people holding them.

### Corrections shipped in batch 12, so nobody re-argues them

- **Mouse (2021) was derived from Mousetrap (2026).** Re-derived from the real row (8.9 from 45,167
  ratings, 20 episodes, 75 min, tvN, 18+, rewatch 7.08, story 7.83, curve 8.4 to 9.5 with no
  decline): runtime 70 to 75, pace 4 to 3, comfort 1 to 2, hook 3 to 2, ending Bittersweet to May
  divide viewers, verdict rewritten. `romance 0` and `heavy 5` were already right.
- **The comfort rule was wrong on small samples.** Amended in section 4, with the seven clamps it
  reproduces.
- **The "112 pageless entries" figure overstated the work.** Later-season entries correctly get no
  page. Count from the data, not from the last doc.
- **Shared screenwriter and director beat everything else as a pick signal.** Ranking the whole
  catalog against a seed by writer, then director, then cast, then vote-ranked tag overlap, then
  meter distance produced the top pick on 14 of the 18 part A pages before any judgement was
  applied. Build that ranking first on every future batch. It found One Spring Night and Something
  in the Rain sharing writer, director and lead, Live and It's Okay That's Love sharing writer,
  director and two cast members, and Weightlifting Fairy and The Light in Your Eyes sharing a writer
  despite being tonal opposites, which is why the second is an anti-pick on the first rather than a
  pick.
- **`CONTENT-QUEUE.md` had a stale page-owed line.** D.P. Season 2 already had a page. The pages
  actually owed were the season one slugs, `taxi-driver` and `tale-of-the-nine-tailed`. Fixed, and
  that file is now folded into section 7 of this one.
