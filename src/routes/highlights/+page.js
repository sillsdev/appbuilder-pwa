import { getHighlights } from '$lib/data/highlights';

/** @type {import('./$types').PageLoad} */
export async function load({ depends }) {
    const highlights = await getHighlights();
    depends('highlights');
    return { highlights };
}
