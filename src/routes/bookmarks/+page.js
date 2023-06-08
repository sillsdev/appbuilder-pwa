import { getBookmarks } from '$lib/data/bookmarks';

/** @type {import('./$types').PageLoad} */
export async function load() {
    const bookmarks = await getBookmarks();
    return { bookmarks };
}