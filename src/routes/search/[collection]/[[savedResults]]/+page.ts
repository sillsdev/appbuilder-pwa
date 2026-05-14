import { error } from '@sveltejs/kit';
import { scriptureConfig } from '$assets/config';

export async function load({ params }) {
    const collection = scriptureConfig.bookCollections?.find((bc) => bc.id === params.collection);

    if (!collection) {
        throw error(404);
    }

    return { collection: collection.id, savedResults: params.savedResults };
}
