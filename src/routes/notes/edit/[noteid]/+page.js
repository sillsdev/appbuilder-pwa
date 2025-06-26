import { error } from '@sveltejs/kit';
import { getNotes } from '$lib/data/notes';

export async function load({ params }) {
    const { noteid } = params;
    if (noteid === 'new') {
        return { note: undefined };
    }

    const date = parseInt(noteid, 10);
    if (isNaN(date)) {
        console.error(`Invalid noteid: ${noteid}`);
        error(400, {
            message: 'Invalid note ID'
        });
    }

    const allNotes = await getNotes();
    const note = allNotes.find((item) => item.date === date);

    if (!note) {
        error(404, {
            message: 'Note not found'
        });
    }
    return { note };
}
