import { readFileSync } from 'fs';
import { test, describe, expect } from 'vitest';

import {
    parseResponse,
    referenceFromScopes,
    searchParams,
    tokenize,
    type GraphQLResponse
} from './search';

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
});

describe('tokenize', () => {
    test('splits on whitespace', () => {
        expect(tokenize('  some\n thing\tgreat ')).toEqual(['some', 'thing', 'great']);
    });

    test('Retuns empty array if only whitespace', () => {
        expect(tokenize('  \n \t ')).toEqual([]);
    });
});

describe('referenceFromScopes', () => {
    test('chapter then verses', () => {
        const scopes = ['chapter/11', 'verses/1'];
        expect(referenceFromScopes(scopes)).toBe('11:1');
    });
});

describe('parseResponse', () => {
    const response1 = JSON.parse(
        readFileSync('test_data/sampleSearchResults/martha_said.json').toString()
    ) as GraphQLResponse;

    const searchResults1 = [
        {
            reference: {
                bookCode: 'JHN',
                chapter: '11',
                verses: '21'
            },
            chunks: [
                {
                    content: 'Therefore ',
                    matchesQuery: false
                },
                {
                    content: 'Martha said',
                    matchesQuery: true
                },
                {
                    content:
                        ' to Jesus, “Lord, if you would have been here, my brother wouldn’t have died. ',
                    matchesQuery: false
                }
            ]
        },
        {
            reference: {
                bookCode: 'JHN',
                chapter: '11',
                verses: '24'
            },
            chunks: [
                {
                    content: 'Martha said',
                    matchesQuery: true
                },
                {
                    content:
                        ' to him, “I know that he will rise again in the resurrection at the last day.”',
                    matchesQuery: false
                }
            ]
        }
    ];

    /*
     * In this test response, John 11:35 has been intentionally broken into two blocks.
     * This situation is more likely in passages such as the Psalms.
     * The search algorithm should be able to discover text that spans multiple blocks within the same verse.
     */
    const response2 = JSON.parse(
        readFileSync('test_data/sampleSearchResults/martha_said.json').toString()
    ) as GraphQLResponse;

    const searchResults2 = [
        {
            reference: {
                bookCode: 'JHN',
                chapter: '11',
                verses: '35'
            },
            chunks: [
                {
                    content: 'Jesus wept',
                    matchesQuery: true
                },
                {
                    content: '.',
                    matchesQuery: false
                }
            ]
        }
    ];

    test('finds "Martha said"', () => {
        expect(parseResponse(response1, 'Martha said')).toEqual(searchResults1);
    });

    test('ignores leading and trailing whitespace', () => {
        expect(parseResponse(response1, '  Martha said   ')).toEqual(searchResults1);
    });

    /*
     * In response2, John 11:35 has been intentionally broken into two blocks.
     * This situation is more likely in passages such as the Psalms.
     * The search algorithm should be able to discover text that spans multiple blocks within the same verse.
     */
    // test('finds text accross multiple blocks', () => {
    //     expect(parseResponse(response2, 'Jesus wept')).toEqual(searchResults2);
    // });
});
