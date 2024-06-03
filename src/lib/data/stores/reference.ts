import { NavigationContext } from '$lib/data/navigation';
import { derived, writable } from 'svelte/store';
import type { CatalogData } from '../catalogData';
import config from '$lib/data/config';

interface ReferenceStore {
    docSet: string;
    collection: string;
    book: string;
    chapter: string;
    verse: string;
    chapterVerses: string;
    numVerses: number;
    hasAudio: any;
    title: string;
    name: string;
    next: { book: string | null; chapter: string | null };
    prev: { book: string | null; chapter: string | null };
    catalog: CatalogData;
    initialized: boolean;
}

export const referenceStore = () => {
    const nav = new NavigationContext();
    const internal = writable<ReferenceStore>();

    const update = () => {
        internal.set({
            docSet: nav.docSet,
            collection: nav.collection,
            book: nav.book,
            chapter: nav.chapter,
            verse: nav.verse,
            chapterVerses: nav.chapterVerses,
            numVerses: nav.chapterLength,
            hasAudio: nav.audio,
            title: nav.title,
            name: nav.name,
            next: nav.next,
            prev: nav.prev,
            catalog: nav.catalog,
            initialized: nav.initialized
        });
        localStorage.refs = nav.reference;
        localStorage.package = config.package;
    };

    const set = async ({ docSet, book, chapter, verse }) => {
        await nav.goto(docSet, book, chapter, verse);
        update();
    };

    const setReference = async (ref: string) => {
        await nav.gotoReference(ref);
        update();
    };

    const external = derived(internal, ($internal: object) => ({ ...$internal }) as ReferenceStore);

    const skip = async (direction: number) => {
        if (direction < 0) {
            await nav.gotoPrev();
        } else {
            await nav.gotoNext();
        }
        update();
    };

    const init = async () => {
        const start = localStorage.package === config.package ? localStorage.refs : null;
        await nav.gotoInitial(start);
        update();
    };

    return {
        init,
        subscribe: external.subscribe,
        set,
        setReference,
        skip
    };
};
