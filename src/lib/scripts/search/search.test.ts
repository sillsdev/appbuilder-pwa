import { describe, expect, test } from 'vitest';
import {
    SearchQueryBase,
    SearchInterface,
    type SearchCandidate,
    type SearchOptions
} from './application';
import {
    ProksommaSearchInterface,
    gqlSearchHelpers,
    type GQLBlockToken,
    type GQLBlocks,
    type GQLBooks
} from './adapters';
import { SABProskomma } from '$lib/sab-proskomma';
import type { Reference } from './entities';
import { thaw } from '../thaw';
import { readFileSync } from 'fs';

class EmptyVerseProvider extends SearchInterface.VerseProvider {
    async getVerses(limit: number): Promise<SearchCandidate[]> {
        return [];
    }
}

class TestVerseProvider extends SearchInterface.VerseProvider {
    constructor(searchPhrase: string) {
        super(searchPhrase);
        this.versesLeft = this.candidates;
    }

    verse1 = {
        reference: {
            docSet: 'eng_C01',
            collection: 'C01',
            bookCode: 'MAT',
            chapter: '1',
            verses: '1'
        },
        text: 'The book of the genealogy of Jesus Christ, the son of David, the son of Abraham.'
    };
    verse2 = {
        reference: {
            docSet: 'eng_C01',
            collection: 'C01',
            bookCode: 'MRK',
            chapter: '10',
            verses: '26'
        },
        text: 'They were exceedingly astonished, saying to him, “Then who can be saved?”'
    };
    verse3 = {
        reference: {
            docSet: 'eng_C01',
            collection: 'C01',
            bookCode: 'MAT',
            chapter: '8',
            verses: '7'
        },
        text: 'Jesus said to him, “I will come and heal him.”'
    };
    verse4 = {
        reference: {
            docSet: 'eng_C02',
            collection: 'C02',
            bookCode: 'JHN',
            chapter: '14',
            verses: '6'
        },
        text: 'Jesus said to him, “I am the way, the truth, and the life. No one comes to the Father, except through me.'
    };

    candidates = [this.verse1, this.verse2, this.verse3, this.verse4];

    private versesLeft;

    async getVerses(limit: number): Promise<SearchCandidate[]> {
        if (limit <= 0) {
            limit = this.candidates.length;
        }
        const results = this.versesLeft.slice(0, limit);
        this.versesLeft = this.versesLeft.slice(limit);
        return results;
    }
}

class EmptySearchQuery extends SearchQueryBase {
    constructor(searchPhrase: string, options = {}) {
        super(searchPhrase, new EmptyVerseProvider(searchPhrase), options);
    }
}

class TestSearchQuery extends SearchQueryBase {
    constructor(searchPhrase: string, options: SearchOptions = {}) {
        super(searchPhrase, new TestVerseProvider(searchPhrase), options);
    }
}

interface VerseProviderOptions {
    searchPhrase?: string;
    wholeWords?: boolean;
    docSet?: string;
    collection?: string;
}

class TestProskommaVerseProvider extends ProksommaSearchInterface.ProskommaVerseProvider {
    constructor({
        searchPhrase = '',
        wholeWords = false,
        docSet = '',
        collection = ''
    }: VerseProviderOptions = {}) {
        super({ pk: new SABProskomma(), searchPhrase, wholeWords, docSet, collection });
    }

    lastBookQueried: string = null;

    testBooks: GQLBooks = {
        data: {
            docSet: {
                documents: [
                    {
                        id: 'abc',
                        idParts: {
                            type: 'book'
                        }
                    },
                    {
                        id: 'xyz',
                        idParts: {
                            type: 'book'
                        }
                    },
                    {
                        id: 'songs123',
                        idParts: {
                            type: 'song'
                        }
                    }
                ]
            }
        }
    };

    testBlock1: GQLBlockToken[] = [
        {
            scopes: ['chapter/4', 'verses/2'],
            payload: 'token-4.2.1'
        },
        {
            scopes: ['chapter/4', 'verses/2'],
            payload: ' '
        },
        {
            scopes: ['chapter/4', 'verses/2'],
            payload: 'token-4.2.2'
        },
        {
            scopes: ['chapter/4', 'verses/3'],
            payload: 'token-4.3.1'
        },
        {
            scopes: ['chapter/4', 'verses/3'],
            payload: ' '
        },
        {
            scopes: ['chapter/4', 'verses/3'],
            payload: 'token-4.3.2'
        },
        {
            scopes: ['chapter/5', 'verses/1'],
            payload: 'token-5.1.1'
        }
    ];

    testBlock2: GQLBlockToken[] = [
        {
            scopes: ['chapter/5', 'verses/1'],
            payload: 'hello'
        },
        {
            scopes: ['chapter/5', 'verses/2'],
            payload: 'hello'
        }
    ];

