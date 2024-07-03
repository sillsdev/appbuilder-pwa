import { openDB, type DBSchema } from 'idb';
import config from '$lib/data/config';

export interface HistoryItem {
    date: number;
    score: number;
    collection: string;
    book: string;
    quiz: string;
    reference: string;
    bookIndex: number;
}

interface History extends DBSchema {
    history: {
        key: number;
        value: HistoryItem;
        indexes: {
            'collection, book, quiz': string;
            date: number;
        };
    }
}

let quizDB = null;
async function openHistory() {
    if (!quizDB) {
        quizDB = await openDB<History>('history', 1, {
            upgrade(db) {
                const historyStore = db.createObjectStore('history', {
                    keyPath: 'date'
                });
                historyStore.createIndex('collection, book, quiz', [
                    'collection',
                    'book',
                    'quiz'
                ]);

                historyStore.createIndex('date', 'date');
            }
        });
    }
    return quizDB;
}

export async function addHistory(item: {
    collection: string;
    book: string;
    quiz: string;
}) {
    const history = await openHistory();
    const date = new Date()[Symbol.toPrimitive]('number');
    const bookIndex = config.bookCollections
        .find((x) => x.id === item.collection)
        .books.findIndex((x) => x.id === item.book)
        .quizzes.findIndex((x) => x.id === item.quiz);
    const nextItem = { ...item, date: date, bookIndex: bookIndex };
    await history.add('history', nextItem);
    //notifyUpdated(); //what is this?
}

export async function clearHistory() {
    let history = await openHistory();
    await history.clear('history');
}

export async function getHistory() {
    const history = await openHistory();
    return await history.getAllFromIndex('history', 'date');
}