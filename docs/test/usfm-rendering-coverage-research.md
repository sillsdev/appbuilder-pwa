# USFM Rendering Coverage: Research & Design Report

Status: **research/design only — no test framework has been implemented yet.**
Scope: how to build a regenerable test-coverage system that verifies USFM (+ SAB-specific SFM)
constructs are correctly converted through Proskomma/Sofria and rendered to HTML by the PWA.

This document distinguishes **verified facts** (with file/line or URL citations) from
**recommendations** (marked as such). Where something could not be verified, it is flagged
explicitly rather than assumed.

At the time of writing, the repo is checked out on branch `refactor/proskomma-render-actions`
(the branch for PR #1090), with `proskomma-core@0.11.3` and `proskomma-json-tools@0.9.1`
installed (`node_modules/*/package.json`).

The refactored renderer lives at `src/lib/render-sofria/*Feature.ts`
(plain exported TypeScript modules) plus a new wrapper component
`src/lib/components/ScriptureViewProskomma.svelte`. The legacy renderer,
`src/lib/components/ScriptureViewSofria.svelte`, remains in the tree and is still what ships
today. See §F and §H for why this matters for testability.

---

## A. USFM grammar findings

**Source of research**: a background agent fetched raw file content directly from
`usfm-bible/tcdocs` (via `raw.githubusercontent.com` and the GitHub Contents API) rather than
relying on summarized web results, after an earlier pass produced at least one wrong claim
("no z-namespace markers present") that direct fetching corrected. Facts below are from that
verified pass unless marked `[inference]`/`[unverified]`.

### What `grammar/usfm.ext` is

`grammar/usfm.ext` (1399 lines, 310 `\marker` entries) is **not** a parser-generator grammar
file. It's a flat, backslash-tagged key/value list — using USFM-like syntax to describe USFM
itself. The only fields that occur anywhere in the file are:

```
\marker \attributes \category \description \closes \closedby \defattrib
```

Representative real excerpt (lines 792–821):

```
\marker qt-s
\attributes sid? who?
\category milestone
\closedby qt-e
\defattrib who

\marker qt-e
\attributes eid?
\category milestone
\closes qt-s
\defattrib eid
```

and (lines ~1324–1328):

```
\marker w
\attributes lemma? srcloc? strong?
\category char
\defattrib lemma
```

Field meanings (confirmed against the file plus the prose spec at
`docs.usfm.bible/usfm/3.1.2/extensions.html`, "User Extensions"):

- **`\marker`** — bare marker name (no `\`, no `+`, no trailing `*`).
- **`\attributes`** — space-separated legal attribute names; trailing `?` = optional, unmarked =
  required (e.g. `\c` has `\attributes altnumber? number pubnumber?` — `number` required).
- **`\category`** — one or more space-separated syntactic tags. Values actually present:
  `attribute, char, crossreference, crossreferencechar, footnote, footnotechar, header,
  internal, introchar, introduction, introlist, list, listchar, milestone, otherpara,
  periphpara, sectionpara, title, versepara`.
- **`\description`** — free text. Deprecation is only ever signaled as prose inside this field
  (e.g. `(DEPRECATED - used nested char@style pn)` on `addpn`) — there is **no** dedicated
  deprecated flag.
- **`\closes` / `\closedby`** — on `category milestone` pairs, names the sid/eid partner.
- **`\defattrib`** — which attribute receives an unlabeled/positional value.

### `usfm.ext` alone is not sufficient

This is explicit in tcdocs' `docs/USFMTC Versioning.md`: patch-level version bumps are
"implemented through additions to the marker.ext and no changes to the parser" — i.e. the base
grammar is designed to be layered with project-specific marker files. To build a complete
inventory you need, in addition to `usfm.ext`:

- **`grammar/changes.txt`** — the per-version delta log (3.1, 3.1.1, 3.1.2, 3.2-in-progress).
- **A project/tool-specific `markers.ext`** — the officially sanctioned extension mechanism
  (see below). tcdocs ships an example at `tests/markers.ext`:
  ```
  \marker zaln-s
  \category milestone

  \marker zaln-e
  \category milestone

  \marker k-s
  \category milestone
  ...
  \marker zms
  \category milestone
  ...
  ```
  This confirms `zaln-s/-e` (word-alignment), `k-s/-e`, `zms` are **not** in the base
  `usfm.ext` and must be supplied per-project/tool — exactly the mechanism SAB's own `z*`
  markers should use (see §E).
- **`grammar/usfm3_1.sty` and `grammar/usfm_sb.sty`** — Paratext stylesheet files, a richer,
  independent catalog (335 `\Marker` entries vs. 310 in `usfm.ext`), with fields `usfm.ext`
  lacks: `\Endmarker` (explicit end-marker name), `\OccursUnder` (an actual parent-marker
  whitelist — real nesting grammar, not just a category tag), `\TextProperties` (see below),
  `\Rank`, `\TextType`.
- **`grammar/usx.rng`/`usx.rnc`** (RelaxNG schema) and **`grammar/usj.js`** (JSON Schema for
  USJ) — describe structural/nesting rules that `usfm.ext` doesn't encode on its own.
- **`markers/<category>/<name>.adoc`** files — per-marker prose docs (e.g. `markers/char/w.adoc`)
  used to build the docs site; not machine-parseable inventory data, but the human-authored
  source of descriptions.

### Numbered marker families (q/q1/q2, s/s1/s2, ili/ili1/ili2)

**Literal, individually-written entries — not a range or regex.** `q`, `q1`, `q2`, `q3`, `q4`
are each their own `\marker` block (`q` = "if single level", `q1` = "if multiple levels" —
near-duplicate semantics, still separate entries). Same for `mi`/`mi1..4`, `s`/`s1..4`,
`ili`/`ili1..2`. There is no wildcard support today; tcdocs' own 3.2 roadmap document proposes
*adding* wildcard syntax to `markers.ext` in the future — confirming it doesn't exist yet.
**Recommendation**: our generator should detect the numbered-family naming convention itself
(regex over marker names, e.g. `^(q|s|mi|ili|imt|toc)(\d*)$`) rather than expecting the grammar
to declare it, since the grammar doesn't.

### Nested/variant markers (`\+w`, `\+q1`)

Not represented in the grammar at all — no marker name in `usfm.ext` contains `+`. Per
`docs.usfm.bible/usfm/3.1.2/release-notes.html`: *"Use of the `+` prefix for nested USFM
character markup is supported but is deprecated... future versions of USFM may remove support
for the `\+` syntax entirely."* `\+w` and `\w` are the same grammar entry; nesting-prefix
handling is a parser-layer concern outside `usfm.ext`'s scope.

### Word-level attributes

Declared inline via `\attributes`/`\defattrib` on the marker itself (e.g. `\w` →
`\attributes lemma? srcloc? strong?`, `\defattrib lemma`). There is no separate
attribute-schema file. `\f` (footnote) is structurally different — its content comes from
nested sub-markers (`\fr`, `\ft`, `\fk`, `\fq`, `\fqa`, each its own `category
footnote/footnotechar` entry), not from pipe attributes.

### Milestones and the `z`-namespace convention

Standard paired milestones (`qt-s/-e`, `qt1..5-s/-e`, `t-s/-e`, `ts-s/-e`, plus a bare `ts` and
a `ref` milestone) are directly in `usfm.ext`. **`z`-prefixed markers do not appear in the base
file at all.** The private-use convention is explicitly documented at
`docs.usfm.bible/usfm/3.1.2/extensions.html` ("User Extensions"):

> "Users may create and use non-standard markup extensions. User created markers should always
> begin with `z`... User extended markup is NOT considered part of the USFM/USX standard... A
> basic specification for markup extensions used in a text should be provided in a file named
> `markers.ext`."

That page gives the canonical field set for a *user-authored* `markers.ext`: `\marker`,
`\category` (fixed vocabulary), `\description`, and repeatable `\attribute` lines — this is the
spec-blessed schema SAB's own extension file should mirror (see §E). This directly confirms
that SAB's `\zvideo-s`, `\zstyle`, `\zcstyle`, `\zaudioc`, `\zreflink`, etc. (see §D) are using
the private-use namespace exactly as intended, and that they *should* have a `markers.ext`-style
declaration — they currently don't.

### Deprecated markers

No boolean/field — only free text inside `\description` (8 occurrences in `usfm.ext`: `addpn,
fdc, h1, h2, ide, ph1, rb, xdc`). The `.sty` file is more systematic: it prefixes `\Name` with
the literal string `DEPRECATED` (13 occurrences) — still not a clean boolean field, but
grep-able. Per `docs/USFMTC Versioning.md`, deprecated syntax is only actually *removed* on a
major version bump; a patch bump may only *mark* something deprecated.

### Non-content-producing markers

`usfm.ext` gives these `category internal` (e.g. `id`, `c`) or `category attribute` (e.g.
`usfm`, `ca`, `cp`) — coarse, with no clean "does this produce visible/publishable text" axis.
**The `.sty` file is much better here**: its `\TextProperties` field carries explicit tokens
like `nonpublishable nonvernacular book` (on `\Marker id`) vs. `publishable vernacular` on
ordinary content markers. **Recommendation**: use `.sty`'s `\TextProperties`, not `usfm.ext`'s
`\category`, as the "should this ever produce visible HTML" signal in the generated inventory.

### Is there a better machine-readable source than `usfm.ext`?

Yes, two candidates found within the same repo, both richer:

1. **`grammar/usfm3_1.sty`** — 335 markers, with `\Endmarker`, `\OccursUnder`,
   `\TextProperties`, `\Rank`, `\TextType` — almost certainly Paratext's actual runtime
   catalog, and the single most battle-tested source available.
2. **`tests/*/*/origin.json`** (USJ) alongside `origin.usfm`/`origin.xml`/`metadata.xml` per
   test case — a genuine machine-readable, standards-body-authored ground truth for *parsing
   behavior*, and a strong precedent for our own fixture format (see §F, §I).

**Recommendation**: treat `usfm.ext` + `usfm3_1.sty` as a **combined** authoritative source —
`usfm.ext` for attribute/category/milestone-pairing metadata, `.sty` for `TextProperties`,
`OccursUnder`, and explicit `Endmarker`/deprecation flags that `usfm.ext` lacks.
`[unverified]`: whether a JSON/YAML version of `.sty` exists anywhere outside tcdocs' mirrored
copy — not found.

### Current spec version and how to track it

Confirmed current released version: **USFM 3.1.2** (`docs.usfm.bible/usfm/3.1.2/`), with 3.2
"in discussion" per tcdocs' `docs/USFMTC Roadmap.md`. There is a real changelog
(`docs.usfm.bible/usfm/3.1.2/release-notes.html`, mirrored by `grammar/changes.txt` in tcdocs)
with dated per-version Additions/Revisions sections. `docs/USFMTC Versioning.md` is the
authoritative policy doc explaining what each version-number digit is allowed to mean (patch =
additive-only via `markers.ext`, minor = syntactic expansion, major = breaking removal of
deprecated syntax) — this maps directly onto how "risky" a regenerated-inventory diff is.

**Recommendation for versioning our own artifacts**: because `usfm.ext` lives on a moving
branch (not a tagged release) in tcdocs, record **both** the USFM spec version string (parsed
out of `docs.usfm.bible` or `changes.txt`) **and** the exact git commit SHA of the vendored
`usfm.ext`/`.sty` snapshot we generated from — the version string alone is not enough to
reproduce a build. See §G.

### tcdocs conventions worth mirroring (rather than inventing our own)

- The `markers.ext` extension-file schema itself — reuse it verbatim for SAB's declarative
  source (§E), rather than inventing a new schema.
- The **`tests/` fixture-directory convention** (from tcdocs' own `tests/readme.md`): one
  directory per test case (e.g. `tests/paragraph/ip/bad/test1/`), containing `origin.sfm`,
  parallel `origin.xml` (USX)/`origin.json` (USJ) serializations, and a `metadata.xml` with a
  `description`, a `validated` state (`pass`/`fail`/indeterminate), and tags (`clarify`,
  `exemplar`, `stress`, `sample`). This directory-per-case + declarative-metadata pattern is the
  strongest concrete precedent found for our fixture design (§F, §I) — authored by the standard's
  own body, so shaping ours similarly keeps future interop plausible.
- Versioning discipline (patch = additive/`markers.ext`-only) directly informs how "risky" a
  regenerated diff is and whether it should be a blocking or advisory CI signal (§G).

---

## B. USFM rendering taxonomy

Derived from `usfm.ext`'s `\category` field, `.sty`'s `\TextProperties`, and — critically — how
Proskomma's Sofria event stream and the current renderer actually treat each category (verified
by reading `src/lib/components/ScriptureViewSofria.svelte` line-by-line, not assumed):

| Taxonomy group | Grammar category source | Proskomma/Sofria event | Renderer behavior today (verified) |
|---|---|---|---|
| Book identification/metadata (`\id`, `\ide`, `\h`, `\toc1-3`, `\usfm`) | `internal`/`attribute`/`header` | consumed at document-header level, not emitted as body events `[inference — not traced further, out of scope for HTML rendering]` | Not rendered inline; used upstream in `convert/` for catalog/config generation. |
| Chapter markers (`\c`) | `internal` | `startChapter`/`endChapter` + `mark subType usfm:chapter_label` (namespaced mark) | `chapter_label` mark → chapter-number div (`ScriptureViewSofria.svelte:2496-2530`-adjacent region; new renderer: `ChapterNumberFeature.ts`). |
| Verse markers (`\v`) | `internal` | `startVerses`/`endVerses` + `mark subType usfm:verses_label` | `verses_label` mark → verse-number span (old: inline; new: `VerseNumberFeature.ts`, `util.ts:addVerseNumberRange`). |
| Alternate/publishable numbering (`\ca`, `\cp`, `\va`, `\vp`) | `attribute` | `mark` with `subType` presumably `alt_chapter/alt_verse/pub_chapter/pub_verse` (fixed Sofria enum, confirmed in schema) | **Not handled** by current renderer — no case matches these subtypes. Gap, see §H. |
| Paragraph markers (`\p`, `\m`, `\pi`, `\q1-4`, `\pc`, `\b`, etc.) | `versepara`/`otherpara` | `startParagraph`/`endParagraph`, `block.subType` | Generic: `<div class="{subtype}">`. Special case: `b` also appends `&nbsp;`. (Old: `ScriptureViewSofria.svelte:1642-1673`; new: `MainTextFeature.ts:11-19`.) |
| Character markers (`\add`, `\bd`, `\it`, `\nd`, `\sig`, `\bk`, `\ord`, `\qs`, `\tl`, `\dc`, …) | `char` | `startWrapper`/`endWrapper` `subType usfm:<name>` | Generic fallback: `<span class="{name}">text</span>` (`ScriptureViewSofria.svelte:536-566` `addTextNode`/`usfmSpan`). **All of these share one rendering behavior** — one parametrized test covers dozens of markers. |
| Character markers with unique behavior (`\wj`, `\w`, `\xt`) | `char` | same `startWrapper` path, explicitly special-cased | `\wj` → conditionally wrapped in `<span class="wj">` gated on a "show words of Jesus" setting; `\w` → glossary-match `<a class="glossary">` or plain span depending on a setting, uses `lemma` attribute; `\xt` → sets `innerHTML` instead of text content. Each needs its **own** dedicated fixture. |
| Figures (`\fig`) | `char` (per `.sty`, actually a distinct figure marker family) | `startWrapper`/`endWrapper subType usfm:fig` | Dedicated: builds an image block (`addFigureDiv`) inserted into the paragraph on `endWrapper`. Pre-processed heavily in `convert/convertBooks.ts` (caption/missing-image handling, see §D). |
| Hyperlinks (`\jmp`) | not in base `usfm.ext` `[unverified — likely added in 3.1.2+, agent did not confirm exact version it was introduced]` | `startWrapper`/`endWrapper subType usfm:jmp` | Dedicated: `prepareJmpLink`/`addJmpLink`, produces an `<a>`. |
| Footnotes/cross-references (`\f...\f*`, `\x...\x*`) | `footnote`/`crossreference` (container) + `footnotechar`/`crossreferencechar` (children `\fr`,`\ft`,`\fk`,`\xo`,`\xt`,…) | `inlineGraft` `subType xref\|footnote`, nested sub-sequence | Dedicated: `createFootnoteDiv`, builds a caller `<span>` + popup content div, appended to the current phrase/heading/title container depending on context (`ScriptureViewSofria.svelte:2314-2347`). Structurally the most complex construct — deserves its own compound fixture (nested char markers *inside* a footnote, e.g. `\fq`/`\ft` mixed with `\add`). |
| Note callers (`\fp`? / automatic caller machinery) | n/a — Sofria-level `subtype note_caller` | `inlineGraft subType note_caller` | Handled, pushes/pops `textType` stack; `[unverified]` exact visible HTML difference from footnote — not traced in this pass. |
| Introductions (`\imt`, `\ip`, `\iot`, …) | `introduction`/`introchar`/`introlist` | `blockGraft subType introduction` (out-of-line sequence) | Conditionally rendered based on a "show introduction" flag (`ScriptureViewSofria.svelte:2261-2266`). Not yet ported to render-sofria (§H). |
| Section headings (`\s`, `\s1-4`, `\r`, `\ms`, `\mr`) | `sectionpara` | `startParagraph`, `block.subType` | Falls into the same generic paragraph-div path unless separately special-cased — `[unverified — not traced whether headings get distinct div structure vs. plain paragraph class]`. |
| Titles (`\mt1-4`, `\imt1-4`) | `title` | `blockGraft subType title` | Conditionally rendered (`ScriptureViewSofria.svelte:2267-2269`, `titleSpan`). Not yet ported to render-sofria. |
| Lists (`\li1-4`, standard USFM) | `list`/`listchar` | `startParagraph`, `block.subType` | `[unverified — not traced; SAB does not appear to author standard `\li` markers, instead using its own `\zuli`/`\zoli`/`\zon` extensions, see §D]`. |
| Tables (`\tr`, `\tc1-9`, `\th1-9`) | not fully categorized by `usfm.ext` alone; `.sty` likely has explicit table fields `[unverified]` | `startRow`/`endRow`, `startWrapper subType cell` | Dedicated: builds `<table><tr><td class="tc{n}">`. `convert/convertBooks.ts:311-318` (`addParagraphMarkersAroundTableRows`) wraps table row runs in `\p`/`\p` first — a SAB-side pre-processing quirk worth its own fixture. |
| Milestones — standard USFM (`\qt-s/-e`, `\ts-s/-e`) | `milestone` | `startMilestone`/`endMilestone subType usfm:qt`/`usfm:ts` | **Not handled** — no case matches `qt`/`ts` in the milestone switch statements. Gap, see §H. |
| Milestones — SAB private-use (`\zvideo-s/-e`, `\zstyle`, `\zcstyle-s/-e`, `\zaudioc-s/-e`, `\zreflink-s/-e`, `\zuli{n}`, `\zoli{n}`, `\zon{n}`) | not in base grammar; would live in SAB's own `markers.ext`-equivalent | `startMilestone`/`endMilestone subType usfm:z*` (namespaced exactly like standard custom milestones) | Fully explicit, dedicated handling per marker (`ScriptureViewSofria.svelte:2485-2616`). See §D for full inventory. |
| Deprecated markers (`\addpn`, `\fdc`, `\h1`, `\h2`, `\ide`, `\ph1`, `\rb`, `\xdc`) | flagged only via free-text description | whatever their base category implies (mostly `char`/`header`) | No special-case in the renderer — presumably fall through to the generic paragraph/character path. `[unverified — not confirmed to actually round-trip cleanly, e.g. `\rb` (ruby/pronunciation glossing) has non-trivial attribute structure that the generic char-span path may not handle correctly]`. |

**Taxonomy summary** (answering the research brief's own candidate list): book
metadata/chapter/verse/paragraph/character/nested-character/footnotes/xrefs/milestones/tables/
figures/word-attributes/introductions/section-headings/deprecated/extensions all turned out to
be real, distinct categories — but **peripheral material** (`periphpara`) has **no observed
renderer handling at all** and `[unverified]` whether the PWA ever ingests peripheral content
(front/back matter, standalone glossary-as-periph); this needs a product decision, not just a
test (§H).

---

## C. USFM coverage matrix

This is a representative matrix, grouped by demonstrated-identical rendering behavior per §B,
not an exhaustive 310-row dump (the generated inventory in §G will be exhaustive; this table
shows the *shape* of the grouping).

| Marker/construct | Grammar category | Proskomma representation | Renderer behavior | Expected HTML behavior | Test fixture | Status |
|---|---|---|---|---|---|---|
| `\p`, `\m`, `\pi1-3`, `\cls`, `\li1-4` | `versepara`/`otherpara`/`list` | `startParagraph`, `block.subType = <name>` | generic `<div class="{name}">` | one shared param. test: assert wrapping `div` has class = marker name | one fixture per representative marker, shared assertion helper | Supported — grammar+parser+render coverage all green |
| `\b` (blank line) | `versepara` | `startParagraph subType b` | same generic div + forced `&nbsp;` | assert div contains a non-breaking space in addition to class | dedicated (differs from generic group) | Supported |
| `\q1-4` | `versepara` | `startParagraph subType q1..4` | generic div, but relies on CSS for indent levels | assert class only (indent is a CSS/product concern, not an HTML-structure concern — do **not** assert computed style) | shared with generic paragraph group | Supported |
| `\add`, `\bd`, `\it`, `\bk`, `\dc`, `\k`, `\nd`, `\ord`, `\pn`, `\qs`, `\sig`, `\sls`, `\tl`, `\em`, `\no` | `char` | `startWrapper/endWrapper subType usfm:<name>` | generic `<span class="{name}">text</span>` | one shared param. test: assert `<span>` with class = marker name, wrapping the literal phrase text | one minimal fixture per marker sharing one assertion helper; can legitimately be *one* generated test file iterating the whole group | Supported (renderer); **untested today** |
| `\wj` | `char` | `startWrapper subType usfm:wj` | conditionally wrapped span, gated on a setting | two fixtures: setting on → `<span class="wj">`; setting off → plain text, no span | dedicated | Supported; needs 2-state fixture |
| `\w ...\|lemma="..."\w*` | `char` + attribute | `startWrapper subType usfm:w`, `atts.lemma` | glossary `<a class="glossary" match="...">` or plain `<span class="w">` depending on a setting | two fixtures (glossary on/off) + assert `match` attribute value derived from `lemma` | dedicated | Supported; needs 2-state fixture |
| `\xt ...\xt*` | `char` (cross-reference target, inside footnote/xref content) | `startWrapper subType usfm:xt` | `innerHTML` set directly (not textContent) | assert nested markup survives (e.g. embedded `\+bd` inside `\xt`) — this is the one character marker where nested-markup-through matters | dedicated compound fixture | Supported; needs nested-markup fixture |
| `\fig ...\fig*` | figure (own family in `.sty`) | `startWrapper/endWrapper subType usfm:fig` | image block built from `src`/caption attrs, appended to paragraph on close | assert an `<img>`-bearing block with resolved `src`; also test the `convert/convertBooks.ts` pre-processing (`handleNoCaptionFigures`, `removeMissingFigures`, `moveFigureToNextNonVerseMarker`) as separate **conversion-layer** unit tests | dedicated + conversion-layer fixtures | Supported; conversion-layer logic **untested today** |
| `\jmp ...\|href="..."\jmp*` | not in base `usfm.ext` `[unverified version]` | `startWrapper/endWrapper subType usfm:jmp` | `<a>` built from `href`/`title` | assert `<a href>` | dedicated | Supported; **untested today** |
| `\f + ...\f*`, `\x + ...\x*` | `footnote`/`crossreference` container | `inlineGraft subType footnote\|xref`, nested sequence | caller span + popup div, placed depending on surrounding context (phrase/heading/title) | compound fixture: caller + content, and a variant with nested char markup inside (`\ft`, `\fq`, `\add` mixed) | dedicated compound fixtures (≥2: plain, nested) | Supported; **untested today**, high-value target |
| `\qt-s ... \qt-e\*` (quoted text milestone) | `milestone` | `startMilestone/endMilestone subType usfm:qt` | **no matching case found** | `[unverified exact current behavior — likely silently dropped/no visual effect]` | none yet | **Gap — needs product decision before a fixture can be written** (§H) |
| `\ts-s ... \ts-e\*` / bare `\ts` (translator section) | `milestone` | `startMilestone/endMilestone subType usfm:ts` | **no matching case found** | same as above | none yet | **Gap** (§H) |
| `\ca`/`\cp`, `\va`/`\vp` (alt/pub numbering) | `attribute` | `mark subType alt_chapter\|alt_verse\|pub_chapter\|pub_verse` (fixed Sofria enum) | **no matching case found** in chapter/verse-number features | n/a | none yet | **Gap** (§H) |
| `\tr` rows / `\tc1-9`/`\th1-9` cells | table family | `startRow/endRow`, `startWrapper subType cell` | builds `<table><tr><td class="tc{n}">` | compound fixture: multi-row/multi-cell table; also test `addParagraphMarkersAroundTableRows` conversion-layer wrapping | dedicated + conversion-layer fixture | Supported; **untested today** |
| `\imt`,`\ip`,`\iot`,`\ili1-2` (introduction) | `introduction`/`introchar`/`introlist` | `blockGraft subType introduction` | conditionally rendered based on setting | fixture with setting on/off | dedicated | Supported in legacy renderer; **not yet ported** to render-sofria (§H) |
| `\mt1-4` (title) | `title` | `blockGraft subType title` | conditionally rendered | fixture | dedicated | Supported in legacy renderer; **not yet ported** to render-sofria |
| `\rem`, `\ide`, `\usfm`, `\id` | `internal`/`attribute`/`header` | consumed at header/catalog level, not emitted as body render events `[inference]` | not rendered | assert **absence** of any visible HTML for these — a "must not render" test is still real coverage | dedicated negative-assertion fixture | Intentionally unsupported (correct) — should be tested as such, not skipped |
| `\addpn`,`\fdc`,`\h1`,`\h2`,`\ide`,`\ph1`,`\rb`,`\xdc` (deprecated) | varies, flagged only in description text | falls through to base category's normal event path | no special-case; generic fallback | best-effort: assert graceful fallback (doesn't crash, produces *some* reasonable span/div), not a specific product-approved appearance | dedicated, marked low-priority/best-effort | Grammar coverage: yes. Rendering coverage: optional/best-effort by design (§H) |

---

## D. SAB SFM inventory

All entries verified directly in `convert/convertBooks.ts` (filter pipeline, lines 372–385: the
`usfmFilterFunctions` array) and `convert/convertMarkdown.ts`, cross-checked against the
`case 'usfm:z...'` switches in `src/lib/components/ScriptureViewSofria.svelte`
(lines 2485–2616) and `src/lib/scripts/milestoneLinks.ts`.

| SAB SFM | Input syntax | `convertBooks.ts` conversion | Proskomma representation | Renderer behavior | Expected HTML | Test |
|---|---|---|---|---|---|---|
| Video | `\video ID` | `replaceVideoTags` (line 54-61): regex → `\zvideo-s \|id="ID"\*\zvideo-e\*` | `startMilestone/endMilestone subType usfm:zvideo`, `atts.id` | looks up `id` in `scriptureConfig.videos`; if found builds a video block; else treats `id` as a URL (`÷`→`/` unescape) and builds from URL directly (`ScriptureViewSofria.svelte:2532-2550`) | video `<div>`/`<video>` block inserted at the milestone point | **None found** for `replaceVideoTags` or the renderer path |
| Custom paragraph style | `\p_XXX ...` | `replacePStyleTags` (line 62-64): `\(p_[^\s]+)` → `\m \zstyle \|id="$1"\*` (standalone milestone, not a pair) | `startMilestone subType usfm:zstyle`, `atts.id` | adds `id` (the literal `p_XXX` string) as a CSS class on the current paragraph div (`:2560-2563`) | paragraph `<div>` gets an extra class `p_XXX` | **None found** |
| Custom character style | `\c_XXX ...\c_XXX*` | `replaceCStyleTags` (line 65-67): → `\zcstyle-s \|id="c_XXX"\*...\zcstyle-e\*` | `startMilestone/endMilestone subType usfm:zcstyle`, `atts.id` | wraps enclosed content in a `<span class="c_XXX">` (`:2565-2569`) | `<span>` with class = the style id | **None found** |
| Unordered list item, level N | `\zuliN ...` (already `z`-prefixed in native SAB SFM) | `transformZuliTags` (line 78-80): `\zuliN` → `\nb \zuliN\*` (adds a standard `\nb` no-break paragraph before, self-closes as standalone milestone) | `startParagraph subType nb` then `startMilestone subType usfm:zuliN` | adds `list-item`/bullet classes + computed indent/`counterSet` style to the current paragraph div, varying by level (`:2519-2530`) | `<div class="nb list-item ...">` with inline padding/list-style classes keyed by level | **Tested** — `convert/tests/sab/storybookTests.test.ts` covers the `\zuli`→`\nb \zuliN\*` transform itself (`transformLists`), but **not** the renderer's visual output |
| Ordered list item, level N | `\zoliN ...` | `transformZoliTags` (line 82-84): same shape as zuli | `startMilestone subType usfm:zoliN` | numbered list styling via CSS counters, resets deeper levels (`:2499-2518`) | `<div class="nb list-item list-decimal ...">` | Conversion transform **tested** (same file); renderer output **not tested** |
| Ordered list starting number | `\zonN <startNumber>` | `transformZonTags` (line 86-88): `\zonN 10` → `\zonN \|start="10"\*` | `startMilestone subType usfm:zonN`, `atts.start` | sets the CSS counter start value for that list level (`:2496-2498`) | affects rendered numbering of subsequent `zoliN` items — must be tested together with a `zoliN` sequence, not in isolation | Conversion transform **tested**; renderer output **not tested** |
| Markdown image → figure | `![alt](file.png "tip")` (authored inline in SFM text) | `convertMarkdownsToMilestones` → `convertMarkdown.ts:imageUSFM` → standard `\fig alt\|src="file.png" size="span"\fig*` (tooltip intentionally dropped — "Figures do not support tooltips", confirmed by an explicit test) | standard USFM `\fig` wrapper (not a SAB milestone at all — reuses real USFM) | standard figure handling (see §C) | standard figure HTML | **Tested** at the conversion layer (`convert/convertMarkdown.test.ts`); renderer output not tested |
| Markdown local audio link | `[label](clip.mp3)` | `audioUSFM` → `\zaudioc-s \|link="clip.mp3"\*label\zaudioc-e\*` | `startMilestone/endMilestone subType usfm:zaudioc`, `atts.link` | builds an `<audio>` element + a play `<a>`, resolved against `AudioConfig` (assets vs. download source) (`milestoneLinks.ts:24-35`, `105-150`) | `<audio>` + `<a class="audioclip">` (download case) or inline `onclick` play (assets case) | Conversion **tested**; renderer/link-resolution **not tested** |
| Markdown scripture reference link | `[label](BOOK.C.V)` (various shorthand forms — same book, same chapter, full ref) | `referenceUSFM` → `\zreflink-s \|link="COLLECTION.BOOK.C.V"\*label\zreflink-e\*` | `startMilestone/endMilestone subType usfm:zreflink`, `atts.link`, optional `atts.title` | builds an `<a>` for internal navigation (`milestoneLinks.ts:36-39`) | `<a>` with resolved internal reference | Conversion **tested** (multiple shorthand-resolution cases, `convert/convertMarkdown.test.ts`); renderer **not tested** |
| Markdown web/email/tel link | `[label](https://...)` / `mailto:` / `tel:` | `linkUSFM` → standard `\jmp label\|href="..."title="..."\jmp*` (reuses real USFM `\jmp`, not a `z`-marker) | standard USFM `\jmp` wrapper | builds `<a>` (see §C) | `<a href>` | Conversion **tested**; renderer **not tested** |
| Web/email/tel link milestones `usfm:zweblink`/`usfm:ztellink`/`usfm:zelink` | — | **No producer found** in `convertMarkdown.ts` or `convertBooks.ts` for these three specific milestone names | `startMilestone subType usfm:zweblink\|ztellink\|zelink` (renderer *expects* these) | `milestoneLinks.ts:41-55` has live handling code for all three | n/a until a producer is found | **Anomaly, not yet a tested/testable construct — see §H, needs investigation before writing fixtures** |
| Strong's-number stripping | `\w text\|strong="H0430"\w*` | `removeStrongNumberReferences` (line 114-124): strips the whole `\w...\w*` wrapper down to plain `text` — this is a **downgrade** of standard USFM, not an SAB extension producing a milestone | plain text token, no wrapper at all reaches Proskomma | plain text | plain text, no span | **None found** — and worth testing precisely *because* it's a lossy transform (must verify multi-word/nested cases don't mis-strip) |
| Markdown table-row wrapping | (any `\tr` row block) | `addParagraphMarkersAroundTableRows` (line 311-318): wraps consecutive `\tr` lines in `\p`/`\p` | affects paragraph/table nesting seen by Proskomma | (feeds into standard table rendering, §C) | n/a directly — feeds table fixture | **None found** |
| Figure caption/missing-image handling | `\fig ...\fig*` variants | `handleNoCaptionFigures`, `removeMissingFigures`, `moveFigureToNextNonVerseMarker` (lines 194-263, 320-363) | affects whether/how a `\fig` reaches Proskomma at all (can be stripped entirely if the image file is missing on disk) | n/a directly | n/a directly — conversion-layer only | **None found** — high value target since it has real conditional branches (missing vs. present, captioned vs. not) |

**Key architectural point for §E**: every SAB *milestone* marker (`zvideo`, `zstyle`, `zcstyle`,
`zaudioc`, `zreflink`, and the still-unexplained `zweblink`/`ztellink`/`zelink`) already uses the
spec-sanctioned `z`-prefix private-use convention and is emitted as syntactically legal USFM by
the time it reaches Proskomma. The *pre-conversion* native SAB syntax (`\video`, `\p_XXX`,
`\c_XXX`, and the already-`z`-prefixed-but-not-self-closing `\zuliN`/`\zoliN`/`\zonN`) is **not**
legal USFM and only exists transiently inside `convertBooks.ts`'s string-filter pipeline.

---

## E. `sab-sfm.ext` recommendation

**Yes, create a declarative file — but as two complementary parts, not one.** A single
`markers.ext`-shaped file cannot describe SAB's SFM layer completely, because tcdocs'
`markers.ext` schema (§A) only models *legal, already-converted* USFM markers (name, category,
attributes) — it has no field for "and here is the regex that rewrites the illegal native
SAB syntax into this marker." Two of SAB's constructs (`\video ID`, `\p_XXX`) aren't valid USFM
before conversion at all, so no `.ext`-shaped file can represent the *input* side.

**Recommendation: Option A (for the output side) + a small companion conversions table (for the
input side), not Option B/C/D.**

1. **`grammar/sab-sfm.ext`** — same field format as upstream `markers.ext`
   (`\marker`/`\category`/`\description`/`\attribute`), describing the **post-conversion**
   milestones/markers Proskomma actually sees:
   ```
   \marker zvideo-s
   \category milestone
   \description SAB video placement (native syntax: \video ID)
   \attribute id

   \marker zvideo-e
   \category milestone
   \closes zvideo-s

   \marker zstyle
   \category milestone
   \description SAB custom paragraph style (native syntax: \p_XXX)
   \attribute id

   \marker zcstyle-s
   \category milestone
   \description SAB custom character style (native syntax: \c_XXX ... \c_XXX*)
   \attribute id

   \marker zcstyle-e
   \category milestone
   \closes zcstyle-s

   \marker zaudioc-s
   \category milestone
   \description SAB local audio-clip link (from markdown-in-SFM: [label](clip.mp3))
   \attribute link

   \marker zaudioc-e
   \category milestone
   \closes zaudioc-s

   \marker zreflink-s
   \category milestone
   \description SAB internal scripture-reference link (from markdown-in-SFM)
   \attribute link
   \attribute title

   \marker zreflink-e
   \category milestone
   \closes zreflink-s
   ```
   plus `zuli1..4`/`zoli1..4`/`zon1..4` (numbered family, same caveat as §A applies — enumerate
   literally, don't invent wildcard syntax the base spec doesn't have), and — once §D's open
   question is resolved — `zweblink-s/-e`, `ztellink-s/-e`, `zelink-s/-e`.

   Reusing the exact upstream field names means any tooling written against `usfm.ext`'s format
   (our own parser from §G, and potentially future upstream tooling) works on this file
   unchanged — this is the concrete payoff of not inventing a bespoke schema.

2. **`grammar/sab-sfm-conversions.md`** (or `.yaml` — format matters less here since this file
   is consumed only by our own generator, not by any upstream tool) — one entry per native SAB
   input construct, naming which `sab-sfm.ext` marker(s) it produces:
   ```yaml
   - nativeSyntax: "\\video ID"
     description: Bible video placement
     producesMarker: zvideo-s/zvideo-e
     sourceFunction: convert/convertBooks.ts#replaceVideoTags
     example:
       input: "\\video intro-clip"
       output: "\\zvideo-s |id=\"intro-clip\"\\*\\zvideo-e\\*"
   - nativeSyntax: "\\p_XXX"
     description: Custom paragraph style
     producesMarker: zstyle
     sourceFunction: convert/convertBooks.ts#replacePStyleTags
     example:
       input: "\\p_callout"
       output: "\\m \\zstyle |id=\"p_callout\"\\*"
   # ... one entry per row of §D's table that has a convertBooks.ts producer
   ```
   This file is the thing the generator (§G) diffs `convert/convertBooks.ts` against to detect
   drift (a new/changed filter function with no matching entry here is itself a coverage gap,
   symmetric with how a new upstream marker with no `usfm.ext` entry would be).

Why not the other options: **Option B** (a wholly different, more general schema) adds
invented complexity with no upstream precedent to justify it, when the spec already defines
almost exactly what's needed. **Option C** (documenting in "another existing configuration
format") was considered — YAML/JSON *is* used, but only for the conversion-rule half that
genuinely can't fit the `.ext` shape; the marker-metadata half should still use `.ext` to get
format-compatibility with the USFM tooling we're already building for real USFM markers.
**Option D** (derive everything from `convertBooks.ts` alone, no declarative file) fails the
task's explicit requirement that the source be declarative — reverse-engineering regexes as the
sole source of truth also means the "expected HTML" review step has no independent checklist to
review against; a human reviewing `sab-sfm.ext` can sanity-check "did we cover every SAB
extension" without reading TypeScript.

---

## F. Test architecture

### What already exists (do not duplicate)

- **Vitest** is the test runner (`package.json` scripts: `test`, `test:ui`); `jsdom@25` is a
  devDependency; no `@testing-library/svelte` is installed.
- **Zero existing tests touch the rendering pipeline** — confirmed by grepping for
  `ScriptureViewSofria`, `ScriptureViewProskomma`, `SofriaRenderFromProskomma`, `render-sofria`
  across all `*.test.ts` files: no hits. This is genuinely new test surface.
- **Existing, worth-reusing convention #1**: plain-function unit tests against exported
  `convert/*.ts` helpers, asserting on literal USFM-string output
  (`convert/tests/sab/storybookTests.test.ts` tests `transformLists`; `convert/convertMarkdown.test.ts`
  tests `convertMarkdownsToMilestones`/`convertMarkdownsToHTML` with real USFM fixture files
  under `test_data/books/C01/`, using `toContain` on expected substrings). **Recommendation**:
  all §D "conversion-layer" tests (video/style/list/figure transforms) should follow this exact
  pattern — it's already idiomatic in this repo and needs no new infrastructure.
- **Existing, worth-reusing convention #2**: `docs/test/testing-basics.md` documents
  `describe`/`test`/`expect`, one-assertion-per-test as house style.
- **Existing, worth-reusing convention #3**: CI (`.github/workflows/main.yml`) downloads real
  zipped SAB project fixtures (`test_data/projects/index.json` → `web_gospels.zip`,
  `sab_test_pwa.zip`, etc.), runs the full conversion, then runs `npm run test` scoped to
  `src/` and `convert/tests/sab/` **against the converted output** — a genuine
  integration-test layer already wired up. **Recommendation**: this is the natural home for
  "USFM + SAB SFM integration coverage" (§11 of the brief) — either extend one of these zipped
  fixture projects with dedicated coverage books, or (preferred, to keep coverage fixtures small
  and reviewable rather than binary zip diffs) add a new lightweight project purpose-built for
  rendering coverage, following the same `index.json`/`tests` wiring.
- **Existing, worth-reusing convention #4**: standalone `ts-node`-run scripts wired to `npm run`
  for versioned/regenerable tasks (`convert/checkVersion.ts`, `convert/bumpVersion.ts`,
  `convert/tagVersion.ts`) — direct model for the `update-usfm-test-coverage` script (§G).

### A testability constraint that shapes the whole design

The **new** renderer (`src/lib/render-sofria/*Feature.ts`) exports plain `FeatureSpec`/
`RenderAction` objects — directly importable and unit-testable without mounting any Svelte
component. The **legacy** renderer's render-action definitions are inline inside
`ScriptureViewSofria.svelte`'s `<script>` block, not exported — testing it directly requires
mounting the actual component (needs `@testing-library/svelte`, not currently installed) or
duplicating logic (which defeats the purpose).

**Recommendation**: prioritize building generated/hand-authored coverage against
**render-sofria**, since (a) it's already unit-testable with zero new dependencies, (b) it's
the direction the team is actively moving (PR #1090), and (c) a coverage suite against
soon-to-be-replaced code has a short shelf life. Use the *legacy* renderer only as a one-time,
human-reviewed reference when first writing expected-HTML values (see next section) — never as
a live, auto-diffed oracle.

### Fixture format

**Recommendation**: hand-maintained fixtures as colocated TypeScript data — a small
`{ usfm, expectedHtml }`-shaped record per taxonomy group, e.g.:

```ts
// test/render-sofria/fixtures/characterMarkers.fixtures.ts
export const genericCharacterMarkers = [
  { marker: 'add', usfm: '\\v 1 Test text with \\add added text\\add*.', expectSpanClass: 'add', expectText: 'added text' },
  { marker: 'bd',  usfm: '\\v 1 Test text with \\bd bold text\\bd*.',    expectSpanClass: 'bd',  expectText: 'bold text' },
  // ...
];
```

This keeps the USFM snippet and its expectation on one screen, satisfies "understandable by
developers," and is trivial for the generator (§G) to *append to* (new marker → new todo
entry with a `NEEDS_FIXTURE` placeholder) without regenerating the whole file. Reserve
standalone `.usfm` files (à la `test_data/books/C01/01GENengWEBbd.usfm`) for the **compound**
fixtures that are naturally book-shaped (multi-verse, multi-paragraph, real footnote/table/list
sequences) — small inline strings for atomic marker coverage, real files for compound scenarios,
mirroring the existing `test_data/` convention already in the repo.

### Assertion strategy

**Recommendation: semantic/structural assertions, not exact-HTML string diffing.** Verified
from the code itself: rendering is done via raw `document.createElement`/`classList`/`innerText`
calls (both in the legacy inline actions and the new Feature modules), independent of Svelte's
own templating — so tests can render into a real `jsdom` `document`, then assert with small
helpers such as:

- tag-name assertions (`expect(el.tagName).toBe('SPAN')`) — catches the exact regression class
  named in the brief (`\bd` silently becoming a `<span>` when it should be — or vice versa, some
  future refactor making it a `<strong>` when the contract says `<span class="bd">`; whichever
  the *reviewed* contract says).
- class-token assertions (`el.classList.contains('add')`) rather than full `className` string
  equality — tolerant of an incidental extra class a future refactor adds.
- text-content assertions on the innermost meaningful node, not the whole subtree's
  `outerHTML`.
- targeted attribute assertions where the marker's contract is specifically about an attribute
  (e.g. `\jmp`'s `href`, `\w`'s `lemma`-derived `match`).

Do **not** assert on incidental wrapper structure (phrase-div ids, `data-verse`/`data-phrase`
attributes, `scroll-item`/`seltxt` utility classes) unless the marker/group under test is
specifically about verse/phrase boundaries — those are legitimately allowed to change.

### Test organization

Three clearly separated suites, per the brief's own §11 request:

1. **USFM grammar coverage** — generated, mechanical: "does every marker in the merged
   `usfm.ext`+`sab-sfm.ext` inventory have an entry in our hand-maintained grouping config
   (§G)?" No Proskomma/rendering involved — pure inventory completeness.
2. **Parser coverage** — for each grammar-covered marker's minimal fixture, does
   `pk.importDoc(...)` succeed and does the expected Sofria event/`subType` actually appear in
   the event stream? This catches "Proskomma doesn't recognize this marker at all" independent
   of whether we render it.
3. **Rendering coverage** — the render-sofria (and, where explicitly maintained, legacy)
   feature-level tests with the semantic HTML assertions above.
4. **SAB SFM coverage**, mirrored the same three ways, plus a **conversion-layer** unit-test
   tier (§D/§F convention #1) that is unique to SAB SFM since it has a real
   native-syntax → USFM string-rewrite step upstream of Proskomma entirely.
5. **Integration coverage** — real project fixture(s) run through the full
   `convert →Proskomma → render` pipeline end-to-end (existing CI convention #3), to catch
   regressions in the conversion layer that a unit test of `convertBooks.ts` alone wouldn't
   catch (e.g. filter-function ordering interactions — the `usfmFilterFunctions` array's order
   is itself part of the contract, see line 372-385).

---

## G. Regeneration workflow

**Recommendation: vendor, don't live-fetch.** Commit a snapshot of the upstream files under
`grammar/vendor/usfm.ext` and `grammar/vendor/usfm3_1.sty`, updated by an explicit, separate step
— not fetched during normal `npm test`/CI runs (keeps tests hermetic/offline-safe, and makes
"the spec changed" a reviewable diff in its own commit rather than a side effect of an unrelated
PR touching the network at test time).

Two scripts, both following the existing `convert/checkVersion.ts`-style plain `ts-node` +
`npm run` convention:

**`npm run sync-usfm-grammar`** (`convert/syncUsfmGrammar.ts`):
1. Fetches `usfm.ext` and `usfm3_1.sty` from `usfm-bible/tcdocs` (raw GitHub URLs), and resolves
   the exact commit SHA those files came from via the GitHub API.
2. Writes them to `grammar/vendor/`, plus a small `grammar/vendor/SOURCE.json`:
   ```json
   { "usfmSpecVersion": "3.1.2", "tcdocsCommit": "<sha>", "syncedAt": "2026-09-16" }
   ```
3. Does **not** touch any test files — this step is purely "pull the raw spec in."

**`npm run update-usfm-test-coverage`** (`convert/updateUsfmTestCoverage.ts`):
1. Parses `grammar/vendor/usfm.ext` + `.sty` into a normalized marker list (name, category,
   attributes, textProperties, closes/closedby).
2. Parses `grammar/sab-sfm.ext` the same way, and merges it in with a `sab: true` flag per
   marker.
3. Diffs the merged list against the previously committed
   `test/generated/usfm-marker-inventory.json` (which itself carries the `SOURCE.json` metadata
   from the last sync).
4. Regenerates `test/generated/usfm-marker-inventory.json` and, per taxonomy group (§B/§C),
   a `test/generated/<group>.generated.test.ts` scaffold.
5. **Critical rule, directly implementing the brief's core requirement**: for any marker with no
   matching entry in the hand-maintained fixture/grouping config (§F), emit
   `test.todo('NEW/UNTESTED MARKER: \\<name> — needs fixture + expected HTML (added in USFM <version>, commit <sha>)')`
   — never a passing test, never an auto-captured "whatever the renderer currently outputs."
   Vitest's `test.todo` reports these as pending in test output without failing the suite,
   giving visible-but-non-blocking gap tracking.
6. Prints a console summary (`+N new markers, -N removed, ~N category changes`) — the visible,
   PR-reviewable signal the brief asks for.
7. Exits nonzero **only** under an explicit `--strict` flag (for an optional, separate CI job
   that gates on "no un-reviewed new markers") — the default run never blocks unrelated work
   merely because upstream added a marker nobody has looked at yet.

**On "should generated files be committed?" — yes, agreed with the stated leaning.** Because
`test/generated/usfm-marker-inventory.json` and the `.generated.test.ts` scaffolds are committed,
a spec change becomes an ordinary, reviewable diff in a PR (new `test.todo` lines appearing,
inventory JSON changing) rather than a silent regeneration nobody sees — directly matching the
principle "generated scaffolding should identify required tests, not manufacture correctness,"
and making the *absence* of new coverage after a spec bump visible in code review rather than
buried in CI logs.

---

## H. Current gaps

Gaps found, each with an explicit judgment on whether it's actually a problem:

- **`\qt-s/-e` (quoted text) and `\ts-s/-e`/bare `\ts` (translator section) milestones**: no
  matching case anywhere in the renderer's milestone switch statements. `[unverified]` exact
  current runtime behavior (likely silently dropped/no visual effect, but not confirmed by
  running the app). **Needs a product decision** before a fixture can encode "expected" —
  possibly intentional (both are largely checking/translation-tool artifacts, arguably
  correct to drop), but currently undocumented as intentional.
- **`alt_chapter`/`alt_verse`/`pub_chapter`/`pub_verse` marks** (from `\ca`/`\cp`/`\va`/`\vp`,
  alternate/publishable numbering): no handling found; only `chapter_label`/`verses_label` are
  switched on. Likely an intentional non-goal (PWA doesn't yet support dual versification
  display), but should be **documented as intentional**, not silently absent.
- **`periphpara` (peripheral material)**: no renderer handling found at all, and
  `[unverified]` whether the PWA ever ingests peripheral USFM content in the first place.
  **Needs a product decision** — is this in scope for the PWA ever?
- **`usfm:zweblink`/`usfm:ztellink`/`usfm:zelink`**: the renderer (`milestoneLinks.ts:41-55`)
  has live handling for all three, but no producer was found anywhere in `convertMarkdown.ts`
  or `convertBooks.ts` that emits them. Either (a) there's a producer path this research pass
  missed, or (b) this is dead/vestigial handling code. **Needs investigation before writing a
  fixture for these three** — write the fixture only once the producer question is resolved,
  otherwise the "fixture" would be untestable via the real pipeline.
- **render-sofria (PR #1090) is intentionally incomplete today.** Per its own progress doc, it
  currently implements only document/paragraph/text/verse-number/chapter-number features.
  Missing: all milestone handling (so none of §D's SAB markers work yet), grafts
  (footnotes/xrefs/introductions/titles), and tables. This is **not a bug** — it's declared,
  in-progress work — but the coverage framework must represent it as such (a
  "not yet ported to render-sofria" status distinct from "regression"), or the first run of
  generated tests against render-sofria will look like a wall of failures indistinguishable
  from real breakage.
- **Deprecated markers** (`addpn`, `fdc`, `h1`, `h2`, `ide`, `ph1`, `rb`, `xdc`): no
  special-casing; fall through to generic handling. Recommend treating these as
  grammar-coverage-required but rendering-coverage-optional/best-effort (§C), since the spec
  itself discourages continued use and a "produces *some* reasonable output, doesn't crash" bar
  is more proportionate than pinning an exact appearance.
- **Legacy renderer testability**: `ScriptureViewSofria.svelte`'s render actions are inline,
  unexported. This is an architectural gap independent of USFM coverage — it means any
  coverage we write against the legacy renderer needs either a full component-mount test setup
  (new dependency, `@testing-library/svelte`) or is simply not attempted, in favor of
  render-sofria (§F's recommendation).
- **Conversion-layer functions with zero existing tests**: `replaceVideoTags`,
  `replacePStyleTags`, `replaceCStyleTags`, `removeStrongNumberReferences`, `encodeJmpLinks`,
  `handleNoCaptionFigures`, `removeMissingFigures`, `moveFigureToNextNonVerseMarker`,
  `addParagraphMarkersAroundTableRows` — confirmed via repo-wide grep, none appear in any
  `*.test.ts`. Not a rendering gap per se, but a real coverage gap sitting directly upstream of
  every SAB SFM construct in §D.

---

## I. Implementation plan (staged — none of this has been built yet)

1. **Vendor + parse upstream grammar.** Add `convert/syncUsfmGrammar.ts` and the `usfm.ext`/
   `.sty` parser (`convert/usfmGrammar.ts`), with unit tests for the *parser itself* (feed it
   small hand-written `.ext`-shaped strings, assert on parsed structure) — no project-wide test
   scaffolding yet. Commit `grammar/vendor/*` + `grammar/vendor/SOURCE.json`.
2. **Author `grammar/sab-sfm.ext` + `grammar/sab-sfm-conversions.md`** (§E), covering the full
   §D inventory including a resolved answer to the `zweblink`/`ztellink`/`zelink` question.
   Reuse the Stage 1 parser (same file format).
3. **Build the taxonomy/grouping config** (§B/§C) as a small hand-maintained TS/JSON file
   mapping marker → {group, sharedFixture?, dedicatedFixtureNeeded, status}. This is the
   "coverage requirements" layer the generator reads.
4. **Build `convert/updateUsfmTestCoverage.ts`** (§G): cross-reference Stage 1+2 inventory
   against Stage 3's config, emit the inventory JSON + `test.todo` scaffolds + console diff
   summary. Wire `npm run update-usfm-test-coverage`. At this point the suite runs and reports
   gaps, but has no real assertions yet — this itself is a useful, reviewable checkpoint.
5. **Hand-author expected-HTML fixtures**, highest-value groups first: generic character
   markers (one file, many markers), generic paragraph markers, chapter/verse numbering,
   footnotes/xrefs (including the nested-markup compound case), tables, then the SAB `z*`
   milestones (video/style/cstyle/lists) — targeting **render-sofria**, accepting that most
   will initially report as failing/todo since render-sofria doesn't implement milestones yet.
   This becomes the concrete, living contract the PR #1090 refactor works against.
6. **Add the conversion-layer unit tests** for the currently-untested `convertBooks.ts` filter
   functions (§H), generated from `grammar/sab-sfm-conversions.md`, following the existing
   `storybookTests.test.ts`/`convertMarkdown.test.ts` pattern already idiomatic in this repo.
7. **Wire a real project fixture for integration coverage** (§F) — either extend an existing
   zipped `test_data/projects` fixture or add a new small one purpose-built for USFM/SAB SFM
   coverage, following the existing `index.json` wiring, and run it through the existing CI
   convention.
8. **CI integration**: land the coverage report as a non-blocking, visible signal first
   (console summary in CI logs / PR annotation); only promote `--strict` mode to a blocking
   gate once coverage has stabilized and the team has agreed on which gaps in §H are
   permanently-intentional vs. still-open.

Stages 1-4 involve no product decisions and no risk to the shipped renderer. Stage 5 is where
the §H gaps (qt/ts milestones, alt/pub numbering, periphpara, zweblink family) will need actual
answers before their fixtures can be written "correctly" rather than just "documented as
pending" — recommend surfacing those as a short separate decision list to the team before
Stage 5 rather than guessing.
