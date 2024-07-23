import { initProskomma } from '$lib/data/scripture';

/** @type {import('./$types').PageLoad} */
export async function load({ url, fetch }) {
    const proskomma = await initProskomma({ fetch });
    return { proskomma };
}
