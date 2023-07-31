import { getNotes } from '$lib/data/notes';

/** @type {import('./$types').PageLoad} */
export async function load({ depends }) {
    const notes = await getNotes();
    console.log("notes updated", notes);
    depends('notes');
    return { notes };
}
