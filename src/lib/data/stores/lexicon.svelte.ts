import type { LoadEvent } from '@sveltejs/kit';
import initSqlJs, { type Database } from 'sql.js';
import { SvelteMap } from 'svelte/reactivity';

// Store for vernacularLanguage
export let vernacularLanguageId = $state({ value: '' });

export let displayNames: { value: Record<string, string> } = $state({ value: {} });

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
export type VernacularWordReference = {
    name: string;
    homonym_index: number;
};

export type ReversalWord = {
    name: string;
    indexes: number[];
    vernacularWords: VernacularWordReference[];
    letter: string;
    homonym_index?: never;
};

/**
 * code -> letter -> file -> loaded
 */
export let reversals: SvelteMap<
    string,
    SvelteMap<string, SvelteMap<string, ReversalWord[]> | undefined> | undefined
> = new SvelteMap();

export type Word = VernacularWord | ReversalWord;

type SelectableFromVernacular = {
    name: string;
    id: number;
    homonym_index?: number;
};

export type SelectedWord = ReversalWord | SelectableFromVernacular;

export let selectedWord: { value: SelectedWord | null } = $state({ value: null });
export let wordIDs: { value: number[] } = $state({ value: [] });
export function selectWord(word: SelectedWord | null, resetWords = true) {
    selectedWord.value = word;
    if (resetWords) {
        wordIDs.value = selectedWord.value
            ? isSelectedVernacular(selectedWord.value)
                ? [selectedWord.value.id]
                : selectedWord.value.indexes
            : [];
    }
}

export function isVernacular(word?: Word | null): word is VernacularWord {
    return !!word && 'id' in word;
}
export function isSelectedVernacular(word?: SelectedWord | null): word is SelectableFromVernacular {
    return !!word && 'id' in word;
}

export function compareWordsEqual(a: SelectedWord, b: SelectedWord) {
    if (isSelectedVernacular(a) && isSelectedVernacular(b)) {
        // For vernacular words, match by ID which is unique
        return a.id === b.id;
    } else if (b.name) {
        if (isSelectedVernacular(a)) {
            if (a.homonym_index !== undefined && 'homonym_index' in b) {
                // For vernacular words with homonyms, match both word and homonym index
                return a.name === b.name && a.homonym_index === b.homonym_index;
            } else {
                // For regular vernacular words
                return a.name === b.name;
            }
        } else if (a.name) {
            // For reversal words
            return a.name === b.name;
        }
    }
    return false;
}

class CurrentReversal {
    // Store for selectedLanguageStore
    languageId: string | null = $state(null);
    // Derived store to get the current language's reversalWordsList
    words = $derived(
        this.languageId
            ? reversals
                  .get(this.languageId)
                  ?.values() // = letters for language
                  .filter((file) => !!file) // filter letters that don't have a file
                  .flatMap((file) => file?.values().flatMap((v) => v))
                  .toArray() || [] // for each letter, flatten word list // return flattened array of all words
            : []
    );
    // Derived store to get the current language's reversalLetters
    letters = $derived(
        new Set(this.languageId ? reversals.get(this.languageId)?.keys() || [] : [])
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

export async function initializeDatabase({ fetch }: Pick<LoadEvent, 'fetch'>): Promise<Database> {
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