    testBlocks: GQLBlocks = {
        data: {
            document: {
                bookCode: 'XYZ',
                mainSequence: {
                    blocks: [
                        {
                            tokens: this.testBlock1
                        },
                        {
                            tokens: this.testBlock2
                        }
                    ]
                }
            }
        }
    };

    queryForBooks(): Promise<GQLBooks> {
        return Promise.resolve(this.testBooks);
    }

    queryForBlocks(bookId: string): Promise<GQLBlocks> {
        this.lastBookQueried = bookId;
        return Promise.resolve(this.testBlocks);
    }
}

describe('SearchQueryBase', () => {
    test('If no candidates, no results', async () => {
        const search = new EmptySearchQuery('Jesus said');
        const results = await search.getResults();
        expect(results).toEqual([]);
    });

    describe('Basic search', () => {
        test('Returns at least one result', async () => {
            const search = new TestSearchQuery('said');
            const results = await search.getResults();
            expect(results.length).toBeGreaterThan(0);
        });

        test('At least one chunk equals search phrase', async () => {
            const search = new TestSearchQuery('said');
            const results = await search.getResults();
            for (const result of results) {
                const matchingChunks = result.chunks.filter((c) => c.content === 'said');
                expect(matchingChunks.length).toBeGreaterThan(0);
            }
        });

        test('Chunks that equal search phrase are marked', async () => {
            const search = new TestSearchQuery('said');
            const results = await search.getResults();
            for (const result of results) {
                const matchingChunks = result.chunks.filter((c) => c.content === 'said');
                for (const chunk of matchingChunks) {
                    expect(chunk.matchesQuery).toBe(true);
                }
            }
        });

        test('Chunks not equaling search phrase are marked', async () => {
            const search = new TestSearchQuery('said');
            const results = await search.getResults();
            for (const result of results) {
                const matchingChunks = result.chunks.filter((c) => c.content !== 'said');
                for (const chunk of matchingChunks) {
                    expect(chunk.matchesQuery).toBe(false);
                }
            }
        });

        test('Chunks reconstruct an actual verse', async () => {
            const search = new TestSearchQuery('said');
            const verseProvider = search.verseProvider as TestVerseProvider;
            const results = await search.getResults();
            for (const result of results) {
                let text = '';
                for (const chunk of result.chunks) {
                    text += chunk.content;
                }
                const matchingVerses = verseProvider.candidates.filter((v) => v.text === text);
                expect(matchingVerses.length).toBe(1);
            }
        });

        test('Matches partial words', async () => {
            const search = new TestSearchQuery('enealogy');
            const results = await search.getResults();
            expect(results.length).toBeGreaterThan(0);
        });

        test('empty string matches nothing', async () => {
            const search = new TestSearchQuery('');
            const results = await search.getResults();
            expect(results.length).toBe(0);
        });

        test('space matches nothing', async () => {
            const search = new TestSearchQuery(' ');
            const results = await search.getResults();
            expect(results.length).toBe(0);
        });
    });

    describe('Match whole words', () => {
        test('Finds a whole word', async () => {
            const search = new TestSearchQuery('genealogy', { wholeWords: true });
            const results = await search.getResults();
            expect(results.length).toBeGreaterThan(0);
        });

        test('Does not find partial word', async () => {
            const search = new TestSearchQuery('enealogy', { wholeWords: true });
            const results = await search.getResults();
            expect(results.length).toBe(0);
        });
    });

    describe('Paginated results', () => {
        describe('Return three verses in two batches', async () => {
            const search = new TestSearchQuery('Jesus', { wholeWords: true });
            const results1 = await search.getResults(2);
            const results2 = await search.getResults(2);
            const results3 = await search.getResults(2);

            test('First batch has two verses', () => {
                expect(results1.length).toBe(2);
            });

            test('Second batch has one verse', () => {
                expect(results2.length).toBe(1);
            });

            test('Last batch is empty', () => {
                expect(results3.length).toBe(0);
            });
        });

        describe('Limit of zero retuns all verses', async () => {
            const search = new TestSearchQuery('Jesus', { wholeWords: true });
            const results1 = await search.getResults(0);
            const results2 = await search.getResults(0);

            test('First batch has three verses', () => {
                expect(results1.length).toBe(3);
            });

            test('Second batch is empty', () => {
                expect(results2.length).toBe(0);
            });
        });
    });
});

