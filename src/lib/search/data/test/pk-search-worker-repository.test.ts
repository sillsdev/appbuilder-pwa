import { describe, expect, test, vi } from 'vitest';
import {
    ProskommaSearchWorkerRepository,
    type BookQuery,
    type SearchWorkerRequest,
    type SearchWorkerResponse,
    type TokenQuery
} from '../repositories/pk-search-worker-repository';
import type { SearchWorker } from '../interfaces/search-worker';
import type { SearchOptions } from '$lib/search/domain/interfaces/data-interfaces';
import type { GQLBlockToken, GQLBookId } from '../interfaces/pk-search-repository';

const testBook: GQLBookId = {
    id: 'abc123',
    idParts: {
        type: 'book'
    },
    bookCode: 'eng_test'
};

const testToken: GQLBlockToken = {
    scopes: ['scope1', 'scope2'],
    payload: 'hello'
};

function getTestResponse(request: SearchWorkerRequest): SearchWorkerResponse {
    if (request.type === 'load') {
        return {
            requestId: request.id,
            type: 'load-complete'
        };
    } else if (request.type === 'book-query') {
        return {
            requestId: request.id,
            type: 'books',
            data: [testBook]
        };
    } else if (request.type === 'token-query') {
        return {
            requestId: request.id,
            type: 'tokens',
            data: [testToken]
        };
    }
}

class TestSearchWorker implements SearchWorker {
    onResponse: (response: SearchWorkerResponse) => void;

    post(request: SearchWorkerRequest, transfer: Transferable[]): void {
        let response = getTestResponse(request);
        this.onResponse(response);
    }
}

class SlowSearchWorker implements SearchWorker {
    onResponse: (response: SearchWorkerResponse) => void;

    waiting: (() => void)[] = [];

    post(request: SearchWorkerRequest, transfer: Transferable[]): void {
        const response: SearchWorkerResponse = {
            requestId: request.id,
            type: 'load-complete'
        };
        const resolve = () => this.onResponse(response);
        this.waiting.push(resolve);
    }

    resolveNext() {
        if (this.waiting.length) {
            const resolve = this.waiting.shift();
            resolve();
        }
    }
}

async function testFetchDocSet(docSet: string): Promise<Uint8Array> {
    return new Uint8Array([1, 2, 3, 4, 5]);
}

describe('ensureLoaded', () => {
    test('adds missing docSet to list', async () => {
        const worker = new TestSearchWorker();
        const repo = new ProskommaSearchWorkerRepository(worker, testFetchDocSet);
        await repo.ensureLoaded('test');
        expect(repo.docSets).toContain('test');
    });

    test('does not add to list twice', async () => {
        const worker = new TestSearchWorker();
        const repo = new ProskommaSearchWorkerRepository(worker, testFetchDocSet);
        await repo.ensureLoaded('test');
        await repo.ensureLoaded('test');
        expect(repo.docSets.length).toBe(1);
    });

    test('if not loaded fetches docSet', async () => {
        let docSet: string;
        async function mockFetch(ds: string) {
            docSet = ds;
            return await testFetchDocSet(ds);
        }

        const worker = new TestSearchWorker();
        const repo = new ProskommaSearchWorkerRepository(worker, mockFetch);
        await repo.ensureLoaded('test');
        expect(docSet).toBe('test');
    });

    describe('if not loaded calls worker', () => {
        test('with corect request type', async () => {
            const worker = new TestSearchWorker();

            let request: SearchWorkerRequest;
            let transfer: Transferable[];

            vi.spyOn(worker, 'post').mockImplementationOnce((r, t) => {
                request = r;
                transfer = t;
                return worker.post(r, t);
            });

            const repo = new ProskommaSearchWorkerRepository(worker, testFetchDocSet);
            await repo.ensureLoaded('test');
            expect(request.type).toBe('load');
        });

        test('with fetched docset data', async () => {
            const worker = new TestSearchWorker();

            let request: SearchWorkerRequest;
            let transfer: Transferable[];

            vi.spyOn(worker, 'post').mockImplementationOnce((r, t) => {
                request = r;
                transfer = t;
                return worker.post(r, t);
            });

            const repo = new ProskommaSearchWorkerRepository(worker, testFetchDocSet);
            await repo.ensureLoaded('test');
            const dataArray = request.data as Uint8Array;
            expect(dataArray).toEqual(new Uint8Array([1, 2, 3, 4, 5]));
        });

        test('with a unique request id', async () => {
            const worker = new TestSearchWorker();
            const requests: SearchWorkerRequest[] = [];

            vi.spyOn(worker, 'post').mockImplementation((r, t) => {
                requests.push(r);
                const response: SearchWorkerResponse = {
                    requestId: r.id,
                    type: 'load-complete'
                };
                worker.onResponse(response);
            });

            const repo = new ProskommaSearchWorkerRepository(worker, testFetchDocSet);
            await repo.ensureLoaded('test1');
            await repo.ensureLoaded('test2');
            expect(requests[0].id == requests[1].id).toBe(false);
        });
    });

    test('does not resolve until worker response', async () => {
        const worker = new SlowSearchWorker();
        const repo = new ProskommaSearchWorkerRepository(worker, testFetchDocSet);

        let doneLoading = false;

        async function doLoading() {
            await repo.ensureLoaded('test');
            doneLoading = true;
        }

        async function doTest() {
            for (let i = 0; i < 10; i++) {
                if (worker.waiting.length) break;
                await new Promise((resolve) => setTimeout(resolve, 0));
            }
            expect(worker.waiting.length).toBe(1);

            expect(doneLoading).toBe(false);
            worker.resolveNext();

            for (let i = 0; i < 10; i++) {
                if (doneLoading) break;
                await new Promise((resolve) => setTimeout(resolve, 0));
            }
            expect(doneLoading).toBe(true);
        }

        await Promise.all([doLoading(), doTest()]);
    });

    test('disposes of pending request after use', async () => {
        const worker = new TestSearchWorker();
        const repo = new ProskommaSearchWorkerRepository(worker, testFetchDocSet);
        await repo.ensureLoaded('test1');
        await repo.ensureLoaded('test2');
        await repo.ensureLoaded('test3');
        const keys = repo.pendingRequests.keys();
        expect(Array.from(keys)).toEqual([]);
    });

    test('if response has wrong ID throws reasonable error', () => {
        class BadWorker implements SearchWorker {
            onResponse: (response: SearchWorkerResponse) => void;
            post(request: SearchWorkerRequest, transfer?: Transferable[]): void {
                const response: SearchWorkerResponse = {
                    requestId: request.id + 1,
                    type: 'load-complete'
                };
                this.onResponse(response);
            }
        }

        const worker = new BadWorker();
        const repo = new ProskommaSearchWorkerRepository(worker, testFetchDocSet);
        expect(async () => await repo.ensureLoaded('test')).rejects.toThrow(/search/);
    });
});

