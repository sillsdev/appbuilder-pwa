import { initProskomma } from '$lib/data/scripture';
import catalog from '$lib/data/catalog';
import { refs } from '$lib/data/stores/scripture';

/** @type {import('./$types').PageLoad} */
export async function load({ url, fetch }) {
    const ref = url.searchParams.get('ref');
    const audio = url.searchParams.get('audio');
    const proskomma = await initProskomma({ fetch });

    catalog.setFetch(fetch);
    await refs.init();
    return { ref, audio, proskomma };
}
