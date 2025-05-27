import { base } from '$app/paths';
import config from '$lib/data/config';

/** @type {import('./$types').PageLoad} */
export async function load({ params, fetch }) {
    const id = params.id;
    const collection = params.collection;
    console.log(`Songs: collection=${collection} id=${id}`);

    let songs;
    try {
        const response = await fetch(`${base}/collections/${collection}/songs/${id}.json`);
        if (!response.ok) {
            throw new Error('Failed to fetch songs JSON file');
        }

        songs = await response.json();
    } catch (error) {
        console.error('Error fetching songs JSON file', error);
    }

    return {
        collection,
        book: id,
        songs
    };
}
