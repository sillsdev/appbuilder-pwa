/**
 * TypeScript file for parsing and handling text references found in text.
 *
 * @author Jake Colbert
 **/

import { get } from 'svelte/store';
import config from '$lib/data/config';
import { refs } from '../data/stores/scripture';
import {
    containsRomanScriptLetter,
    getFirstDigitsAsInt,
    getIntFromString,
    isNotBlank,
    isPositiveInteger,
    splitString,
    stripAllExceptDigitsAndHyphens
} from './stringUtils';
import {
    convertDigitsInStringToDefaultNumeralSystem,
    getIntFromNumberString
} from './numeralUtils';

export const ref: any = get(refs);
export const collection: any = config.bookCollections.find((x) => x.id === ref.collection);
export const allBookNames: any = Object.fromEntries(collection.books.map((x) => [x.id, x.name]));
export const features: any = collection.features;

// In text reference seperators

// These may need to be preprocessed to check escape characters

export const cvs = features['ref-chapter-verse-separator']; // Chapter verse separator
export const rov = features['ref-verse-range-separator']; // Range of verses separator
export const lov = features['ref-verse-list-separator']; // List of verses separator
export const roc = features['ref-chapter-range-separator']; // Range of chapters separator
export const cls = features['ref-chapter-list-separator']; // Chapter list separator

/**
 * Function for taking an input string of references
 * returning an array of reference objects
 * @param text: A string of scripture references ex. 'John 3:16; 3:20-22'
 * @returns A multidimensional array of App.Reference objects
 */
