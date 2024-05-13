import { writable } from 'svelte/store';
import { base } from '$app/paths';

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

export const catalog = writable<CatalogData>();

export async function loadCatalog(docSet: string) {
    await fetch(`${base}/collections/catalog/${docSet}.json`)
        .then((response) => {
            if (!response.ok) {
                throw new Error(
                    `Could not get catalog for ${docSet} (Response ${response.status}: ${response.statusText})`
                );
            }
            return response.json();
        })
        .then((data) => {
            catalog.set(data);
        })
        .catch((error) => {
            console.error(`Could not get catalog for ${docSet}:`, error);
        });
}
