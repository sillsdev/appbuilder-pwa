import { derived, get, writable } from 'svelte/store';
import { isDefined } from '../../scripts/stringUtils';
import config from '../config';
import { loadDocSetIfNotLoaded } from '../scripture';
import { pk } from './pk';
import { referenceStore } from './reference';
import { setDefaultStorage } from './storage';

function createStack() {
    const external = writable([]);

    return {
        subscribe: external.subscribe,
        push: (content) => {
            external.set([content, ...get(external)]);
        },
        pop: () => {
            external.set(get(external).slice(1));
        },
        reset: () => {
            external.set([]);
        }
    };
}

export const footnotes = createStack();

/** current reference */
export const refs = referenceStore();

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

export async function getVerseText(item, item2 = undefined) {
    const proskomma = get(pk);
    const scriptureCV =
        item2 !== undefined
            ? item.chapter === item2.chapter
                ? `${item.chapter}:${item.verse}-${item2.verse}`
                : `${item.chapter}:${item.verse}-${item2.chapter}:${item2.verse}`
            : `${item.chapter}:${item.verse}`;
    //console.log('getVerseText', scriptureCV);
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
    //console.log(query);

    const { data } = await proskomma.gqlQuery(query);
    let text = [];
    for (const block of data.docSet.document.mainSequence.blocks) {
        if (block.text) {
            text.push(block.text);
        }
    }
    return text.join(' ');
}

export const docSet = derived(refs, ($refs) => $refs.docSet);

/*
 *  glossary is returning a Promise
 */
/* eslint-disable-next-line svelte/no-store-async */
export const glossary = derived(docSet, async ($docSet) => {
    const proskomma = get(pk);
    await loadDocSetIfNotLoaded(proskomma, $docSet, fetch);
    // This query returns the text strings in the glossary along with the tokens
    // marked with a \k that are the words in the glossary.  Each glossary text
    // segment starts with the glossary word and then the definition.  If no glossary
    // book is present in the book collection, the document section is undefined.
    const glossaryQuery =
        '{docSets(ids: "' +
        $docSet +
        '") ' +
        '{ document(bookCode: "GLO")' +
        '{ mainBlocks ' +
        '{ ' +
        'text ' +
        'tokens(withScopes: "span/k") ' +
        '{ ' +
        'payload ' +
        '} ' +
        '} ' +
        '} ' +
        '} ' +
        '} ';
    const glossaryResults = proskomma.gqlQuerySync(glossaryQuery);
    if (isDefined(glossaryResults.data.docSets[0].document)) {
        glossaryResults.data.docSets[0].document.mainBlocks.forEach((block) => {
            let key = '';
            block.tokens.forEach((token) => {
                key = key + token.payload;
            });
            block.key = key.trim();
        });
    }
    return glossaryResults;
});

function getDefaultCurrentFonts() {
    const currentFonts = {};
    // This is for Scripture PWA, not Dictionary
    if (config?.bookCollections) {
        for (let collection of config.bookCollections) {
            // Sometimes, the collection.style.font doesn't exist in the array of fonts!
            currentFonts[collection.id] =
                collection.style.font &&
                config.fonts.some((font) => font.family === collection.style.font)
                    ? collection.style.font
                    : config.fonts[0].family;
        }
    }
    return currentFonts;
}
setDefaultStorage('currentFonts', JSON.stringify(getDefaultCurrentFonts()));

export const currentFonts = writable(JSON.parse(localStorage.currentFonts));
currentFonts.subscribe((fonts) => (localStorage.currentFonts = JSON.stringify(fonts)));

export const currentFont = derived([refs, currentFonts], ([$refs, $currentFonts]) => {
    if (!$refs.initialized) {
        return config.fonts[0].family;
    }
    return $currentFonts[$refs.collection];
});

export const fontChoices = derived(refs, ($refs) => {
    if (!$refs.initialized) {
        return [];
    }
    const bookFonts = config.bookCollections
        .find((x) => x.id === $refs.collection)
        .books.find((x) => x.id === $refs.book)?.fonts;
    const colFonts = config.bookCollections.find((x) => x.id === $refs.collection).fonts;
    const allFonts = [...new Set(config.fonts.map((x) => x.family))];
    const currentFonts =
        bookFonts?.length > 0 ? bookFonts : colFonts.length > 0 ? colFonts : allFonts;
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
