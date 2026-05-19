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

let historyDB: Awaited<ReturnType<typeof openDB<History>>> | null = null;
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

let nextItem: HistoryItem | null = null;
let nextTimer: NodeJS.Timeout | null = null;

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
    const history = await openHistory();
    if (nextTimer) {
        clearTimeout(nextTimer);
        nextTimer = null;
    }
    const date = new Date()[Symbol.toPrimitive]('number');
    const itemRef = { ...item, date: date };
    const timerRef = setTimeout(async () => {
        await history.add('history', itemRef);
        if (callback) {
            callback(itemRef);
        }
        clearTimeout(timerRef);
        nextTimer = null;
        nextItem = null;
    }, 2000);
    nextItem = itemRef;
    nextTimer = timerRef;
}

export async function clearHistory() {
    const history = await openHistory();
    await history.clear('history');
}

export async function getHistory() {
    const history = await openHistory();
    return await history.getAllFromIndex('history', 'date');
}
