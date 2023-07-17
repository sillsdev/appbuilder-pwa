import { getBookmarks } from '$lib/data/bookmarks';

/** @type {import('./$types').PageLoad} */
export async function load({ depends }) {
    const bookmarks = await getBookmarks();
    depends('bookmarks');
    return { bookmarks };
}
