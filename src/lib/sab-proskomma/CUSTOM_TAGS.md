# Getting non-standard USFM markers through Proskomma

This note explains how non-standard markers (SAB's `z*` markers and project-specific tags such as `\lw`)
make it through `proskomma-core` and into the Sofria events that `src/lib/render-sofria` turns into
HTML. It covers what can be configured, what can't, and the workarounds.

Findings were verified against `proskomma-core@0.11.3` and `proskomma-json-tools@0.9.1` (the
versions installed in the root `node_modules`), reading upstream source at
[Proskomma/proskomma-core](https://github.com/Proskomma/proskomma-core) commit `0204ad3` and
[Proskomma/proskomma-json-tools](https://github.com/Proskomma/proskomma-json-tools), and by running
sample USFM through the installed packages (see [Reproducing](#reproducing)).

## Summary

- **The only hook is `customTags`** on the `Proskomma` class. `SABProskomma` already has it, with
  every list empty (`src/lib/sab-proskomma/index.ts`).
- **The Sofria side needs no configuration.** `SofriaRenderFromProskomma` maps any `span/X`,
  `spanWithAtts/X`, `milestone/X` or `blockTag/X` scope to an event with subType `usfm:X`. If the
  parser keeps a marker, render-sofria sees it.
- **All the limits are in proskomma-core's lexer and parser.** Undeclared tags are dropped without
  warning, and tag names have to fit a fixed character set.
- **Milestones need no configuration at all.** Any `\name-s … \name-e\*` or `\name …\*` reaches
  Sofria as `startMilestone`/`endMilestone` `usfm:name`. That's why SAB's existing `z*` milestones
  work.
- **Custom tags only take effect at conversion time.** `convert/convertBooks.ts` parses with
  `SABProskomma` and freezes the result. The app only thaws the frozen data, so changing
  `customTags` means regenerating the data.

## How a marker gets through

```
USFM text ──lexer──▶ tokens ──parser specs──▶ scopes ──SofriaRenderFromProskomma──▶ Sofria events
            (fixed regexes)   (lookup by tag name,        (generic: usfm:<name>)
                               extended by customTags)
```

### 1. Lexer (`src/parser/lexers/lexingRegexes.js`)

The regexes are module-level constants and can't be configured.

| Token | Pattern | Consequence |
|---|---|---|
| Start/end tag | `\\[+]?[a-z\-]+[1-9]?` (then `*` for end tags) | Lowercase letters and hyphens only, plus one optional trailing digit 1–9. No underscores, uppercase or `0`. |
| Milestone start/end | `\\[a-z1-9]+-[se]` | Lowercase letters and digits 1–9. No hyphens inside the name. |
| Empty milestone | `\\[a-z1-9]+( \| [a-z1-9]+="…")*\\*` | Attribute names are limited to `[a-z1-9]`. |
| Attribute | `\|? name="value"` with name `[A-Za-z0-9\-]+` | Wider than the empty-milestone attribute names. |

Things that follow from these patterns:

- `\p_XXX` lexes as `\p` followed by the text `_XXX`, and `\c_XXX` as an unknown `\c` tag followed by
  `_XXX`. This is why `convertBooks.ts` rewrites them to `\zstyle`/`\zcstyle` milestones before
  parsing.
- **The digit 1 is dropped from the name.** `makeTag` in `object_for_fragment.js` sets
  `fullTagName` to the bare name when the digit is `1`, so `\zuli1` becomes `zuli` while `\zuli2`
  stays `zuli2` (the same as `\q1` → `q`).
- **Avoid `-s`/`-e` after a hyphen in tag names.** The milestone regex is tried before the tag
  regexes, so `\zc-span` lexes as the start of a `zc` milestone.

### 2. Parser specs (`src/parser/parser_specs.js`, `src/parser/index.js`)

`Parser.specForItem` looks up each start tag by name in a fixed table. `customTags` adds names to
some of the table's lists.

- **An undeclared start tag is dropped without warning.** Its text stays in the current
  paragraph. Before the lookup, `parseItem` closes every `implicitEnd` scope (open character spans)
  unless the tag has a `+` prefix, so an undeclared tag still closes open spans.
- **An undeclared end tag is dropped.**
- **Attributes outside an attribute context become literal text.** Attributes are only understood
  inside a word-level tag (`\w`, `\rb`, `\jmp`, `customTags.word`), `\fig`, or a milestone.
  Anywhere else, text like `| id="…"` is added to the paragraph as an `unknown` token. Upstream's
  `test/code/main/custom.cjs` checks for this.
- **Attribute values are rewritten** (`makeAttribute` in `object_for_fragment.js`). Every `/` is
  replaced with `÷`, and the value is split on commas into several values. This is why
  `features/videos.ts` converts `÷` back to `/`, and why `features/custom-styles.ts` applies every
  `id` value as a class. Empty milestones parse their attributes separately in `makeMilestone`.
  I didn't check whether they get the same treatment.
- **An attribute without a name** gets the name `lemma` on `\w`, `gloss` on `\rb`, `link-href` on
  `\xt`, and `unknownDefault_<tag>` on anything else, including custom word tags.

### 3. Sofria rendering (`proskomma-json-tools`, `src/render/renderers/SofriaRenderFromProskomma.js`)

The scope-to-event mapping is generic:

| Scope | Sofria event |
|---|---|
| `blockTag/X` | `startParagraph`/`endParagraph`, subType `usfm:X` |
| `span/X` | `startWrapper`/`endWrapper`, subType `usfm:X`, no attributes |
| `spanWithAtts/X` + `attribute/…` | `startWrapper`/`endWrapper`, subType `usfm:X`, `atts` |
| `milestone/X` | `startMilestone`/`endMilestone`, subType `usfm:X`, `atts` (`ts` becomes a `mark` instead) |

proskomma-json-tools has no hook into parsing. Its `sofriaToSofria` transforms can only reshape
what the parser kept, so they can't bring back a dropped tag.

**Bug: character spans inside `\w`.** `renderItem` expects a `spanWithAtts` start to be followed
directly by its attribute scopes. The parser emits `\w \+lw serpents\+lw*|lemma="serpent"\w*` as
`spanWithAtts/w` › `span/lw` › `attribute/…/lemma/…` › end `w`. The renderer then emits an empty
`usfm:w` wrapper, then `usfm:lw`, then a second `usfm:w` wrapper with the lemma that never gets an
`endWrapper`. The parser output is correct, so this needs an upstream fix. Until then, put the
character span outside the `\w` (see [Example: `\lw`](#example-lw-in-a-glossary)).

## `customTags` reference

`customTags` is set on the Proskomma instance (`SABProskomma`'s constructor) or passed for each
document to `importDocument(selectors, contentType, content, filterOptions, customTags, …)`. Every
key must be present.

| Key | Parser behavior | Sofria output |
|---|---|---|
| `paragraph` | Starts a new paragraph in the main sequence (or the current sidebar). | `startParagraph` `usfm:X` |
| `char` | Opens a span, closed by `\X*`, the end of the paragraph, or the next start tag without `+`. | `startWrapper` `usfm:X`, no attributes |
| `word` | Opens a span that takes attributes, like `\w` and `\jmp`; closed by `\X*` or the end of the paragraph. | `startWrapper` `usfm:X` with `atts` |
| `heading` | Starts a new heading sequence. | heading `blockGraft` |
| `intro` | Adds a paragraph to the introduction sequence. | introduction paragraph |
| `introHeading` | Turns an intro paragraph with this tag into a heading graft (listed in `intro` as well). | heading graft inside the introduction |

Upstream's `test/code/main/custom.cjs` covers every key (with `zh`, `zp`, `zc`, `zw`, `zhi`, `zip`).

What `customTags` can't do:

- Allow names outside the lexer's character set.
- Give a custom paragraph tag attributes. Only word-level tags, `\fig` and milestones get an
  attribute context.
- Add a note-like inline type (something that behaves like `\f` or `\x`), or a header tag.
- Add a separate milestone category. None is needed, since milestones are always generic.

## Options for SAB markers

1. **`customTags` for markers with a fixed set of names.** For example, `\zuliN`/`\zoliN` could be
   declared as `customTags.paragraph` (`zuli`, `zuli2`, …), which would give
   `startParagraph usfm:zuli2` directly instead of the current `\nb \zuliN\*` rewrite. Level 1
   arrives as `zuli`.
2. **`z*` milestones (current approach).** These need no configuration and accept any attributes,
   but milestones are flat start/end markers rather than nested spans. render-sofria has to
   rebuild the nesting itself with `wrapper:*` scopes. This suits markers with arbitrary names
   (`zstyle`, `zcstyle` from `\p_XXX`/`\c_XXX`) and single points in the text (`zvideo`), and
   markers whose values don't fit on a tag (`zonN`, which needs `start`).
3. **`customTags.word` for span-like markers with attributes.** Emitting
   `\zreflink label|link="GEN.1.1"\zreflink*` instead of the milestone pair would produce a real
   wrapper with `atts.link`, nested correctly and closed at the end of the paragraph, the same
   path `\jmp` takes. This could also replace the `zcstyle` and `zaudioc` milestones. Always name
   the attribute, and the comma and `÷` rewriting still applies. Not tried yet.
4. **Fork or patch proskomma-core** for paragraphs with attributes, custom note types, or a wider
   name character set. Only the bundled `dist/` is published, so `patch-package` would be patching
   bundled code. A fork or an upstream PR (for example a `customTags.paragraphWithAtts` key) is the
   better route.
5. **Import USX or USJ instead of USFM.** The USX lexer takes `style="p_Callout"` as written, so
   names with underscores and uppercase survive. They still have to be declared in `customTags`,
   and a USFM-to-USX conversion would be needed first. Probably not worth it.

| Marker | Suggestion |
|---|---|
| `\zuliN`, `\zoliN` | Option 1 (`customTags.paragraph`) |
| `\zonN` | Keep as a milestone (needs the `start` value) |
| `zcstyle`, `zaudioc`, `zreflink` | Try option 3 (`customTags.word`) |
| `zstyle` (`\p_XXX`) | Keep as a milestone (arbitrary names, `_` can't be lexed) |
| `zvideo` | Keep as a milestone (single point in the text) |

## Example: `\lw` in a glossary

Glossary (`GLO`) content as currently authored:

```
\c 1
\q1 \k serpent \k* snake
\q1 \k subtle \k* crafty, or smart; commonly used to describe \w \lw serpents \lw* |lemma="serpent" \w*
\q1 \k \lw eternal\lw* life\k* life with no end
```

Sofria events from the installed packages:

| Line | `lw` not declared (current) | `customTags.char: ['lw']` |
|---|---|---|
| 1 | correct | correct |
| 2 | `lw` dropped; `usfm:w` keeps its lemma | empty `usfm:w`, then `usfm:lw` ("serpents"), then a second `usfm:w` with the lemma that never closes (the renderer bug above) |
| 3 | `k` empty; "eternal life" is plain text | `k` empty (closed by the unprefixed `\lw`); `lw` wraps "eternal"; " life" outside both |

This version works with `customTags.char: ['lw']`:

```
\c 1
\q1 \k serpent\k* snake
\q1 \k subtle\k* crafty, or smart; commonly used to describe \lw \+w serpents|lemma="serpent"\+w*\lw*
\q1 \k \+lw eternal\+lw* life\k* life with no end
```

- Line 2: `lw` › `w {lemma: ["serpent"]}` › "serpents" › end `w` › end `lw`.
- Line 3: `k` › `lw` › "eternal" › end `lw` › " life" › end `k` › " life with no end".

If the source keeps the original form, `convertBooks.ts` can rewrite it before parsing:

- Inside an open `\k … \k*`, change `\lw … \lw*` to `\+lw … \+lw*`.
- Change `\w \lw X\lw* |attrs\w*` to `\lw \+w X|attrs\+w*\lw*`.

Once declared, `usfm:lw` falls through to the generic `usfmWrappers` fallback in
`src/lib/render-sofria/features/wrappers.ts` and renders as `<span class="lw">`. If `\lw` should
act as a glossary link, it needs its own feature file (like `features/reflinks.ts`).

## Testing

- **An undeclared tag doesn't trigger render-sofria's warning.** `features/unsupported.ts` warns
  about events nothing handled, but an undeclared tag never becomes an event. Catching it needs a
  check at conversion time that compares the markers in the converted USFM against a list of known
  markers (standard USFM plus `customTags`).
- **Check for leaked attribute text.** A fixture should assert that no `|name="…"` text reaches the
  rendered output.

## Reproducing

Save this as a `.mjs` file in the repo root (the imports are relative to the script's own location)
and run `node <file> '<usfm lines>'`. It prints the Sofria events with and without `lw` declared.

```js
import { Proskomma } from './node_modules/proskomma-core/dist/index.mjs';
import { SofriaRenderFromProskomma } from './node_modules/proskomma-json-tools/dist/index.js';

const usfm = `\\id GLO Glossary\n\\c 1\n${process.argv[2]}\n`;
class PK extends Proskomma {
    constructor(char) {
        super();
        this.customTags = { heading: [], paragraph: [], char, word: [], intro: [], introHeading: [] };
    }
}
for (const char of [[], ['lw']]) {
    const pk = new PK(char);
    pk.importDocument({ lang: 'eng', abbr: 'tst' }, 'usfm', usfm);
    const docId = Object.keys(pk.documents)[0];
    const events = [];
    const log = (name) => ({
        description: name,
        test: () => true,
        action: ({ context }) => {
            const el = context.sequences[0].element;
            events.push(name === 'text' ? `  text ${JSON.stringify(el.text)}`
                : `${name} ${el?.subType ?? ''} ${el?.atts ? JSON.stringify(el.atts) : ''}`);
        }
    });
    const actions = {};
    for (const e of ['startParagraph', 'endParagraph', 'startWrapper', 'endWrapper', 'text', 'startMilestone', 'endMilestone'])
        actions[e] = [log(e)];
    new SofriaRenderFromProskomma({ proskomma: pk, actions }).renderDocument({ docId, config: {}, output: {} });
    console.log(`=== customTags.char = ${JSON.stringify(char)}\n${events.join('\n')}`);
}
```

The script logs `context.sequences[0].element` for every event. For paragraph events that is
whatever element was set last, so ignore the subType shown on `startParagraph`/`endParagraph`
lines.
