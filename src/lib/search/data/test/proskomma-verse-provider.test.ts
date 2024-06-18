import { SABProskomma } from '$lib/sab-proskomma';
import { thaw } from '$lib/scripts/thaw';
import { readFileSync } from 'fs';
import { describe, test, expect } from 'vitest';
import type { Reference } from '../../domain/entities';
import {
    ProskommaVerseProvider,
    gqlSearchHelpers,
    type GQLBlockToken,
    type GQLBlocks,
    type GQLBooks
} from '../proskomma-verse-provider';
import type { SearchOptions } from '../../domain/interfaces/data-interfaces';

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

class TestProskommaVerseProvider extends ProskommaVerseProvider {
    constructor(args: { phrase?: string; options?: SearchOptions } = {}) {
        super(
            new SABProskomma(),
            args.phrase ?? 'test',
            args.options ?? { docSet: '', collection: '' }
        );
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
        const provider = new TestProskommaVerseProvider({
            options: { docSet: 'eng_C01', collection: 'C01' }
        });
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
        const provider = new TestProskommaVerseProvider({
            options: { docSet: 'eng_C01', collection: 'C01' }
        });
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

        const provider = new ProskommaVerseProvider(pk, 'Lazarus', {
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

        describe('are case insensitive, whole words', () => {
            const pk = new SABProskomma();
            loadTestUSFM(pk);

            const provider = new ProskommaVerseProvider(pk, 'abrAHAm', {
                wholeWords: true,
                docSet: 'eng_C01',
                collection: 'C01'
            });

            test('queryForBooks', async () => {
                const response = await provider.queryForBooks();
                expect(response).toHaveProperty('data');
                expect(response.data.docSet.documents.length).toBeGreaterThan(0);
            });

            test('queryForBlocks', async () => {
                const bookResponse = await provider.queryForBooks();
                const bookId = bookResponse.data.docSet.documents[0].id;
                const blockResponse = await provider.queryForBlocks(bookId);
                expect(blockResponse).toHaveProperty('data');
            });
        });

        describe('are case insensitive, partial words', () => {
            const pk = new SABProskomma();
            loadTestUSFM(pk);

            const provider = new ProskommaVerseProvider(pk, 'abrAHAm', {
                wholeWords: false,
                docSet: 'eng_C01',
                collection: 'C01'
            });

            test('queryForBooks', async () => {
                const response = await provider.queryForBooks();
                expect(response).toHaveProperty('data');
                expect(response.data.docSet.documents.length).toBeGreaterThan(0);
            });

            test('queryForBlocks', async () => {
                const bookResponse = await provider.queryForBooks();
                const bookId = bookResponse.data.docSet.documents[0].id;
                const blockResponse = await provider.queryForBlocks(bookId);
                expect(blockResponse).toHaveProperty('data');
            });
        });
    });

    test('Escapes double quotes in search', async () => {
        const pk = new SABProskomma();
        await loadTestUSFM(pk);

        const provider = new ProskommaVerseProvider(pk, '"', {
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

        const provider = new ProskommaVerseProvider(pk, 'David,', {
            wholeWords: false,
            docSet: 'eng_C01',
            collection: 'C01'
        });

        const results = await provider.getVerses();
        expect(results.length).toBeGreaterThan(0);
    });

    test('Ignores case with partial words', async () => {
        const pk = new SABProskomma();
        await loadTestUSFM(pk);

        const provider = new ProskommaVerseProvider(pk, 'dAviD', {
            wholeWords: false,
            docSet: 'eng_C01',
            collection: 'C01'
        });

        const results = await provider.getVerses();
        expect(results.length).toBeGreaterThan(0);
    });

    test('Ignores case with whole words', async () => {
        const pk = new SABProskomma();
        await loadTestUSFM(pk);

        const provider = new ProskommaVerseProvider(pk, 'dAviD', {
            wholeWords: true,
            docSet: 'eng_C01',
            collection: 'C01'
        });

        const results = await provider.getVerses();
        expect(results.length).toBeGreaterThan(0);
    });

    test('Ignores case with substitutions and ignore', async () => {
        const pk = new SABProskomma();
        await loadTestUSFM(pk);

        const provider = new ProskommaVerseProvider(pk, 'dÁxiD', {
            wholeWords: true,
            docSet: 'eng_C01',
            collection: 'C01',
            substitute: { a: 'á', á: 'a' },
            ignore: 'vx'
        });

        const results = await provider.getVerses();
        expect(results.length).toBeGreaterThan(0);
    });

    describe('Ignores case by locale', async () => {
        const pk = new SABProskomma();
        await loadTestUSFM(pk);

        test('whole words', async () => {
            const provider = new ProskommaVerseProvider(pk, 'davİd', {
                wholeWords: true,
                docSet: 'eng_C01',
                collection: 'C01',
                locale: 'tr'
            });

            const results = await provider.getVerses();
            expect(results.length).toBeGreaterThan(0);
        });

        test('parial words', async () => {
            const provider = new ProskommaVerseProvider(pk, 'davİ', {
                wholeWords: false,
                docSet: 'eng_C01',
                collection: 'C01',
                locale: 'tr'
            });

            const results = await provider.getVerses();
            expect(results.length).toBeGreaterThan(0);
        });
    });

    test('If word is not found, returns no results', async () => {
        const pk = new SABProskomma();
        await loadTestUSFM(pk);

        const provider = new ProskommaVerseProvider(pk, 'Hello', {
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
            const provider = new ProskommaVerseProvider(pk, 'Abraham', {
                wholeWords: true,
                docSet: 'eng_C01',
                collection: 'C01'
            });

            const results = await provider.getVerses();
            expect(results.length).toBeGreaterThan(0);
        });

        test('Does not match partial word', async () => {
            const provider = new ProskommaVerseProvider(pk, 'braham', {
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
        const provider = new ProskommaVerseProvider(pk, 'Heron', {
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
        const provider = new ProskommaVerseProvider(pk, 'Jesús', {
            wholeWords: false,
            substitute: { u: 'ú', ú: 'u' },
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
        expect(phrase.match(regex)?.slice(), `Bad match from regex pattern '${parsed}'`).toEqual([
            phrase
        ]);
    });
});
