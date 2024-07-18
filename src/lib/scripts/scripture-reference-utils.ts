/**
 * TypeScript file for parsing and handling text references found in text.
 *
 * @author Jake Colbert & David Moore
 **/

import { get } from 'svelte/store';
import config from '../data/config';
import type { CatalogData } from '../data/catalogData';
import { getVerseText, refs } from '../data/stores';
import {
    ciEquals,
    getFirstDigitsAsInt,
    getIntFromString,
    isBlank,
    isDefined,
    isNotBlank,
    isPositiveInteger,
    nullToEmpty
} from './stringUtils';
import { getIntFromNumberString } from './numeralUtils';

let ref: any;
let bookCollections: any;
let collection: any;
let features: any;
let showScriptureLinks; // Show scripture reference links
let runtimeCatalog: CatalogData;

// In text reference separators

// These may need to be preprocessed to check escape characters

let cvs: string; // Chapter verse separator
let rov: string; // Range of verses separator
let lov: string; // List of verses separator
let roc: string; // Range of chapters separator
let cls: string; // Chapter list separator
let extras: string;

/**
 * Function to generate an inline anchor tag from a preprocessed string reference
 * @param start: Reference object where the reference starts
 * @param end: Reference object where the reference ends
 * {
 *    phrase: string;
 *    docSet: string;
 *    book: string;
 *    chapter: string;
 *    verse: string;
 * }
 */
export function generateAnchor(refClass: string, start, end = undefined): HTMLElement {
    const anchor = document.createElement('a');
    anchor.classList.add('cursor-pointer');
    if (isNotBlank(refClass)) {
        anchor.classList.add(refClass);
    }
    anchor.href = '#';
    anchor.innerHTML = start.phrase;
    anchor.setAttribute('data-start-ref', JSON.stringify(start));
    anchor.setAttribute('data-end-ref', JSON.stringify(end));
    return anchor;
}
function initGlobals() {
    collection = bookCollections.find((x) => x.id === ref.collection);
    features = collection.features;
    cvs = features['ref-chapter-verse-separator']; // Chapter verse separator
    rov = features['ref-verse-range-separator']; // Range of verses separator
    lov = features['ref-verse-list-separator']; // List of verses separator
    roc = features['ref-chapter-range-separator']; // Range of chapters separator
    cls = features['ref-chapter-list-separator']; // Chapter list separator
    showScriptureLinks = features['show-scripture-refs']; // Show scripture reference links
    extras = features['ref-extra-material'];
    if (isNotBlank(extras)) {
        // Reorder by length, otherwise if we have "See |See also", the See also will not be matched
        sortExtraMaterialMatchesByLength();
        // Escape the special chars that we use in regular expressions (apart from the pipe |)
        escapeExtraMaterialSpecialCharactersForRegEx();
    }
}
/**
 * Function to generate HTML wrapper with inline span tags
 * that navigate to provided reference
 * @param reference: the string containing the reference
 */
export function generateHTML(crossRef: string, refClass: string, bookId: string = '') {
    ref = get(refs);
    bookCollections = config.bookCollections;
    runtimeCatalog = ref.catalog;
    return generateHTMLMain(crossRef, refClass, bookId);
}
export function generateHTMLTest(
    crossRef: string,
    refClass: string,
    bookId: string = '',
    testRefs: any = null,
    testCollections: any = null,
    testCatalog: any = null
) {
    ref = testRefs;
    runtimeCatalog = testCatalog;
    bookCollections = testCollections;
    return generateHTMLMain(crossRef, refClass, bookId);
}
export function generateHTMLMain(crossRef: string, refClass: string, bookId: string = '') {
    initGlobals();
    const currentBookId = isBlank(bookId) ? ref.book : bookId;
    const docSet = ref.docSet;
    const contentToMatch = '\\xt ' + crossRef + '\\xt*';
    const referencePattern =
        '\\\\(\\+?)xt[ \\xA0]([\\s\\S\\xA0]*?)(?:\\|([\\s\\S]*?))?\\\\\\1xt\\*';
    const referenceRegEx = new RegExp(referencePattern, 'g');
    let referenceMatches: RegExpExecArray | null;
    let sb: string = '';
    let lastIndex = 0;
    while ((referenceMatches = referenceRegEx.exec(contentToMatch)) !== null) {
        const ref = referenceMatches[2];
        const linkRef = referenceMatches[3];
        const targetRef = isNotBlank(linkRef) ? linkRef : ref;
        const displayText = isNotBlank(linkRef) ? ref : null;
        let parseCvs = cvs;
        let parseRov = rov;
        if (isNotBlank(linkRef)) {
            parseCvs = ':';
            parseRov = '-';
        }
        const referenceHTML = processScriptureRef(
            targetRef,
            docSet,
            currentBookId,
            displayText,
            parseCvs,
            parseRov,
            refClass
        );
        sb += contentToMatch.substring(lastIndex, referenceMatches.index);
        sb += referenceHTML;
        lastIndex += referenceMatches.index + referenceMatches[0].length;
    }
    sb += contentToMatch.substring(lastIndex);
    return sb;
}
export function isBibleBook(item, testConfig: any = null) {
    const runtimeConfig = testConfig ?? config;
    const bookTestament =
        runtimeConfig.bookCollections
            .find((x) => x.id === item.collection)
            .books.find((x) => x.id === item.book)?.testament || '';
    const bibleBook = bookTestament === 'NT' || bookTestament === 'OT' || bookTestament === 'DC';
    return bibleBook;
}

