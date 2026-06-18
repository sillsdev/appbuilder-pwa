import { base } from '$app/paths';
import type { ResolvedPathname } from '$app/types';

/**
 * Replacement for SvelteKit's `resolve()` from `$app/paths` when using hash routing with `BUILD_BASE_PATH`.
 *
 * Bug in SvelteKit ≤ 2.59.x: `resolve('/path')` with `base='/foobar'` generates `/foobar#/path`
 * (URL pathname = `/foobar`), but `location.pathname` is always `/foobar/` (with trailing slash
 * after the server redirect `/foobar` → `/foobar/`). `is_external_url()` sees `/foobar` ≠ `/foobar/`
 * and treats the navigation as external, calling `native_navigation()` → full page reload → all
 * in-memory Svelte store state is lost.
 *
 * Fix: generate `BASE/#/path` so `url.pathname = BASE/` matches `location.pathname = BASE/`.
 * Works when base is empty too: `'' + '/#' + '/path'` = `/#/path` → pathname `/` matches `/`.
 *
 * Returning `ResolvedPathname` satisfies `eslint-plugin-svelte`'s `no-navigation-without-resolve`
 * rule via its TypeScript type-check path, since our function serves the same role as the original.
 */
export function resolve(path: string): ResolvedPathname {
    return (base + '/#' + path) as ResolvedPathname;
}
