import type { SearchResult } from '$lib/search/domain/entities';
import type {
    QueryGenerator,
    SearchOptions,
    SearchQuery
} from '$lib/search/domain/interfaces/data-interfaces';
import { expect, test } from 'vitest';
import type { NewQueryRequest, ResultsRequest } from '../interfaces/requests';
import { SearchSessionInternal } from '../search-session-internal';
import {
    isNewQueryResponse,
    isResultsResponse,
    type NewQueryResponse
} from '../interfaces/responses';
import { describe } from 'node:test';

const testResult: SearchResult = {
    reference: {
        docSet: 'eng_test',
        collection: 'test',
        bookCode: 'ABC',
        chapter: '4',
        verses: '1'
    },
    chunks: [
        {
            content: 'hello world',
            matchesQuery: true
        }
    ]
};

const testSearchResults: SearchResult[] = [testResult, testResult, testResult, testResult];

class TestSearchQuery implements SearchQuery {
    constructor(markComplete: boolean = false) {
        this.markComplete = markComplete;
    }

    lastLimit: number;
    markComplete: boolean;
    isComplete: boolean;

    async getResults(limit?: number): Promise<SearchResult[]> {
        this.lastLimit = limit;
        this.isComplete = this.markComplete;
        return testSearchResults;
    }
}

const testNewQueryRequest: NewQueryRequest = {
    type: 'new-query-request',
    phrase: 'hello world',
    options: {
        docSet: 'eng_test',
        collection: 'test'
    }
};

function makeResultsRequest(queryId: number, limit?: number): ResultsRequest {
    return {
        type: 'results-request',
        queryId,
        limit
    };
}

const testQueryGenerator: QueryGenerator = async (_) => new TestSearchQuery();

describe('on new query request', () => {
    test('creates new query on request', async () => {
        let queryCreated = false;

        const queryGenerator = async () => {
            queryCreated = true;
            return new TestSearchQuery();
        };

        const session = new SearchSessionInternal(queryGenerator);
        await session.onRequest(testNewQueryRequest);

        expect(queryCreated).toBe(true);
    });

    test('new query has correct phrase', async () => {
        let phrase: string;

        const queryGenerator: QueryGenerator = async (p) => {
            phrase = p;
            return new TestSearchQuery();
        };

        const session = new SearchSessionInternal(queryGenerator);
        await session.onRequest(testNewQueryRequest);

        expect(phrase).toBe(testNewQueryRequest.phrase);
    });

    test('new query has correct options', async () => {
        let options: SearchOptions;

        const queryGenerator: QueryGenerator = async (_, o) => {
            options = o;
            return new TestSearchQuery();
        };

        const session = new SearchSessionInternal(queryGenerator);
        await session.onRequest(testNewQueryRequest);

        expect(options).toEqual(testNewQueryRequest.options);
    });

    test('sends correct response type', async () => {
        const session = new SearchSessionInternal(testQueryGenerator);
        const response = await session.onRequest(testNewQueryRequest);
        expect(isNewQueryResponse(response)).toBe(true);
    });

    test('returns unique queryID', async () => {
        const session = new SearchSessionInternal(testQueryGenerator);
        const response1 = await session.onRequest(testNewQueryRequest);
        const response2 = await session.onRequest(testNewQueryRequest);

        if (isNewQueryResponse(response1) && isNewQueryResponse(response2)) {
            expect(response1.queryId === response2.queryId).toBe(false);
        } else
            throw new Error(
                `expected new query responses, but got types '${response1.type}' and ${response2.type}`
            );
    });
});

describe('on results request', () => {
    test('if query is not running, returns no results', async () => {
        const session = new SearchSessionInternal(testQueryGenerator);
        const response = await session.onRequest(makeResultsRequest(100));

        if (isResultsResponse(response)) {
            expect(response.results).toEqual([]);
        } else {
            throw new Error(`Expected results response, but got reponse type ${response.type}`);
        }
    });

    test('returns results', async () => {
        const session = new SearchSessionInternal(testQueryGenerator);
        const queryData = (await session.onRequest(testNewQueryRequest)) as NewQueryResponse;
        const resultsData = await session.onRequest(makeResultsRequest(queryData.queryId));

        if (isResultsResponse(resultsData)) {
            expect(resultsData.results).toEqual(testSearchResults);
        } else {
            throw new Error(`Expected results response, but got reponse type ${resultsData.type}`);
        }
    });

    test('queryDone is false if query is not done', async () => {
        const session = new SearchSessionInternal(testQueryGenerator);
        const queryData = (await session.onRequest(testNewQueryRequest)) as NewQueryResponse;
        const resultsData = await session.onRequest(makeResultsRequest(queryData.queryId));

        if (isResultsResponse(resultsData)) {
            expect(resultsData.queryDone).toBe(false);
        } else {
            throw new Error(`Expected results response, but got reponse type ${resultsData.type}`);
        }
    });

    test('queryDone is true if query is done', async () => {
        const queryGenerator = async () => new TestSearchQuery(true);
        const session = new SearchSessionInternal(queryGenerator);
        const queryData = (await session.onRequest(testNewQueryRequest)) as NewQueryResponse;
        const resultsData = await session.onRequest(makeResultsRequest(queryData.queryId));

        if (isResultsResponse(resultsData)) {
            expect(resultsData.queryDone).toBe(true);
        } else {
            throw new Error(`Expected results response, but got reponse type ${resultsData.type}`);
        }
    });

    test('passes limit to query', async () => {
        let query: TestSearchQuery;

        const queryGenerator = async () => {
            query = new TestSearchQuery();
            return query;
        };

        const session = new SearchSessionInternal(queryGenerator);
        const queryData = (await session.onRequest(testNewQueryRequest)) as NewQueryResponse;
        const resultsData = await session.onRequest(makeResultsRequest(queryData.queryId, 43));

        if (isResultsResponse(resultsData)) {
            expect(query.lastLimit).toBe(43);
        } else {
            throw new Error(`Expected results response, but got reponse type ${resultsData.type}`);
        }
    });
});
