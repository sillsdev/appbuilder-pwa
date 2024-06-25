import type { SearchOptions } from '$lib/search/domain/interfaces/data-interfaces';
import type {
    GQLBlockToken,
    GQLBookId,
    ProskommaSearchRepository
} from '../interfaces/pk-search-repository';
import type { SearchWorker } from '../interfaces/search-worker';

type SearchWorkerRequestType = 'load' | 'book-query' | 'token-query';

export interface SearchWorkerRequest {
    id: number;
    type: SearchWorkerRequestType;
    data: object;
}

export interface SearchWorkerResponse {
    requestId: number;
    type: 'load-complete' | 'books' | 'tokens';
    data?: any;
}

export interface BookQuery {
    phrase: string;
    options: SearchOptions;
}

export interface TokenQuery {
    phrase: string;
    bookId: string;
    options: SearchOptions;
}

export class ProskommaSearchWorkerRepository implements ProskommaSearchRepository {
    constructor(worker: SearchWorker, docSetFetcher: (docSet: string) => Promise<Uint8Array>) {
        this.worker = worker;
        this.worker.onResponse = (r) => this.handleResponse(r);
        this.fetchDocSet = docSetFetcher;
    }

    docSets: string[] = [];
    worker: SearchWorker;
    fetchDocSet: (docSet: string) => Promise<Uint8Array>;

    pendingRequests = new Map<number, (result?: any) => void>();
    lastRequest = 0;

    handleResponse(response: SearchWorkerResponse) {
        const id = response.requestId;
        if (!this.pendingRequests.has(id)) {
            throw new Error(`No callback to handle response for search request ${id}`);
        }
        const resolve = this.pendingRequests.get(id);
        resolve(response.data);
        this.pendingRequests.delete(id);
    }

    async queryBooks(phrase: string, options: SearchOptions): Promise<GQLBookId[]> {
        await this.ensureLoaded(options.docSet);
        const books = await this.submitRequest('book-query', { phrase, options });
        return books;
    }

    async queryTokens(
        phrase: string,
        bookId: string,
        options: SearchOptions
    ): Promise<GQLBlockToken[]> {
        await this.ensureLoaded(options.docSet);
        const tokens = await this.submitRequest('token-query', { phrase, options, bookId });
        return tokens;
    }

    async ensureLoaded(docSet: string) {
        if (!this.docSets.includes(docSet)) {
            const data = await this.fetchDocSet(docSet);
            await this.submitRequest('load', data);
            this.docSets.push(docSet);
        }
    }

    async submitRequest(type: SearchWorkerRequestType, data: object): Promise<any> {
        const id = ++this.lastRequest;
        const request: SearchWorkerRequest = { id, type, data };
        return await new Promise((resolve) => {
            this.pendingRequests.set(id, resolve);
            this.worker.post(request);
        });
    }
}
