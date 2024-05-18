import { base } from '$app/paths';

let fetchFn = fetch;

export interface CatalogData {
    id: string;
    selectors: { lang: string; abbr: string };
    hasMapping: boolean;
    documents: {
        id: string;
        bookCode: string;
        h: string;
        toc: string;
        toc2: string;
        toc3: string;
        sequences: {}[];
        hasIntroduction: boolean;
        versesByChapters: {
            [chapter: string]: {
                [verse: string]: string;
            };
        };
    }[];
    tags: {};
}

export async function loadCatalog(docSet: string): Promise<CatalogData> {
    let result: CatalogData;
    await fetchFn(`${base}/collections/catalog/${docSet}.json`)
        .then((response) => {
            if (!response.ok) {
                throw new Error(
                    `Could not get catalog for ${docSet} (Response ${response.status}: ${response.statusText})`
                );
            }
            return response.json();
        })
        .then((data) => {
            result = data;
        })
        .catch((error) => {
            console.error(`Could not get catalog for ${docSet}:`, error);
        });
    return result;
}

export default {
    setFetch: (func) => {
        fetchFn = func;
    }
};
