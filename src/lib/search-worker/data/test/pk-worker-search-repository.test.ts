import type { SearchOptions } from '$lib/search/domain/interfaces/data-interfaces';
import { describe, expect, test, vi } from 'vitest';
import type {
    GQLBlockToken,
    GQLBookId,
    ProskommaSearchRepository
} from '../interfaces/pk-search-repository';
import { ProksommaWorkerSearchRepository } from '../repositories/pk-worker-search-repository';
import type { MessageRequest, MessageResponse } from '$lib/utils/worker-messenger/message';
import type { RequestHandler } from '$lib/utils/worker-messenger/messenger';
import type { DocsetUrlResponse } from '../interfaces/responses';
import type { SABProskomma } from '$lib/sab-proskomma';
import { isDocsetUrlRequest } from '../interfaces/requests';

const testSearchOptions: SearchOptions = {
    docSet: 'test',
    collection: 'test'
};

const testBookId: GQLBookId = {
    id: '19072',
    idParts: {
        type: 'book'
    },
    bookCode: 'ABC'
};

const testToken: GQLBlockToken = {
    scopes: ['scope1', 'scope2'],
    payload: 'hello'
};

class TestSearchRepository implements ProskommaSearchRepository {
    lastLoaded: ArrayBuffer;

    nDocSets = 0;

    async loadDocSet(data: ArrayBuffer): Promise<void> {
        await new Promise((resolve) => setTimeout(resolve, 10));
        this.nDocSets++;
        this.lastLoaded = data;
    }

    async queryBooks(phrase: string, options: SearchOptions): Promise<GQLBookId[]> {
        return [testBookId];
    }

    async queryTokens(
        phrase: string,
        bookId: string,
        options: SearchOptions
    ): Promise<GQLBlockToken[]> {
        return [testToken];
    }
}

class TestRequestHandler {
    constructor(respondWith: MessageResponse) {
        this.respondWith = respondWith;
    }

    lastRequest: MessageRequest;
    respondWith: MessageResponse;

    onRequest: RequestHandler = async (request) => {
        this.lastRequest = request;
        return this.respondWith;
    };
}

const testUrlResponse: DocsetUrlResponse = {
    type: 'docset-url',
    url: '/static/example',
    base: 'http://www.example.com'
};

describe('ensureLoaded', () => {
    test('requests URL for docset', async () => {
        const getImplementation = (pk: SABProskomma) => new TestSearchRepository();
        const fetch = async (_) => new Response('abc');
        const requestHandler = new TestRequestHandler(testUrlResponse);

        const repo = new ProksommaWorkerSearchRepository({
            outboundHandler: (r) => requestHandler.onRequest(r),
            fetch,
            getImplementation
        });

        await repo.ensureLoaded('test');

        const request = requestHandler.lastRequest;
        if (isDocsetUrlRequest(request)) {
            expect(request.docSet).toBe('test');
        } else {
            throw new Error(`Epxected docset Url request, but got request type ${request.type}`);
        }
    });

    test('fetches docSet if not loaded', async () => {
        let lastFetched: URL;

        const fetch = async (url: URL) => {
            lastFetched = url;
            return new Response('abc');
        };

        const getImplementation = (pk: SABProskomma) => new TestSearchRepository();
        const requestHandler = new TestRequestHandler(testUrlResponse);

        const repo = new ProksommaWorkerSearchRepository({
            outboundHandler: (r) => requestHandler.onRequest(r),
            fetch,
            getImplementation
        });

        await repo.ensureLoaded('test');
        expect(lastFetched).toEqual(new URL(testUrlResponse.url, testUrlResponse.base));
    });

    test('thaws docset', async () => {
        let searchRepo: TestSearchRepository;

        const getImplementation = (pk: SABProskomma) => {
            searchRepo = new TestSearchRepository();
            return searchRepo;
        };
        const fetch = async (_) => new Response('abc');
        const requestHandler = new TestRequestHandler(testUrlResponse);

        const repo = new ProksommaWorkerSearchRepository({
            outboundHandler: (r) => requestHandler.onRequest(r),
            fetch,
            getImplementation
        });

        await repo.ensureLoaded('test');

        const decoder = new TextDecoder('utf-8');
        expect(decoder.decode(searchRepo.lastLoaded)).toBe('abc');
    });

    test('throws error if window returns invalid url response', () => {
        const getImplementation = (pk: SABProskomma) => new TestSearchRepository();
        const fetch = async (_) => new Response('abc');
        const requestHandler = new TestRequestHandler({ type: 'bogus' });

        const repo = new ProksommaWorkerSearchRepository({
            outboundHandler: (r) => requestHandler.onRequest(r),
            fetch,
            getImplementation
        });

        expect(async () => repo.ensureLoaded('test')).rejects.toThrow('bogus');
    });

    test('loads each docset once', async () => {
        let searchRepo: TestSearchRepository;

        const getImplementation = (pk: SABProskomma) => {
            searchRepo = new TestSearchRepository();
            return searchRepo;
        };
        const fetch = async (_) => new Response('abc');
        const requestHandler = new TestRequestHandler(testUrlResponse);

        const repo = new ProksommaWorkerSearchRepository({
            outboundHandler: (r) => requestHandler.onRequest(r),
            fetch,
            getImplementation
        });

        await repo.ensureLoaded('test');
        await repo.ensureLoaded('test');
        await repo.ensureLoaded('test');
        await repo.ensureLoaded('test2');
        await repo.ensureLoaded('test2');

        expect(searchRepo.nDocSets).toBe(2);
    });
});

