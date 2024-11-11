import { base } from '$app/paths';
import config from '$lib/data/config';

/** @type {import('./$types').PageLoad} */
export async function load({ fetch }) {
    if (!config.writingSystems) {
        throw new Error('Writing systems configuration not found');
    }

    const vernacularWritingSystem = Object.values(config.writingSystems).find(
        (ws) => ws.type.includes('main')
    );

    if (!vernacularWritingSystem) {
        throw new Error('Vernacular language not found');
    }

    const vernacularAlphabet = vernacularWritingSystem.alphabet;
    const vernacularLanguage = vernacularWritingSystem.displayNames.default;
    
    const reversalWritingSystems = Object.entries(config.writingSystems).filter(
        ([key, ws]) => !ws.type.includes('main')
    );

    if (!reversalWritingSystems) {
        throw new Error('Reversal language not found');
    }

    const reversalAlphabets = reversalWritingSystems.map(([key, ws]) => ({ [key]: ws.alphabet }));
    const reversalLanguages = reversalWritingSystems.map(([key, ws]) => ({ [key]: ws.displayNames.default }));
    
    const dictionaryName = config.name;

    return {
        fetch,
        vernacularAlphabet,
        vernacularLanguage,
        reversalAlphabets,
        reversalLanguages,
        dictionaryName
    };
}