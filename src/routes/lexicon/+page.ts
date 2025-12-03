import type { DictionaryConfig } from '$config';
import config from '$lib/data/config';
import {
    displayNames,
    initializeDatabase,
    vernacularLanguageId,
    vernacularWords,
    type VernacularWord
} from '$lib/data/stores/lexicon.svelte';
import type { ReversalIndex } from '$lib/lexicon';

const reversalIndexUrls = import.meta.glob('./**/index.json', {
    import: 'default',
    eager: true,
    base: '/src/gen-assets/reversal',
    query: '?url'
}) as Record<string, string>;

export async function load({ fetch }) {
    if (!(config as DictionaryConfig).writingSystems) {
        throw new Error('Writing systems configuration not found');
    }
    const dictionaryConfig = config as DictionaryConfig;

    const [vernacularLanguage, vernacularWritingSystem] = Object.entries(
        dictionaryConfig.writingSystems
    ).find(([_, ws]) => ws.type.includes('main'));

    if (!vernacularWritingSystem) {
        throw new Error('Vernacular language not found');
    }

    displayNames.value = Object.fromEntries(
        Object.entries(dictionaryConfig.writingSystems).map(([id, ws]) => [
            id,
            ws.displayNames.default
        ])
    );

    const vernacularAlphabet = vernacularWritingSystem.alphabet;

    const reversalWritingSystems = Object.entries(dictionaryConfig.writingSystems).filter(
        ([_, ws]) => 'reversalFilename' in ws
    );

    if (!reversalWritingSystems.length) {
        throw new Error('Reversal language(s) not found');
    }

    const reversalAlphabets = reversalWritingSystems.map(([key, ws]) => ({ [key]: ws.alphabet }));
    const reversalLanguages = reversalWritingSystems.map(([key, _]) => key);

    const reversalIndexes: { [language: string]: ReversalIndex } = {}; // Updated type for reversalIndexes

    for (const [key] of reversalWritingSystems) {
        const response = await fetch(reversalIndexUrls[`./${key}/index.json`]);
        if (response.ok) {
            reversalIndexes[key] = (await response.json()) as ReversalIndex; // Explicitly cast the JSON response
        } else {
            console.warn(`Failed to load reversal index for language: ${key}`);
        }
    }

    let db = await initializeDatabase({ fetch });
    let results = db.exec(`SELECT id, name, homonym_index, type, num_senses, summary FROM entries`);

    if (!results || results.length === 0) {
        throw new Error('Vernacular query error');
    }

    let vernacularWordsList: VernacularWord[] = [];
    if (results[0]) {
        vernacularWordsList = results[0].values.map((value) => {
            const entry = results[0].columns.reduce((acc, column, index) => {
                acc[column] = value[index];
                return acc;
            }, {} as VernacularWord);

            let firstLetter = entry.name.charAt(0).toLowerCase();

            let firstTwoChars = '';
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
        vernacularLanguageId.value = vernacularLanguage;
        vernacularWords.value = vernacularWordsList;
    }

    return {
        vernacularAlphabet,
        reversalAlphabets,
        reversalLanguages,
        reversalIndexes
    };
}
