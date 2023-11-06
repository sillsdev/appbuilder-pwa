/**
 * TypeScript file for parsing and handling text references found in text.
 *
 * @author Jake Colbert
 **/

import { get } from 'svelte/store';
import config from '$lib/data/config';
import { refs } from '../data/stores/scripture';

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

    // Clean book titles to escape any characters that the regex would misrecognize
    for (const [key, value] of Object.entries(allBookNames)) {
        escapedBookNames[key] = (value as string).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    /**
     * The regex pattern follows this structure in which each element in parentheses is a capture group and where '?' means 0 or more occurances:
     * (Book)? (Chapter1)?:(Verse1)?(roc|rov|lov)?(Chapter2|Verse2)?:(Verse2)?
     *
     * These capture groups are then organized into a match object:
     * Reference = [OriginalString, Book, Chapter1, Verse1, range seperator | list seperator, Chapter2 | Verse2, Verse2]
     *
     * If they do not exist in the string their placements are filled with 'undefined'
     * ex. John 3:16
     * [
     *    'John 3:16',
     *    'John',
     *    '3',
     *    '16',
     *    undefined,
     *    undefined,
     *    undefined,
     *    ...
     * ]
     */
    const regex = new RegExp(
        `(${Object.values(escapedBookNames).join(
            '|'
        )})?\\s?(\\d+)?${cvs}?(\\d+)?(${roc}|${rov}|${lov})?(\\d+)?${cvs}?(\\d+)?`
    );

    // Iterate through elements of the reference string seperated by the chapter list seperator.
    for (const reference of text.split(`${cls} `).map((x) => x.match(regex))) {
        console.log(reference);
        book = Object.keys(allBookNames).find((key) => allBookNames[key] === reference[1]) ?? book;
        chapter = reference[2] ?? chapter;

        // Root reference
        subResult.push({
            phrase: reference[0].split(`${lov}`)[0],
            docSet: docSet,
            book: book,
            chapter: chapter,
            verse: reference[3]
        });

        // Additional reference cases
        switch (reference[4]) {
            case rov:
            case roc:
                subResult.push({
                    phrase: reference[0],
                    docSet: docSet,
                    book: book,
                    chapter: reference[6] ? reference[5] : chapter,
                    verse: reference[6] ?? reference[5]
                });
                break;
            case lov:
                result.push(subResult);
                subResult = [];
                subResult.push({
                    phrase: reference[0].split(`${lov}`)[1],
                    docSet: docSet,
                    book: book,
                    chapter: chapter,
                    verse: reference[5]
                });
                break;
            default:
                break;
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
