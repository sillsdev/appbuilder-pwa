import { base } from '$app/paths';
import initSqlJs, { Database } from 'sql.js';
import { derived, get, writable, type Writable } from 'svelte/store';

// Store for vernacularLanguage
export const vernacularLanguageStore = writable<string>('');

// Store for vernacularWordsList
export const vernacularWordsStore = writable<string[]>();

// Store for selectedLanguageStore
export const selectedLanguageStore = writable<string | null>(null);

// Store for reversalWordsList, keyed by language
interface VernacularWordReference {
    name: string;
    homonymIndex: number;
}

interface ReversalWord {
    word: string;
    indexes: string[];
    vernacularWords: VernacularWordReference[];
    letter: string;
}
export const reversalWordsStore = writable<Record<string, ReversalWord[]>>({});

// Store for the loaded reversalLetters, keyed by language
export const reversalLettersStore = writable<Record<string, string[]>>({});

// Derived store to get the current language's reversalWordsList
export const currentReversalWordsStore = derived(
    [selectedLanguageStore, reversalWordsStore],
    ([selectedLanguage, wordsStore]) => (selectedLanguage ? wordsStore[selectedLanguage] || [] : [])
);

// Derived store to get the current language's reversalLetters
export const currentReversalLettersStore = derived(
    [selectedLanguageStore, reversalLettersStore],
    ([selectedLanguage, lettersStore]) =>
        selectedLanguage ? lettersStore[selectedLanguage] || [] : []
);

// Store for database instance
export const sqlJs = writable<ReturnType<typeof initSqlJs> | null>(null);
export const sqlDb = writable<Database | null>(null);

const sqliteUrl = import.meta.glob('./*.sqlite', {
    import: 'default',
    eager: true,
    base: '/src/gen-assets',
    query: '?url'
}) as Record<string, string>;
const wasmUrl = import.meta.glob('./*.wasm', {
    import: 'default',
    eager: true,
    base: '/src/gen-assets/wasm',
    query: '?url'
}) as Record<string, string>;

export async function initializeDatabase({ fetch }) {
    let db = get(sqlDb);
    let sql = get(sqlJs);
    if (!sql || !db) {
        // Fetch the WebAssembly binary manually using SvelteKit's fetch
        const wasmKey = './sql-wasm.wasm';
        const wasmEntry = wasmUrl[wasmKey];
        if (!wasmEntry) {
            throw new Error(`Lexicon wasm asset not found for key ${wasmKey}`);
        }
        const wasmResponse = await fetch(wasmEntry);
        const wasmBinary = await wasmResponse.arrayBuffer();

        // Initialize sql.js with the manually loaded wasm binary
        sql = await initSqlJs({ wasmBinary });
        sqlJs.set(sql);

        // Fetch the database file
        const dbKey = './data.sqlite';
        const dbEntry = sqliteUrl[dbKey];
        if (!dbEntry) {
            throw new Error(`Lexicon sqlite asset not found for key ${dbKey}`);
        }
        const response = await fetch(dbEntry);
        const buffer = await response.arrayBuffer();

        // Load the database into sql.js
        db = new sql.Database(new Uint8Array(buffer));
        sqlDb.set(db);
    }
    return db;
}
