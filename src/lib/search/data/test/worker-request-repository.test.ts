import type { DocsetUrlRequest } from '$lib/search-worker/data/interfaces/requests';
import { describe, expect, test } from 'vitest';
import { WorkerRequestRepository } from '../repositories/worker-request-repository';
import { isDocsetUrlResponse } from '$lib/search-worker/data/interfaces/responses';
import { isErrorResponse, type MessageRequest } from '$lib/utils/worker-messenger/message';

const testUrlRequest: DocsetUrlRequest = {
    type: 'docset-url-request',
    docSet: 'eng_test'
};

describe('on docSet URL request', () => {
    test('gets url for correct docset', async () => {
        let docset: string;
        const repo = new WorkerRequestRepository((ds) => {
            docset = ds;
            return 'test';
        }, 'www.example.com');

        const handler = repo.requestHandler();
        await handler(testUrlRequest);

        expect(docset).toBe('eng_test');
    });

    test('responds with url', async () => {
        const repo = new WorkerRequestRepository((_) => '/example/test', 'www.example.com');

        const handler = repo.requestHandler();
        const response = await handler(testUrlRequest);

        if (isDocsetUrlResponse(response)) {
            expect(response.url).toBe('/example/test');
        } else {
            throw new Error(`Expected docset url response, but got ${response.type}`);
        }
    });

    test('responds with url base', async () => {
        const repo = new WorkerRequestRepository((_) => '/example/test', 'www.example.com');

        const handler = repo.requestHandler();
        const response = await handler(testUrlRequest);

        if (isDocsetUrlResponse(response)) {
            expect(response.base).toBe('www.example.com');
        } else {
            throw new Error(`Expected docset url response, but got ${response.type}`);
        }
    });
});

test('on unknown request returns error', async () => {
    const repo = new WorkerRequestRepository(() => '', 'www.example.com');
    const handler = repo.requestHandler();
    const request: MessageRequest = { type: 'bogus' };
    const response = await handler(request);
    expect(isErrorResponse(response)).toBe(true);
});
