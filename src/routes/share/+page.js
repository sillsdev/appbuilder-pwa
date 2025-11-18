import config from '$lib/data/config';

/** @type {import('./$types').PageLoad} */
export async function load({ fetch }) {
    /**
     * @type {string[]}
     */
    let languages = [];
    if (config.mainFeatures['share-apple-app-link']) {
        const response = await import('$assets/badges/languages.json');
        if (response.default) {
            languages = response.default;
        }
    }

    return { languages };
}
