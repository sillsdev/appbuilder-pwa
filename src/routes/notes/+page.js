import { getNotes } from '$lib/data/notes';

/** @type {import('./$types').PageLoad} */
export async function load() {
    const notes = await getNotes();
    return { notes };
}
