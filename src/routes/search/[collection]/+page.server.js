import { error } from '@sveltejs/kit';
import config from '$lib/data/config';

export async function load({ params }) {
    const collection = config.bookCollections.find((bc) => bc.id === params.collection);

    if (!collection) throw error(404);

    return { collection: collection.id };
}
