import { initProskomma } from '$lib/data/scripture';

/** @type {import('./$types').PageLoad} */
export async function load({ fetch }) {
    const proskomma = await initProskomma({ fetch });
    return { fetch, proskomma };
}
