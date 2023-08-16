import { referenceStore } from './store-types';
import { writable, get, derived } from 'svelte/store';
import { setDefaultStorage } from './storage';
import { pk } from './pk';
import config from '../config';

function createStack() {
    const external = writable([]);

    return {
        subscribe: external.subscribe,
        push: (content) => {
            external.set([content, ...get(external)]);
        },
        pop: () => {
            external.set(get(external).slice(1));
        }
    };
}

export const footnotes = createStack();

/** current reference */
const firstChapter =
    config.bookCollections[0].books[0].id +
    '.' +
    config.bookCollections[0].books[0].chaptersN.split('-')[0];
const startReference = config.mainFeatures['start-at-reference'] || firstChapter;
const initReference =
    config.bookCollections[0].languageCode +
    '_' +
    config.bookCollections[0].id +
    '.' +
    startReference;
setDefaultStorage('refs', initReference);

export const refs = referenceStore(localStorage.refs);
refs.subscribe((value) => {
    localStorage.refs = value.docSet + '.' + value.book + '.' + value.chapter;
});

function createNextRef() {
    const external = writable({ book: '', chapter: '', verse: '' });

    return {
        subscribe: external.subscribe,
        set: external.set,
        reset: () => {
            external.set({ book: '', chapter: '', verse: '' });
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

export function getReference(item) {
    const separator = config.bookCollections.find((x) => x.id === item.collection).features[
        'ref-chapter-verse-separator'
    ];
    const bookName =
        config.bookCollections
            .find((x) => x.id === item.collection)
            .books.find((x) => x.id === item.book)?.name || item.book;
    return bookName + ' ' + item.chapter + separator + item.verse;
}

export async function getVerseText(item) {
    const proskomma = get(pk);
    const scriptureCV = `${item.chapter}:${item.verse}`;
    const query = `{
        docSet (id: "${item.docSet}") {
            document(bookCode:"${item.book}") {
                mainSequence {
                    blocks(withScriptureCV: "${scriptureCV}") {
                        text(withScriptureCV: "${scriptureCV}" normalizeSpace:true )
                    }
                }
            }
        }
    }`;

    const { data } = await proskomma.gqlQuery(query);
    const block = data.docSet.document.mainSequence.blocks[0];
    if (block === null) {
        return '';
    }
    return block.text;
}

export const currentFont = writable(config.fonts[0].family);
export const fontChoices = derived(refs, ($refs) => {
    console.log('refs', $refs);
    const bookFonts = config.bookCollections
        .find((x) => x.id === $refs.collection)
        .books.find((x) => x.id === $refs.book).fonts;
    const colFonts = config.bookCollections.find((x) => x.id === $refs.collection).fonts;
    const allFonts = [...new Set(config.fonts.map((x) => x.family))];
    const currentFonts =
        bookFonts.length > 0 ? bookFonts : colFonts.length > 0 ? colFonts : allFonts;
    console.log('currentFonts', currentFonts);
    currentFont.set(currentFonts[0]);
    return currentFonts;
});

function createSelectedVerses() {
    const external = writable([]);

    return {
        subscribe: external.subscribe,
        addVerse: (id) => {
            const currentRefs = get(refs);
            const reference = getReference({ ...currentRefs, verse: id });
            const selection = {
                docSet: currentRefs.docSet,
                collection: currentRefs.collection,
                book: currentRefs.book,
                chapter: currentRefs.chapter,
                reference: reference,
                verse: id
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
        getVerseTextByIndex: async (i) => {
            let selections = get(external);
            let text = '';
            const index = Number(i);
            if (index > -1 && index < selections.length) {
                const selection = selections[index];
                text = await getVerseText(selection);
            }
            return text;
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
                    verse: ''
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
                    verse: ''
                };
                return selection;
            }
        },
        getReference: (i) => {
            let selections = get(external);
            const index = Number(i);
            if (index > -1 && index < selections.length) {
                const selection = selections[index];
                const separator = config.bookCollections.find((x) => x.id === selection.collection)
                    .features['ref-chapter-verse-separator'];
                const bookName =
                    config.bookCollections
                        .find((x) => x.id === selection.collection)
                        .books.find((x) => x.id === selection.book)?.name || selection.book;
                return bookName + ' ' + selection.chapter + separator + selection.verse;
            } else {
                return '';
            }
        },

        getCompositeReference: () => {
            let selections = get(external);
            if (selections.length <= 1) {
                return selectedVerses.getReference(0);
            } else {
                const selectionStart = selections[0];
                const verseSeparator = config.bookCollections.find(
                    (x) => x.id === selectionStart.collection
                ).features['ref-chapter-verse-separator'];
                const rangeSeparator = config.bookCollections.find(
                    (x) => x.id === selectionStart.collection
                ).features['ref-verse-range-separator'];
                const verseListSeparator = config.bookCollections.find(
                    (x) => x.id === selectionStart.collection
                ).features['ref-verse-list-separator'];
                const bookName =
                    config.bookCollections
                        .find((x) => x.id === selectionStart.collection)
                        .books.find((x) => x.id === selectionStart.book)?.name ||
                    selectionStart.book;
                let reference =
                    bookName + ' ' + selectionStart.chapter + verseSeparator + selectionStart.verse;
                let wasConsecutive = false;
                let lastVerse = selectionStart.verse;
                let currVerse = selectionStart.verse;
                for (let i = 1; i < selections.length; i++) {
                    lastVerse = currVerse;
                    currVerse = selections[i].verse;
                    if (currVerse - lastVerse > 1) {
                        if (wasConsecutive) {
                            reference += lastVerse;
                            wasConsecutive = false;
                        }
                        reference += verseListSeparator + ' ' + currVerse;
                    } else {
                        if (reference.charAt(reference.length - 1) != rangeSeparator) {
                            reference += rangeSeparator;
                            wasConsecutive = true;
                        }
                    }
                }
                if (reference.charAt(reference.length - 1) == rangeSeparator) {
                    reference += currVerse;
                }
                return reference;
            }
        },

        getCompositeText: async () => {
            const selections = get(external);
            const verseText = [];
            for (var i = 0; i < selections.length; i++) {
                const t = await getVerseText(selections[i]);
                verseText.push(t);
            }
            return verseText.join(' ');
        }
    };
}
export const selectedVerses = createSelectedVerses();
