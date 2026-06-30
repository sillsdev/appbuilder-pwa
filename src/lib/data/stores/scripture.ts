import { scriptureConfig } from '$assets/config';
import { setDefaultStorage } from '$lib/data/stores/storage';
import { derived, get, writable, type Writable } from 'svelte/store';
import { isDefined } from '../../scripts/stringUtils';
import { loadDocSetIfNotLoaded } from '../scripture';
import { pk } from './pk';
import { referenceStore } from './reference';

function createStack<T>() {
    const external = writable([] as T[]);

    return {
        subscribe: external.subscribe,
        push: (content: T) => {
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

export const footnotes = createStack<string>();

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
function findIndex(id: string | number) {
    const references = get(selectedVerses);
    for (let i = 0; i < references.length; i++) {
        const entry = references[i];
        if (entry.verse == id) {
            return i;
        }
    }
    return -1;
}
function getInsertIndex(newVerseNumber: number, selections: Selection[]) {
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

export function getReference(item: Omit<Selection, 'reference'>) {
    const separator = scriptureConfig.bookCollections?.find((x) => x.id === item.collection)
        ?.features['ref-chapter-verse-separator'];
    const bookName =
        scriptureConfig.bookCollections
            ?.find((x) => x.id === item.collection)
            ?.books.find((x) => x.id === item.book)?.name || item.book;
    return bookName + ' ' + item.chapter + separator + item.verse;
}

export async function getVerseText(item: Selection, item2?: Selection) {
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
    const text = [];
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
    type Block = { key: string; tokens: { payload: string }[] };
    const glossaryResults = proskomma.gqlQuerySync(glossaryQuery);
    if (isDefined(glossaryResults.data.docSets[0].document)) {
        glossaryResults.data.docSets[0].document.mainBlocks.forEach((block: Block) => {
            let key = '';
            block.tokens.forEach((token) => {
                key = key + token.payload;
            });
            block.key = key.trim();
        });
    }
    return glossaryResults as { data: { docSets: { document?: { mainBlocks: Block[] } }[] } };
});

function getDefaultCurrentFonts() {
    const currentFonts: Record<string, string> = {};
    // This is for Scripture PWA, not Dictionary
    if (scriptureConfig.bookCollections) {
        for (const collection of scriptureConfig.bookCollections) {
            // Sometimes, the collection.style.font doesn't exist in the array of fonts!
            const font =
                collection.style?.font &&
                scriptureConfig.fonts?.some((font) => font.family === collection.style?.font)
                    ? collection.style.font
                    : scriptureConfig.fonts?.[0].family;
            if (font) {
                currentFonts[collection.id] = font;
            }
        }
    }
    return currentFonts;
}
setDefaultStorage('currentFonts', JSON.stringify(getDefaultCurrentFonts()));

export const currentFonts: Writable<ReturnType<typeof getDefaultCurrentFonts>> = writable(
    JSON.parse(localStorage.currentFonts)
);
currentFonts.subscribe((fonts) => (localStorage.currentFonts = JSON.stringify(fonts)));

export const currentFont = derived([refs, currentFonts], ([$refs, $currentFonts]) => {
    if (!$refs.initialized) {
        return scriptureConfig.fonts?.[0].family;
    }
    return $currentFonts[$refs.collection];
});

export const fontChoices = derived(refs, ($refs) => {
    if (!$refs.initialized) {
        return [];
    }
    const bookFonts = scriptureConfig.bookCollections
        ?.find((x) => x.id === $refs.collection)
        ?.books.find((x) => x.id === $refs.book)?.fonts;
    const colFonts = scriptureConfig.bookCollections?.find((x) => x.id === $refs.collection)?.fonts;
    const allFonts = [...new Set(scriptureConfig.fonts?.map((x) => x.family))];
    const currentFonts =
        (bookFonts?.length ?? 0) > 0
            ? bookFonts
            : (colFonts?.length ?? 0) > 0
              ? colFonts
              : allFonts;
    return currentFonts;
});

export type Selection = {
    docSet: string;
    collection: string;
    book: string;
    chapter: string;
    reference: string;
    verse: string;
};

function createSelectedVerses() {
    const external: Writable<Selection[]> = writable([]);

    return {
        subscribe: external.subscribe,
        addVerse: (id: string | number) => {
            const currentRefs = get(refs);
            const reference = getReference({ ...currentRefs, verse: String(id) });
            const selection = {
                docSet: currentRefs.docSet,
                collection: currentRefs.collection,
                book: currentRefs.book,
                chapter: currentRefs.chapter,
                reference: reference,
                verse: String(id)
            };
            const selections = get(external);
            const newVerseNumber = Number(id);
            const newIndex = getInsertIndex(newVerseNumber, selections);
            selections.splice(newIndex, 0, selection);
            console.log(selections);
            external.set(selections);
        },
        removeVerse: (id: string | number) => {
            const selections = get(external);
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
            const selections = get(external);
            return selections.length;
        },
        getVerseTextByIndex: async (i: string | number) => {
            const selections = get(external);
            let text = '';
            const index = Number(i);
            if (index > -1 && index < selections.length) {
                const selection = selections[index];
                text = await getVerseText(selection);
            }
            return text;
        },
        getVerseByIndex: (i: string | number) => {
            const selections = get(external);
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
        getVerseByVerseNumber: (i: string | number) => {
            const selections = get(external);
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
        getReference: (i: string | number) => {
            const selections = get(external);
            const index = Number(i);
            if (index > -1 && index < selections.length) {
                const selection = selections[index];
                const separator = scriptureConfig.bookCollections?.find(
                    (x) => x.id === selection.collection
                )?.features['ref-chapter-verse-separator'];
                const bookName =
                    scriptureConfig.bookCollections
                        ?.find((x) => x.id === selection.collection)
                        ?.books.find((x) => x.id === selection.book)?.name || selection.book;
                return bookName + ' ' + selection.chapter + separator + selection.verse;
            } else {
                return '';
            }
        },

        getCompositeReference: () => {
            const selections = get(external);
            if (selections.length <= 1) {
                return selectedVerses.getReference(0);
            } else {
                const selectionStart = selections[0];
                const verseSeparator = scriptureConfig.bookCollections?.find(
                    (x) => x.id === selectionStart.collection
                )?.features['ref-chapter-verse-separator'];
                const rangeSeparator = scriptureConfig.bookCollections?.find(
                    (x) => x.id === selectionStart.collection
                )?.features['ref-verse-range-separator'];
                const verseListSeparator = scriptureConfig.bookCollections?.find(
                    (x) => x.id === selectionStart.collection
                )?.features['ref-verse-list-separator'];
                const bookName =
                    scriptureConfig.bookCollections
                        ?.find((x) => x.id === selectionStart.collection)
                        ?.books.find((x) => x.id === selectionStart.book)?.name ||
                    selectionStart.book;
                let reference =
                    bookName + ' ' + selectionStart.chapter + verseSeparator + selectionStart.verse;
                let wasConsecutive = false;
                let lastVerse = Number(selectionStart.verse);
                let currVerse = Number(selectionStart.verse);
                for (let i = 1; i < selections.length; i++) {
                    lastVerse = currVerse;
                    currVerse = Number(selections[i].verse);
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
            for (let i = 0; i < selections.length; i++) {
                const t = await getVerseText(selections[i]);
                verseText.push(t);
            }
            return verseText.join(' ');
        }
    };
}
export const selectedVerses = createSelectedVerses();
