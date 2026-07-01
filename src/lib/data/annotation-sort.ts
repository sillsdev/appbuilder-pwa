import type { BookmarkItem } from './bookmarks';
import type { HighlightItem } from './highlights';
import type { NoteItem } from './notes';

export const Sort = {
    Date: 1,
    Reference: 2,
    Color: 3
} as const;
export type Sort = (typeof Sort)[keyof typeof Sort];

type Annotation = BookmarkItem | HighlightItem | NoteItem;

export function compareReference(a: Annotation, b: Annotation) {
    if (a.bookIndex > b.bookIndex) {
        return 1;
    } else if (a.bookIndex < b.bookIndex) {
        return -1;
    } else if (parseInt(a.chapter) > parseInt(b.chapter)) {
        return 1;
    } else if (parseInt(a.chapter) < parseInt(b.chapter)) {
        return -1;
    } else if (parseInt(a.verse) > parseInt(b.verse)) {
        return 1;
    } else {
        return -1;
    }
}

export function compareDate(a: Annotation, b: Annotation) {
    if (a.date < b.date) {
        return 1;
    } else {
        return -1;
    }
}

export function compareColor(a: HighlightItem, b: HighlightItem) {
    if (a.penColor > b.penColor) {
        return 1;
    } else if (a.penColor < b.penColor) {
        return -1;
    } else if (a.date < b.date) {
        return 1;
    } else {
        return -1;
    }
}

export function toSorted<T extends Annotation>(items: T[], sortType: Sort) {
    if (sortType === Sort.Reference) {
        return items.toSorted(compareReference);
    } else if (sortType === Sort.Date) {
        return items.toSorted(compareDate);
    } else if (sortType === Sort.Color) {
        //@ts-expect-error I don't know how to specify that this only be for Highlights - Aidan
        return items.toSorted(compareColor);
    }
    return items;
}
