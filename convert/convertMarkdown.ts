import assert from 'assert';
import { getReferenceFromString } from '../src/lib/scripts/scripture-reference-utils-common';
import { getFilenameExt, isBlank } from './stringUtils';

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
    // \zaudioc-s |link="audioclip.mp3"\*audioclip.mp3\zaudioc-e\*
    let result = '';
    const refLower = link.toLowerCase();
    const ext = getFilenameExt(refLower);
    if (ext === 'mp3' || ext === 'wav') {
        result =
            ' \\zaudioc-s |link="' + encodeURIComponent(link) + '" \\*' + text + '\\zaudioc-e\\* ';
    }
    return result;
}
function imageUSFM(link: string, text: string): string {
    // \fig Pharisee|src="VB-John 1v22.jpg" size="span"\fig*
    const result = '\\fig ' + text + '|src="' + link + '" size="span"\\fig*';
    return result;
}
function weblinkUSFM(link: string, text: string): string {
    // HACK: USFM supports web links through \jmp, Proskomma doesn't support \jmp. Pass them through as /jmp in text and process in ScriptureViewSofria.
    const result = `/jmp ${text}|href="${encodeURIComponent(link)}"/jmp* `;
    return result;
}
function emailUSFM(link: string, text: string): string {
    // HACK: USFM supports web links through \jmp, Proskomma doesn't support \jmp. Pass them through as /jmp in text and process in ScriptureViewSofria.
    const result = `/jmp ${text}|href="${encodeURIComponent(link)}"/jmp* `;
    return result;
}
function telUSFM(link: string, text: string): string {
    // HACK: USFM supports web links through \jmp, Proskomma doesn't support \jmp. Pass them through as /jmp in text and process in ScriptureViewSofria.
    const result = `/jmp ${text}|href="${encodeURIComponent(link)}"/jmp* `;
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
            ' \\zreflink-s |link="' +
            encodeURIComponent(reference) +
            '"\\*' +
            text +
            '\\zreflink-e\\* ';
    }
    return result;
}