function processScriptureRef(
    reference: string,
    docSet: string,
    bookId: string,
    displayText: string,
    parseCvs: string,
    parseRov: string,
    refClass: string
): string {
    let result: string = '';
    if (showScriptureLinks) {
        const pattern = getScriptureReferencePatternForBook(parseCvs, parseRov);
        result = processScriptureRefLinks(
            pattern,
            reference,
            docSet,
            bookId,
            displayText,
            parseCvs,
            parseRov,
            refClass
        );
    } else {
        result = reference;
    }
    return result;
}
function processScriptureRefLinks(
    pattern: string,
    reference: string,
    docSet: string,
    bookId: string,
    displayText: string,
    parseCvs: string,
    parseRov: string,
    refClass: string
): string {
    const results: any[] = [];
    let prevBookId = bookId;
    const referenceRegEx = new RegExp(pattern, 'g');
    let referenceMatches: RegExpExecArray | null;
    const refResults: RegExpExecArray[] = [];
    const replacements: string[] = [];
    let replacement: string = '';
    let refLink: string = '';
    let matchIndex: number = 0;
    while ((referenceMatches = referenceRegEx.exec(reference)) !== null) {
        const isNumberOnly = isPositiveInteger(referenceMatches[0]);
        let bookName = referenceMatches[2];
        let bookId: string = null;
        if (!isNumberOnly) {
            if (isNotBlank(bookName)) {
                // We have found a possible book name
                bookId = getBookIdFromBookName(bookName);
                prevBookId = null;

                if (!isDefined(bookId) && isNotBlank(displayText)) {
                    // If book name was not found, check to see if it is a book id
                    const checkedId = checkBookId(bookName);
                    if (isNotBlank(checkedId)) {
                        bookId = checkedId;
                    }
                }
            } else {
                bookId = prevBookId;
                bookName = '';
            }
        }
        if (isDefined(bookId)) {
            let replace = '';
            const bookNameWithSp = isBlank(bookName) ? '' : bookName + ' ';

            const extraBefore = nullToEmpty(referenceMatches[1]);
            const extraAfter = nullToEmpty(referenceMatches[13]);

            if (isDefined(referenceMatches[3])) {
                // Model 1
                // Chapter ranges with verse numbers, e.g. 1:1—3:10
                const fromChapter = referenceMatches[4];
                const fromVerse = referenceMatches[5];
                const sep = referenceMatches[6];
                const toChapter = referenceMatches[7];
                const toVerse = referenceMatches[8];

                const fromChapterNum = getFirstDigitsAsInt(fromChapter);
                const toChapterNum = getFirstDigitsAsInt(toChapter);
                const refText =
                    extraBefore +
                    bookNameWithSp +
                    fromChapter +
                    cvs +
                    fromVerse +
                    sep +
                    toChapter +
                    cvs +
                    toVerse +
                    extraAfter;
                const model1Reference = createReference(
                    '',
                    docSet,
                    bookId,
                    fromChapter,
                    toChapter,
                    fromVerse,
                    toVerse
                );
                replace = getLinkText(model1Reference, displayText, refText, refClass);
            } else if (isDefined(referenceMatches[9])) {
                // Model 2
                // Chapter & verses, e.g. 1:2-3, 10
                // Also 1-2 (where this could be a chapter range or a verse range for a single chapter book)

                // Chapter Number
                let chapter = referenceMatches[10];
                let chapterNum = getIntFromNumberString(chapter);

                // Separator between the first two numbers
                // This could be a chapter/verse separator or a range separator
                let sep = nullToEmpty(referenceMatches[11]);
                if (sep === '\u2011' && parseRov === '-') {
                    sep = '-';
                }

                let verses = referenceMatches[12];
                const maxChapters = getNumChaptersFromBookId(bookId);
                if (maxChapters === 1) {
                    // One chapter books, like Philemon, Obadiah, etc.
                    // The number in the chapter position is the verse number in the one-chapter book.

                    chapterNum = 1;
                    if (!isDefined(verses)) {
                        // Single verse number
                        verses = chapter;
                    } else if (sep === parseRov) {
                        // Verse range
                        verses = chapter + sep + verses;
                    }
                    chapter = '';
                }

                if (!isDefined(verses)) {
                    // Chapter only - no verse numbers
                    // e.g. Matthew 5
                    const lastVerse = lastVerseInChapter(bookId, chapter, docSet);
                    const refText = extraBefore + bookNameWithSp + chapter + extraAfter;
                    const chapterOnlyReference = createReference(
                        '',
                        docSet,
                        bookId,
                        chapter,
                        '',
                        '1',
                        lastVerse
                    );
                    replace = getLinkText(chapterOnlyReference, displayText, refText, refClass);
                } else if (sep === roc && maxChapters > 1) {
                    // Chapter range
                    // There was no chapter-verse separator
                    // e.g. Matthew 5—7
                    // or a list of chapter ranges, Luke 1—3, 10—12
                    // (where the chapter list separator is the same as a verse list separator, such as a comma)
                    const chapterList = chapter + roc + verses;
                    replace = parseChapterList(
                        reference,
                        displayText,
                        docSet,
                        bookId,
                        bookNameWithSp,
                        extraBefore,
                        extraAfter,
                        chapterList,
                        refClass
                    );
                } else if (sep === parseCvs || maxChapters === 1) {
                    // Verse range
                    // e.g. Matthew 5:1-3, 8-10
                    // or verses in a one-chapter book, e.g. 3 John 3, 7
                    // Parse list of verses, e.g. 1-4, 5, 8-9
                    replace = parseVerseList(
                        reference,
                        displayText,
                        docSet,
                        bookId,
                        bookNameWithSp,
                        extraBefore,
                        extraAfter,
                        chapter,
                        chapterNum,
                        verses,
                        parseCvs,
                        parseRov,
                        refClass
                    );
                } else {
                    // No change
                    replace = referenceMatches[9];
                }
            }

            // append replacement
            replacement = replace;
            replacements.push(replace);
            prevBookId = bookId;
        } else if (isNumberOnly && isNotBlank(prevBookId)) {
            // We have a number on its own, e.g. the chapter "4" in "Mat 3:1-2; 4;"
            bookId = prevBookId;
            const chapterNum = getIntFromString(referenceMatches[0]);
            const maxChapters = getNumChaptersFromBookId(bookId);
            let replace: string = '';

            if (chapterNum <= maxChapters) {
                const refText = chapterNum.toString();
                const chapterFrom = chapterNum.toString();
                const lastVerse = lastVerseInChapter(bookId, chapterFrom, docSet);
                const reference = createReference(
                    '',
                    docSet,
                    bookId,
                    chapterFrom,
                    '',
                    '1',
                    lastVerse
                );
                replace = getLinkText(reference, displayText, refText, refClass);
            } else {
                replace = isNotBlank(displayText) ? displayText : referenceMatches[0];
            }
            // append replacement
            replacement = replace;
            replacements.push(replace);
        } else {
            const replace = isNotBlank(displayText) ? displayText : referenceMatches[0];
            replacement = replace;
            replacements.push(replace);
        }
        refLink += reference.substring(matchIndex, referenceMatches.index);
        refLink += replacement;
        matchIndex = referenceMatches.index + referenceMatches[0].length;
    }
    refLink += reference.substring(matchIndex);
    return refLink;
}
function getScriptureReferencePatternForBook(parseCvs: string, parseRov: string): string {
    const extraMaterial = isNotBlank(extras) ? '(' + extras + ')?' : '()';
    const sepChapterVs = parseCvs === '.' ? '\\.' : parseCvs;
    const sepVerseList = lov === '.' ? '\\.' : lov;

    const optionalRtlMark = '[\\u200f]?';
    const chapterNumberGroup = '(\\d{1,3})';
    const verseNumber = '\\d{1,3}';
    const verseNumberGroup = '(\\d{1,3})';
    const bookName = getBookNamePattern();

    // Model 1
    // Chapter ranges with verse numbers, e.g. 1:1—3:10
    let chapterRangeSep = roc;
    if (chapterRangeSep === '-') {
        // If it is a hyphen, also handle non-breaking hyphens
        chapterRangeSep = chapterRangeSep + '|' + '\\u2011';
    }
    const model1 =
        chapterNumberGroup +
        sepChapterVs +
        verseNumberGroup +
        '(' +
        chapterRangeSep +
        ')' +
        chapterNumberGroup +
        sepChapterVs +
        verseNumberGroup;
    // Model 2
    // Chapter & verses, e.g. 1:2-3, 10
    // Also 1-2 (where this could be a chapter range or a verse range for a single chapter book)
    let rangeSepChars = roc;
    if (!(roc === parseRov)) {
        const sepVerseRange = parseRov === '-' ? '\\-' : parseRov;
        rangeSepChars = rangeSepChars + '|' + sepVerseRange;
    }
    if (roc === '-' || parseRov === '-') {
        // If we have a hyphen, also handle non-breaking hyphens
        rangeSepChars = rangeSepChars + '|' + '\\u2011';
    }
    // Negative lookahead: In this type of lookahead the regex engine searches for a particular element
    // which may be a character or characters or a group after the item matched. If that particular element
    // is not present then the regex declares the match as a match otherwise it simply rejects that match.
    // e.g. exclude including "14" as a verse in Gen 1:2, 14:8
    // e.g. exclude including "1" as a verse in Exo 7:2, 1Pe 2:3
    // e.g. exclude including "2" as a verse in Exodus 1:8, 2 Peter 1:3
    // \p{Lu} matches any kind of uppercase letter from any language
    const negLookaheadForChapterVerseSep =
        '(?!' + '(\\d*' + sepChapterVs + '\\d)|(\\d?\\p{Lu})|(\\d?\\s\\p{Lu}))';
    const verseRange =
        verseNumber +
        negLookaheadForChapterVerseSep +
        '(?:' +
        optionalRtlMark +
        '(?:' +
        rangeSepChars +
        ')' +
        verseNumber +
        ')?';
    const verses =
        '(' +
        verseRange + // first verse range
        '(?:' +
        sepVerseList +
        '\\s?' +
        verseRange +
        ')*' + // 0 or more subsequent verse ranges
        ')';
    const separator = '([' + rangeSepChars + sepChapterVs + '])'; // includes range separator as well as chapter/verse separator
    const model2 = chapterNumberGroup + '(?:' + optionalRtlMark + separator + verses + ')?';

    // Regex is book name followed by either model 1 or model 2.
    const models = '(' + model1 + ')|(' + model2 + ')';
    let regex = extraMaterial + '(?:(' + bookName + ')\\s)?' + '(?:' + models + ')' + extraMaterial;

    // Append negative lookahead to make sure match is not in the attributes of an HTML tag
    // Without this, the pattern was matching href="G-0-34" etc.
    // See http://stackoverflow.com/a/18622606
    const negLookahead = '(?![^<]*>|[^<>]*</)';
    regex = regex + negLookahead;
    return regex;
}
function getBookNamePattern(): string {
    let nonWordCharsInBookName = getNonWordCharactersInBookNames();
    nonWordCharsInBookName = nonWordCharsInBookName.replace(/-/g, '\\-');
    const bookNamePattern =
        '(?:[123] )?[\\w\\p{L}][\\w\\p{L}\\p{M}\\s' + nonWordCharsInBookName + ']*';
    return bookNamePattern;
}
function getScriptureReferencePatternForChapterList(): string {
    // Example:
    // 4—6, 8—9
    const chapterNumber = '\\d{1,3}';
    const optionalRtlMark = '[\\u200f]?';
    let rangeSepChars = roc;
    if (roc === '-') {
        rangeSepChars = rangeSepChars + '\\u2011';
    }
    const chapterListPattern =
        '(' +
        chapterNumber +
        ')' +
        '(?:' +
        optionalRtlMark +
        '[' +
        rangeSepChars +
        '](' +
        chapterNumber +
        '))?';
    return chapterListPattern;
}
function getScriptureReferencePatternForVerseList(parseRov: string): string {
    const verseNumber = '\\d{1,3}';
    const optionalRtlMark = '[\\u200f]?';

    let rangeSepChars = parseRov;
    if (rangeSepChars === '-') {
        // If we have a hyphen, also handle non-breaking hyphens
        rangeSepChars = rangeSepChars + '\\u2011';
    }
    const verseListPattern =
        '(' +
        verseNumber +
        ')' +
        '(?:' +
        optionalRtlMark +
        '[' +
        rangeSepChars +
        '](' +
        verseNumber +
        '))?';

    // Example:
    // 4-6, 8, 10, 13, 15-20

    // Matches:
    // 4   6
    // 8
    // 10
    // 13
    // 15  20
    return verseListPattern;
}
function getBookIdFromBookName(bookName: string): string | null {
    let value: string;
    let i = 0;
    while (i < collection.books.length) {
        if (
            ciEquals(collection.books[i].name, bookName) ||
            ciEquals(collection.books[i].abbreviation, bookName) ||
            ciEquals(collection.books[i].abbreviation + '.', bookName)
        ) {
            value = collection.books[i].id;
            break;
        }
        if (isDefined(collection.books[i].additionalNames)) {
            let j = 0;
            while (j < collection.books[i].additionalNames.length) {
                if (ciEquals(collection.books[i].additionalNames[j].name, bookName)) {
                    value = collection.books[i].id;
                    break;
                }
                j++;
            }
            if (isDefined(value)) {
                break;
            }
        }
        i++;
    }
    return value;
}
function checkBookId(bookId: string): string {
    let value: string = '';
    let i = 0;
    while (i < collection.books.length) {
        if (ciEquals(collection.books[i].id, bookId)) {
            value = collection.books[i].id;
            break;
        }
        i++;
    }
    return value;
}
function getNumChaptersFromBookId(bookId: string): number {
    const numberOfChapters = collection.books.find((x) => x.id === bookId)?.chapters || 0;
    return numberOfChapters;
}
function parseChapterList(
    reference: string,
    displayText: string,
    docSet: string,
    bookId: string,
    bookNameWithSp: string,
    extraBefore: string,
    extraAfter: string,
    chapterList: string,
    refClass: string
): string {
    const chapterListPattern = getScriptureReferencePatternForChapterList();
    let isFirstChapterRange = true;
    let numberChapterRanges = 0;
    let rangeIndex = 0;
    let replace = '';

    const chapterRegEx = new RegExp(chapterListPattern, 'g');
    let chapterMatch: RegExpExecArray | null;
    const chapterMatches: any[] = [];

    while ((chapterMatch = chapterRegEx.exec(chapterList)) !== null) {
        numberChapterRanges++;
        chapterMatches.push(chapterMatch);
    }
    // Reset lastIndex to 0 to start matching from the beginning
    chapterRegEx.lastIndex = 0;

    for (let i = 0; i < numberChapterRanges; i++) {
        const currentMatch = chapterMatches[i];
        const chapterFrom = currentMatch[1];
        const chapterTo = currentMatch[2];
        const hasRtl = reference.includes('\u200F');

        let chapterRange = chapterFrom;
        if (isDefined(chapterTo)) {
            if (hasRtl) {
                chapterRange = chapterFrom + '\u200f' + roc + chapterTo;
            } else {
                chapterRange = chapterRange + roc + chapterTo;
            }
        }
        // Kind of copying SAB functionality here.  When you display the dropdown with the text,
        // it only displays the first chapter, which makes sense because there is a practical
        // limit to how much you want to view in a dropdown.
        const lastVerse = lastVerseInChapter(bookId, chapterFrom, docSet);
        const chapterReference = createReference(
            '',
            docSet,
            bookId,
            chapterFrom,
            chapterFrom,
            '1',
            lastVerse
        );
        let refText: string;
        if (isFirstChapterRange) {
            refText = bookNameWithSp + chapterRange;
            refText = extraBefore + refText;
            if (rangeIndex == numberChapterRanges - 1) {
                refText = refText + extraAfter;
            }
            replace = getLinkText(chapterReference, displayText, refText, refClass);
            isFirstChapterRange = false;
        } else {
            // Subsequent chapter number or range following chapter list separator (e.g. comma)
            refText = chapterRange;
            if (rangeIndex == numberChapterRanges - 1) {
                refText = refText + extraAfter;
            }
            replace = replace + lov + getLinkText(chapterReference, displayText, refText, refClass);
        }
        rangeIndex++;
    }
    return replace;
}
function parseVerseList(
    reference: string,
    displayText: string,
    docSet: string,
    bookId: string,
    bookNameWithSp: string,
    extraBefore: string,
    extraAfter: string,
    chapter: string,
    chapterNum: number,
    verses: string,
    parseCvs: string,
    parseRov: string,
    refClass: string
): string {
    let replace: string = '';
    let numberVerseRanges = 0;
    let rangeIndex = 0;
    let isFirstVerseRange = true;
    const containsRtlMark = reference.includes('\u200F');
    const verseListPattern = getScriptureReferencePatternForVerseList(parseRov);

    const verseRegEx = new RegExp(verseListPattern, 'g');
    let verseMatch: RegExpExecArray | null;
    const verseMatches: any[] = [];

    while ((verseMatch = verseRegEx.exec(verses)) !== null) {
        numberVerseRanges++;
        verseMatches.push(verseMatch);
    }
    // Reset lastIndex to 0 to start matching from the beginning
    verseRegEx.lastIndex = 0;

    for (let i = 0; i < numberVerseRanges; i++) {
        const verseMatch = verseMatches[i];
        const verseFrom = verseMatch[1];
        const verseTo = verseMatch[2];
        const hasRtl = containsRtlMark;

        let verseRange = verseFrom;
        if (isDefined(verseTo)) {
            if (hasRtl) {
                verseRange = verseFrom + '\u200f' + parseRov + verseTo;
            } else {
                verseRange = verseRange + parseRov + verseTo;
            }
        }

        const verseReference = createReference(
            '',
            docSet,
            bookId,
            chapterNum.toString(),
            '',
            verseFrom,
            verseTo
        );
        let refText = '';
        if (isFirstVerseRange) {
            // First verse number or verse range
            refText = bookNameWithSp + chapter;
            refText = refText.trim();

            if (isNotBlank(verseRange)) {
                if (containsRtlMark) {
                    refText = refText + '\u200f';
                }

                if (isBlank(chapter)) {
                    refText = refText + ' ' + verseRange;
                    refText = refText.trim();
                } else {
                    refText = refText + parseCvs + verseRange;
                }
            }

            refText = extraBefore + refText;
            if (rangeIndex == numberVerseRanges - 1) {
                refText = refText + extraAfter;
            }
            replace = getLinkText(verseReference, displayText, refText, refClass);
            isFirstVerseRange = false;
        } else {
            // Subsequent verse number or range following verse separator (e.g. comma)
            refText = verseRange;
            if (rangeIndex == numberVerseRanges - 1) {
                refText = refText + extraAfter;
            }
            replace = replace + lov + getLinkText(verseReference, displayText, refText, refClass);
        }

        rangeIndex++;
    }
    return replace;
}
function getLinkText(
    reference: any,
    displayText: string,
    refText: string,
    refClass: string
): string {
    let value = '';
    let phrase = refText;
    if (isNotBlank(displayText)) {
        phrase = displayText;
    }
    reference.text = phrase;

    const startAnchor = {
        phrase: reference.text,
        docSet: reference.collection,
        book: reference.bookId,
        chapter: reference.fromChapter,
        verse: reference.fromVerse
    };
    const noEndAnchor = isBlank(reference.toChapter) && isBlank(reference.toVerse);
    const endAnchor = noEndAnchor
        ? undefined
        : {
              phrase: reference.text,
              docSet: reference.collection,
              book: reference.bookId,
              chapter: isNotBlank(reference.toChapter)
                  ? reference.toChapter
                  : reference.fromChapter,
              verse: isNotBlank(reference.toVerse) ? reference.toVerse : reference.fromVerse
          };
    const anchor = generateAnchor(refClass, startAnchor, endAnchor);
    value = anchor.outerHTML;
    return value;
}
function lastVerseInChapter(book: string, chapter: string, docSet: string): string {
    if (!chapter || chapter === 'i') {
        return '0';
    }
    const books = runtimeCatalog.documents;
    const chapters = books.find((d) => d.bookCode === book).versesByChapters;
    const verses = Object.keys(chapters[chapter]);
    const lastVerse = verses[verses.length - 1];
    return lastVerse;
}
export function createReference(
    referenceText: string,
    collection: string,
    bookId: string,
    fromChapter: string,
    toChapter: string,
    fromVerse: string,
    toVerse: string
): any {
    const reference = {};
    reference['text'] = referenceText;
    reference['collection'] = collection;
    reference['bookId'] = bookId;
    reference['fromChapter'] = fromChapter;
    reference['toChapter'] = toChapter;
    reference['fromVerse'] = fromVerse;
    reference['toVerse'] = toVerse;
    return reference;
}
function sortExtraMaterialMatchesByLength() {
    const matches = extras.split('|');
    const stringLengthComparator = function (o1: string, o2: string) {
        return o2.length - o1.length;
    };

    matches.sort(stringLengthComparator);

    let sb = '';
    matches.forEach(function (match, index) {
        if (index > 0) {
            sb += '|';
        }
        sb += match;
    });
    extras = sb;
}
function escapeExtraMaterialSpecialCharactersForRegEx() {
    extras = extras.replace('\\', '\\\\');
    extras = extras.replace('+', '\\+');
    extras = extras.replace('.', '\\.');
    extras = extras.replace('?', '\\?');
    extras = extras.replace('*', '\\*');
    extras = extras.replace('^', '\\^');
    extras = extras.replace('$', '\\$');
    extras = extras.replace('(', '\\(');
    extras = extras.replace(')', '\\)');
    extras = extras.replace('[', '\\[');
    extras = extras.replace(']', '\\]');
}
export function getNonWordCharactersInBookNames(): string {
    const chars = new Set();
    let i = 0;
    while (i < collection.books.length) {
        const bookName = collection.books[i].name;
        const bookAbbrev = collection.books[i].abbreviation;
        const bookAdditionalNames = collection.books[i].additionalNames;
        let nonWordChars = isDefined(bookName) ? bookName.replace(/[\p{L}\p{M}]/gu, '') : '';
        addCharsToSet(nonWordChars, chars);
        nonWordChars = isDefined(bookAbbrev) ? bookAbbrev.replace(/[\p{L}\p{M}]/gu, '') : '';
        addCharsToSet(nonWordChars, chars);
        if (isDefined(bookAdditionalNames)) {
            let j = 0;
            while (j < bookAdditionalNames.length) {
                const name = bookAdditionalNames[j].name;
                nonWordChars = isDefined(name) ? name.replace(/[\p{L}\p{M}]/gu, '') : '';
                addCharsToSet(nonWordChars, chars);
                j++;
            }
        }
        i++;
    }
    return Array.from(chars).join('');
}

