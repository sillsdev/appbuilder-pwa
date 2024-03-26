import { getNotes } from '$lib/data/notes';
import config from '$lib/data/config';

/** @type {import('./$types').PageLoad} */
export async function load({ depends }) {
    const allNotes = await getNotes();

    // Make annotations more resiliant to changes in book collection ids over time.
    // Ignore entries if we don't currently have a collection for the entry.
    // This can happen during testing of different PWA at the same port and we don't
    // want to break the feature.
    const notes = allNotes.filter((item) => {
        return config.bookCollections.some((collection) => collection.id === item.collection);
    });
    depends('notes');
    console.log('Notes', notes);
    return { notes };
}
