import { scriptureConfig } from '$assets/config';
import { getNotes } from '$lib/data/notes';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ depends }) => {
    const allNotes = await getNotes();

    // Make annotations more resiliant to changes in book collection ids over time.
    // Ignore entries if we don't currently have a collection for the entry.
    // This can happen during testing of different PWA at the same port and we don't
    // want to break the feature.
    const notes = allNotes.filter((item) =>
        scriptureConfig.bookCollections?.some((collection) => collection.id === item.collection)
    );
    depends('note:notes');
    console.log('Notes', notes);
    return { notes };
};
