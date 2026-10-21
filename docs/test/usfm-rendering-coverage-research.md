# USFM Rendering Coverage: Research & Design Report

Status: **research/design only — no test framework has been implemented yet.**
Scope: how to build a regenerable test-coverage system that verifies USFM (+ SAB-specific SFM)
constructs are correctly converted through Proskomma/Sofria and rendered to HTML by the PWA.

This document distinguishes **verified facts** (with file/line or URL citations) from
**recommendations** (marked as such). Where something could not be verified, it is flagged
explicitly rather than assumed.

At the time of writing (last updated 2026-10-21, after rebasing onto `refactor/proskomma-render-actions`), 
the repo is checked out on branch `feature/proskomma-render-tests`, branched from 
`refactor/proskomma-render-actions` (the branch for PR #1135), with
`proskomma-core@0.11.3` and `proskomma-json-tools@0.9.1` installed
(`node_modules/*/package.json`). All file/line citations into this repo below are against
`feature/proskomma-render-tests`.

The refactored renderer ("render-sofria") lives in `src/lib/render-sofria/`: one
`FeatureSpec` per file under `src/lib/render-sofria/features/*.ts` (shared helpers in
`features/common/`), registered in order in `src/lib/render-sofria/index.ts`, and driven by
the wrapper component `src/lib/components/ScriptureViewProskomma.svelte`
(`handleSofriaRenderEvent`, lines 502-555). render-sofria is still **work in progress** and
has not shipped: `main` still mounts the legacy `ScriptureViewSofria`. On the refactor branch
(and so on this one), `src/routes/text/+page.svelte:15-17,524` mounts `ScriptureViewProskomma`
instead, with the `<ScriptureViewSofria>` usage commented out (lines 521-522). The legacy
renderer, `src/lib/components/ScriptureViewSofria.svelte`, is therefore the production
behavior today and is expected to be replaced once PR #1135 merges. See §F and §H for why this
matters for testability.

Dispatch semantics worth knowing before writing fixtures (`ScriptureViewProskomma.svelte:515-538`,
`common.ts:294-354`): for each event, actions are sorted by stage (`init` → `standard` →
`fallback` → `cleanup`, stable within a stage so `index.ts` order matters); **every** `standard`
action whose `guard` passes runs, and `fallback` actions run only if no `standard` action ran.
Because several wrapper-like scopes can be open at once, `text` actions now route text to the
**innermost** one via `isTopWrapper(workspace, 'wrapper:…')` (`features/common/text.ts:72-78`,
commit `0f40b572`): a feature's `text` action only fires when its own scope is the top-most
`wrapper:*` scope on the stack. To take part in that routing, the `zcstyle`, `zaudioc` and
`zreflink` milestones push `wrapper:*` scopes rather than `milestone:*`, and headings and
introductions push an inner `wrapper:heading` / `wrapper:introduction` scope. Commit `1215d5fd`
also makes every wrapper/milestone close (`endWrapper`/`endMilestone`, and table `endRow`) call
`terminatePhrase` first, so an open phrase `<div>` is flushed into the correct parent before the
scope is promoted. Nested-wrapper fixtures (§C) are what exercise this routing.

Phrase markup now depends on book type (commit `1bd3f8ec`): `getPhraseDiv`
(`features/common/text.ts:39`) only adds the verse/phrase `id`, `data-verse`, `data-phrase` and
`seltxt scroll-item` classes when `viewSettings.isBibleBook`, and `subdividePhrases`
(`util.ts:34-45`) only splits text at audio phrase boundaries for Bible books with audio.
Fixtures for non-Bible books should expect plain `<div class="txs">` phrases.

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
Proskomma's Sofria event stream and the current renderers actually treat each category (verified
by reading `src/lib/components/ScriptureViewSofria.svelte` and the `src/lib/render-sofria/`
feature modules line-by-line, not assumed):

