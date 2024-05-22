import { test, describe, expect } from 'vitest';

import { searchParams, tokenize } from './search';

describe('searchParams', () => {
    describe('whole words', () => {
        test('one search word', () => {
            const result = searchParams(['Lazarus'], true);
            expect(result).toBe('withChars: ["Lazarus"]');
        });

        test('three search words', () => {
            const result = searchParams(['Lazarus', 'Mary', 'Martha'], true);
            expect(result).toBe('withChars: ["Lazarus", "Mary", "Martha"]');
        });

        test('quotation marks are escaped', () => {
            const result = searchParams(['"Lazarus"', 'Mary', 'Martha'], true);
            expect(result).toBe('withChars: ["\\"Lazarus\\"", "Mary", "Martha"]');
        });

        test('backslashes are escaped', () => {
            const result = searchParams(['"Lazarus"\\', 'Mary', 'Martha'], true);
            expect(result).toBe('withChars: ["\\"Lazarus\\"\\\\", "Mary", "Martha"]');
        });
    });

    describe('partial words', () => {
        test('one search word', () => {
            const result = searchParams(['Laz'], false);
            expect(result).toBe('withMatchingChars: ["Laz.*"]');
        });

        test('three search words', () => {
            const result = searchParams(['Lazarus', 'Mary', 'Martha'], false);
            expect(result).toBe('withMatchingChars: ["Lazarus.*", "Mary.*", "Martha.*"]');
        });

        test('quotation marks are escaped', () => {
            const result = searchParams(['"Lazarus"', 'Mary', 'Martha'], false);
            expect(result).toBe('withMatchingChars: ["\\"Lazarus\\".*", "Mary.*", "Martha.*"]');
        });

        test('backslashes are escaped', () => {
            const result = searchParams(['Lazarus\\'], false);
            // 4 backslashes in the GraphQL query
            //   = 2 backslashes in the resulting regex
            //   = 1 literal backslash
            expect(result).toBe(String.raw`withMatchingChars: ["Lazarus\\\\.*"]`);
        });

        test('asterisks are escaped', () => {
            const result = searchParams(['Laz*', 'Mary', 'Martha'], false);
            expect(result).toBe('withMatchingChars: ["Laz\\\\*.*", "Mary.*", "Martha.*"]');
        });

        test('periods are escaped', () => {
            const result = searchParams(['Laz.'], false);
            expect(result).toBe('withMatchingChars: ["Laz\\\\..*"]');
        });

        test('question marks are escaped', () => {
            const result = searchParams(['Laz?'], false);
            expect(result).toBe('withMatchingChars: ["Laz\\\\?.*"]');
        });

        test('plus symbols are escaped', () => {
            const result = searchParams(['Laz+'], false);
            expect(result).toBe('withMatchingChars: ["Laz\\\\+.*"]');
        });

        test('square brakets are escaped', () => {
            const result = searchParams(['Laz[]'], false);
            expect(result).toBe('withMatchingChars: ["Laz\\\\[\\\\].*"]');
        });

        test('carats are escaped', () => {
            const result = searchParams(['Laz^'], false);
            expect(result).toBe('withMatchingChars: ["Laz\\\\^.*"]');
        });

        test('dollar signs are escaped', () => {
            const result = searchParams(['Laz$'], false);
            expect(result).toBe('withMatchingChars: ["Laz\\\\$.*"]');
        });

        test('curly brakets are escaped', () => {
            const result = searchParams(['Laz{}'], false);
            expect(result).toBe('withMatchingChars: ["Laz\\\\{\\\\}.*"]');
        });

        test('angle brakets are escaped', () => {
            const result = searchParams(['Laz<>'], false);
            expect(result).toBe('withMatchingChars: ["Laz\\\\<\\\\>.*"]');
        });

        test('exclamation points are escaped', () => {
            const result = searchParams(['Laz!'], false);
            expect(result).toBe('withMatchingChars: ["Laz\\\\!.*"]');
        });

        test('pipes are escaped', () => {
            const result = searchParams(['Laz|'], false);
            expect(result).toBe('withMatchingChars: ["Laz\\\\|.*"]');
        });

        test('hyphens are escaped', () => {
            const result = searchParams(['Laz-'], false);
            expect(result).toBe('withMatchingChars: ["Laz\\\\-.*"]');
        });
    });

    describe('tokenize', () => {
        test('splits on whitespace', () => {
            expect(tokenize('  some\n thing\tgreat ')).toEqual(['some', 'thing', 'great']);
        });

        test('Retuns empty array if only whitespace', () => {
            expect(tokenize('  \n \t ')).toEqual([]);
        });
    });
});
