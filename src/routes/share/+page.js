import { base } from '$app/paths';
import config from '$lib/data/config';

/** @type {import('./$types').PageLoad} */
export async function load({ fetch }) {
    let languages = [];
    if (config.mainFeatures['share-apple-app-link']) {
        const response = await fetch(`${base}/badges/languages.json`);
        const result = await response.json();
        if (!result.error) {
            languages = result;
        }
    }

    return { languages };
}
