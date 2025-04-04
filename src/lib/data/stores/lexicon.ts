import { base } from '$app/paths';
import initSqlJs, { Database } from 'sql.js';
import { derived, writable } from 'svelte/store';

// Store for vernacularWordsList
export const vernacularWordsStore = writable();

// Store for selectedReversalLanguageStore
export const selectedReversalLanguageStore = writable<string | null>(null);

// Store for reversalWordsList, keyed by language
export const reversalWordsStore = writable<Record<string, any[]>>({});

// Store for the loaded reversalLetters, keyed by language
export const reversalLettersStore = writable<Record<string, any[]>>({});

// Derived store to get the current language's reversalWordsList
export const currentReversalWordsStore = derived(
    [selectedReversalLanguageStore, reversalWordsStore],
    ([selectedLanguage, wordsStore]) => (selectedLanguage ? wordsStore[selectedLanguage] || [] : [])
);

// Derived store to get the current language's reversalLetters
export const currentReversalLettersStore = derived(
    [selectedReversalLanguageStore, reversalLettersStore],
    ([selectedLanguage, lettersStore]) =>
        selectedLanguage ? lettersStore[selectedLanguage] || [] : []
);

// Store for database instance
export const db = writable<Database>();

export async function initializeDatabase({ fetch }) {
    const wasmResponse = await fetch(`${base}/wasm/sql-wasm.wasm`);
    const wasmBinary = await wasmResponse.arrayBuffer();

    const sqlInstance = await initSqlJs({
        wasmBinary: wasmBinary
    });

    const response = await fetch(`${base}/data.sqlite`);
    const buffer = await response.arrayBuffer();

    const database = new sqlInstance.Database(new Uint8Array(buffer));
    db.set(database);
    return database;
}
