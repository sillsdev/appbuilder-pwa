import { expect, test } from 'vitest';
import { SearchSessionBase } from '../use-cases/search-session-base';
import { SearchQuery } from '../use-cases/search-query';
import type { SearchResult } from '../entities';
import type {
    QueryVerseProvider,
    ScriptureRepository,
    SearchOptions
} from '../interfaces/data-interfaces';

const docSet = 'eng_TEST';
const collection = 'TEST';

class TestScriptureRepository implements ScriptureRepository {
    queryVerses(phrase: string, options: SearchOptions): Promise<QueryVerseProvider> {
        throw new Error('Method not implemented.');
    }
}

class TestSearchQuery extends SearchQuery {
    static totalVerses = 40;

    versesLeft = TestSearchQuery.totalVerses;

    async getResults(limit?: number): Promise<SearchResult[]> {
        const emptyResult: SearchResult = {
            chunks: [],
            reference: {
                docSet: '',
                collection: '',
                bookCode: '',
                chapter: '',
                verses: ''
            }
        };
        const nVerses = Math.min(limit, this.versesLeft);
        this.versesLeft -= nVerses;
        this.isComplete = this.versesLeft === 0;
        return Array(nVerses).fill(emptyResult);
    }
}

class TestSearchSession extends SearchSessionBase {
    protected createQuery(phrase: string, options: SearchOptions): SearchQuery {
        return new TestSearchQuery(phrase, options, new TestScriptureRepository());
    }
}

test('submit calls onNewQuery', () => {
    let wasCalled = false;

    const session = new TestSearchSession({
        onNewQuery: () => {
            wasCalled = true;
        },
        onResults: (_) => {}
    });

    session.submit('', { docSet, collection });
    expect(wasCalled).toBe(true);
});

test('after submit, results are returned', async () => {
    const results: SearchResult[][] = [];
    const session = new TestSearchSession({
        onNewQuery: () => {},
        onResults: (r) => {
            results.push(r);
        }
    });
    await session.submit('', { docSet, collection });
    expect(results.length).toBeGreaterThan(0);
});

test('results are returned in batches', async () => {
    const results: SearchResult[][] = [];
    const session = new TestSearchSession({
        onNewQuery: () => {},
        onResults: (r) => {
            results.push(r);
        }
    });
    await session.submit('', { docSet, collection }, 7);

    let i = 0;
    while (i < results.length - 1) {
        expect(results[i].length).toBe(7);
        i++;
    }
    expect(results[i].length).toBeLessThanOrEqual(7);
});

test('returns all results', async () => {
    const results: SearchResult[] = [];
    const session = new TestSearchSession({
        onNewQuery: () => {},
        onResults: (r) => {
            results.push(...r);
        }
    });
    await session.submit('', { docSet, collection });
    expect(results.length).toBe(TestSearchQuery.totalVerses);
});

test('on submit old query is cancelled', async () => {
    let results: SearchResult[] = [];
    const session = new TestSearchSession({
        onNewQuery: () => {
            results = [];
        },
        onResults: (r) => {
            results.push(...r);
        }
    });

    const request1 = session.submit('', { docSet, collection });
    const request2 = session.submit('', { docSet, collection });

    await Promise.all([request1, request2]);
    expect(results.length).toBe(TestSearchQuery.totalVerses);
});
