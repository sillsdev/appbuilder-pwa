import type { MessageRequest, MessageResponse } from '$lib/utils/worker-messenger/message';
import type { RequestHandler } from '$lib/utils/worker-messenger/messenger';
import { expect, test } from 'vitest';
import { SearchQueryExternal } from '../search-query-external';
import type { SearchResult } from '$lib/search/domain/entities';
import { isResultsRequest, type ResultsRequest } from '../interfaces/requests';
import type { ResultsResponse } from '../interfaces/responses';

class TestMessenger {
    lastSentRequest: MessageRequest;

    outboundHandler(respondWith: MessageResponse): RequestHandler {
        return async (request) => {
            this.lastSentRequest = request;
            return respondWith;
        };
    }
}

const testResult: SearchResult = {
    reference: {
        docSet: 'eng_test',
        collection: 'test',
        bookCode: 'TEST',
        chapter: '4',
        verses: '5'
    },
    chunks: [
        {
            content: 'hello world',
            matchesQuery: true
        }
    ]
};

const validResponse: ResultsResponse = {
    type: 'results-response',
    results: [testResult],
    queryDone: false
};

const validDoneResponse: ResultsResponse = {
    type: 'results-response',
    results: [testResult],
    queryDone: true
};

const invalidResponse: MessageResponse = {
    type: 'bogus'
};

test('sends result request', async () => {
    const messenger = new TestMessenger();
    const outboundHandler = messenger.outboundHandler(validResponse);
    const query = new SearchQueryExternal({ id: 56, outboundHandler });
    await query.getResults();
    const sent = messenger.lastSentRequest;
    expect(isResultsRequest(sent)).toBe(true);
});

test('request includes limit', async () => {
    const messenger = new TestMessenger();
    const outboundHandler = messenger.outboundHandler(validResponse);
    const query = new SearchQueryExternal({ id: 4, outboundHandler });
    await query.getResults(12);
    const sent = messenger.lastSentRequest as ResultsRequest;
    expect(sent.limit).toBe(12);
});

test('request includes query id', async () => {
    const messenger = new TestMessenger();
    const outboundHandler = messenger.outboundHandler(validResponse);
    const query = new SearchQueryExternal({ id: 6, outboundHandler });
    await query.getResults();
    const sent = messenger.lastSentRequest as ResultsRequest;
    expect(sent.queryId).toBe(6);
});

test('isComplete when response indicates', async () => {
    const messenger = new TestMessenger();
    const outboundHandler = messenger.outboundHandler(validDoneResponse);
    const query = new SearchQueryExternal({ id: 1, outboundHandler });
    await query.getResults(12);
    expect(query.isComplete).toBe(true);
});

test('is not complete until response indicates', async () => {
    const messenger = new TestMessenger();
    const outboundHandler = messenger.outboundHandler(validResponse);
    const query = new SearchQueryExternal({ id: 1, outboundHandler });
    await query.getResults();
    expect(query.isComplete).toBe(false);
});

test('throws error on invalid response', () => {
    const messenger = new TestMessenger();
    const outboundHandler = messenger.outboundHandler(invalidResponse);
    const query = new SearchQueryExternal({ id: 4, outboundHandler });
    expect(() => query.getResults()).rejects.toThrow(invalidResponse.type);
});
