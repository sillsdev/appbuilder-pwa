/**
 * Vitest file for reference parsing utilities
 *
 * @Author Jake Colbert & David Moore
 */

import { describe, expect, it } from 'vitest';
import { getReferenceFromString } from './scripture-reference-utils-common';
describe('Scripture Reference Utilities', () => {
    describe('getReferenceFromString', () => {
        it('gets book from string', () => {
            const [collection, book, fromChapter, toChapter, verseRanges] =
                getReferenceFromString('MAT 1:1-25');
            expect(book).toEqual('MAT');
        });
        it('gets chapter from string', () => {
            const [collection, book, fromChapter, toChapter, verseRanges] =
                getReferenceFromString('MAT 1:1-25');
            expect(toChapter).toEqual(1);
        });
        it('gets empty book collection when not present', () => {
            const [collection, book, fromChapter, toChapter, verseRanges] =
                getReferenceFromString('MAT 1:1-25');
            expect(collection).toEqual('');
        });
        it('gets verse range from string', () => {
            const [collection, book, fromChapter, toChapter, verseRanges] =
                getReferenceFromString('MAT 1:1-25');
            const [fromVerse, toVerse, separator] = verseRanges[0];
            expect(fromVerse).toEqual(1);
            expect(toVerse).toEqual(25);
        });
        it('handles chapter only reference', () => {
            const [collection, book, fromChapter, toChapter, verseRanges] =
                getReferenceFromString('MAT 1');
            const [fromVerse, toVerse, separator] = verseRanges[0];
            expect(toChapter).toEqual(1);
            expect(verseRanges.length).toEqual(1);
            expect(toVerse).toEqual(-1);
            expect(fromVerse).toEqual(-1);
        });
    });
});