describe('searchParams', () => {
    describe('whole words', () => {
        test('one search word', () => {
            const result = gqlSearchHelpers.searchParams(['Lazarus'], true);
            expect(result).toBe('withChars: ["Lazarus"]');
        });

        test('three search words', () => {
            const result = gqlSearchHelpers.searchParams(['Lazarus', 'Mary', 'Martha'], true);
            expect(result).toBe('withChars: ["Lazarus", "Mary", "Martha"]');
        });

        test('quotation marks are escaped', () => {
            const result = gqlSearchHelpers.searchParams(['"Lazarus"', 'Mary', 'Martha'], true);
            expect(result).toBe('withChars: ["\\"Lazarus\\"", "Mary", "Martha"]');
        });

        test('backslashes are escaped', () => {
            const result = gqlSearchHelpers.searchParams(['"Lazarus"\\', 'Mary', 'Martha'], true);
            expect(result).toBe('withChars: ["\\"Lazarus\\"\\\\", "Mary", "Martha"]');
        });
    });

    describe('partial words', () => {
        test('one search word', () => {
            const result = gqlSearchHelpers.searchParams(['Laz']);
            expect(result).toBe('withMatchingChars: ["Laz.*"]');
        });

        test('three search words', () => {
            const result = gqlSearchHelpers.searchParams(['Lazarus', 'Mary', 'Martha']);
            expect(result).toBe('withMatchingChars: ["Lazarus.*", "Mary.*", "Martha.*"]');
        });

        test('quotation marks are escaped', () => {
            const result = gqlSearchHelpers.searchParams(['"Lazarus"', 'Mary', 'Martha']);
            expect(result).toBe('withMatchingChars: ["\\"Lazarus\\".*", "Mary.*", "Martha.*"]');
        });

        test('backslashes are escaped', () => {
            const result = gqlSearchHelpers.searchParams(['Lazarus\\']);
            // 4 backslashes in the GraphQL query
            //   = 2 backslashes in the resulting regex
            //   = 1 literal backslash
            expect(result).toBe(String.raw`withMatchingChars: ["Lazarus\\\\.*"]`);
        });

        test('asterisks are escaped', () => {
            const result = gqlSearchHelpers.searchParams(['Laz*', 'Mary', 'Martha']);
            expect(result).toBe('withMatchingChars: ["Laz\\\\*.*", "Mary.*", "Martha.*"]');
        });

        test('periods are escaped', () => {
            const result = gqlSearchHelpers.searchParams(['Laz.']);
            expect(result).toBe('withMatchingChars: ["Laz\\\\..*"]');
        });

        test('question marks are escaped', () => {
            const result = gqlSearchHelpers.searchParams(['Laz?']);
            expect(result).toBe('withMatchingChars: ["Laz\\\\?.*"]');
        });

        test('plus symbols are escaped', () => {
            const result = gqlSearchHelpers.searchParams(['Laz+']);
            expect(result).toBe('withMatchingChars: ["Laz\\\\+.*"]');
        });

        test('square brakets are escaped', () => {
            const result = gqlSearchHelpers.searchParams(['Laz[]']);
            expect(result).toBe('withMatchingChars: ["Laz\\\\[\\\\].*"]');
        });

        test('carats are escaped', () => {
            const result = gqlSearchHelpers.searchParams(['Laz^']);
            expect(result).toBe('withMatchingChars: ["Laz\\\\^.*"]');
        });

        test('dollar signs are escaped', () => {
            const result = gqlSearchHelpers.searchParams(['Laz$']);
            expect(result).toBe('withMatchingChars: ["Laz\\\\$.*"]');
        });

        test('curly brakets are escaped', () => {
            const result = gqlSearchHelpers.searchParams(['Laz{}']);
            expect(result).toBe('withMatchingChars: ["Laz\\\\{\\\\}.*"]');
        });

        test('angle brakets are escaped', () => {
            const result = gqlSearchHelpers.searchParams(['Laz<>']);
            expect(result).toBe('withMatchingChars: ["Laz\\\\<\\\\>.*"]');
        });

        test('exclamation points are escaped', () => {
            const result = gqlSearchHelpers.searchParams(['Laz!']);
            expect(result).toBe('withMatchingChars: ["Laz\\\\!.*"]');
        });

        test('pipes are escaped', () => {
            const result = gqlSearchHelpers.searchParams(['Laz|']);
            expect(result).toBe('withMatchingChars: ["Laz\\\\|.*"]');
        });

        test('hyphens are escaped', () => {
            const result = gqlSearchHelpers.searchParams(['Laz-']);
            expect(result).toBe('withMatchingChars: ["Laz\\\\-.*"]');
        });
    });
});

describe('tokenize', () => {
    test('splits on whitespace', () => {
        expect(gqlSearchHelpers.tokenize('  some\n thing\tgreat ')).toEqual([
            'some',
            'thing',
            'great'
        ]);
    });

    test('Retuns empty array if only whitespace', () => {
        expect(gqlSearchHelpers.tokenize('  \n \t ')).toEqual([]);
    });
});

