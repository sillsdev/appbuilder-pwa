const catalogs = import.meta.glob('./*.json', {
    eager: true,
    base: '/src/generatedAssets/collections/catalog',
    query: '?url'
}) as Record<string, { default: string }>;

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
    quizzes: {};
    htmlBooks?: {
        id: string;
        name: string;
    }[];
}

export async function loadCatalog(docSet: string): Promise<CatalogData> {
    let result: CatalogData;
    const key = `./${docSet}.json`;
    const entry = catalogs[key];
    if (!entry?.default) {
        throw new Error(`Catalog JSON asset not found for key ${key}`);
    }

    await fetchFn(entry.default)
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
