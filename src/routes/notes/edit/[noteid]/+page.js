import { getNotes } from '$lib/data/notes';

export async function load({ params }) {
    const { noteid } = params;
    const date = parseInt(noteid, 10);
    const allNotes = await getNotes();
    const note = allNotes.find((item) => item.date === date);

    console.log('note %o allNotes %o noteid %o date %o' , note, allNotes, noteid, date);
    
    if (!note) {
        throw new Error('Note not found');
    }

    return { note };
}