describe('ProskommaVerseProvider', () => {
    describe('setBooks', () => {
        test('Sets nextBook at zero', async () => {
            const provider = new TestProskommaVerseProvider();
            await provider.setBooks();
            expect(provider.nextBook).toBe(0);
        });

        test('Sets books to valid books', async () => {
            const provider = new TestProskommaVerseProvider();
            await provider.setBooks();
            expect(provider.books).toEqual(['abc', 'xyz']);
        });
    });

    describe('verseFromTokens', () => {
        const provider = new TestProskommaVerseProvider({ docSet: 'eng_C01', collection: 'C01' });
        const verses = provider.versesFromTokens(provider.testBlock1, 'RST');

        test('have correct references', () => {
            const refs = verses.map((v) => v.reference);
            const expected: Reference[] = [
                {
                    docSet: 'eng_C01',
                    collection: 'C01',
                    bookCode: 'RST',
                    chapter: '4',
                    verses: '2'
                },
                {
                    docSet: 'eng_C01',
                    collection: 'C01',
                    bookCode: 'RST',
                    chapter: '4',
                    verses: '3'
                },
                {
                    docSet: 'eng_C01',
                    collection: 'C01',
                    bookCode: 'RST',
                    chapter: '5',
                    verses: '1'
                }
            ];
            expect(refs).toEqual(expected);
        });

        test('have correct texts', () => {
            const texts = verses.map((v) => v.text);
            const expected = ['token-4.2.1 token-4.2.2', 'token-4.3.1 token-4.3.2', 'token-5.1.1'];
            expect(texts).toEqual(expected);
        });
    });

    describe('versesOfBook', async () => {
        const provider = new TestProskommaVerseProvider({ docSet: 'eng_C01', collection: 'C01' });
        const verses = await provider.versesOfBook('abc1234');

        test('queries correct book', () => {
            expect(provider.lastBookQueried).toBe('abc1234');
        });

        test('returns correct book code', () => {
            for (const verse of verses) {
                expect(verse.reference.bookCode).toBe('XYZ');
            }
        });

        test('returns correct number of verses', () => {
            expect(verses.length).toBe(4);
        });
    });

    describe('getVerses', () => {
        test('Gets all verses by default', async () => {
            const provider = new TestProskommaVerseProvider();
            const verses = await provider.getVerses();
            // 2 Books, each returning 4 verses = 8 total verses
            expect(verses.length).toBe(8);
        });

        describe('Get batches of 3', async () => {
            const provider = new TestProskommaVerseProvider();
            const batch1 = await provider.getVerses(3);
            const batch2 = await provider.getVerses(3);
            const batch3 = await provider.getVerses(3);
            const batch4 = await provider.getVerses(3);

            test('first batch has 3', () => {
                expect(batch1.length).toBe(3);
            });

            test('second batch has 3', () => {
                expect(batch2.length).toBe(3);
            });

            test('third batch has 2', () => {
                expect(batch3.length).toBe(2);
            });

            test('fourth batch has none', () => {
                expect(batch4.length).toBe(0);
            });
        });
    });

    test('queryNextBook return empty after last book', async () => {
        const provider = new TestProskommaVerseProvider();
        await provider.queryNextBook();
        await provider.queryNextBook();
        await provider.queryNextBook();
        await provider.queryNextBook();
        const results = await provider.queryNextBook();
        expect(results.length).toBe(0);
    });

    describe('GQL Queries', () => {
        const pk = new SABProskomma();
        const docSet = readFileSync('test_data/collections/eng_C01.pkf');
        thaw(pk, new Uint8Array(docSet));

        const provider = new ProksommaSearchInterface.ProskommaVerseProvider({
            pk,
            searchPhrase: 'Lazarus',
            wholeWords: true,
            docSet: 'eng_C01',
            collection: 'C01'
        });

        describe('queryForBooks', async () => {
            const response = await provider.queryForBooks();

            test('Returns data', () => {
                expect(response).toHaveProperty('data');
            });

            test('Returns correct number of books', () => {
                expect(response.data.docSet.documents.length).toBe(2);
            });
        });

        test('queryForBlocks returns data', async () => {
            const bookResponse = await provider.queryForBooks();
            const bookId = bookResponse.data.docSet.documents[0].id;
            const blockResponse = await provider.queryForBlocks(bookId);
            expect(blockResponse).toHaveProperty('data');
        });
    });
});

test('chapterVerseFromScopes', () => {
    const scopes = ['chapter/11', 'verses/1'];
    expect(gqlSearchHelpers.chapterVerseFromScopes(scopes)).toBe('11:1');
});
