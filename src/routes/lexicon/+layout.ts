import type { DictionaryConfig } from '$config';
import config from '$lib/data/config';
import {
    displayNames,
    initializeDatabase,
    reversals,
    vernacularLanguageId,
    vernacularWords,
    type ReversalWord,
    type VernacularWord,
    type VernacularWordReference
} from '$lib/data/stores/lexicon.svelte';
import { SvelteMap } from 'svelte/reactivity';
import type { LayoutLoad } from './$types';

const reversalURLs = import.meta.glob('./**/*.json', {
    import: 'default',
    eager: true,
    base: '/src/gen-assets/reversal',
    query: '?url'
}) as Record<string, string>;

export const load: LayoutLoad = async ({ fetch }) => {
    if (!(config as DictionaryConfig).writingSystems) {
        throw new Error('Writing systems configuration not found');
    }
    const dictionaryConfig = config as DictionaryConfig;

    const writingSystems = Object.entries(dictionaryConfig.writingSystems);

    const [vernacularLanguage, vernacularWritingSystem] =
        writingSystems.find(([_, ws]) => ws.type.includes('main')) ?? [];

    if (!(vernacularLanguage && vernacularWritingSystem)) {
        throw new Error('Vernacular language not found');
    }

    displayNames.value = Object.fromEntries(
        Object.entries(dictionaryConfig.writingSystems).map(([id, ws]) => [
            id,
            ws.displayNames.default
        ])
    );

    const vernacularAlphabet = vernacularWritingSystem.alphabet;

    for (const [code, ws] of writingSystems) {
        if ('reversalFilename' in ws) {
            reversals.set(
                code,
                ws.alphabet && new SvelteMap(ws.alphabet.map((letter) => [letter, undefined]))
            );
        }
    }

    const toFetch: string[][] = [];

    for (const [code, reversal] of reversals.entries()) {
        const response = await fetch(reversalURLs[`./${code}/index.json`]);
        if (response.ok) {
            Object.entries((await response.json()) as Promise<Record<string, string[]>>).forEach(
                ([letter, files]) => {
                    reversal?.set(letter, new SvelteMap(files.map((f: string) => [f, []])));
                    toFetch.push(...files.map((file: string) => [code, letter, file]));
                }
            );
        } else {
            console.warn(`Failed to load reversal index for language: ${code}`);
        }
    }

    // load all 'a', then all 'b', etc.
    toFetch.sort((a, b) => a[1].localeCompare(b[1], 'en-US'));

    const db = await initializeDatabase({ fetch });
    const results = db.exec(
        `SELECT id, name, homonym_index, type, num_senses, summary FROM entries`
    );

    if (!results || results.length === 0) {
        throw new Error('Vernacular query error');
    }

    let vernacularWordsList: VernacularWord[] = [];
    if (results[0]) {
        vernacularWordsList = results[0].values.map((value) => {
            const entry = Object.fromEntries(
                results[0].columns.map((col, index) => [col, value[index]])
            ) as VernacularWord;

            let firstLetter = entry.name.charAt(0).toLowerCase();
            const startingPosition = firstLetter === '*' || firstLetter === '-' ? 1 : 0;

            const firstTwoChars = entry.name
                .substring(startingPosition, 2 + startingPosition)
                .toLowerCase();

            firstLetter = vernacularAlphabet?.includes(firstTwoChars)
                ? firstTwoChars
                : entry.name.charAt(startingPosition).toLowerCase();

            entry.letter = vernacularAlphabet?.includes(firstLetter) ? firstLetter : '*';
            return entry;
        });
        vernacularLanguageId.value = vernacularLanguage;
        vernacularWords.value = vernacularWordsList;
    }

    // start loading reversals in background
    const start = new Date().valueOf();
    Promise.all(toFetch.map((j) => loadReversal(j))).then(() =>
        console.log(`Loaded all reversals in ${(new Date().valueOf() - start) / 1000}s`)
    );

    return {
        vernacularAlphabet
    };
};

async function loadReversal(job: string[]) {
    const [code, letter, file] = job;

    const key = `./${code}/${file}`;

    const reversalFile = reversalURLs[key];
    if (!reversalFile) {
        console.error(`Reversal file not found in glob: ${key}`);
        return;
    }

    const response = await fetch(reversalFile);
    if (response.ok) {
        const data: Record<string, { index: number; name: string }[]> = await response.json();
        reversals
            .get(code)
            ?.get(letter)
            ?.set(
                file,
                Object.entries(data).map(
                    ([name, entries]) =>
                        ({
                            name,
                            indexes: entries.map((entry) => entry.index),
                            vernacularWords: entries
                                .map((entry) => {
                                    const foundWord: VernacularWord | undefined =
                                        vernacularWords.value.find((vw) => vw.id === entry.index);
                                    if (foundWord) {
                                        return {
                                            name: foundWord.name,
                                            homonym_index: foundWord.homonym_index || 0
                                        } satisfies VernacularWordReference;
                                    } else {
                                        console.log(
                                            `Index ${entry.index} not found in vernacularWords`
                                        );
                                        return null; // Return null for missing indexes
                                    }
                                })
                                .filter((index) => index !== null), // Filter out null values
                            letter: letter
                        }) satisfies ReversalWord
                )
            );
    }
}
