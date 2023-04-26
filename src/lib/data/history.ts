import { openDB, type DBSchema } from "idb";
import { writable } from "svelte/store";



export interface HistoryItem {
    date: number;
    collection?: string;
    book: string;
    chapter: string;
    verse?: string;
}
interface History extends DBSchema {
    history: {
        key: number;
        value: HistoryItem;
        indexes: { "date": number };
    };
}

export const history = await openDB<History>("history", 1, {
    upgrade(db) {
        const historyStore = db.createObjectStore("history", {
            keyPath: "date",
        });

        historyStore.createIndex("date", "date");
    },
});

let nextItem:HistoryItem = null;
let nextTimer:NodeJS.Timeout = null;

export async function addHistory(item: {
    collection: string;
    book: string;
    chapter: string;
    verse: string;
}) {
    if (nextTimer) {
        clearTimeout(nextTimer);
        nextTimer = null;
    }
    const date = new Date()[Symbol.toPrimitive]('number');
    nextItem = {...item, date: date};
    //console.log("setNextItem", nextItem);
    nextTimer = setTimeout(async () => {
        await history.add("history", nextItem);
        //console.log("addHistory", nextItem);
        clearTimeout(nextTimer);
        nextTimer = null;
        nextItem = null;
    }, 2000);
}

async function clearHistory() {
    await history.clear("history");
}

export function getHistory() {
    const { subscribe, set } = writable([]);
    history.getAllFromIndex("history", "date").then(items => {
        set(items);
    });

    return {
        subscribe,
        clear: () => {
            //console.log("clearHistory");
            clearHistory();
            set([]);
        }
    }
}