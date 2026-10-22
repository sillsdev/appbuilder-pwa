/**
 * Vitest file for reference parsing utilities
 *
 * @Author Jake Colbert & David Moore
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { getReferenceFromString } from './scripture-reference-utils-common';

const config1 = {
    bookCollections: [
        {
            id: 'C01',
            style: {
                numeralSystem: 'Default'
            },
            books: []
        }
    ]
};

describe('Scripture Reference Utilities', () => {
    describe('getReferenceFromString', () => {
        it('gets book from string', () => {
            const [collection, book, fromChapter, toChapter, verseRanges] = getReferenceFromString(
                'MAT 1:1-25',
                config1.bookCollections
            );
            expect(book).toEqual('MAT');
        });
        it('gets chapter from string', () => {
            const [collection, book, fromChapter, toChapter, verseRanges] = getReferenceFromString(
                'MAT 1:1-25',
                config1.bookCollections
            );
            expect(toChapter).toEqual(1);
        });
        it('gets empty book collection when not present', () => {
            const [collection, book, fromChapter, toChapter, verseRanges] = getReferenceFromString(
                'MAT 1:1-25',
                config1.bookCollections
            );
            expect(collection).toEqual('');
        });
        it('gets verse range from string', () => {
            const [collection, book, fromChapter, toChapter, verseRanges] = getReferenceFromString(
                'MAT 1:1-25',
                config1.bookCollections
            );
            const [fromVerse, toVerse, separator] = verseRanges[0];
            expect(fromVerse).toEqual(1);
            expect(toVerse).toEqual(25);
        });
        it('handles chapter only reference', () => {
            const [collection, book, fromChapter, toChapter, verseRanges] = getReferenceFromString(
                'MAT 1',
                config1.bookCollections
            );
            const [fromVerse, toVerse, separator] = verseRanges[0];
            expect(toChapter).toEqual(1);
            expect(verseRanges.length).toEqual(1);
            expect(toVerse).toEqual(-1);
            expect(fromVerse).toEqual(-1);
        });
    });
});
