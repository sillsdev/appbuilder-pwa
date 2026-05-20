import config from '$assets/config';
import type { PageLoad } from './$types';

const languageJSON = import.meta.glob('./*.json', {
    import: 'default',
    eager: true,
    base: '/src/gen-assets/badges',
    query: '?url'
}) as Record<string, string>;

export const load: PageLoad = async ({ fetch }) => {
    let languages: string[] = [];
    if (config.mainFeatures['share-apple-app-link']) {
        const url = languageJSON['./languages.json'];
        if (url) {
            const response = await fetch(url);
            const result = await response.json();
            if (!result.error) {
                languages = result;
            }
        }
    }

    return { languages };
};
