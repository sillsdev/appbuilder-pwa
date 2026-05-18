import config from '$assets/config';
import { getBookmarks } from '$lib/data/bookmarks';

/** @type {import('./$types').PageLoad} */
export async function load({ depends }) {
    const allBookmarks = await getBookmarks();

    // Make annotations more resiliant to changes in book collection ids over time.
    // Ignore entries if we don't currently have a collection for the entry.
    // This can happen during testing of different PWA at the same port and we don't
    // want to break the feature.
    const bookmarks = allBookmarks.filter((item) => {
        return config.bookCollections.some((collection) => collection.id === item.collection);
    });
    depends('bookmarks');
    return { bookmarks };
}