describe('queryBooks', () => {
    test('calls ensureLoaded first', async () => {
        const worker = new TestSearchWorker();
        const repo = new ProskommaSearchWorkerRepository(worker, testFetchDocSet);

        let loadedDocSet: string;
        const spy = vi.spyOn(repo, 'ensureLoaded').mockImplementationOnce(async (ds) => {
            loadedDocSet = ds;
        });

        const options: SearchOptions = {
            docSet: 'test',
            collection: ''
        };
        await repo.queryBooks('mary', options);
        expect(loadedDocSet).toBe('test');
    });

    test('submits worker request', async () => {
        let submitted = false;

        const phrase = 'mary';
        const options: SearchOptions = {
            docSet: 'test',
            collection: ''
        };

        class MyWorker implements SearchWorker {
            onResponse: (response: SearchWorkerResponse) => void;
            post(request: SearchWorkerRequest, transfer?: Transferable[]): void {
                if (request.type === 'book-query') {
                    const data = request.data as BookQuery;
                    submitted = data.phrase === phrase && data.options == options;
                }
                const response = getTestResponse(request);
                this.onResponse(response);
            }
        }

        const worker = new MyWorker();
        const repo = new ProskommaSearchWorkerRepository(worker, testFetchDocSet);

        await repo.queryBooks(phrase, options);
        expect(submitted).toBe(true);
    });

    test('returns books', async () => {
        const worker = new TestSearchWorker();
        const repo = new ProskommaSearchWorkerRepository(worker, testFetchDocSet);
        const options: SearchOptions = { docSet: '', collection: '' };
        const books = await repo.queryBooks('test', options);
        expect(books).toEqual([testBook]);
    });
});

describe('queryTokens', () => {
    test('calls ensureLoaded first', async () => {
        const worker = new TestSearchWorker();
        const repo = new ProskommaSearchWorkerRepository(worker, testFetchDocSet);

        let loadedDocSet: string;
        const spy = vi.spyOn(repo, 'ensureLoaded').mockImplementationOnce(async (ds) => {
            loadedDocSet = ds;
        });

        const options: SearchOptions = {
            docSet: 'test',
            collection: ''
        };
        await repo.queryTokens('mary', 'abc1234', options);
        expect(loadedDocSet).toBe('test');
    });

    test('submits worker request', async () => {
        let submitted = false;

        const phrase = 'mary';
        const bookId = 'xyz';
        const options: SearchOptions = {
            docSet: 'test',
            collection: ''
        };

        class MyWorker implements SearchWorker {
            onResponse: (response: SearchWorkerResponse) => void;
            post(request: SearchWorkerRequest, transfer?: Transferable[]): void {
                if (request.type === 'token-query') {
                    const data = request.data as TokenQuery;
                    submitted =
                        data.phrase === phrase && data.bookId === bookId && data.options == options;
                }
                const response = getTestResponse(request);
                this.onResponse(response);
            }
        }

        const worker = new MyWorker();
        const repo = new ProskommaSearchWorkerRepository(worker, testFetchDocSet);

        await repo.queryTokens(phrase, bookId, options);
        expect(submitted).toBe(true);
    });

    test('returns tokens', async () => {
        const worker = new TestSearchWorker();
        const repo = new ProskommaSearchWorkerRepository(worker, testFetchDocSet);
        const options: SearchOptions = { docSet: '', collection: '' };
        const books = await repo.queryTokens('test', '183', options);
        expect(books).toEqual([testToken]);
    });
});