function addCharsToSet(nonWordChars, chars) {
    for (let i = 0; i < nonWordChars.length; i++) {
        chars.add(nonWordChars.charAt(i));
    }
}
export async function handleHeaderLinkPressed(start, end, colors): Promise<string> {
    console.log('HandleHeaderLinkPressed start: %o end: %o colors: %o', start, end, colors);
    const primaryColor = colors['PrimaryColor'];
    const root = document.createElement('div');
    const textDiv = document.createElement('div');
    const iconDiv = document.createElement('div');
    const icon = document.createElement('button');

    iconDiv.id = 'icon';

    const referenceSpan = document.createElement('span');
    const footnoteSpan = document.createElement('span');

    root.classList.add('flex', 'flex-row', 'justify-space-between');
    referenceSpan.classList.add('fr');
    footnoteSpan.classList.add('ft');
    icon.setAttribute('reference', JSON.stringify(start));
    icon.classList.add('p-2');

    const svgInnerHTML = `<svg fill='${primaryColor}' xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24"><path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h280v80H200v560h560v-280h80v280q0 33-23.5 56.5T760-120H200Zm188-212-56-56 372-372H560v-80h280v280h-80v-144L388-332Z"/></svg>`;
    icon.innerHTML = svgInnerHTML;
    referenceSpan.innerText = `${start.phrase} `;

    footnoteSpan.innerText = await getVerseText(start, end);

    textDiv.appendChild(referenceSpan);
    textDiv.appendChild(footnoteSpan);
    iconDiv.appendChild(icon);

    root.appendChild(textDiv);
    root.appendChild(iconDiv);

    return root.outerHTML;
}
