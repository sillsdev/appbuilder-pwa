import { describe, expect, test } from 'vitest';
import type { SearchOptions } from '$lib/search/domain/interfaces/data-interfaces';
import { SearchQueryInternal } from '../search-query-internal';
import type {
    QueryVerseProvider,
    SearchCandidate,
    ScriptureRepository
} from '../interfaces/data-interfaces';

const verse1 = {
    reference: {
        docSet: 'eng_C01',
        collection: 'C01',
        bookCode: 'MAT',
        chapter: '1',
        verses: '1'
    },
    text: 'The book of the genealogy of Jesus Christ, the son of David, the son of Abraham.'
};
const verse2 = {
    reference: {
        docSet: 'eng_C01',
        collection: 'C01',
        bookCode: 'MRK',
        chapter: '10',
        verses: '26'
    },
    text: 'They were exceedingly astonished, saying to him, “Then who can be saved?”'
};
const verse3 = {
    reference: {
        docSet: 'eng_C01',
        collection: 'C01',
        bookCode: 'MAT',
        chapter: '8',
        verses: '7'
    },
    text: 'Jesus said to him, “I will come and heal him.”'
};
const verse4 = {
    reference: {
        docSet: 'eng_C02',
        collection: 'C02',
        bookCode: 'JHN',
        chapter: '14',
        verses: '6'
    },
    text: 'Jesus said to him, “I am the way, the truth, and the life. No one comes to the Father, except through me.'
};
const verse5 = {
    reference: {
        docSet: 'eng_C02',
        collection: 'C02',
        bookCode: 'XXX',
        chapter: '1',
        verses: '1'
    },
    text: 'other Mother'
};

const testVerses = [verse1, verse2, verse3, verse4, verse5];

const docSet = 'eng_TEST';
const collection = 'TEST';

class TestVerseProvider implements QueryVerseProvider {
    static candidates = testVerses;
    private versesLeft = testVerses;

    async getVerses(limit: number): Promise<SearchCandidate[]> {
        if (limit <= 0) {
            limit = TestVerseProvider.candidates.length;
        }
        const results = this.versesLeft.slice(0, limit);
        this.versesLeft = this.versesLeft.slice(limit);
        return results;
    }
}

class EmptyVerseProvider implements QueryVerseProvider {
    async getVerses(_limit: number): Promise<SearchCandidate[]> {
        return [];
    }
}

class EmptyScriptureRepository implements ScriptureRepository {
    async queryVerses(_phrase: string, _options: SearchOptions): Promise<QueryVerseProvider> {
        return new EmptyVerseProvider();
    }
}

class TestScriptureRepository implements ScriptureRepository {
    async queryVerses(_phrase: string, _options: SearchOptions): Promise<QueryVerseProvider> {
        return new TestVerseProvider();
    }
}

function emptyQuery(phrase: string, options: object = {}) {
    return new SearchQueryInternal(
        phrase,
        { ...options, docSet, collection },
        new EmptyScriptureRepository()
    );
}

function testQuery(phrase: string, options: object = {}) {
    return new SearchQueryInternal(
        phrase,
        { ...options, docSet, collection },
        new TestScriptureRepository()
    );
}

test('If no candidates, no results', async () => {
    const search = emptyQuery('Jesus said');
    const results = await search.getResults();
    expect(results).toEqual([]);
});

describe('Basic search', () => {
    test('Returns at least one result', async () => {
        const search = testQuery('said');
        const results = await search.getResults();
        expect(results.length).toBeGreaterThan(0);
    });

    test('At least one chunk equals search phrase', async () => {
        const search = testQuery('said');
        const results = await search.getResults();
        for (const result of results) {
            const matchingChunks = result.chunks.filter((c) => c.content === 'said');
            expect(matchingChunks.length).toBeGreaterThan(0);
        }
    });

    test('Chunks that equal search phrase are marked', async () => {
        const search = testQuery('said');
        const results = await search.getResults();
        for (const result of results) {
            const matchingChunks = result.chunks.filter((c) => c.content === 'said');
            for (const chunk of matchingChunks) {
                expect(chunk.matchesQuery).toBe(true);
            }
        }
    });

    test('Chunks not equaling search phrase are marked', async () => {
        const search = testQuery('said');
        const results = await search.getResults();
        for (const result of results) {
            const matchingChunks = result.chunks.filter((c) => c.content !== 'said');
            for (const chunk of matchingChunks) {
                expect(chunk.matchesQuery).toBe(false);
            }
        }
    });

    test('Chunks reconstruct an actual verse', async () => {
        const search = testQuery('said');
        const results = await search.getResults();
        for (const result of results) {
            let text = '';
            for (const chunk of result.chunks) {
                text += chunk.content;
            }
            const matchingVerses = TestVerseProvider.candidates.filter((v) => v.text === text);
            expect(matchingVerses.length).toBe(1);
        }
    });

    test('Strips leading and trailing whitespace', async () => {
        const search = testQuery('  said \t \n');
        const results = await search.getResults();
        expect(results.length).toBeGreaterThan(0);
    });

    test('Matches partial words', async () => {
        const search = testQuery('enealogy');
        const results = await search.getResults();
        expect(results.length).toBeGreaterThan(0);
    });

    test('empty string matches nothing', async () => {
        const search = testQuery('');
        const results = await search.getResults();
        expect(results.length).toBe(0);
    });

    test('space matches nothing', async () => {
        const search = testQuery(' ');
        const results = await search.getResults();
        expect(results.length).toBe(0);
    });
});

