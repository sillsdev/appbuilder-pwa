import { initProskomma } from '$lib/data/scripture';

/** @type {import('./$types').PageLoad} */
export async function load({ url, fetch }) {
    const ref = url.searchParams.get('ref');
    const audio = url.searchParams.get('audio');
    const proskomma = await initProskomma({ fetch });

    return { ref, audio, proskomma };
}
