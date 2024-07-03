import { expect, test } from 'vitest';
import { SearchSession } from '../search-session';
import type { SearchResult } from '../entities';
import type { SearchQuery } from '../interfaces/data-interfaces';
import type { SearchPresenter } from '../interfaces/presentation-interfaces';

const docSet = 'eng_TEST';
const collection = 'TEST';

class TestSearchQuery implements SearchQuery {
    isComplete = false;

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

function testSearchSession(presenter: SearchPresenter): SearchSession {
    return new SearchSession(presenter, async (_, __) => new TestSearchQuery());
}

test('submit calls onNewQuery', async () => {
    let wasCalled = false;

    const session = testSearchSession({
        onNewQuery: () => {
            wasCalled = true;
        },
        onResults: (_) => {},
        onQueryDone: () => {}
    });

    await session.submit('', { docSet, collection });
    expect(wasCalled).toBe(true);
});

test('after submit, results are returned', async () => {
    const results: SearchResult[][] = [];
    const session = testSearchSession({
        onNewQuery: () => {},
        onQueryDone: () => {},
        onResults: (r) => {
            results.push(r);
        }
    });
    await session.submit('', { docSet, collection });
    expect(results.length).toBeGreaterThan(0);
});

test('results are returned in batches', async () => {
    const results: SearchResult[][] = [];
    const session = testSearchSession({
        onNewQuery: () => {},
        onQueryDone: () => {},
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
    const session = testSearchSession({
        onNewQuery: () => {},
        onQueryDone: () => {},
        onResults: (r) => {
            results.push(...r);
        }
    });
    await session.submit('', { docSet, collection });
    expect(results.length).toBe(TestSearchQuery.totalVerses);
});

test('calls queryDone after all results', async () => {
    const results: SearchResult[] = [];
    let queryDone: boolean;
    const session = testSearchSession({
        onNewQuery: () => {},
        onQueryDone: () => {
            expect(results.length).toBe(TestSearchQuery.totalVerses);
            queryDone = true;
        },
        onResults: (r) => {
            results.push(...r);
        }
    });
    await session.submit('', { docSet, collection });
    expect(queryDone).toBe(true);
});

test('on submit old query is cancelled', async () => {
    let results: SearchResult[] = [];
    const session = testSearchSession({
        onNewQuery: () => {
            results = [];
        },
        onQueryDone: () => {},
        onResults: (r) => {
            results.push(...r);
        }
    });

    const request1 = session.submit('', { docSet, collection });
    const request2 = session.submit('', { docSet, collection });

    await Promise.all([request1, request2]);
    expect(results.length).toBe(TestSearchQuery.totalVerses);
});
