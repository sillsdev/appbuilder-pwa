import { describe, expect, test } from 'vitest';
import {
    SearchQueryBase,
    SearchInterface,
    type SearchCandidate,
    type SearchOptions
} from './application';
import {
    ProksommaSearchInterface,
    SearchQuery,
    gqlSearchHelpers,
    type GQLBlockToken,
    type GQLBlocks,
    type GQLBooks
} from './adapters';
import { SABProskomma } from '$lib/sab-proskomma';
import type { Reference } from './entities';
import { thaw } from '../thaw';
import { readFileSync } from 'fs';

const sampleUsfm = `
\\id MAT 40-MAT-web.sfm World English Bible (WEB) 
\\ide UTF-8
\\h Matthew 
\\toc1 The Good News According to Matthew 
\\toc2 Matthew 
\\toc3 Mat 
\\mt2 The Good News According to 
\\mt1 Matthew 
\\c 1  
\\p
\\v 1 The book of the genealogy of Jesus Christ,\\f + \\fr 1:1  \\ft Messiah (Hebrew) and Christ (Greek) both mean “Anointed One”\\f* the son of David, the son of Abraham. 
\\v 2 Abraham became the father of Isaac. Isaac became the father of Jacob. Jacob became the father of Judah and his brothers. 
\\v 3 Judah became the father of Perez and Zerah by Tamar. Perez became the father of Hezron. Hezron became the father of Ram. 
\\v 4 Ram became the father of Amminadab. Amminadab became the father of Nahshon. Nahshon became the father of Salmon. 
\\v 5 $*.?+[]^&{}!<>|-
`;

async function loadTestUSFM(pk: SABProskomma) {
    await pk.gqlQuery(
        `mutation {
            addDocument(
                selectors: [
                    {key: "lang", value: "eng"}, 
                    {key: "abbr", value: "C01"}
                ], 
                contentType: "usfm", 
                content: """${sampleUsfm}""",
            )
        }`
    );
}

class EmptyVerseProvider extends SearchInterface.VerseProvider {
    constructor(searchPhrase: string, options: SearchOptions = {}) {
        super(searchPhrase, options);
    }

    async getVerses(limit: number): Promise<SearchCandidate[]> {
        return [];
    }
}

class TestVerseProvider extends SearchInterface.VerseProvider {
    constructor(searchPhrase: string, options: SearchOptions = {}) {
        super(searchPhrase, options);
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
        searchPhrase = 'test',
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

    test('Ignore characters', async () => {
        const search = new TestSearchQuery('Davd', { ignore: 'i' });
        const results = await search.getResults();
        expect(results.length).toBeGreaterThan(0);
    });

    test('Equivalent characters', async () => {
        const search = new TestSearchQuery('Jesús', { equivalent: ['uú'] });
        const results = await search.getResults();
        expect(results.length).toBeGreaterThan(0);
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

    test('Escapes double quotes in search', async () => {
        const pk = new SABProskomma();
        await loadTestUSFM(pk);

        const provider = new ProksommaSearchInterface.ProskommaVerseProvider({
            pk,
            searchPhrase: '"',
            wholeWords: true,
            docSet: 'eng_C01',
            collection: 'C01'
        });

        const results = await provider.getVerses();
        expect(results.length).toBe(0);
    });

    test('Ignores punctuation', async () => {
        const pk = new SABProskomma();
        await loadTestUSFM(pk);

        const provider = new ProksommaSearchInterface.ProskommaVerseProvider({
            pk,
            searchPhrase: 'David,',
            wholeWords: false,
            docSet: 'eng_C01',
            collection: 'C01'
        });

        const results = await provider.getVerses();
        expect(results.length).toBeGreaterThan(0);
    });

    test('If word is not found, returns no results', async () => {
        const pk = new SABProskomma();
        await loadTestUSFM(pk);

        const provider = new ProksommaSearchInterface.ProskommaVerseProvider({
            pk,
            searchPhrase: 'Hello',
            wholeWords: false,
            docSet: 'eng_C01',
            collection: 'C01'
        });

        const results = await provider.getVerses();
        expect(results.length).toBe(0);
    });

    describe('Whole words', async () => {
        const pk = new SABProskomma();
        await loadTestUSFM(pk);

        test('Matches whole word', async () => {
            const provider = new ProksommaSearchInterface.ProskommaVerseProvider({
                pk,
                searchPhrase: 'Abraham',
                wholeWords: true,
                docSet: 'eng_C01',
                collection: 'C01'
            });
            const results = await provider.getVerses();
            expect(results.length).toBeGreaterThan(0);
        });

        test('Does not match partial word', async () => {
            const provider = new ProksommaSearchInterface.ProskommaVerseProvider({
                pk,
                searchPhrase: 'braham',
                wholeWords: true,
                docSet: 'eng_C01',
                collection: 'C01'
            });
            const results = await provider.getVerses();
            expect(results.length).toBe(0);
        });
    });

    test('Ignore characters', async () => {
        const pk = new SABProskomma();
        await loadTestUSFM(pk);
        const provider = new ProksommaSearchInterface.ProskommaVerseProvider({
            pk,
            searchPhrase: 'Heron',
            wholeWords: false,
            ignore: 'z',
            docSet: 'eng_C01',
            collection: 'C01'
        });
        const verses = await provider.getVerses();
        expect(verses.length).toBeGreaterThan(0);
    });

    test('Equivalent characters', async () => {
        const pk = new SABProskomma();
        await loadTestUSFM(pk);
        const provider = new ProksommaSearchInterface.ProskommaVerseProvider({
            pk,
            searchPhrase: 'Jesús',
            wholeWords: false,
            equivalent: ['uú'],
            docSet: 'eng_C01',
            collection: 'C01'
        });
        const verses = await provider.getVerses();
        expect(verses.length).toBeGreaterThan(0);
    });
});

test('chapterVerseFromScopes', () => {
    const scopes = ['chapter/11', 'verses/1'];
    expect(gqlSearchHelpers.chapterVerseFromScopes(scopes)).toBe('11:1');
});

describe('keywordToRegex', () => {
    test('escapes Regex characters', () => {
        const phrase = '$*. \\ ?+[]^&{}!<>|-';
        const pattern = gqlSearchHelpers.keywordToRegex(phrase);

        // Resolve escaped quotes and backslashes the way GraphQL would.
        let parsed = '';
        let escape = false;
        for (const c of pattern) {
            if (escape) {
                if (c === '"') {
                    parsed += '"';
                } else if (c === '\\') {
                    parsed += '\\';
                } else {
                    throw new Error('Unknown escape sequence: \\' + c);
                }
                escape = false;
            } else if (c === '\\') {
                escape = true;
            } else {
                parsed += c;
            }
        }

        const regex = new RegExp(parsed);

        // Phrase should match literally.
        expect(phrase.match(regex).slice(), `Bad match from regex pattern '${parsed}'`).toEqual([
            phrase
        ]);
    });
});

describe('parseConfig', () => {
    const config = '\\u0300 \\u0301 á>a \\u0302 à>a è>e é>e';
    const parsed = ProksommaSearchInterface.parseConfig(config);

    test('ignored characters', () => {
        expect(parsed.ignore).toBe('\u0300\u0301\u0302');
    });

    test('equivalent characters', () => {
        expect(parsed.equivalent).toEqual(['áa', 'àa', 'èe', 'ée']);
    });
});
