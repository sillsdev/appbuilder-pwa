import { getHighlights } from '$lib/data/highlights';

/** @type {import('./$types').PageLoad} */
export async function load() {
    const highlights = await getHighlights();
    return { highlights };
}