export function parseText(text: string) {
    const result = [];
    let subResult = [];
    const escapedBookNames = {};
    const docSet = ref.docSet;
    let book: string, chapter: string;

    for (const [key, value] of Object.entries(allBookNames)) {
        escapedBookNames[key] = (value as string).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    // ToDo: List of verses separator parsing
    const regex = new RegExp(
        `(${Object.values(escapedBookNames).join(
            '|'
        )})?\\s?(\\d+)?${cvs}?(\\d+)?(${roc}|${rov})?(\\d+)?${cvs}?(\\d+)?`
    );

    for (const reference of text.split(`${cls} `).map((x) => x.match(regex))) {
        book = Object.keys(allBookNames).find((key) => allBookNames[key] === reference[1]) ?? book;
        chapter = reference[2] ?? chapter;
        subResult.push({
            phrase: reference[0],
            docSet: docSet,
            book: book,
            chapter: chapter,
            verse: reference[3]
        });
        if (reference[4] === rov || reference[4] === roc) {
            subResult.push({
                phrase: reference[0],
                docSet: docSet,
                book: book,
                chapter: reference[6] ? reference[5] : chapter,
                verse: reference[6] ?? reference[5]
            });
        }
        result.push(subResult);
        subResult = [];
    }
    return result;
}

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
export function generateAnchor(start, end = undefined) {
    const anchor = document.createElement('a');
    anchor.classList.add('cursor-pointer');
    anchor.href = '#';
    anchor.innerHTML = start.phrase;
    anchor.setAttribute('data-start-ref', JSON.stringify(start));
    anchor.setAttribute('data-end-ref', JSON.stringify(end));
    return anchor;
}

/**
 * Function to generate HTML wrapper with inline span tags
 * that navigate to provided reference
 * @param reference: the string containing the reference
 */
export function generateHTML(references: string) {
    const refs = parseText(references);
    const spans = [];
    for (const reference of refs) {
        for (let i = 0; i < reference.length; i += 2) {
            spans.push(generateAnchor(reference[i], reference[i + 1]));
        }
    }
    const result = spans.map((span) => span.outerHTML).join('; ');
    return result;
}

export function getReferenceFromString(
    reference: string
): [string, string, number, number, [number, number, string][]] {
    let bookCollectionId: string;
    let bookId: string;
    let fromChapter: number;
    let toChapter: number;
    let verseRanges: [number, number, string][];

    bookId = '';
    fromChapter = -1;
    toChapter = -1;
    verseRanges = [[-1, -1, '']];
    bookCollectionId = '';

    if (isNotBlank(reference)) {
        // Look for book collection code
        let refToParse: string;

        if (reference.includes('|')) {
            const chPos: number = reference.indexOf('|');
            bookCollectionId = reference.substring(0, chPos);
            refToParse = reference.length > chPos + 1 ? reference.substring(chPos + 1) : '';
        } else if (reference.includes('/')) {
            const chPos: number = reference.indexOf('/');
            bookCollectionId = reference.substring(0, chPos);
            refToParse = reference.length > chPos + 1 ? reference.substring(chPos + 1) : '';
        } else {
            bookCollectionId = '';
            refToParse = reference;

            // Check if a period has been used as the book collection separator
            // e.g., C01.REV.7.9
            const components: string[] = splitString(reference, '.');
            if (components.length > 2) {
                if (
                    containsRomanScriptLetter(components[0]) &&
                    containsRomanScriptLetter(components[1])
                ) {
                    const chPos: number = reference.indexOf('.');
                    bookCollectionId = reference.substring(0, chPos);
                    refToParse = reference.substring(chPos + 1);
                }
            }
        }
        // Replace any %20 by periods
        let ref: string = refToParse.replace('%20', '.');

        // Replace any colons or spaces by periods
        ref = ref.replace(':', '.');
        ref = ref.replace(' ', '.');

        // Replace any en-dashes by hyphens
        ref = ref.replace('\u2013', '-');

        // Replace non-breaking hyphens by ordinary hyphens
        ref = ref.replace('\u2011', '-');

        const pattern: RegExp = /(\w+)(?:.([0-9-]+))?(?:.([0-9-]+))?/;
        const m: RegExpMatchArray | null = ref.match(pattern);
        if (m) {
            // Book collection and book
            bookId = m[1];
            // Chapter number or range
            let chapter: string = m[2];
            // Verse or verse range
            let verses: string = m[3];

            // For case of only verse chapter in reference
            if (!containsRomanScriptLetter(m[1])) {
                bookId = '';
                chapter = m[1];
                verses = m[2];
            }
            if (isPositiveInteger(chapter)) {
                fromChapter = getIntFromString(chapter);
                toChapter = fromChapter;
            } else {
                [fromChapter, toChapter] = parseChapterRange(chapter);
            }
            if (isNotBlank(verses)) {
                verseRanges = parseVerseRange(verses);
            }
        }
    }
    return [bookCollectionId, bookId, fromChapter, toChapter, verseRanges];
}

function parseChapterRange(chapterRange: string): [number, number] {
    let fromChapter: number;
    let toChapter: number;

    if (isNotBlank(chapterRange)) {
        let range: string = chapterRange.replace('\u2013', '-');
        range = stripAllExceptDigitsAndHyphens(range);
        const hyphenPos: number = range.indexOf('-');
        if (hyphenPos > 0) {
            fromChapter = getIntFromNumberString(range.substring(0, hyphenPos));
            toChapter = getIntFromNumberString(range.substring(hyphenPos + 1));
        } else {
            fromChapter = getIntFromNumberString(range);
            toChapter = fromChapter;
        }
    } else {
        fromChapter = -1;
        toChapter = -1;
    }
    return [fromChapter, toChapter];
}
function parseVerseRange(verseRange: string): [number, number, string][] {
    const verseRanges: [number, number, string][] = [];

    if (isNotBlank(verseRange)) {
        const ranges: string[] = splitString(verseRange, ',');
        for (const range of ranges) {
            const vRange: [number, number, string] = parseVerseRangeString(range);
            verseRanges.push(vRange);
        }
    }
    return verseRanges;
}
function parseVerseRangeString(input: string): [number, number, string] {
    let fromVerse: number;
    let toVerse: number;
    let separator: string;
    let inputToUse: string = isNotBlank(input) ? input.trim() : '';
    if (isNotBlank(input)) {
        // Replace en-dash by hyphen
        inputToUse = input.replace('\u2013', '-');
        // Replace any non-default numeral system digits
        inputToUse = convertDigitsInStringToDefaultNumeralSystem(inputToUse);
        const VERSE_RANGE_PATTERN: RegExp = /(\d+(\w?))(?:\u200F?([-,])(\d+(\w?)))?/;
        const match: RegExpMatchArray | null = inputToUse.match(VERSE_RANGE_PATTERN);

        if (match) {
            fromVerse = isNotBlank(match[1]) ? getFirstDigitsAsInt(match[1]) : -1;
            separator = isNotBlank(match[3]) ? match[3] : '';
            toVerse = isNotBlank(match[4]) ? getFirstDigitsAsInt(match[4]) : -1;
        }
    }
    return [fromVerse, toVerse, separator];
}
