import { base } from '$app/paths';

/** @type {import('./$types').PageLoad} */
export async function load({ fetch }) {
    const response = await fetch(`${base}/about.partial.html`);
    const partial = await response.text();
    return { partial };
}
