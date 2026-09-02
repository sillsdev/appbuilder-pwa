import { bookmarksLastUpdated, findBookmarkByChapter } from '$lib/data/bookmarks';
import { findHighlightByChapter, highlightsLastUpdated } from '$lib/data/highlights';
import { findNoteByChapter, notesLastUpdated } from '$lib/data/notes';
import {
    markAnnotationHintShown,
    shouldShowAnnotationHint,
    type AnnotationKind
} from '$lib/scripts/safariUtils';
import { derived, writable } from 'svelte/store';
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

// Shows a one-time popup ("you may lose your data...") the first time a user adds
// an annotation. Lives here (rather than on the toolbar that triggers it) because
// that toolbar is unmounted as soon as the selection is cleared or the user
// navigates to the note editor - this store outlives both.
export interface AnnotationHintState {
    visible: boolean;
    kind: AnnotationKind | null;
}

export const annotationHint = writable<AnnotationHintState>({ visible: false, kind: null });

const ANNOTATION_HINT_DURATION_MS = 4000;
let annotationHintTimeoutId: ReturnType<typeof setTimeout> | null = null;

export function triggerAnnotationHint(kind: AnnotationKind): void {
    if (!shouldShowAnnotationHint()) {
        return;
    }
    markAnnotationHintShown();
    annotationHint.set({ visible: true, kind });
    if (annotationHintTimeoutId) {
        clearTimeout(annotationHintTimeoutId);
    }
    annotationHintTimeoutId = setTimeout(() => {
        annotationHint.set({ visible: false, kind: null });
        annotationHintTimeoutId = null;
    }, ANNOTATION_HINT_DURATION_MS);
}