describe('Match whole words', () => {
    test('Finds a whole word', async () => {
        const search = testQuery('genealogy', { wholeWords: true });
        const results = await search.getResults();
        expect(results.length).toBeGreaterThan(0);
    });

    test('Does not find partial word', async () => {
        const search = testQuery('enealogy', { wholeWords: true });
        const results = await search.getResults();
        expect(results.length).toBe(0);
    });

    test('Does not highlight partial matches', async () => {
        const search = testQuery('other', { wholeWords: true });
        const results = await search.getResults();
        const result = results.find(
            (r) =>
                r.reference.bookCode === 'XXX' &&
                r.reference.chapter === '1' &&
                r.reference.verses === '1'
        );
        const matching = result.chunks.filter((c) => c.matchesQuery);
        expect(matching.length).toBe(1);
    });

    test('Chunks reconstruct an actual verse', async () => {
        const search = testQuery('said', { wholeWords: true });
        const results = await search.getResults();
        for (const result of results) {
            let text = '';
            for (const chunk of result.chunks) {
                text += chunk.content;
            }
            const matchingVerses = TestVerseProvider.candidates.filter((v) => v.text === text);
            expect(matchingVerses.length).toBe(1);
        }
    });
});

describe('Paginated results', () => {
    describe('Return three verses in two batches', async () => {
        const search = testQuery('Jesus', { wholeWords: true });
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
        const search = testQuery('Jesus', { wholeWords: true });
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

describe('Ignore characters in text', async () => {
    const search = testQuery('Davd', { ignore: 'i' });
    const results = await search.getResults();

    test('Finds match', () => {
        expect(results.length).toBeGreaterThan(0);
    });

    test('Highlights match', () => {
        for (const result of results) {
            expect(result.chunks.some((c) => c.content === 'David' && c.matchesQuery)).toBe(true);
        }
    });
});

describe('Ignore characters in search phrase', async () => {
    const search = testQuery('Daviid', { ignore: 'i' });
    const results = await search.getResults();

    test('Finds match', () => {
        expect(results.length).toBeGreaterThan(0);
    });

    test('Highlights match', () => {
        for (const result of results) {
            expect(result.chunks.some((c) => c.content === 'David' && c.matchesQuery)).toBe(true);
        }
    });
});

describe('Equivalent characters', async () => {
    const search = testQuery('Jesús', { substitute: { u: 'ú', ú: 'u' } });
    const results = await search.getResults();

    test('finds verse', () => {
        expect(results.length).toBeGreaterThan(0);
    });

    test('highlights match', () => {
        for (const result of results) {
            expect(result.chunks.some((c) => c.content === 'Jesus' && c.matchesQuery)).toBe(true);
        }
    });
});

describe('Ignore case', () => {
    test('basic options', async () => {
        const search = testQuery('abraHam', { caseInsensitive: true });
        const results = await search.getResults();
        expect(results.length).toBeGreaterThan(0);
    });

    test('with whole words', async () => {
        const search = testQuery('abraHam', {
            caseInsensitive: true,
            wholeWords: true
        });
        const results = await search.getResults();
        expect(results.length).toBeGreaterThan(0);
    });

    test('with substitution', async () => {
        const search = testQuery('ÁbraHam', {
            caseInsensitive: true,
            wholeWords: true,
            substitute: { a: 'á', á: 'a' }
        });
        const results = await search.getResults();
        expect(results.length).toBeGreaterThan(0);
    });

    test('with substitute and ignore', async () => {
        const search = testQuery('Ábraxam', {
            caseInsensitive: true,
            wholeWords: true,
            substitute: { a: 'á', á: 'a' },
            ignore: 'xh'
        });
        const results = await search.getResults();
        expect(results.length).toBeGreaterThan(0);
    });
});

describe('Ignore case respects locale', () => {
    test('partial words', async () => {
        const search = testQuery('lİfe', {
            caseInsensitive: true,
            locale: 'tr'
        });
        const results = await search.getResults();
        expect(results.length).toBeGreaterThan(0);
    });

    test('whole words', async () => {
        const search = testQuery('lİfe', {
            caseInsensitive: true,
            wholeWords: true,
            locale: 'tr'
        });
        const results = await search.getResults();
        expect(results.length).toBeGreaterThan(0);
    });
});
