import { groupStore, referenceStore } from './store-types';
import { writable, get } from 'svelte/store';
import { setDefaultStorage } from './storage';
import config from '../config';

/** current reference */
const initReference =
    config.bookCollections[0].languageCode +
    '_' +
    config.bookCollections[0].id +
    '.' +
    config.mainFeatures['start-at-reference'];
setDefaultStorage('refs', initReference);
export const refs = groupStore(referenceStore, localStorage.refs);
refs.subscribe((value) => {
    localStorage.refs = value.docSet + '.' + value.book + '.' + value.chapter;
});

function createNextRef() {
    const external = writable({ book: '', chapter: '' });

    return {
        subscribe: external.subscribe,
        set: external.set,
        reset: () => {
            external.set({ book: '', chapter: '' });
        }
    };
}
export const nextRef = createNextRef();

/**list of selected verses */
function findIndex(id) {
    let references = get(selectedVerses);
    for (let i = 0; i < references.length; i++) {
        const entry = references[i];
        if (entry.verse == id) {
            return i;
        }
    }
    return -1;
}
function getInsertIndex(newVerseNumber, selections) {
    let index = 0;
    for (let i = 0; i < selections.length; i++) {
        const verseNumber = Number(selections[i].verse);
        if (verseNumber > newVerseNumber) {
            break;
        }
        index = i + 1;
    }
    return index;
}
function createSelectedVerses() {
    const external = writable([]);

    return {
        subscribe: external.subscribe,
        addVerse: (id, text) => {
            const currentRefs = get(refs);
            const selection = {
                docSet: currentRefs.docSet,
                book: currentRefs.book,
                chapter: currentRefs.chapter,
                verse: id,
                text: text
            };
            let selections = get(external);
            const newVerseNumber = Number(id);
            const newIndex = getInsertIndex(newVerseNumber, selections);
            selections.splice(newIndex, 0, selection);
            external.set(selections);
        },
        removeVerse: (id) => {
            let selections = get(external);
            const index = findIndex(id);
            if (index > -1) {
                selections.splice(index, 1);
                external.set(selections);
            }
        },
        reset: () => {
            external.set([]);
        },
        length: () => {
            let selections = get(external);
            return selections.length;
        },
        getVerseByIndex: (i) => {
            let selections = get(external);
            const index = Number(i);
            if (index > -1 && index < selections.length) {
                return selections[index];
            } else {
                const selection = {
                    docSet: '',
                    book: '',
                    chapter: '',
                    verse: '',
                    text: ''
                };
                return selection;
            }
        },
        getVerseByVerseNumber: (i) => {
            let selections = get(external);
            const index = findIndex(i);
            if (index > -1) {
                return selections[index];
            } else {
                const selection = {
                    docSet: '',
                    book: '',
                    chapter: '',
                    verse: '',
                    text: ''
                };
                return selection;
            }
        }
    };
}
export const selectedVerses = createSelectedVerses();
