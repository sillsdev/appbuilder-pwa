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

    let initialReversalData = {};
    try {
        const response = await fetch(`${base}/reversal/language/${defaultKey}/${alphabet[0]}.json`);
        if (response.ok) {
            initialReversalData = await response.json();
        }
    } catch (error) {
        console.error('Error loading initial reversal data:', error);
    }

    return {
        alphabet,
        initialReversalData,
        defaultKey
    };
}
