import { base } from '$app/paths';

/** @type {import('./$types').PageLoad} */
export async function load({ fetch }) {
    const url = await import('$assets/about.partial.html?raw');
    return { partial: url.default };
}
