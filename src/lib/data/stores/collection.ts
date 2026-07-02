import { scriptureConfig } from '$assets/config';
import { get, writable } from 'svelte/store';
import { Layout } from './view';

export const testLayouts = false; // Set to true to show all layouts regardless of scriptureConfig

function findCollection(id: string): App.CollectionEntry | undefined {
    const ds = scriptureConfig.bookCollections?.find((x) => x.id === id);
    return (
        ds && {
            id: ds.languageCode + '_' + ds.id,
            name: ds.collectionName,
            singlePane: (ds.features['bc-allow-single-pane'] ??
                ds.features['bc-layout-allow-single-pane']) as boolean,
            description: ds.collectionDescription,
            image: ds.collectionImage
        }
    );
}

function createInitCollections(): App.CollectionGroup {
    const layouts = scriptureConfig.layouts || [];
    const initCollections: App.CollectionGroup = {};

    for (const layout of layouts) {
        if (!layout.enabled && !testLayouts) {
            continue;
        }
        const collections: App.CollectionEntry[] = layout.layoutCollections
            .map((collectionId) => findCollection(collectionId))
            .filter((c) => !!c);
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
            if (collections.length < 3 && (scriptureConfig.bookCollections?.length ?? 0) > 2) {
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
    const external = writable<App.CollectionGroup>(
        localStorage.selectedLayouts ? JSON.parse(localStorage.selectedLayouts) : initCollections
    );
    external.subscribe((value) => (localStorage.selectedLayouts = JSON.stringify(value)));

    return {
        subscribe: external.subscribe,
        set: external.set,
        collections: (mode: Layout) => {
            switch (mode) {
                case Layout.Single:
                    return [get(external).singlePane];
                case Layout.Two:
                    return get(external).sideBySide;
                case Layout.VerseByVerse:
                    return get(external).verseByVerse;
            }
        },
        reset: () => {
            external.set(initCollections);
        }
    };
}
export const selectedLayouts = createSelectedLayouts();
