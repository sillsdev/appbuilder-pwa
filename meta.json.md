# How meta.json is loaded by bloom-player

## Flow

A single `url` prop (the book folder or `.htm` file) drives everything:

1. **Entry point**: `IProps.url` in `src/bloom-player-core.tsx:124` — "Url of the bloom book (folder)." In the standalone harness it comes from the query string: `src/bloom-player-controls.tsx:1140` → `url={getQueryStringParamAndUnencode("url")}`.
2. **Parsing**: The constructor stores it as `state.bookUrl`, stripping any `#hash` as `startPageId`.
3. **componentDidUpdate** normalizes it (`preprocessUrl()`), then calls `computeBookUrlParts(sourceUrl)` (`bookLoader.ts:29-49`) to split it into `urlOfBookHtmlFile` and `urlPrefix` (the book folder).
4. **Fetching**: `loadBook(urlOfBookHtmlFile, urlPrefix)` (`bookLoader.ts:66-108`) fires three parallel `axios.get` calls:
   - the `.htm` file
   - `fullUrl("meta.json", urlPrefix)` → **`bookLoader.ts:90`** — literally `urlPrefix + "/meta.json"`
   - `.distribution` (tolerant of 404)
5. The resulting `metaDataObject` (untyped, `any`) is stashed on `BloomPlayerCore` and later read by `BookInfo.setSomeBookInfoFromMetadata()` and `LangData` helpers for title, publisher, tags, features, RTL flag, language names, etc.

## Is there an option to pass a meta.json path directly?

**No.** There's no prop, query param, or override anywhere — meta.json's location is always derived by string concatenation from `urlPrefix`, which itself is derived from the single `url` input. There's also no typed interface for meta.json's shape; it's passed around as `any` and read field-by-field in `bookInfo.ts`.

If bloom-player itself were to be changed to support this, the minimal additions would be:
- an optional `metaJsonUrl?: string` on `IProps` (bloom-player-core.tsx)
- have `loadBook()` use that override instead of `fullUrl("meta.json", urlPrefix)` when provided
- optionally expose it as a query param in `bloom-player-controls.tsx` alongside `url`

## Can a consuming project hash meta.json (e.g. `meta.3asdg8e2w.json`) per build, without modifying bloom-player?

No — since bloom-player hardcodes the request as literally `urlPrefix + "/meta.json"` (`bookLoader.ts:90`, via `fullUrl("meta.json", urlPrefix)`) with no override hook, it can't be made to request a hashed filename without patching bloom-player's source. The `url` prop only points at the book folder — everything under it (`meta.json`, `.distribution`, the `.htm` file) is derived by fixed string concatenation.

Since modifying bloom-player is off the table, the options are all on the serving side, keeping the literal path `meta.json` stable:

1. **Server-side rewrite/alias** — the static server (or a rewrite rule) serves whatever the current hashed file's contents are whenever `meta.json` is requested. The build still emits `meta.<hash>.json` for the consuming project's own asset-hashing needs, but it's also copied/symlinked to (or rewritten from) `meta.json` for bloom-player to fetch.
2. **Skip filename hashing for this file, use cache headers instead** — since bloom-player always hits the same URL, the usual reason for filename hashing (cache-busting) is better solved with `Cache-Control: no-cache, must-revalidate` (or a short `max-age`) plus an `ETag`/`Last-Modified` on `meta.json` specifically, while other hashed assets keep long-lived caching.

Either way, the constraint is the same: bloom-player must always be able to `GET <bookFolder>/meta.json` literally.
