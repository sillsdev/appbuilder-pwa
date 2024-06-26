import { describe, test, expect } from 'vitest';
import type { Reference } from '$lib/search/domain/entities';
import { ProskommaVerseProvider, chapterVerseFromScopes } from '../pk-verse-provider';
import type { SearchOptions } from '$lib/search/domain/interfaces/data-interfaces';
import type {
    GQLBookId,
    GQLBlockToken,
    ProskommaSearchRepository
} from '../interfaces/pk-search-repository';

const testBooks: GQLBookId[] = [
    {
        id: 'abc',
        bookCode: 'test1',
        idParts: {
            type: 'book'
        }
    },
    {
        id: 'xyz',
        bookCode: 'test2',
        idParts: {
            type: 'book'
        }
    },
    {
        id: 'songs123',
        bookCode: 'test3',
        idParts: {
            type: 'song'
        }
    }
];

const testTokens: GQLBlockToken[] = [
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
    },
    {
        scopes: ['chapter/5', 'verses/2'],
        payload: 'token-5.2.1'
    }
];

class TestProskommaSearchRepository implements ProskommaSearchRepository {
    loadDocSet(data: ArrayBuffer): Promise<void> {
        throw new Error('Method not implemented.');
    }

    lastBookQueried: string;

    async queryBooks(phrase: string, options: SearchOptions): Promise<GQLBookId[]> {
        return testBooks;
    }

    async queryTokens(
        phrase: string,
        bookId: string,
        options: SearchOptions
    ): Promise<GQLBlockToken[]> {
        this.lastBookQueried = bookId;
        return testTokens;
    }
}

function makeTestProvider(phrase?: string, options?: SearchOptions) {
    const repository = new TestProskommaSearchRepository();
    phrase ??= 'test';
    options ??= {
        docSet: '',
        collection: ''
    };
    return new ProskommaVerseProvider(repository, phrase, options);
}

describe('ProskommaVerseProvider', () => {
    describe('setBooks', () => {
        test('Sets nextBook at zero', async () => {
            const provider = makeTestProvider();
            await provider.setBooks();
            expect(provider.nextBook).toBe(0);
        });

        test('Sets books to valid books', async () => {
            const provider = makeTestProvider();
            await provider.setBooks();
            expect(provider.books.map((b) => b.id)).toEqual(['abc', 'xyz']);
        });
    });

    describe('verseFromTokens', () => {
        const options = { docSet: 'eng_C01', collection: 'C01' };
        const provider = makeTestProvider('test', options);
        const verses = provider.versesFromTokens(testTokens, 'RST');

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
                },
                {
                    docSet: 'eng_C01',
                    collection: 'C01',
                    bookCode: 'RST',
                    chapter: '5',
                    verses: '2'
                }
            ];
            expect(refs).toEqual(expected);
        });

        test('have correct texts', () => {
            const texts = verses.map((v) => v.text);
            const expected = [
                'token-4.2.1 token-4.2.2',
                'token-4.3.1 token-4.3.2',
                'token-5.1.1',
                'token-5.2.1'
            ];
            expect(texts).toEqual(expected);
        });
    });

    describe('versesOfBook', async () => {
        const options = { docSet: 'eng_C01', collection: 'C01' };
        const repo = new TestProskommaSearchRepository();
        const provider = new ProskommaVerseProvider(repo, 'test', options);

        const book: GQLBookId = {
            id: 'abc1234',
            idParts: {
                type: 'book'
            },
            bookCode: 'XYZ'
        };
        const verses = await provider.versesOfBook(book);

        test('queries correct book', () => {
            expect(repo.lastBookQueried).toBe('abc1234');
        });

        test('returns correct book code', () => {
            for (const verse of verses) {
                expect(verse.reference.bookCode).toBe('XYZ');
            }
        });
    });

    describe('getVerses', () => {
        test('Gets all verses by default', async () => {
            const provider = makeTestProvider();
            const verses = await provider.getVerses();
            // 2 Books, each returning 4 verses = 8 total verses
            expect(verses.length).toBe(8);
        });

        describe('Get batches of 3', async () => {
            const provider = makeTestProvider();
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
        const provider = makeTestProvider();
        await provider.queryNextBook();
        await provider.queryNextBook();
        await provider.queryNextBook();
        await provider.queryNextBook();
        const results = await provider.queryNextBook();
        expect(results.length).toBe(0);
    });
});

test('chapterVerseFromScopes', () => {
    const scopes = ['chapter/11', 'verses/1'];
    expect(chapterVerseFromScopes(scopes)).toBe('11:1');
});