describe('queryBooks', () => {
    test('calls ensureLoaded', async () => {
        const getImplementation = (pk: SABProskomma) => new TestSearchRepository();
        const fetch = async (_) => new Response('abc');
        const requestHandler = new TestRequestHandler(testUrlResponse);

        const repo = new ProksommaWorkerSearchRepository({
            outboundHandler: (r) => requestHandler.onRequest(r),
            fetch,
            getImplementation
        });

        let loaded: string;
        const spy = vi.spyOn(repo, 'ensureLoaded').mockImplementationOnce(async (s) => {
            await new Promise((resolve) => setTimeout(resolve, 10));
            loaded = s;
        });

        await repo.queryBooks('hello world', testSearchOptions);
        expect(loaded).toBe('test');
    });

    test('returns books', async () => {
        const getImplementation = (pk: SABProskomma) => new TestSearchRepository();
        const fetch = async (_) => new Response('abc');
        const requestHandler = new TestRequestHandler(testUrlResponse);

        const repo = new ProksommaWorkerSearchRepository({
            outboundHandler: (r) => requestHandler.onRequest(r),
            fetch,
            getImplementation
        });

        const books = await repo.queryBooks('hello world', testSearchOptions);
        expect(books).toEqual([testBookId]);
    });
});

describe('queryTokens', () => {
    test('calls ensureLoaded', async () => {
        const getImplementation = (pk: SABProskomma) => new TestSearchRepository();
        const fetch = async (_) => new Response('abc');
        const requestHandler = new TestRequestHandler(testUrlResponse);

        const repo = new ProksommaWorkerSearchRepository({
            outboundHandler: (r) => requestHandler.onRequest(r),
            fetch,
            getImplementation
        });

        let loaded: string;
        const spy = vi.spyOn(repo, 'ensureLoaded').mockImplementationOnce(async (s) => {
            await new Promise((resolve) => setTimeout(resolve, 10));
            loaded = s;
        });

        await repo.queryTokens('hello world', 'abc', testSearchOptions);
        expect(loaded).toBe('test');
    });

    test('returns books', async () => {
        const getImplementation = (pk: SABProskomma) => new TestSearchRepository();
        const fetch = async (_) => new Response('abc');
        const requestHandler = new TestRequestHandler(testUrlResponse);

        const repo = new ProksommaWorkerSearchRepository({
            outboundHandler: (r) => requestHandler.onRequest(r),
            fetch,
            getImplementation
        });

        const tokens = await repo.queryTokens('hello world', 'abc', testSearchOptions);
        expect(tokens).toEqual([testToken]);
    });
});

test('loadDocSet calls internal repo', async () => {
    let searchRepo: TestSearchRepository;

    const getImplementation = (pk: SABProskomma) => {
        searchRepo = new TestSearchRepository();
        return searchRepo;
    };
    const fetch = async (_) => new Response('abc');
    const requestHandler = new TestRequestHandler(testUrlResponse);

    const repo = new ProksommaWorkerSearchRepository({
        outboundHandler: (r) => requestHandler.onRequest(r),
        fetch,
        getImplementation
    });

    await repo.loadDocSet(new ArrayBuffer(3));
    expect(searchRepo.nDocSets).toBe(1);
});
