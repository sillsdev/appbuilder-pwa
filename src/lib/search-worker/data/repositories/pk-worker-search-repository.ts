import { SABProskomma } from '$lib/sab-proskomma';
import type { SearchOptions } from '$lib/search/domain/interfaces/data-interfaces';
import type { RequestHandler } from '$lib/utils/worker-messenger/messenger';
import type {
    GQLBlockToken,
    GQLBookId,
    ProskommaSearchRepository
} from '../interfaces/pk-search-repository';
import type { DocsetUrlRequest } from '../interfaces/requests';
import { isDocsetUrlResponse } from '../interfaces/responses';

type CustomFetch = typeof fetch;

interface Dependencies {
    fetch: CustomFetch;
    getImplementation: (pk: SABProskomma) => ProskommaSearchRepository;

    /**
     * Sends message requests to the window and retrieves a response
     */
    outboundHandler: RequestHandler;
}

/**
 * A special implementation of Proskomma search functions for web workers
 *
 * The main reason for this class is to retrieve necessary data from the window.
 *
 * For example, technical limitations make it difficult for the worker to construct
 * the URL for a frozen docset file, so it must request it from the window instead.
 */
export class ProksommaWorkerSearchRepository implements ProskommaSearchRepository {
    constructor({ outboundHandler, fetch, getImplementation }: Dependencies) {
        this.requestHandler = outboundHandler;
        this.fetch = fetch;
        this.pk = new SABProskomma();
        this.repo = getImplementation(this.pk);
    }

    repo: ProskommaSearchRepository;
    requestHandler: RequestHandler;
    fetch: CustomFetch;

    pk: SABProskomma;

    docSets: string[] = [];

    loadDocSet(data: ArrayBuffer): Promise<void> {
        return this.repo.loadDocSet(data);
    }

    async queryBooks(phrase: string, options: SearchOptions): Promise<GQLBookId[]> {
        await this.ensureLoaded(options.docSet);
        return this.repo.queryBooks(phrase, options);
    }

    async queryTokens(
        phrase: string,
        bookId: string,
        options: SearchOptions
    ): Promise<GQLBlockToken[]> {
        await this.ensureLoaded(options.docSet);
        return this.repo.queryTokens(phrase, bookId, options);
    }

    async ensureLoaded(docSet: string) {
        if (!this.docSets.includes(docSet)) {
            const url = await this.getDocsetUrl(docSet);
            const data = await this.fetch(url);
            const buffer = await data.arrayBuffer();
            await this.repo.loadDocSet(buffer);
            this.docSets.push(docSet);
        }
    }

    private async getDocsetUrl(docSet: string): Promise<URL> {
        const request: DocsetUrlRequest = {
            type: 'docset-url-request',
            docSet
        };
        const response = await this.requestHandler(request);
        if (isDocsetUrlResponse(response)) {
            return new URL(response.url, response.base);
        } else {
            throw new Error(`Unexpected response type for docset url: ${response.type}`);
        }
    }
}
