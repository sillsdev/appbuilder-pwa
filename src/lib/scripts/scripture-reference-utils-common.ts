/**
 * TypeScript file for parsing and handling text references found in text.
 * These are routines that need to be called both by convert methods and runtime and
 * so cannot reference the data folders
 *
 * @author David Moore
 **/

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
    return [
        bookCollectionId.toUpperCase(),
        bookId.toUpperCase(),
        fromChapter,
        toChapter,
        verseRanges
    ];
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
    let fromVerse: number = -1;
    let toVerse: number = -1;
    let separator: string = '';
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
