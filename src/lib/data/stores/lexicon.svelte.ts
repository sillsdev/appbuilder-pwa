import initSqlJs, { type Database } from 'sql.js';

// Store for vernacularLanguage
export let vernacularLanguage = $state({ value: '' });

export type VernacularWord = {
    id: number;
    name: string;
    homonym_index: number;
    type: number;
    num_senses: number;
    summary: string;
    letter: string;
};
// Store for vernacularWordsList
export let vernacularWords: { value: VernacularWord[] } = $state({ value: [] });

// Store for reversalWordsList, keyed by language
interface VernacularWordReference {
    name: string;
    homonymIndex: number;
}

export interface ReversalWord {
    word: string;
    indexes: number[];
    vernacularWords: VernacularWordReference[];
    letter: string;
}
export let reversalWords: Record<string, ReversalWord[]> = $state({});

// Store for the loaded reversalLetters, keyed by language
export let reversalLetters: Record<string, string[]> = $state({});

export type Word = VernacularWord | ReversalWord;

export type SelectableFromVernacular = {
    word: string;
    index: number;
    homonym_index: number;
};

export type SelectedWord = ReversalWord | SelectableFromVernacular;

class CurrentReversal {
    // Store for selectedLanguageStore
    selectedLanguage: string | null = $state(null);
    // Derived store to get the current language's reversalWordsList
    words = $derived(this.selectedLanguage ? reversalWords[this.selectedLanguage] || [] : []);
    // Derived store to get the current language's reversalLetters
    letters = $derived(
        new Set(this.selectedLanguage ? reversalLetters[this.selectedLanguage] || [] : [])
    );
}

export const currentReversal = new CurrentReversal();

// Store for database instance
let sql: Awaited<ReturnType<typeof initSqlJs>> | null = null;
let db: Database | null = null;

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

export async function initializeDatabase({ fetch }): Promise<Database> {
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
    }
    return db;
}
