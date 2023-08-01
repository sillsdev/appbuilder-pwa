import { openDB, type DBSchema } from 'idb';
import config from '$lib/data/config';
import { writable } from 'svelte/store';
import { invalidate } from '$app/navigation';

export interface HighlightItem {
    date: number;
    docSet: string;
    collection: string;
    book: string;
    chapter: string;
    verse: string;
    text: string;
    reference: string;
    bookIndex: number;
    penColor: number;
}
interface Highlights extends DBSchema {
    highlights: {
        key: number;
        value: HighlightItem;
        indexes: {
            'collection, book, chapter, verse': string;
            'collection, book, chapter': string;
        };
    };
}

let highlightDB = null;
async function openHighlights() {
    if (!highlightDB) {
        highlightDB = await openDB<Highlights>('highlights', 1, {
            upgrade(db) {
                const highlightStore = db.createObjectStore('highlights', {
                    keyPath: 'date'
                });

                highlightStore.createIndex('collection, book, chapter, verse', [
                    'collection',
                    'book',
                    'chapter',
                    'verse'
                ]);
                highlightStore.createIndex('collection, book, chapter', [
                    'collection',
                    'book',
                    'chapter'
                ]);
            }
        });
    }
    return highlightDB;
}

export async function addHighlights(
    numColor: number,
    selectedVerses: any[],
    getVerseTextByIndex: (i: any) => Promise<string>
) {
    const highlights = await openHighlights();

    if (numColor > 5 || numColor < 1) {
        numColor = 1;
    }

    const verseCount = selectedVerses.length;

    //isHighlight = false;

    for (var i = 0; i < verseCount; i++) {
        const selectedVerse = selectedVerses[i];
        const index = await findHighlight({ ...selectedVerse });

        if (index !== -1) {
            await highlights.delete('highlights', index);
        }

        const date = new Date()[Symbol.toPrimitive]('number');
        const bookIndex = config.bookCollections
            .find((x) => x.id === selectedVerse.collection)
            .books.findIndex((x) => x.id === selectedVerse.book);
        const text = await getVerseTextByIndex(i);

        const nextItem = { ...selectedVerse, text, date, bookIndex, penColor: numColor };
        await highlights.add('highlights', nextItem);
    }
    notifyUpdated();
}

export async function findHighlight(item: {
    collection: string;
    book: string;
    chapter: string;
    verse: string;
}) {
    const highlights = await openHighlights();
    const tx = highlights.transaction('highlights', 'readonly');
    const index = tx.store.index('collection, book, chapter, verse');
    const result = await index.getAll([item.collection, item.book, item.chapter, item.verse]);
    await tx.done;
    return result[0] ? result[0].date : -1;
}

export async function findHighlightByChapter(item: {
    collection: string;
    book: string;
    chapter: string;
}) {
    const highlights = await openHighlights();
    const tx = highlights.transaction('highlights', 'readonly');
    const index = tx.store.index('collection, book, chapter');
    const result = await index.getAll([item.collection, item.book, item.chapter]);
    await tx.done;
    return result;
}

export async function removeHighlight(date: number) {
    const highlights = await openHighlights();
    await highlights.delete('highlights', date);
    notifyUpdated();
}

export async function removeHighlights(selectedVerses) {
    const verseCount = selectedVerses.length;
    for (var i = 0; i < verseCount; i++) {
        const selectedVerse = selectedVerses[i];
        let index = await findHighlight({ ...selectedVerse });
        // Could be highlighted with multiple colors, remove all
        while (index !== -1) {
            await removeHighlight(index);
            index = await findHighlight({ ...selectedVerse });
        }
    }
    notifyUpdated();
}

export async function clearHighlights() {
    const highlights = await openHighlights();
    await highlights.clear('highlights');
    notifyUpdated();
}

export async function getHighlights(): Promise<HighlightItem[]> {
    const highlights = await openHighlights();
    return await highlights.getAll('highlights');
}

function notifyUpdated() {
    highlightsLastUpdated.set(Date.now());
    invalidate('highlights');
}

export const highlightsLastUpdated = writable(Date.now());
