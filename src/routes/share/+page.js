import { base } from '$app/paths';
import config from '$lib/data/config';

const languageJSON = import.meta.glob('./*.json', {
    eager: true,
    base: '/src/gen-assets/badges',
    query: '?url'
});

/** @type {import('./$types').PageLoad} */
export async function load({ fetch }) {
    let languages = [];
    if (config.mainFeatures['share-apple-app-link']) {
        const url = languageJSON['./languages.json']?.default;
        if (url) {
            const response = await fetch(url);
            const result = await response.json();
            if (!result.error) {
                languages = result;
            }
        }
    }

    return { languages };
}
