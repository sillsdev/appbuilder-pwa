import type { DictionaryConfig } from '$config';
import config from '$lib/data/config';
import { lexicon } from '$lib/data/lexicon.svelte';

export async function load({ fetch }) {
    if (!(config as DictionaryConfig).writingSystems) {
        throw new Error('Writing systems configuration not found');
    }
    const dictionaryConfig = config as DictionaryConfig;

    const vernacularWritingSystem = Object.values(dictionaryConfig.writingSystems)
        .find((ws) =>
            ws.type.includes('main')
        );

    if (!vernacularWritingSystem) {
        throw new Error('Vernacular language not found');
    }

    const vernacularAlphabet = vernacularWritingSystem.alphabet;

    const reversalWritingSystems = Object.entries(dictionaryConfig.writingSystems).filter(
        ([_key, ws]) => !ws.type.includes('main')
    );

    if (!reversalWritingSystems) {
        throw new Error('Reversal language not found');
    }

    const reversalLanguages = reversalWritingSystems.map(([key, ws]) => ({
        [key]: ws.displayNames.default
    }));


    await lexicon.withFetch({ fetch }).setup(
        dictionaryConfig
    );

    return {
        vernacularAlphabet,
        reversalLanguages,
    };
}
