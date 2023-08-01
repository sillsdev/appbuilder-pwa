import { openDB, type DBSchema } from 'idb';
import config from '$lib/data/config';
import { writable } from 'svelte/store';
import { invalidate } from '$app/navigation';

export interface NoteItem {
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
interface Notes extends DBSchema {
    notes: {
        key: number;
        value: NoteItem;
        indexes: {
            'collection, book, chapter, verse': string;
            'collection, book, chapter': string;
        };
    };
}

let noteDB = null;
async function openNotes() {
    if (!noteDB) {
        noteDB = await openDB<Notes>('notes', 1, {
            upgrade(db) {
                const noteStore = db.createObjectStore('notes', {
                    keyPath: 'date'
                });

                noteStore.createIndex('collection, book, chapter, verse', [
                    'collection',
                    'book',
                    'chapter',
                    'verse'
                ]);
                noteStore.createIndex('collection, book, chapter', [
                    'collection',
                    'book',
                    'chapter'
                ]);
            }
        });
    }
    return noteDB;
}

export async function addNote(item: {
    docSet: string;
    collection: string;
    book: string;
    chapter: string;
    verse: string;
    text: string;
    reference: string;
}) {
    const notes = await openNotes();
    const date = new Date()[Symbol.toPrimitive]('number');
    const bookIndex = config.bookCollections
        .find((x) => x.id === item.collection)
        .books.findIndex((x) => x.id === item.book);
    const nextItem = { ...item, date: date, bookIndex: bookIndex };
    await notes.add('notes', nextItem);
    notifyUpdated();
}

export async function findNote(item: {
    collection: string;
    book: string;
    chapter: string;
    verse: string;
}) {
    const notes = await openNotes();
    const tx = notes.transaction('notes', 'readonly');
    const index = tx.store.index('collection, book, chapter, verse');
    const result = await index.getAll([item.collection, item.book, item.chapter, item.verse]);
    await tx.done;
    return result[0] ? result[0].date : -1;
}

export async function findNoteByChapter(item: {
    collection: string;
    book: string;
    chapter: string;
}) {
    const notes = await openNotes();
    const tx = notes.transaction('notes', 'readonly');
    const index = tx.store.index('collection, book, chapter');
    const result = await index.getAll([item.collection, item.book, item.chapter]);
    await tx.done;
    return result;
}

export async function editNote(item: { note: any; newText: string }) {
    const notes = await openNotes();
    const tx = notes.transaction('notes', 'readwrite');
    const store = tx.objectStore('notes');
    const result = await store.get(item.note.date);
    await store.put({ ...result, text: item.newText });
    await tx.done;
    notifyUpdated();
}

export async function removeNote(date: number) {
    const notes = await openNotes();
    await notes.delete('notes', date);
    notifyUpdated();
}

export async function clearNotes() {
    const notes = await openNotes();
    await notes.clear('notes');
    notifyUpdated();
}

export async function getNotes(): Promise<NoteItem[]> {
    const notes = await openNotes();
    return await notes.getAll('notes');
}

function notifyUpdated() {
    notesLastUpdated.set(Date.now());
    invalidate('notes');
}

export const notesLastUpdated = writable(Date.now());
