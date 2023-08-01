import { openDB, type DBSchema } from 'idb';
import config from '$lib/data/config';
import { writable } from 'svelte/store';
import { invalidate } from '$app/navigation';

export interface BookmarkItem {
    date: number;
    docSet: string;
    collection: string;
    book: string;
    chapter: string;
    verse: string;
    text: string;
    reference: string;
    bookIndex: number;
}
interface Bookmarks extends DBSchema {
    bookmarks: {
        key: number;
        value: BookmarkItem;
        indexes: {
            'collection, book, chapter, verse': string;
            'collection, book, chapter': string;
            date: string;
        };
    };
}

let bookmarkDB = null;
async function openBookmarks() {
    if (!bookmarkDB) {
        bookmarkDB = await openDB<Bookmarks>('bookmarks', 1, {
            upgrade(db) {
                const bookmarkStore = db.createObjectStore('bookmarks', {
                    keyPath: 'date'
                });

                bookmarkStore.createIndex('collection, book, chapter, verse', [
                    'collection',
                    'book',
                    'chapter',
                    'verse'
                ]);
                bookmarkStore.createIndex('collection, book, chapter', [
                    'collection',
                    'book',
                    'chapter'
                ]);
                bookmarkStore.createIndex('date', ['date']);
            }
        });
    }
    return bookmarkDB;
}

export async function addBookmark(item: {
    docSet: string;
    collection: string;
    book: string;
    chapter: string;
    verse: string;
    text: string;
    reference: string;
}) {
    const bookmarks = await openBookmarks();
    const date = new Date()[Symbol.toPrimitive]('number');
    const bookIndex = config.bookCollections
        .find((x) => x.id === item.collection)
        .books.findIndex((x) => x.id === item.book);
    const nextItem = { ...item, date: date, bookIndex: bookIndex };
    await bookmarks.add('bookmarks', nextItem);
    notifyUpdated();
}

export async function findBookmark(item: {
    collection: string;
    book: string;
    chapter: string;
    verse: string;
}) {
    const bookmarks = await openBookmarks();
    const tx = bookmarks.transaction('bookmarks', 'readonly');
    const index = tx.store.index('collection, book, chapter, verse');
    const result = await index.getAll([item.collection, item.book, item.chapter, item.verse]);
    await tx.done;
    return result[0] ? result[0].date : -1;
}

export async function findBookmarkByChapter(item: {
    collection: string;
    book: string;
    chapter: string;
}) {
    const bookmarks = await openBookmarks();
    const tx = bookmarks.transaction('bookmarks', 'readonly');
    const index = tx.store.index('collection, book, chapter');
    const result = await index.getAll([item.collection, item.book, item.chapter]);
    await tx.done;
    return result;
}

export async function removeBookmark(date: number) {
    const bookmarks = await openBookmarks();
    await bookmarks.delete('bookmarks', date);
    notifyUpdated();
}

export async function clearBookmarks() {
    const bookmarks = await openBookmarks();
    await bookmarks.clear('bookmarks');
    notifyUpdated();
}

export async function getBookmarks(): Promise<BookmarkItem[]> {
    const bookmarks = await openBookmarks();
    return await bookmarks.getAll('bookmarks');
}

function notifyUpdated() {
    bookmarksLastUpdated.set(Date.now());
    invalidate('bookmarks');
}

export const bookmarksLastUpdated = writable(Date.now());
