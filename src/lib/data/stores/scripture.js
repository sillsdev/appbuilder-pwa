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
                collection: currentRefs.collection,
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
                    collection: '',
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
                    collection: '',
                    book: '',
                    chapter: '',
                    verse: '',
                    text: ''
                };
                return selection;
            }
        },
        getReference: (i) => {
            let selections = get(external);
            const index = Number(i);
            if (index > -1 && index < selections.length) {
                const selection = selections[index];
                const separator = config.bookCollections.find((x) => x.id === selection.collection).features["ref-chapter-verse-separator"];
                return selection.book + " " + selection.chapter + separator + selection.verse;
            } else {
                return '';
            }
        },

        getCompositeReference: () => {
            let selections = get(external);
            if (selectedVerses.length <= 1) {
                return selectedVerses.getReference(0);
            } else {
                const selectionStart = selections[0];
                const verseSeparator = config.bookCollections.find((x) => x.id === selectionStart.collection).features["ref-chapter-verse-separator"];
                const rangeSeparator = config.bookCollections.find((x) => x.id === selectionStart.collection).features["ref-verse-range-separator"];
                const verseListSeparator = config.bookCollections.find((x) => x.id === selectionStart.collection).features["ref-verse-list-separator"];
                const reference = selectionStart.book + " " + selectionStart.chapter + verseSeparator + selectionStart.verse;
                var lastVerse = selectionStart.verse;
                var currVerse = selectionStart.verse;
                for (var i = 1; i < length; i++) {
                    //Move old curr to last
                    lastVerse = currVerse;
                    //Update curr
                    currVerse = selections[i].verse;
                    if (currVerse - lastVerse > 1) {// if they are not consecutive
                        reference += lastVerse + verseListSeparator + currVerse;
                    } else {
                        //if doesn't have - as last element
                        if (reference.charAt(reference.length - 1) != rangeSeparator) {
                            reference += rangeSeparator;
                        }
                        //else 
                        //still a continuation
                        //do nothing
                    }
                }
                if (reference.charAt(reference.length - 1) == rangeSeparator) {
                    reference += currVerse;
                }
                return reference;
            }
        }
    };
}
export const selectedVerses = createSelectedVerses();
