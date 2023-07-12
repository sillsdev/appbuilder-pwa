import { writable } from 'svelte/store';
import config from '../config';

function findDocSet(id) {
    const ds = config.bookCollections.find((x) => x.id === id);
    return {
        id: ds.languageCode + '_' + ds.id,
        name: ds.collectionName,
        singlePane: ds.features['bc-allow-single-pane'],
        description: ds?.collectionDescription
    };
}

function createInitDocSet(): App.CollectionGroup {
    const layouts = config.layouts;
    const initDocSets: App.CollectionGroup = {};

    for (const layout of layouts) {
        if (!layout.enabled) continue;
        const docSets: App.CollectionEntry[] = layout.layoutCollections.map((collectionId) =>
            findDocSet(collectionId)
        );
        if (layout.mode === 'single') {
            initDocSets.singlePane = docSets[0];
        } else if (layout.mode === 'two') {
            initDocSets.sideBySide = docSets as [App.CollectionEntry, App.CollectionEntry];
        } else if (layout.mode === 'verse-by-verse') {
            initDocSets.verseByVerse = docSets as [
                App.CollectionEntry,
                App.CollectionEntry,
                App.CollectionEntry
            ];

            // If there is no third VerseByVerse docSet 
            // and there are greater than 2 project book collections
            // set it to the blank value
            if (docSets.length < 3 && config.bookCollections.length > 2) {
                initDocSets.verseByVerse[2] = {
                    id: '',
                    name: '--------',
                    singlePane: false,
                    description: ''
                };
            }
        }
    }
    return initDocSets;
}

const initDocSets: App.CollectionGroup = createInitDocSet();

function createNextDocSet() {
    const external = writable<App.CollectionGroup>(initDocSets);

    return {
        subscribe: external.subscribe,
        set: external.set,
        reset: () => {
            external.set(initDocSets);
        }
    };
}
export const nextDocSet = createNextDocSet();
