import { NavigationContext } from '$lib/data/navigation';
import { setDefaultStorage } from '$lib/data/stores/storage';
import { derived, writable } from 'svelte/store';
import type { CatalogData } from '../catalog';

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
        setDefaultStorage('refs', nav.reference);
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

    return {
        init: nav.gotoInitial,
        subscribe: external.subscribe,
        set,
        setReference,
        skip
    };
};
