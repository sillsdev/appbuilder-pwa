import { getNotes } from '$lib/data/notes';

export async function load({ params }) {
    const { noteid } = params;
    const date = parseInt(noteid, 10);

    if (isNaN(date)) {
        console.error(`Invalid noteid: ${noteid}`);
        return {
            status: 400,
            error: new Error('Invalid note ID')
        };
    }

    const allNotes = await getNotes();
    const note = allNotes.find((item) => item.date === date);

    if (!note) {
        return {
            status: 400,
            error: new Error('Note not found')
        };
    }

    return { note };
}
