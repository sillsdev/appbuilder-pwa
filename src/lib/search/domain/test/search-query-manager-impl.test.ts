import { expect, test, describe } from 'vitest';
import { SearchQueryManagerImpl } from '../search-query-manager-impl';
import type { SearchResult } from '../entities';
import type {
    SearchQuery,
    SearchStorageData,
    SearchStorageRepository
} from '../interfaces/data-interfaces';
import type { SearchPresenter, UserSearchOptions } from '../interfaces/presentation-interfaces';
import { ConfigRepository } from '$lib/search/data/repositories/config-repository';

const docSet = 'eng_TEST';
const collection = 'TEST';

class TestSearchQuery implements SearchQuery {
    constructor(delay?: number) {
        this.delay = delay ?? 0;
    }

    delay: number;

    isComplete = false;

    static totalVerses = 40;

    versesLeft = TestSearchQuery.totalVerses;

    async getResults(limit?: number): Promise<SearchResult[]> {
        await new Promise((resolve) => setTimeout(resolve, this.delay));
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

interface TestConfigValues {
    searchAccentsDefault?: boolean;
    searchWholeWordsDefault?: boolean;
}

class TestConfig extends ConfigRepository {
    constructor({
        searchAccentsDefault = false,
        searchWholeWordsDefault = false
    }: TestConfigValues = {}) {
        super();
        this.searchAccentsDefault = () => searchAccentsDefault;
        this.searchWholeWordsDefault = () => searchWholeWordsDefault;
    }
}

class TestStorage implements SearchStorageRepository {
    constructor(savedData: SearchStorageData) {
        this.savedData = savedData;
    }

    savedData: SearchStorageData;

    async save(data: SearchStorageData): Promise<void> {
        this.savedData = data;
    }

    async read(): Promise<SearchStorageData> {
        return this.savedData;
    }

    async clear(): Promise<void> {
        this.savedData = null;
    }
}

interface TestOptions {
    queryDelay?: number;
}

function testSearchManager({ queryDelay = 0 }: TestOptions = {}): SearchQueryManagerImpl {
    return new SearchQueryManagerImpl({
        queryGenerator: async (_, __) => new TestSearchQuery(queryDelay)
    });
}

test('after submit, results are returned', async () => {
    const results: SearchResult[][] = [];
    const manager = testSearchManager();
    manager.setOnResults((r) => results.push(r));
    await manager.submit('', { docSet, collection });
    expect(results.length).toBeGreaterThan(0);
});

test('results returned in batches', async () => {
    const results: SearchResult[][] = [];
    const manager = testSearchManager();
    manager.setOnResults((r) => results.push(r));
    await manager.submit('', { docSet, collection }, { batchSize: 7 });

    let i = 0;
    while (i < results.length - 1) {
        expect(results[i].length).toBe(7);
        i++;
    }
    expect(results[i].length).toBeLessThanOrEqual(7);
});

test('returns all results', async () => {
    const results: SearchResult[] = [];
    const manager = testSearchManager();
    manager.setOnResults((r) => results.push(...r));
    await manager.submit('', { docSet, collection });
    expect(results.length).toBe(TestSearchQuery.totalVerses);
});

test('on submit old query is cancelled', async () => {
    let results: SearchResult[] = [];
    const manager = testSearchManager({ queryDelay: 10 });
    manager.setOnNewQuery(() => (results = []));
    manager.setOnResults((r) => results.push(...r));

    const request1 = manager.submit('', { docSet, collection }, { batchSize: 8 });

    await new Promise((resolve) => setTimeout(resolve, 30));

    const request2 = manager.submit('', { docSet, collection });

    await Promise.all([request1, request2]);
    expect(results.length).toBe(TestSearchQuery.totalVerses);
});

test('limit results', async () => {
    const results: SearchResult[] = [];
    const manager = testSearchManager();
    manager.setOnResults((r) => results.push(...r));
    const limit = TestSearchQuery.totalVerses - 1;
    await manager.submit('', { docSet, collection }, { limit });
    expect(results.length).toBe(limit);
});
