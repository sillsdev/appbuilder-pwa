import { redirect } from '@sveltejs/kit';
import { base } from '$app/paths';
import type { DictionaryConfig } from '$config';
import config from '$lib/data/config';
import {
    initializeDatabase,
    vernacularLanguageStore,
    vernacularWordsStore
} from '$lib/data/stores/lexicon';
import type { ReversalIndex } from '$lib/lexicon';

export async function load({ fetch }) {
    if (!(config as DictionaryConfig).writingSystems) {
        throw new Error('Writing systems configuration not found');
    }
    const dictionaryConfig = config as DictionaryConfig;

    const vernacularWritingSystem = Object.values(dictionaryConfig.writingSystems).find((ws) =>
        ws.type.includes('main')
    );

    if (!vernacularWritingSystem) {
        throw new Error('Vernacular language not found');
    }

    const vernacularAlphabet = vernacularWritingSystem.alphabet;
    const vernacularLanguage = vernacularWritingSystem.displayNames.default;

    const reversalWritingSystems = Object.entries(dictionaryConfig.writingSystems).filter(
        ([key, ws]) => !ws.type.includes('main')
    );

    if (!reversalWritingSystems) {
        throw new Error('Reversal language not found');
    }

    const reversalAlphabets = reversalWritingSystems.map(([key, ws]) => ({ [key]: ws.alphabet }));
    const reversalLanguages = reversalWritingSystems.map(([key, ws]) => ({
        [key]: ws.displayNames.default
    }));

    const reversalIndexes: { [language: string]: ReversalIndex } = {}; // Updated type for reversalIndexes

    for (const [key, ws] of Object.entries(dictionaryConfig.writingSystems)) {
        if (!ws.type.includes('main')) {
            try {
                const response = await fetch(`${base}/reversal/${key}/index.json`);
                if (!response.ok) {
                    throw new Error(`Failed to load reversal index for language: ${key}`);
                }
                reversalIndexes[key] = (await response.json()) as ReversalIndex;
            } catch (err) {
                const message = err instanceof Error ? err.message : `Unknown error loading ${key}`;
                const stack = err instanceof Error && err.stack ? err.stack : 'No stack trace';
                window.location.hash = `/error?message=${encodeURIComponent(message)}&stack=${encodeURIComponent(stack)}`;
            }
        }
    }

    let db = await initializeDatabase({ fetch });
    let results = db.exec(`SELECT id, name, homonym_index, type, num_senses, summary FROM entries`);

    if (!results || results.length === 0) {
        throw new Error('Vernacular query error');
    }

    let vernacularWordsList = [];
    if (results[0]) {
        vernacularWordsList = results[0].values.map((value) => {
            const entry = results[0].columns.reduce((acc, column, index) => {
                acc[column] = value[index];
                return acc;
            }, {});

            let firstLetter = entry.name.charAt(0).toLowerCase();

            let firstTwoChars;
            let startingPosition = 0;

            if (firstLetter === '*' || firstLetter === '-') {
                startingPosition = 1;
            }
            firstTwoChars = entry.name
                .substring(startingPosition, 2 + startingPosition)
                .toLowerCase();

            if (vernacularAlphabet.includes(firstTwoChars)) {
                firstLetter = firstTwoChars;
            } else {
                firstLetter = entry.name.charAt(startingPosition).toLowerCase();
            }

            if (!vernacularAlphabet.includes(firstLetter)) {
                firstLetter = '*';
            }

            entry.letter = firstLetter;
            return entry;
        });
        vernacularLanguageStore.set(vernacularLanguage);
        vernacularWordsStore.set(vernacularWordsList);
    }

    return {
        vernacularAlphabet,
        reversalAlphabets,
        reversalLanguages,
        reversalIndexes
    };
}
