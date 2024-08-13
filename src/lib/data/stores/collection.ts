import { writable, get } from 'svelte/store';
import { LAYOUT_SINGLE, LAYOUT_TWO, LAYOUT_VERSE_BY_VERSE } from './view.js';
import config from '../config';

function findCollection(id) {
    const ds = config.bookCollections.find((x) => x.id === id);
    return {
        id: ds.languageCode + '_' + ds.id,
        name: ds.collectionName,
        singlePane:
            ds?.features['bc-allow-single-pane'] ?? ds?.features['bc-layout-allow-single-pane'],
        description: ds?.collectionDescription,
        image: ds?.collectionImage
    };
}

function createInitCollections(): App.CollectionGroup {
    const layouts = config.layouts;
    const initCollections: App.CollectionGroup = {};

    for (const layout of layouts) {
        if (!layout.enabled) continue;
        const collections: App.CollectionEntry[] = layout.layoutCollections.map((collectionId) =>
            findCollection(collectionId)
        );
        if (layout.mode === 'single') {
            initCollections.singlePane = collections[0];
        } else if (layout.mode === 'two') {
            initCollections.sideBySide = collections as [App.CollectionEntry, App.CollectionEntry];
        } else if (layout.mode === 'verse-by-verse') {
            initCollections.verseByVerse = collections as [
                App.CollectionEntry,
                App.CollectionEntry,
                App.CollectionEntry
            ];

            // If there is no third VerseByVerse collection
            // and there are greater than 2 project book collections
            // set it to the blank value
            if (collections.length < 3 && config.bookCollections.length > 2) {
                initCollections.verseByVerse[2] = {
                    id: '',
                    name: '--------',
                    singlePane: false,
                    description: ''
                };
            }
        }
    }
    return initCollections;
}

const initCollections: App.CollectionGroup = createInitCollections();

function createSelectedLayouts() {
    const external = writable<App.CollectionGroup>(initCollections);

    return {
        subscribe: external.subscribe,
        set: external.set,
        collections: (mode) => {
            let value;
            switch (mode) {
                case LAYOUT_SINGLE:
                    value = [get(external).singlePane];
                    break;
                case LAYOUT_TWO:
                    value = get(external).sideBySide;
                    break;
                case LAYOUT_VERSE_BY_VERSE:
                    value = get(external).verseByVerse;
                    break;
            }
            return value;
        },
        reset: () => {
            external.set(initCollections);
        }
    };
}
export const selectedLayouts = createSelectedLayouts();
