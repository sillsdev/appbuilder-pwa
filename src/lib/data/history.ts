import { openDB, type DBSchema } from 'idb';

export interface HistoryItem {
    date: number;
    collection?: string;
    book: string;
    chapter: string;
    verse?: string;
    url?: string;
}
interface History extends DBSchema {
    history: {
        key: number;
        value: HistoryItem;
        indexes: { date: number };
    };
}

let historyDB = null;
async function openHistory() {
    if (!historyDB) {
        historyDB = await openDB<History>('history', 1, {
            upgrade(db) {
                const historyStore = db.createObjectStore('history', {
                    keyPath: 'date'
                });

                historyStore.createIndex('date', 'date');
            }
        });
    }
    return historyDB;
}

let nextItem: HistoryItem = null;
let nextTimer: NodeJS.Timeout = null;

export async function addHistory(
    item: {
        collection: string;
        book: string;
        chapter: string;
        verse?: string;
        url?: string;
    },
    callback?: (addedItem: HistoryItem) => void
) {
    let history = await openHistory();
    if (nextTimer) {
        clearTimeout(nextTimer);
        nextTimer = null;
    }
    const date = new Date()[Symbol.toPrimitive]('number');
    nextItem = { ...item, date: date };
    nextTimer = setTimeout(async () => {
        await history.add('history', nextItem);
        if (callback) {
            callback(nextItem);
        }
        clearTimeout(nextTimer);
        nextTimer = null;
        nextItem = null;
    }, 2000);
}

export async function clearHistory() {
    let history = await openHistory();
    await history.clear('history');
}

export async function getHistory() {
    const history = await openHistory();
    return await history.getAllFromIndex('history', 'date');
}
