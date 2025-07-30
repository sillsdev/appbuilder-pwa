import { initProskomma } from '$lib/data/scripture';

/** @type {import('./$types').PageLoad} */
export async function load({ params, fetch }) {
    const { collection, id } = params;
    const filename = `${collection}-${id}-songs-by-number.txt`;
    const proskomma = await initProskomma({ fetch });
    return {
        fetch,
        collection,
        id,
        filename
    };
}