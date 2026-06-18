import { resolve as svelteKitResolve } from '$app/paths';
import type { ResolvedPathname } from '$app/types';

/**
 * Thin wrapper around SvelteKit's `resolve()` from `$app/paths` that fixes a bug with hash
 * routing + `BUILD_BASE_PATH` (https://github.com/sveltejs/kit/issues/14894).
 *
 * Bug: `resolve('/path')` with `base='/foobar'` calls `resolve_route` internally and returns
 * `BASE#/path` (url.pathname = `BASE`, no trailing slash). But `location.pathname` is always
 * `BASE/` (with trailing slash, after the server's `/foobar` → `/foobar/` redirect).
 * `is_external_url()` sees `BASE` ≠ `BASE/` and calls `native_navigation()` → full page reload
 * → all in-memory Svelte stores are lost.
 *
 * Fix: insert `/` before the `#` so url.pathname becomes `BASE/`, matching `location.pathname`.
 * Works when base is empty: `#/path` → `/#/path` → url.pathname `/` matches location.pathname `/`.
 *
 * Returning `ResolvedPathname` satisfies `eslint-plugin-svelte`'s `no-navigation-without-resolve`
 * rule via its TypeScript type-check path, since this function serves the same role as the original.
 */
// Rejects paths that already include a hash prefix — resolve() adds it internally.
type HashFreePath<T extends string> = T extends `#${string}` | `/#${string}` ? never : T;

export function resolve<T extends string>(path: HashFreePath<T>): ResolvedPathname {
    return (svelteKitResolve(path as any) as string).replace(/#/, '/#') as ResolvedPathname;
}
