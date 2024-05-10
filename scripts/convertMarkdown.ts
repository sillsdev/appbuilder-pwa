import assert from 'assert';
import {
    convertDigitsInStringToDefaultNumeralSystem,
    getIntFromNumberString
} from './numeralUtils';
import {
    containsRomanScriptLetter,
    getFilenameExt,
    getFirstDigitsAsInt,
    getIntFromString,
    isBlank,
    isNotBlank,
    isPositiveInteger,
    splitString,
    stripAllExceptDigitsAndHyphens
} from './stringUtils';

enum ConversionFormat {
    HTML,
    USFM
}

export function convertMarkdownsToMilestones(
    content: string,
    bcId: string,
    bookId: string
): string {
    return convertMarkdown(content, ConversionFormat.USFM, bcId, bookId);
}

export function convertMarkdownsToHTML(content: string): string {
    return convertMarkdown(content, ConversionFormat.HTML);
}

function convertMarkdown(
    content: string,
    conversion: ConversionFormat,
    bcId: string | null = null,
    bookId: string | null = null
): string {
    if (conversion === ConversionFormat.USFM) {
        assert(bcId && bookId, 'Book and Collection IDs must be specified for USFM conversion');
    }
    const sb = [];
    const patternString = /(!?)\[([^[]*?)\]\((.*?)\)/;
    let match;
    while ((match = patternString.exec(content)) !== null) {
        // Append text segment with 1st part of string
        sb.push(content.substring(0, match.index));
        // Handle markdown
        if (conversion === ConversionFormat.HTML) {
            sb.push(htmlLink(match[1], match[2], match[3]));
        } else if (conversion === ConversionFormat.USFM) {
            sb.push(usfmLink(match[1], match[2], match[3], bcId as string, bookId as string));
        }
        content = content.substring(match.index + match[0].length);
    }
    sb.push(content);
    return sb.join('');
}

/**
 * Convert a markdown link to USFM
 * @param excl An empty string, or an exclamation mark indicating
 * the link is an embedded image.
 * @param alt The link's alt text.
 * @param ref The link's target.
 * @param bcId The ID of the current book selection
 * @param bookId The ID of the current book
 * @returns A USFM tag equivalent to the given markdown link.
 */
function usfmLink(excl: string, alt: string, ref: string, bcId: string, bookId: string): string {
    if (isBlank(ref)) {
        // Empty link reference, e.g. [alt]()
        // Output simple text without a link
        return alt;
    } else if (isLocalAudioFile(ref)) {
        return audioUSFM(ref, alt);
    } else if (isImageLink(ref, excl)) {
        // Image ![alt text](image.png)
        return imageUSFM(ref, alt);
    } else if (isWebLink(ref)) {
        return weblinkUSFM(ref, alt);
    } else if (isEmailLink(ref)) {
        return emailUSFM(ref, alt);
    } else if (isTelephoneNumberLink(ref)) {
        return telUSFM(ref, alt);
    } else {
        return referenceUSFM(ref, alt, bcId, bookId);
    }
}

/**
 * Convert a markdown link to HTML
 * @param excl An empty string, or an exclamation mark indicating
 * the link is an embedded image.
 * @param alt The link's alt text.
 * @param ref The link's target.
 * @returns
 */
function htmlLink(excl: string, alt: string, ref: string): string {
    if (isBlank(ref)) {
        // Empty link reference, e.g. [text]()
        // Output simple text without a link
        return alt;
    } else if (isImageLink(ref, excl)) {
        // Image ![alt text](image.png)
        return `<img src="${ref}" alt="${alt}">`;
    } else if (isWebLink(ref) || isEmailLink(ref) || isTelephoneNumberLink(ref)) {
        return `<a href="${ref}">${alt}</a>`;
    } else {
        // Not a known link type. Return the makrdown element as is.
        return `${excl}[${alt}](${ref})`;
    }
}

function isEmailLink(ref: string): boolean {
    const refLower = ref.toLowerCase();
    return refLower.startsWith('mailto:');
}
function isWebLink(ref: string): boolean {
    const refLower = ref.toLowerCase();
    return refLower.startsWith('http');
}
function isTelephoneNumberLink(ref: string): boolean {
    const refLower = ref.toLowerCase();
    return refLower.startsWith('tel:');
}
function isLocalAudioFile(ref: string): boolean {
    let result = false;
    const refLower = ref.toLowerCase();
    if (!refLower.startsWith('http')) {
        const ext = getFilenameExt(refLower);
        if (ext != null) {
            result = ext === 'mp3' || ext === 'webm' || ext === 'ogg' || ext === 'wav';
        }
    }
    return result;
}
function isImageLink(ref: string, excl: string): boolean {
    let result = false;
    const refLower = ref.toLowerCase();
    const ext = getFilenameExt(refLower);
    if (
        ext === 'png' ||
        ext === 'jpg' ||
        ext === 'jpeg' ||
        ext === 'tif' ||
        ext === 'svg' ||
        ext === 'gif'
    ) {
        if (excl != null && excl === '!') {
            result = true;
        }
    }
    return result;
}
function audioUSFM(link: string, text: string): string {
    // \zaudioc-s | link="audioclip.mp3"\*audioclip.mp3\zaudioc-e\*
    let result = '';
    const refLower = link.toLowerCase();
    const ext = getFilenameExt(refLower);
    if (ext === 'mp3' || ext === 'wav') {
        result =
            ' \\zaudioc-s | link="' +
            encodeURIComponent(link) +
            '" \\*' +
            text +
            ' \\zaudioc-e\\* ';
    }
    return result;
}
function imageUSFM(link: string, text: string): string {
    // \fig Pharisee|src="VB-John 1v22.jpg" size="span"\fig*
    const result = '\\fig ' + text + '|src="' + link + '" size="span"\\fig*';
    return result;
}
function weblinkUSFM(link: string, text: string): string {
    // \zweblink-s | link="https://www.sil.org/"\*Web Link \zweblink-e\*
    const result =
        ' \\zweblink-s | link="' + encodeURIComponent(link) + '"\\*' + text + ' \\zweblink-e\\* ';
    return result;
}
function emailUSFM(link: string, text: string): string {
    // \zelink-s | link="mailto:david_moore1@sil.org"\*EMAIL DAVID \zelink-e\*
    const result =
        ' \\zelink-s | link="' + encodeURIComponent(link) + '"\\*' + text + ' \\zelink-e\\* ';
    return result;
}
function telUSFM(link: string, text: string): string {
    // \ztellink-s | link="tel:6144323864"\*CAMB \ztellink-e\*
    const result =
        ' \\ztellink-s | link="' + encodeURIComponent(link) + '"\\*' + text + ' \\ztellink-e\\* ';
    return result;
}
function referenceUSFM(link: string, text: string, bcId: string, bookid: string): string {
    // \zreflink-s |link="ENGWEB.MAT.5.1"\*Beatitudes\zreflink-e\* \
    let result: string = '';
    const [collection, book, fromChapter, toChapter, verseRanges] = getReferenceFromString(link);
    const [fromVerse, toVerse, separator] = verseRanges[0];
    if (book === '' && fromChapter === -1) {
        // Invalid link
        result = text;
    } else {
        let refCollection = collection;
        if (isBlank(refCollection)) {
            refCollection = bcId;
        }
        let refBook = book;
        if (isBlank(refBook)) {
            refBook = bookid;
        }
        let refChapter = fromChapter;
        if (refChapter < 1) {
            refChapter = 1;
        }
        let refVerse = fromVerse;
        if (refVerse < 1) {
            refVerse = 1;
        }
        const reference =
            refCollection + '.' + refBook + '.' + refChapter.toString() + '.' + refVerse.toString();
        result =
            ' \\zreflink-s | link="' +
            encodeURIComponent(reference) +
            '"\\*' +
            text +
            ' \\zreflink-e\\* ';
    }
    return result;
}

function getReferenceFromString(
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
