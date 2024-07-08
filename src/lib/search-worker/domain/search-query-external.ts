import type { SearchResult } from '$lib/search/domain/entities';
import type { SearchQuery } from '$lib/search/domain/interfaces/data-interfaces';
import type { MessageResponse } from '$lib/utils/worker-messenger/message';
import type { RequestHandler } from '$lib/utils/worker-messenger/messenger';
import type { ExternalQueryOptions } from './interfaces/domain-interfaces';
import type { ResultsRequest } from './interfaces/requests';
import { isResultsResponse } from './interfaces/responses';

/**
 * Forwards search results from the worker to the window
 */
export class SearchQueryExternal implements SearchQuery {
    constructor({ id, outboundHandler }: ExternalQueryOptions) {
        this.queryId = id;
        this.outboundHandler = outboundHandler;
    }

    isComplete: boolean; // Whether all search results have been returned
    queryId: number; // The ID of the worker's query object

    protected outboundHandler: RequestHandler;

    async getResults(limit?: number): Promise<SearchResult[]> {
        const request: ResultsRequest = {
            type: 'results-request',
            limit: limit,
            queryId: this.queryId
        };
        const response = await this.outboundHandler(request);
        return this.parseResponse(response);
    }

    private parseResponse(response: MessageResponse): SearchResult[] {
        if (isResultsResponse(response)) {
            this.isComplete = response.queryDone;
            return response.results;
        }
        throw new Error(
            `Search query returned invalid message of type ${response.type}: ${response}`
        );
    }
}
