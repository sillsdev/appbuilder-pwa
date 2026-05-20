import { bookmarksLastUpdated, findBookmarkByChapter } from '$lib/data/bookmarks';
import { findHighlightByChapter, highlightsLastUpdated } from '$lib/data/highlights';
import { findNoteByChapter, notesLastUpdated } from '$lib/data/notes';
import { derived } from 'svelte/store';
import { refs } from './scripture';

/* promise of bookmarks for the current collection/book/chapter */
export const bookmarks = derived([refs, bookmarksLastUpdated], ([$refs]) => {
    return findBookmarkByChapter($refs);
});

/* promise of highlights for the current collection/book/chapter */
export const highlights = derived([refs, highlightsLastUpdated], ([$refs]) => {
    return findHighlightByChapter($refs);
});

/* promise of notes for the current collection/book/chapter */
export const notes = derived([refs, notesLastUpdated], ([$refs]) => {
    return findNoteByChapter($refs);
});
