import { base } from '$app/paths';
import config from '$lib/data/config';

/** @type {import('./$types').PageLoad} */
export async function load({ fetch }) {
    if (!config.writingSystems) {
        throw new Error('Writing systems configuration not found');
    }

    const [defaultKey, writingSystem] = Object.entries(config.writingSystems)[0];

    if (!writingSystem?.alphabet) {
        throw new Error('Writing system alphabet not found');
    }

    const alphabet = writingSystem.alphabet;
    const reversalLanguage = writingSystem.displayNames.default;
    const dictionaryName = config.name;

    let initialReversalData = {};

    return {
        fetch,
        alphabet,
        initialReversalData,
        defaultKey,
        reversalLanguage,
        dictionaryName
    };
}