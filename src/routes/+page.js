import { initProskomma } from '$lib/data/scripture';

/** @type {import('./$types').PageLoad} */
export function load({ url, fetch }) {
    const ref = url.searchParams.get('ref');
    const audio = url.searchParams.get('audio');
    const proskomma = initProskomma({ fetch });

    return { ref, audio, proskomma };
}