| Taxonomy group | Grammar category source | Proskomma/Sofria event | Renderer behavior today (verified) |
|---|---|---|---|
| Book identification/metadata (`\id`, `\ide`, `\h`, `\toc1-3`, `\usfm`) | `internal`/`attribute`/`header` | consumed at document-header level, not emitted as body events `[inference — not traced further, out of scope for HTML rendering]` | Not rendered inline; used upstream in `convert/` for catalog/config generation. |
| Chapter markers (`\c`) | `internal` | `startChapter`/`endChapter` + `mark subType chapter_label` | `chapter_label` mark → `<div class="c">` appended to the document scope, or — when `chapter-number-format` is `drop-cap` — deferred until the first `verses_label` mark and emitted as `<div class="c-drop">` inside the current paragraph (which is re-classed to `m`). Old: `mark` action, `ScriptureViewSofria.svelte:2132-2209`. New: `features/cv-numbers.ts:18-88` (`chapterNumber`; deferred drop-cap case at 53-84), gated on the `show-chapter-numbers` feature. |
| Verse markers (`\v`) | `internal` | `startVerses`/`endVerses` + `mark subType verses_label` | `verses_label` mark → `<span class="v" data-verse-num>` + `<span class="vsp">`. Old: `handleVerseLabel`, `ScriptureViewSofria.svelte:655`. New: `features/cv-numbers.ts:90-141` (`verseNumbers`) + `addVerseNumber` at 143-164, gated on `show-verse-numbers` / `verse-numbers` setting. Each verse is also wrapped in a `<div data-verse>` by `features/main-text.ts:20-40` (`startVerses`) and `:57-126` (`endParagraph` verse/paragraph nesting logic). |
| Alternate/publishable numbering (`\ca`, `\cp`, `\va`, `\vp`) | `attribute` | `mark` with `subType` presumably `alt_chapter/alt_verse/pub_chapter/pub_verse` (fixed Sofria enum, confirmed in schema) | **Not handled** by either renderer — the only `mark` actions in render-sofria (`features/cv-numbers.ts`) match `chapter_label`/`verses_label`, and unlike milestones/grafts there is no `mark` fallback in `features/unsupported.ts`, so these are dropped **silently**. Gap, see §H. |
| Paragraph markers (`\p`, `\m`, `\pi`, `\q1-4`, `\pc`, `\b`, etc.) | `versepara`/`otherpara` | `startParagraph`/`endParagraph`, `block.subType` | Generic: `<div class="{subtype}">`. Special case: `b` also appends `&nbsp;`. Old: `ScriptureViewSofria.svelte:1734-1780` (`b` at 1775-1777). New: `features/main-text.ts:41-56` (`b` at 50-52), main sequence only. |
| Character markers (`\add`, `\bd`, `\it`, `\nd`, `\sig`, `\bk`, `\ord`, `\qs`, `\tl`, `\dc`, …) | `char` | `startWrapper`/`endWrapper` `subType usfm:<name>` | Generic fallback: `<span class="{name}">` wrapping the phrase content. Old: `ScriptureViewSofria.svelte:551-610` (`usfmSpan`/`addTextNode`). New: `features/wrappers.ts:19-65` (`usfmWrappers`, `fallback` stage — runs only when no dedicated `standard` wrapper action claimed the event), using the `ScopeManager` to build a real nested `<span>` scope rather than string-concatenating `innerHTML`. **All of these share one rendering behavior** — one parametrized test covers dozens of markers. |
| Character markers with unique behavior (`\wj`, `\w`, `\xt`) | `char` | same `startWrapper` path, explicitly special-cased | `\wj`: old wraps in `<span class="wj">` only when `workspace.showWordsOfJesus` (`ScriptureViewSofria.svelte:589-595`); new suppresses the wrapper span entirely when `workspace.viewSettings.redLetters` is false (`features/wrappers.ts:10-17`, `shouldAddWrapper`). **Verified same setting**: both components receive it as the `redLetters` prop, which `src/routes/text/+page.svelte:181` sets from the `red-letters` user setting. `\w`: old produces `<span class="glossary"><a class="glossary" match="…" href=" ">` when glossary words are on, else `<span class="w">`; new `features/glossary.ts` (gated on `show-glossary-words` / `glossary-words`) produces `<span class="glossary"><a data-match="{lemma or text}" href="javascript:void(0)">` — note the attribute rename `match` → `data-match` and the `glossary` class moving off the `<a>`. Glossary-off falls through to the generic `usfmWrappers` `<span class="w">`. `\xt`: **now has dedicated handling** in render-sofria (commit `b6e65d87`, "allow \xt to be rendered outside of footnote"): the `/usfm:x/` wrapper actions in `features/footnotes.ts:167-200` push a `<span class="xt">`, and the "Cross-References - XT Wrapper" text action (`:220-246`, guarded by `isTopWrapper(workspace, 'wrapper:xt')`) splits the text on `"; "` and emits one `<span class="reflink">` per reference containing `generateHTML(ref, 'header-ref')` links — anywhere in the text, not only inside `\x`. Legacy equivalent was the `innerHTML`-instead-of-text special case (`ScriptureViewSofria.svelte:560-563`). |
| Figures (`\fig`) | `char` (per `.sty`, actually a distinct figure marker family) | `inlineGraft subType fig` (rendered via `renderSequence`) containing `startWrapper`/`endWrapper subType usfm:fig` | Old: dedicated, builds an image block (`addFigureDiv`, `ScriptureViewSofria.svelte:1387`) inserted into the paragraph on `endWrapper`. New: `features/illustrations.ts:20-134` (`illustrations`, gated on `show-illustrations`; plus `illustrationsFallback` at 136-148 which swallows the `fig` graft when the feature is off). Builds `<div class="image-block"><span class="image"><img></span><div class="caption"><span class="caption">` and suppresses the literal `NO_CAPTION` placeholder (`:96-101`). Also places config-driven illustrations at `endDocument` (`:104-131`, `features/common/media.ts`). Retains the **runtime behavior not present in the legacy renderer**: an async `fetch(src, {method:'HEAD'})` existence check (`checkImageExists`, `:208-220`) that hides the block if the request fails — assertions on figure visibility need to await it or mock `fetch`. Image display is also gated at render time on `display-images-in-bible-text` for Bible books (`showImages`, `:150-155`). Pre-processed heavily in `convert/convertBooks.ts` regardless (§D). |
| Hyperlinks (`\jmp`) | not in base `usfm.ext` `[unverified — likely added in 3.1.2+, agent did not confirm exact version it was introduced]` | `startWrapper`/`endWrapper subType usfm:jmp` | Old: dedicated `prepareJmpLink`/`addJmpLink` (`ScriptureViewSofria.svelte:1398`, `:1427`), produces an `<a>`. New: `features/jmplinks.ts:5-105`, with a **safety behavior not present in the legacy renderer**: an explicit protocol allowlist (`http://`, `https://`, `mailto:`, `tel:`, `:22-46`); any other scheme (e.g. `javascript:`) is dropped and a plain `<span>` is emitted instead of an `<a>`. Allowed links get `email-link`/`tel-link`/`web-link` classes, `web-link` adds `target="_blank" rel="noopener noreferrer"`, and `title` becomes a `dy-tooltip` `data-tip`. Deliberate divergence, not a bug — the coverage framework should treat the allowlist as the go-forward contract and add a fixture asserting a disallowed-protocol `\jmp` does **not** produce a clickable link. |
| Footnotes/cross-references (`\f...\f*`, `\x...\x*`) | `footnote`/`crossreference` (container) + `footnotechar`/`crossreferencechar` (children `\fr`,`\ft`,`\fk`,`\xo`,`\xt`,…) | `inlineGraft` `subType xref\|footnote`, nested sub-sequence | Old: dedicated, `createFootnoteDiv` (`ScriptureViewSofria.svelte:890`), invoked from the `inlineGraft` action (`:2407-2483`), which appends a caller `<span>` + popup content div to the current phrase/heading/title container. New: **now implemented** in `features/footnotes.ts` — `footnotes` (`:26-118`) and `crossrefs` (`:120-262`). `pushFootnoteScopes`/`popFootnoteScopes` (`:353-387`) build `<span data-graft="X-n"><a class="cursor-pointer"><sup class="footnote">{caller}&nbsp;</sup></a><div id="X-n" type="footnote\|xref" style="display:none">…</div></span>`; child char markers inside become `<span class="{fr\|ft\|fq\|xo\|…}">` via the `/usfm:f(?!ig)/` and `/usfm:x/` wrapper actions, which track their own `scratch.inlineGraft.typeStack` so footnote text is appended only when a footnote/xref wrapper is the innermost wrapper (`isTopWrapper`, commit `0f40b572`). Non-footnote char markers nested inside (e.g. `\+add` within `\ft`) are claimed by the generic `usfmWrappers` fallback instead, whose text action calls `addPhrases` — `[inference — not run]` that may put a phrase `<div>` inside the footnote content; the nested-markup fixture should pin this down. Structurally the most complex construct — deserves its own compound fixture (nested char markers *inside* a footnote, e.g. `\fq`/`\ft` mixed with `\add`). |
| Note callers (`\f +`, `\f -`, `\f a`) | n/a — Sofria-level `subtype note_caller` | `inlineGraft subType note_caller` | Old: handled, pushes/pops `textType` stack. New: `features/footnotes.ts:268-349` (`noteCallers`). The caller text fills the `<sup class="footnote">` via `getFootnoteCallerCharacter` (`:389-434`), which honours the `{footnote,crossref}-caller-type` (`custom-symbol`, `abc`, default), `-caller-symbol` and `-caller-no-caller-to-auto` config features: `+` → auto letter index (`a`, `b`, … `aa`), `-` → the whole footnote is **dropped** (caller scope removed, content never appended), anything else → literal. Each of those branches is a distinct fixture. |
| Introductions (`\imt`, `\ip`, `\iot`, …) | `introduction`/`introchar`/`introlist` | `blockGraft subType introduction` (out-of-line sequence) | Old: conditionally rendered via `processText(introductionGraft, displayingIntroduction, titleGraft)` and the `blockGraft` action (`ScriptureViewSofria.svelte:2360-2405`). New: `features/introductions.ts:11-82` — rendered (`<div class="{ip\|imt\|…}">` paragraphs; text is collected in an inner `wrapper:introduction` scope whose children are moved into the paragraph `<div>` on `endParagraph`, so no extra element is emitted) only when `workspace.hackRenderIntro` is set, otherwise the graft is skipped with a log line. `renderIfRegularOrIfHackedIntro` (`common.ts:280-285`) is the gate that most other features use to suppress main text while the intro is displayed. |
| Section headings (`\s`, `\s1-4`, `\r`, `\ms`, `\mr`) | `sectionpara` | `blockGraft subType heading` → `startParagraph` in a `heading` sequence | **Verified — distinct from plain paragraphs** in render-sofria: `features/headings.ts:9-90` emits `<div class="{s1\|r\|…}" id="{prefix}{n}">`, where `id` is the class with digits stripped plus a running per-prefix count (e.g. `s1`, `s2`, `r1`); heading text is collected in an inner `wrapper:heading` scope (moved into the heading `<div>` on `endParagraph`) and added as non-verse phrases, so footnotes and other wrappers inside headings no longer swallow the heading text. `\r` is special-cased (`:80-84`) to run `generateHTML(text, 'header-ref')` so inline references become clickable. Legacy equivalent: `case 'heading'` in `startParagraph`, `ScriptureViewSofria.svelte:1789-1806`. |
| Titles (`\mt1-4`) | `title` | `blockGraft subType title` | Old: `titleSpan` — `<span class="{mt1…}">` inside a `data-verse="title"` div (`ScriptureViewSofria.svelte:1807-1810`, `:2229-2236`, `:2291-2299`). New: `features/titles.ts:6-73` — `<div data-verse="title" data-phrase="none" class="scroll-item">` containing one `<div class="{mt1…}">` per title paragraph (a **`div`, not the legacy `span`**) followed by two `<div class="b">` spacers. |
| Lists (`\li1-4`, standard USFM) | `list`/`listchar` | `startParagraph`, `block.subType` | Falls into the generic paragraph path (`<div class="li1">`); no list-specific handling in either renderer `[inference — no `li` case found; SAB authors its own `\zuli`/`\zoli`/`\zon` extensions instead, see §D]`. |
| Tables (`\tr`, `\tc1-9`, `\th1-9`) | not fully categorized by `usfm.ext` alone; `.sty` likely has explicit table fields `[unverified]` | `startTable`/`endTable`, `startRow`/`endRow`, `startWrapper subType cell` | Old: dedicated, builds `<table><tr><td class="tc{n}">` (`startRow` at `ScriptureViewSofria.svelte:2738`, `cell` wrapper at `:2541`/`:2591`). New: `features/tables.ts:5-104` — `<table cellpadding="5" class="dy-table dy-table-xs w-fit text-start">`, `<td class="tc{n}" colspan data-col>` where `n` is the *cumulative* column index (so a colspan cell shifts later cell classes), `text-end` for right alignment, and a cell re-ordering workaround for out-of-order `endRow`/`endWrapper` events (`:43-48`, `:90-100`; proskomma-json-tools#67). `convert/convertBooks.ts:312-319` (`addParagraphMarkersAroundTableRows`) wraps table row runs in `\p`/`\p` first — a SAB-side pre-processing quirk worth its own fixture. |
| Milestones — standard USFM (`\qt-s/-e`, `\ts-s/-e`) | `milestone` | `startMilestone`/`endMilestone subType usfm:qt`/`usfm:ts` | **No rendering** in either renderer. In render-sofria they now land in the explicit `fallback` handler in `features/unsupported.ts:5-18`, which emits no HTML and logs `console.warn("Unsupported Milestone Type: …")` — so absence is now *observable* (a test can spy on `console.warn`) rather than silent. Still a product-decision gap, see §H. |
| Milestones — SAB private-use (`\zvideo-s/-e`, `\zstyle`, `\zcstyle-s/-e`, `\zaudioc-s/-e`, `\zreflink-s/-e`, `\zuli{n}`, `\zoli{n}`, `\zon{n}`) | not in base grammar; would live in SAB's own `markers.ext`-equivalent | `startMilestone`/`endMilestone subType usfm:z*` (namespaced exactly like standard custom milestones) | Old: dedicated handling per marker in `startMilestone` (`ScriptureViewSofria.svelte:2607-2710`) plus `checkForMilestoneLinks` in `endMilestone` (`:2711-2737`, `src/lib/scripts/milestoneLinks.ts`). New: **all now implemented**, one feature file each — `features/videos.ts`, `features/custom-styles.ts`, `features/audio-clips.ts`, `features/reflinks.ts`, `features/lists.ts`. See §D for per-marker detail. |
| Deprecated markers (`\addpn`, `\fdc`, `\h1`, `\h2`, `\ide`, `\ph1`, `\rb`, `\xdc`) | flagged only via free-text description | whatever their base category implies (mostly `char`/`header`) | No special-case in either renderer — presumably fall through to the generic paragraph/character path. `[unverified — not confirmed to actually round-trip cleanly, e.g. `\rb` (ruby/pronunciation glossing) has non-trivial attribute structure that the generic char-span path may not handle correctly]`. Note `\fdc`/`\xdc` match the `/usfm:f(?!ig)/` / `/usfm:x/` regex guards in `features/footnotes.ts` and so get footnote-wrapper handling rather than `usfmWrappers`. |

**Taxonomy summary** (answering the research brief's own candidate list): book
metadata/chapter/verse/paragraph/character/nested-character/footnotes/xrefs/milestones/tables/
figures/word-attributes/introductions/section-headings/deprecated/extensions all turned out to
be real, distinct categories — but **peripheral material** (`periphpara`) has **no observed
renderer handling at all** and `[unverified]` whether the PWA ever ingests peripheral content
(front/back matter, standalone glossary-as-periph); this needs a product decision, not just a
test (§H). One more distinction worth calling out: render-sofria now has an explicit
catch-all for things it does not render — `features/unsupported.ts` (`WARN_UNSUPPORTED_FEATURES`)
registers `fallback`-stage handlers for `startMilestone`, `metaContent`, `blockGraft`,
`inlineGraft` and `startSequence` that emit no HTML and `console.warn` an "Unsupported …"
message (plus silent `endMilestone`/`endSequence` counterparts). Because fallbacks only run when
no `standard` action claimed the event, a warning from this file is a reliable "nothing handled
this" signal that a test can assert on. It is a *warn-on-unknown* net, though, not a declaration
of intent: the taxonomy/grouping config (§F) should still record intentionally-non-rendering
categories (`\rem`, `\ide`, `qt`/`ts` if that is the decision, etc.) explicitly, so "unsupported
by design" and "nobody has looked at this yet" stay distinguishable. `mark` has no such fallback
(see alt/pub numbering above).

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
| `\add`, `\bd`, `\it`, `\bk`, `\dc`, `\k`, `\nd`, `\ord`, `\pn`, `\qs`, `\sig`, `\sls`, `\tl`, `\em`, `\no` | `char` | `startWrapper/endWrapper subType usfm:<name>` | generic `<span class="{name}">text</span>` | one shared param. test: assert `<span>` with class = marker name, wrapping the literal phrase text | one minimal fixture per marker sharing one assertion helper; can legitimately be *one* generated test file iterating the whole group | Supported (`features/wrappers.ts`); **untested today** |
| `\wj` | `char` | `startWrapper subType usfm:wj` | wrapped in `<span class="wj">` only when `viewSettings.redLetters` (from the `red-letters` user setting) | two fixtures: setting on → `<span class="wj">`; setting off → plain text, no span | dedicated | Supported; needs 2-state fixture. (Setting parity with legacy verified — same `redLetters` prop.) |
| `\w ...\|lemma="..."\w*` | `char` + attribute | `startWrapper subType usfm:w`, `atts.lemma` | glossary on: `<span class="glossary"><a data-match="…" href="javascript:void(0)">`; off: `<span class="w">` | two fixtures (glossary on/off) + assert `data-match` value = first `lemma` value, else the trimmed word text | dedicated | Supported (`features/glossary.ts`); needs 2-state fixture. Attribute name changed from legacy `match` → `data-match`; assert the new name |
| `\xt ...\xt*` | `char` (cross-reference target; usable inside or outside `\x`) | `startWrapper subType usfm:xt` | `<span class="xt">` containing one `<span class="reflink">` per `"; "`-separated reference, each holding `generateHTML(…, 'header-ref')` links; inside a table cell, appended to the cell instead of a phrase | fixtures: single ref, multi-ref (`; `), `\xt` in plain verse text, `\xt` inside `\x`, `\xt` inside a table cell | dedicated compound fixture | Supported (`features/footnotes.ts:167-246`, commit `b6e65d87`); **untested today** |
| `\fig ...\fig*` | figure (own family in `.sty`) | `inlineGraft subType fig` → `startWrapper/endWrapper subType usfm:fig` | `<div class="image-block"><span class="image"><img src></span><div class="caption">…` with `NO_CAPTION` suppressed; async `fetch` HEAD check hides the block on failure; whole feature off when `show-illustrations` is false; images hidden for Bible books unless `display-images-in-bible-text` is `normal` | assert `<img>`-bearing block with resolved `src` (await/mock the async check); caption vs. `NO_CAPTION`; feature-off and setting-off variants; also test the `convert/convertBooks.ts` pre-processing (`handleNoCaptionFigures`, `removeMissingFigures`, `moveFigureToNextNonVerseMarker`) as separate **conversion-layer** unit tests | dedicated + conversion-layer fixtures | Supported (`features/illustrations.ts`); render and conversion layers both **untested today** |
| `\jmp ...\|href="..."\jmp*` | not in base `usfm.ext` `[unverified version]` | `startWrapper/endWrapper subType usfm:jmp` | `<a class="web-link\|email-link\|tel-link dy-tooltip" href data-tip>` for allowlisted protocols (`http`/`https`/`mailto`/`tel`); plain `<span>` otherwise | assert `<a href>` + class per protocol; `target="_blank"` only for web links; assert **no** `<a>` for a disallowed protocol (e.g. `javascript:`) | dedicated | Supported (`features/jmplinks.ts`); **untested today** |
| `\f + ...\f*`, `\x + ...\x*` | `footnote`/`crossreference` container | `inlineGraft subType footnote\|xref` + `note_caller`, nested sequences | `<span data-graft="X-n"><a><sup class="footnote">{caller}&nbsp;</sup></a><div id="X-n" type="…" style="display:none">…child spans…</div></span>` | compound fixtures: caller + content; nested char markup inside (`\ft`, `\fq`, `\add` mixed); caller variants `+` / `-` / literal, and `{footnote,crossref}-caller-type` = `abc` / `custom-symbol` | dedicated compound fixtures (≥2: plain, nested) + caller-config fixtures | Supported (`features/footnotes.ts`); **untested today**, high-value target |
| `\qt-s ... \qt-e\*` (quoted text milestone) | `milestone` | `startMilestone/endMilestone subType usfm:qt` | no HTML; render-sofria logs `Unsupported Milestone Type: usfm:qt` via `features/unsupported.ts` | assert no visible output (and, optionally, the warning) once the product decision is made | none yet | **Gap — needs product decision before a fixture can encode "expected"** (§H) |
| `\ts-s ... \ts-e\*` / bare `\ts` (translator section) | `milestone` | `startMilestone/endMilestone subType usfm:ts` | same as `qt` | same as above | none yet | **Gap** (§H) |
| `\ca`/`\cp`, `\va`/`\vp` (alt/pub numbering) | `attribute` | `mark subType alt_chapter\|alt_verse\|pub_chapter\|pub_verse` (fixed Sofria enum) | **no matching action** and no `mark` fallback — silently dropped | n/a | none yet | **Gap** (§H) |
| `\tr` rows / `\tc1-9`/`\th1-9` cells | table family | `startTable/endTable`, `startRow/endRow`, `startWrapper subType cell` | `<table class="dy-table …"><tr><td class="tc{cumulative n}" colspan>`; `text-end` for right-aligned cells | compound fixture: multi-row/multi-cell table incl. a colspan cell and a right-aligned cell; also test `addParagraphMarkersAroundTableRows` conversion-layer wrapping | dedicated + conversion-layer fixture | Supported (`features/tables.ts`); **untested today** |
| `\s1-4`, `\r`, `\ms`, `\mr` (headings) | `sectionpara` | `blockGraft subType heading` | `<div class="{s1…}" id="{prefix}{n}">`; `\r` text run through `generateHTML(…, 'header-ref')` | assert class + running `id`; `\r` produces `a.header-ref` links | dedicated | Supported (`features/headings.ts`); **untested today** |
| `\imt`,`\ip`,`\iot`,`\ili1-2` (introduction) | `introduction`/`introchar`/`introlist` | `blockGraft subType introduction` | `<div class="{ip…}">` paragraphs, only while displaying the introduction (`hackRenderIntro`); skipped otherwise | fixture with intro displayed / not displayed | dedicated | Supported (`features/introductions.ts`); **untested today** |
| `\mt1-4` (title) | `title` | `blockGraft subType title` | `div[data-verse="title"]` → `<div class="{mt1…}">` per paragraph + two `<div class="b">` spacers | fixture | dedicated | Supported (`features/titles.ts`); **untested today**. Element changed from legacy `<span>` to `<div>` |
| `\rem`, `\ide`, `\usfm`, `\id` | `internal`/`attribute`/`header` | consumed at header/catalog level, not emitted as body render events `[inference]` | not rendered | assert **absence** of any visible HTML for these — a "must not render" test is still real coverage | dedicated negative-assertion fixture | Intentionally unsupported (correct) — should be tested as such, not skipped |
| `\addpn`,`\fdc`,`\h1`,`\h2`,`\ide`,`\ph1`,`\rb`,`\xdc` (deprecated) | varies, flagged only in description text | falls through to base category's normal event path | no special-case; generic fallback | best-effort: assert graceful fallback (doesn't crash, produces *some* reasonable span/div), not a specific product-approved appearance | dedicated, marked low-priority/best-effort | Grammar coverage: yes. Rendering coverage: optional/best-effort by design (§H) |

---

## D. SAB SFM inventory

All entries verified directly in `convert/convertBooks.ts` (filter pipeline, lines 373–386: the
`usfmFilterFunctions` array) and `convert/convertMarkdown.ts`, cross-checked against the
render-sofria milestone features under `src/lib/render-sofria/features/` (the "Renderer
behavior" column) and, for reference, the legacy `startMilestone` action in
`src/lib/components/ScriptureViewSofria.svelte` (lines 2607–2710) plus
`src/lib/scripts/milestoneLinks.ts`. Every SAB milestone below is now **implemented** in
render-sofria; none has a rendering test.

| SAB SFM | Input syntax | `convertBooks.ts` conversion | Proskomma representation | Renderer behavior (render-sofria) | Expected HTML | Test |
|---|---|---|---|---|---|---|
| Video | `\video ID` | `replaceVideoTags` (lines 55-62): regex → `\zvideo-s \|id="ID"\*\zvideo-e\*` | `startMilestone/endMilestone subType usfm:zvideo`, `atts.id` | `features/videos.ts:20-47`: looks up `id` in `config.videos`; if found builds a video block (`createVideoBlock`), else treats `id` as a URL (`÷`→`/` unescape, `createVideoBlockFromUrl`). Blocks are queued in `scratch.milestone.videos` and appended to the end of the current main paragraph on `endParagraph` (`:55-70`), **not** at the milestone point. Config-placed videos are inserted at `endDocument` (`:71-92`), gated on `display-videos-in-bible-text`. Legacy: `ScriptureViewSofria.svelte:2653-2672` | video block appended inside the enclosing paragraph `<div>` | **None found** for `replaceVideoTags` or the renderer path |
| Custom paragraph style | `\p_XXX ...` | `replacePStyleTags` (lines 63-65): `\(p_[^\s]+)` → `\m \zstyle \|id="$1"\*` (standalone milestone, not a pair) | `startMilestone subType usfm:zstyle`, `atts.id` | `features/custom-styles.ts:5-26`: adds **every** `id` value as a class on the nearest `paragraph` scope (legacy, `:2681-2685`, added only `id[0]`) | paragraph `<div class="m p_XXX">` | **None found** |
| Custom character style | `\c_XXX ...\c_XXX*` | `replaceCStyleTags` (lines 66-68): → `\zcstyle-s \|id="c_XXX"\*...\zcstyle-e\*` | `startMilestone/endMilestone subType usfm:zcstyle`, `atts.id` | `features/custom-styles.ts:28-62`: pushes a `wrapper:zcstyle` `<span class="c_XXX">` scope (renamed from `milestone:zcstyle` in `0f40b572` so it participates in the `isTopWrapper` text routing); enclosed text goes into it; the open phrase is terminated and the span promoted on `endMilestone`. Legacy (`:2686-2691`) used a one-shot `encloseInSpanTag` that is consumed by the first text node it sees (`:535-544`) `[inference — multi-phrase/nested content may differ between renderers]` | `<span class="c_XXX">` around the enclosed text | **None found** |
| Unordered list item, level N | `\zuliN ...` (already `z`-prefixed in native SAB SFM) | `transformZuliTags` (lines 79-81): `\zuliN` → `\nb \zuliN\*` (adds a standard `\nb` no-break paragraph before, self-closes as standalone milestone) | `startParagraph subType nb` then `startMilestone subType usfm:zuliN` | `features/lists.ts:75-104`: adds `list-item list-inside` to the current paragraph, `padding-inline-start: (2N-1)rem`, plus `list-[circle]` (N=2) / `list-[square]` (N≥3). Legacy: `:2639-2651` | `<div class="nb list-item list-inside …" style="padding-inline-start:…">` | **Tested** — `convert/tests/sab/storybookTests.test.ts` covers the `\zuli`→`\nb \zuliN\*` transform itself (`transformLists`), but **not** the renderer's output |
| Ordered list item, level N | `\zoliN ...` | `transformZoliTags` (lines 83-85): same shape as zuli | `startMilestone subType usfm:zoliN` | `features/lists.ts:33-62`: adds `list-item list-decimal list-inside`, `counter-set: list-item {n}`, indent as above; increments the level counter and resets all deeper levels. Legacy: `:2622-2638` | `<div class="nb list-item list-decimal list-inside" style="counter-set:…">` | Conversion transform **tested** (same file); renderer output **not tested** |
| Ordered list starting number | `\zonN <startNumber>` | `transformZonTags` (lines 87-89): `\zonN 10` → `\zonN \|start="10"\*` | `startMilestone subType usfm:zonN`, `atts.start` | `features/lists.ts:15-32`: sets the level-N counter start value in `scratch.milestone.listNums`. Legacy: `:2618-2621` | affects rendered numbering of subsequent `zoliN` items — must be tested together with a `zoliN` sequence, not in isolation | Conversion transform **tested**; renderer output **not tested** |
| Markdown image → figure | `![alt](file.png "tip")` (authored inline in SFM text) | `convertMarkdownsToMilestones` → `convertMarkdown.ts:173-177` (`imageUSFM`) → standard `\fig alt\|src="file.png" size="span"\fig*` (tooltip intentionally dropped — "Figures do not support tooltips", confirmed by an explicit test) | standard USFM `\fig` (not a SAB milestone at all — reuses real USFM) | standard figure handling (see §B/§C) | standard figure HTML | **Tested** at the conversion layer (`convert/convertMarkdown.test.ts`); renderer output not tested |
| Markdown local audio link | `[label](clip.mp3)` | `audioUSFM` (`convertMarkdown.ts:162-172`) → `\zaudioc-s \|link="clip.mp3"\*label\zaudioc-e\*` (link URI-encoded; only `.mp3`/`.wav`) | `startMilestone/endMilestone subType usfm:zaudioc`, `atts.link` | `features/audio-clips.ts:21-116` (scope `wrapper:zaudioc`): resolves the file against `config.audio` (assets → bundled clip URL, download → `source.address + filename`); on success emits `<audio id="audio00N" preload="auto">` + `<a class="audioclip" href="javascript:void(0)">label</a>` with a click-to-play listener (**same element shape for assets and download**; legacy `milestoneLinks.ts:63-112` used an inline `onClick` attribute for assets and the `audioclip` class only for download); on failure emits a plain `<span>` with the label | `<audio>` + `<a class="audioclip">`, or `<span>` when unresolvable | Conversion **tested**; renderer/link-resolution **not tested** |
| Markdown scripture reference link | `[label](BOOK.C.V)` (various shorthand forms — same book, same chapter, full ref) | `referenceUSFM` (`convertMarkdown.ts:184-…`) → `\zreflink-s \|link="COLLECTION.BOOK.C.V"\*label\zreflink-e\*` | `startMilestone/endMilestone subType usfm:zreflink`, `atts.link`, optional `atts.title` | `features/reflinks.ts:6-92` (scope `wrapper:zreflink`): `<a class="web-link ref-link dy-tooltip" data-link="…" data-tip="{title}" href="javascript:void(0)">label</a>`; click handler navigates via `events.navigate`. Legacy (`milestoneLinks.ts:113-128`) used a `ref` attribute and wrapped the `<a>` in `span.dy-tooltip` only when a title existed | `<a class="ref-link" data-link>` | Conversion **tested** (multiple shorthand-resolution cases, `convert/convertMarkdown.test.ts`); renderer **not tested** |
| Markdown web/email/tel link | `[label](https://...)` / `mailto:` / `tel:` | `linkUSFM` (`convertMarkdown.ts:178-182`) → standard `\jmp label\|href="..." title="..."\jmp*` (reuses real USFM `\jmp`, not a `z`-marker) | standard USFM `\jmp` wrapper | `features/jmplinks.ts` (see §B/§C) | `<a href class="web-link\|email-link\|tel-link">` | Conversion **tested**; renderer **not tested** |
| ~~Web/email/tel link milestones `usfm:zweblink`/`usfm:ztellink`/`usfm:zelink`~~ | — | No producer exists | — | **Resolved — removed.** The legacy handling in `milestoneLinks.ts` was deleted on this branch (`git diff main -- src/lib/scripts/milestoneLinks.ts`), and no render-sofria feature handles these names; a stray one would hit the `unsupported.ts` milestone warning. Web/email/tel links are produced only via `\jmp` (row above) | n/a | n/a — no fixture needed; drop from §E |
| Strong's-number stripping | `\w text\|strong="H0430"\w*` | `removeStrongNumberReferences` (lines 115-125): strips the whole `\w...\w*` (or `\+w...\+w*`) wrapper down to plain `text` — this is a **downgrade** of standard USFM, not an SAB extension producing a milestone | plain text token, no wrapper at all reaches Proskomma | plain text | plain text, no span | **None found** — and worth testing precisely *because* it's a lossy transform (must verify multi-word/nested cases don't mis-strip) |
| Markdown table-row wrapping | (any `\tr` row block) | `addParagraphMarkersAroundTableRows` (lines 312-319): wraps consecutive `\tr` lines in `\p`/`\p` | affects paragraph/table nesting seen by Proskomma | (feeds into standard table rendering, §C) | n/a directly — feeds table fixture | **None found** |
| Figure caption/missing-image handling | `\fig ...\fig*` variants | `handleNoCaptionFigures` (lines 195-221), `removeMissingFigures` (223-264), `moveFigureToNextNonVerseMarker` (321-364) | affects whether/how a `\fig` reaches Proskomma at all (can be stripped entirely if the image file is missing on disk) | n/a directly | n/a directly — conversion-layer only | **None found** — high value target since it has real conditional branches (missing vs. present, captioned vs. not) |

**Key architectural point for §E**: every SAB *milestone* marker (`zvideo`, `zstyle`, `zcstyle`,
`zaudioc`, `zreflink`, `zuliN`/`zoliN`/`zonN`) already uses the
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
   literally, don't invent wildcard syntax the base spec doesn't have; note render-sofria's
   `features/lists.ts` regexes accept any `\d+` level, so the `.ext` file is what fixes the
   supported range). `zweblink`/`ztellink`/`zelink` are **not** included — their handling was
   removed on this branch and nothing produces them (§D).

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

The **new** renderer (`src/lib/render-sofria/**/*.ts`) exports plain `FeatureSpec`/`RenderAction`
objects from small, single-purpose modules under `src/lib/render-sofria/features/` —
directly importable without mounting any Svelte component. On this branch it covers
essentially the whole taxonomy in §B (text/paragraphs, chapter/verse numbers, character
markers, `\w`, `\xt`, `\fig`, `\jmp`, tables, headings, titles, introductions,
footnotes/xrefs/callers, and all SAB milestones), and it is the renderer PR #1135 intends to
ship. The **legacy** renderer's render-action definitions remain inline inside
`ScriptureViewSofria.svelte`'s `<script>` block, not exported. It is still what `main`
mounts, but on the refactor branch it is no longer mounted.

There is one harness wrinkle: the dispatcher that applies the stage/guard/fallback rules
(`handleSofriaRenderEvent`, `ScriptureViewProskomma.svelte:502-555`) and the workspace
initialisation (`initRenderWorkspace`, `:386-491`) live inside the `.svelte` component,
not in `src/lib/render-sofria/`. A test harness therefore either (a) re-implements that ~20-line
loop over `compileActionDictionary(renderFeatures, …)` and builds a `RenderWorkspace` itself
(`jsdom` `document`, `ScopeManager`, `scratch: {}`, stub `config`/`stores`/`events`), or
(b) — **recommended** — first extracts the dispatcher and workspace factory into
`src/lib/render-sofria/` as plain functions that both the component and tests import, so the
tests exercise the real dispatch semantics rather than a copy. Some features also reach for
SvelteKit/Vite-only modules (`$app/navigation` via `features/common/plans.ts`,
`import.meta.glob` in `features/illustrations.ts` and `features/audio-clips.ts`), which Vitest
will need to resolve or mock. And not every feature uses `workspace.document`: several call the
global `document` directly (e.g. `features/titles.ts:19`, `features/headings.ts:42`,
`features/footnotes.ts:234`, the `<img>`/caption elements in `features/illustrations.ts`,
`createVideoBlock(document, …)` in `features/videos.ts`, the `<audio>` in
`features/audio-clips.ts`), so tests must run under Vitest's `jsdom` environment with the
workspace's document being that same global `document`, not a separately constructed one.

**Recommendation**: build generated/hand-authored coverage against **render-sofria** only,
since (a) it is unit-testable with no new dependencies once the dispatcher is reachable, (b) it
is the intended replacement under active development (PR #1135), so tests written now act as
its acceptance criteria before it ships, and (c) the legacy component is slated for replacement
and has a short shelf life. Use the
*legacy* renderer only as a one-time, human-reviewed reference when first writing expected-HTML
values (see next section) — never as a live, auto-diffed oracle.

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
3. **Rendering coverage** — render-sofria feature-level tests with the semantic HTML
   assertions above.
4. **SAB SFM coverage**, mirrored the same three ways, plus a **conversion-layer** unit-test
   tier (§D/§F convention #1) that is unique to SAB SFM since it has a real
   native-syntax → USFM string-rewrite step upstream of Proskomma entirely.
5. **Integration coverage** — real project fixture(s) run through the full
   `convert →Proskomma → render` pipeline end-to-end (existing CI convention #3), to catch
   regressions in the conversion layer that a unit test of `convertBooks.ts` alone wouldn't
   catch (e.g. filter-function ordering interactions — the `usfmFilterFunctions` array's order
   is itself part of the contract, see `convert/convertBooks.ts:373-386`).

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
  dedicated handler in either renderer. In render-sofria they reach the `fallback` milestone
  handler in `features/unsupported.ts:5-18`, which renders nothing and logs
  `Unsupported Milestone Type: usfm:qt` (or `usfm:ts`). **Needs a product decision** before a
  fixture can encode "expected" — possibly intentional (both are largely
  checking/translation-tool artifacts, arguably correct to drop). If dropping is the decision,
  give them an explicit no-op `standard` handler so they stop warning, and record them as
  intentionally unsupported in the grouping config.
- **`alt_chapter`/`alt_verse`/`pub_chapter`/`pub_verse` marks** (from `\ca`/`\cp`/`\va`/`\vp`,
  alternate/publishable numbering): no handling; the only `mark` actions
  (`features/cv-numbers.ts`) match `chapter_label`/`verses_label`, and `features/unsupported.ts`
  has no `mark` fallback, so these are dropped **without even a warning**. Likely an intentional
  non-goal (PWA doesn't yet support dual versification display), but should be **documented as
  intentional**, and arguably given a `mark` fallback in `unsupported.ts` for consistency.
- **`periphpara` (peripheral material)**: no renderer handling found at all, and
  `[unverified]` whether the PWA ever ingests peripheral USFM content in the first place.
  **Needs a product decision** — is this in scope for the PWA ever?
- ~~**`usfm:zweblink`/`usfm:ztellink`/`usfm:zelink`**~~ — **resolved**: there was never a
  producer, and the legacy handling (`getWebLinkHtml`/`getEmailLinkHtml`/`getTelephoneLinkHtml`
  in `src/lib/scripts/milestoneLinks.ts`) was deleted on this branch. Nothing to test.
- ~~**Regex overlap: `/usfm:f/` also matched `usfm:fig`**~~ — **resolved in `0f40b572`**. The
  footnote wrapper guards in `features/footnotes.ts:73-103` now use `/usfm:f(?!ig)/`, so a
  `usfm:fig` wrapper no longer also gets a footnote `wrapper:fig` scope that would have broken
  `promoteContent('wrapper:figure')` in `features/illustrations.ts:73-86`. Keep a `\fig` fixture
  as a regression check. The guard is still a negative lookahead rather than an explicit marker
  list, so any future `\f…` character marker is claimed by footnote handling automatically;
  `/usfm:x/` in `crossrefs` remains unanchored but has no non-`\x*` marker it would catch.
- **render-sofria's progress doc is stale in the opposite direction now**:
  `src/lib/render-sofria/rendering-refactor.md`'s "As of 08/10/2026" completed/remaining lists
  still describe an early state (and name a `TextPositionFeature` that no longer exists), with
  only a bare "As of 10/14/2026 — Finished?" appended. The code (source of truth) implements
  every construct in §B except the gaps listed here, though the refactor is still in progress
and unmerged. The coverage
  framework should derive per-construct status from the code and from the fixtures themselves,
  never from that doc.
- **Deprecated markers** (`addpn`, `fdc`, `h1`, `h2`, `ide`, `ph1`, `rb`, `xdc`): no
  special-casing; fall through to generic handling (or, for `fdc`/`xdc`, the footnote/xref
  wrapper regexes). Recommend treating these as grammar-coverage-required but
  rendering-coverage-optional/best-effort (§C), since the spec itself discourages continued use
  and a "produces *some* reasonable output, doesn't crash" bar is more proportionate than pinning
  an exact appearance.
- **Behavior differences from the legacy renderer**: since legacy is what `main` ships today,
  these are user-visible changes that would land when PR #1135 merges; they also matter when using
  legacy as a reference while writing expected HTML (§F): (1) `\jmp` — `href` protocol allowlist
  (`features/jmplinks.ts:22-46`); (2) `\fig` — async runtime `fetch` HEAD existence check
  (`features/illustrations.ts:208-220`); (3) `\w` — `match` attribute renamed to `data-match`,
  `glossary` class moved from the `<a>` to the wrapping `<span>`; (4) `\xt` — reference-splitting
  into `span.reflink` / `a.header-ref` (`features/footnotes.ts:220-246`) instead of raw
  `innerHTML`, and now also outside `\x`; (5) titles — `<div class="mt…">` instead of
  `<span class="mt…">`; (6) `\zaudioc` — one element shape for both asset and download sources;
  (7) `\zreflink` — `data-link`/`data-tip` on the `<a>` instead of a `ref` attribute and an outer
  tooltip span; (8) `\zstyle` — all `id` values applied as classes, not just the first; (9)
  `\zvideo` — blocks appended at the end of the enclosing paragraph. `\wj` is **not** a
  divergence: both renderers read the same `red-letters` setting via the `redLetters` prop
  (`src/routes/text/+page.svelte:181`). These read as deliberate; confirm each with the PR #1135 authors,
  then record the confirmed ones as the go-forward contract rather than as regressions.
- **Legacy renderer testability**: `ScriptureViewSofria.svelte` still ships on `main`, but the
  refactor branch already unmounts it (`src/routes/text/+page.svelte:521-522` is commented
  out) and it is expected to be removed once PR #1135 lands. Its render actions are inline and
  unexported, so testing it would need a component-mount harness (`@testing-library/svelte`).
  Recommend not investing in that; use it only as a human reference for expected HTML (§F).
- **No rendering tests exist yet**: confirmed via repo-wide grep — no `*.test.ts` references
  `render-sofria`, `ScriptureViewProskomma` or `ScriptureViewSofria`. Neither the current
  production renderer nor its in-progress replacement has any automated coverage.
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
   §D inventory (the `zweblink`/`ztellink`/`zelink` question is resolved — they are excluded).
   Reuse the Stage 1 parser (same file format).
3. **Build the taxonomy/grouping config** (§B/§C) as a small hand-maintained TS/JSON file
   mapping marker → {group, sharedFixture?, dedicatedFixtureNeeded, status}. This is the
   "coverage requirements" layer the generator reads.
4. **Build `convert/updateUsfmTestCoverage.ts`** (§G): cross-reference Stage 1+2 inventory
   against Stage 3's config, emit the inventory JSON + `test.todo` scaffolds + console diff
   summary. Wire `npm run update-usfm-test-coverage`. At this point the suite runs and reports
   gaps, but has no real assertions yet — this itself is a useful, reviewable checkpoint.
5. **Make render-sofria's dispatcher testable, then hand-author expected-HTML fixtures.**
   First extract `handleSofriaRenderEvent` and the workspace factory out of
   `ScriptureViewProskomma.svelte` into `src/lib/render-sofria/` (§F), so a small
   `renderUsfm(usfm, options) → HTMLElement` test helper can drive the real dispatch rules
   through `pk.importDoc` + `SofriaRenderFromProskomma`. Then write fixtures, highest-value groups
   first. Since render-sofria now implements everything except the §H product-decision gaps,
   every fixture is expected to pass (or to expose a real bug), not to sit as a todo. Suggested
   order: generic character markers (one file, many markers) and paragraph markers;
   chapter/verse numbering (incl. drop-cap); footnotes/xrefs/callers (incl. nested markup and
   caller-config variants); `\fig` (including a regression check for the `/usfm:f/` overlap fixed in `0f40b572`, §H);
   `\xt`, `\jmp`, `\w`; tables; headings/titles/introductions; then the SAB `z*` milestones
   (video/style/cstyle/lists/audio/reflink). This becomes the living contract render-sofria
   has to meet before it replaces the legacy renderer.
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

Stages 1-4 involve no product decisions and do not touch either renderer. Stage 5's
dispatcher extraction is a small refactor of `ScriptureViewProskomma.svelte`, which is itself
unmerged work in progress; coordinate it with PR #1135 (land it there, or as its own reviewed
change on top) rather than treating it as a change to production code. Stage 5 is also where the §H gaps (qt/ts milestones, alt/pub numbering, periphpara) will need actual
answers before their fixtures can be written "correctly" rather than just "documented as
pending" — recommend surfacing those as a short separate decision list to the team before
Stage 5 rather than guessing.
