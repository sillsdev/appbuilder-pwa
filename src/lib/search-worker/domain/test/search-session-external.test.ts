import type { SearchResult } from '$lib/search/domain/entities';
import type { SearchOptions, SearchQuery } from '$lib/search/domain/interfaces/data-interfaces';
import type { MessageIO, RequestHandler } from '$lib/utils/worker-messenger/messenger';
import { describe, expect, test, vi } from 'vitest';
import type { ExternalQueryOptions } from '../interfaces/domain-interfaces';
import { SearchSessionExternal } from '../search-session-external';
import { isNewQueryRequest, type NewQueryRequest } from '../interfaces/requests';
import type { NewQueryResponse } from '../interfaces/responses';
import type { Message, MessageResponse } from '$lib/utils/worker-messenger/message';

const testMessageRequest: MessageResponse = {
    type: 'test-request'
};

const testMessageResponse: MessageResponse = {
    type: 'test-response'
};

function testResponseEvent(outgoing: Message, response?: MessageResponse) {
    response ??= testMessageResponse;
    const responseMessage: Message = {
        transactionId: outgoing.transactionId,
        type: 'response',
        payload: response
    };
    return new MessageEvent('message', { data: responseMessage });
}

class TestMessageIO implements MessageIO {
    constructor(autoResponse?: MessageResponse) {
        this.autoResponse = autoResponse;
    }

    autoResponse: MessageResponse;
    lastPosted: Message;

    postMessage(message: Message) {
        this.lastPosted = message;
        if (message.type === 'request') {
            // Simulate an incoming message in response to our request
            const event = testResponseEvent(message, this.autoResponse);
            this.onMessage(event);
        }
    }

    onMessage: (event: MessageEvent<Message>) => void;

    setOnMessage(handler: (event: MessageEvent<Message>) => void): void {
        this.onMessage = handler;
    }
}

const testNewQueryResponse: NewQueryResponse = {
    type: 'new-query-response',
    queryId: 73
};

const testInvalidResponse: MessageResponse = {
    type: 'bonkers'
};

class TestSearchQuery implements SearchQuery {
    isComplete: boolean;

    getResults(limit?: number): Promise<SearchResult[]> {
        throw new Error('Method not implemented.');
    }
}

class TestExternalQueryGenerator {
    latestOptions: ExternalQueryOptions;

    createQuery(options: ExternalQueryOptions) {
        this.latestOptions = this.latestOptions;
        return new TestSearchQuery();
    }
}

const testSearchOptions: SearchOptions = {
    docSet: 'eng_Test',
    collection: 'test'
};

interface SessionArgs {
    messageIO?: MessageIO;
    queryGenerator?: (options: ExternalQueryOptions) => SearchQuery;
    windowRepository?: RequestHandler;
}

function getTestSearchSession({ messageIO, queryGenerator, windowRepository }: SessionArgs) {
    messageIO ??= new TestMessageIO(testNewQueryResponse);
    const generator = new TestExternalQueryGenerator();
    queryGenerator ??= (options) => generator.createQuery(options);
    windowRepository ??= async (request) => ({ type: 'test-response' });
    return new SearchSessionExternal(messageIO, queryGenerator, windowRepository);
}

describe('createQuery', () => {
    test('sends new query request', () => {
        const io = new TestMessageIO(testNewQueryResponse);
        const session = getTestSearchSession({ messageIO: io });
        session.createQuery('hello', testSearchOptions);
        const sent = io.lastPosted.payload;
        expect(isNewQueryRequest(sent)).toBe(true);
    });

    test('query request has correct properties', () => {
        const io = new TestMessageIO(testNewQueryResponse);
        const session = getTestSearchSession({ messageIO: io });
        session.createQuery('hello', testSearchOptions);
        const sent = io.lastPosted.payload;

        const expectedRequest: NewQueryRequest = {
            type: 'new-query-request',
            phrase: 'hello',
            options: testSearchOptions
        };

        expect(sent).toEqual(expectedRequest);
    });

    test('search query has correct id', async () => {
        const generator = new TestExternalQueryGenerator();

        let queryId: number;

        const session = getTestSearchSession({
            queryGenerator: (options) => {
                queryId = options.id;
                return generator.createQuery(options);
            }
        });
        await session.createQuery('hello', testSearchOptions);

        expect(queryId).toBe(testNewQueryResponse.queryId);
    });

    test('search query has correct outbound request handler', async () => {
        const generator = new TestExternalQueryGenerator();

        let outboundHandler: RequestHandler;

        const session = getTestSearchSession({
            queryGenerator: (options) => {
                outboundHandler = options.outboundHandler;
                return generator.createQuery(options);
            }
        });
        await session.createQuery('hello', testSearchOptions);

        // See if we get default response for our fake MessageIO
        const response = await outboundHandler(testMessageRequest);
        expect(response).toEqual(testNewQueryResponse);
    });

    test('throw error on invalid response', () => {
        const io = new TestMessageIO(testInvalidResponse);
        const session = getTestSearchSession({ messageIO: io });
        expect(() => session.createQuery('hello', testSearchOptions)).rejects.toThrow(
            testInvalidResponse.type
        );
    });
});
