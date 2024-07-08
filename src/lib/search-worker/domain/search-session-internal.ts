import type { SearchResult } from '$lib/search/domain/entities';
import type { QueryGenerator, SearchQuery } from '$lib/search/domain/interfaces/data-interfaces';
import type {
    ErrorResponse,
    MessageRequest,
    MessageResponse
} from '$lib/utils/worker-messenger/message';
import type { Messenger, MessageIO, RequestHandler } from '$lib/utils/worker-messenger/messenger';
import {
    isNewQueryRequest,
    isResultsRequest,
    type NewQueryRequest,
    type ResultsRequest
} from './interfaces/requests';
import type { NewQueryResponse, ResultsResponse } from './interfaces/responses';

/**
 * Creates and runs search queries in response to the window
 *
 * This class runs within the web worker.
 */
export class SearchSessionInternal {
    constructor(queryGenerator: QueryGenerator) {
        this.createQuery = queryGenerator;
    }

    createQuery: QueryGenerator;

    currentQueryID = -1;
    currentQuery: SearchQuery;

    getRequestHandler(): RequestHandler {
        return (request) => this.onRequest(request);
    }

    async onRequest(request: MessageRequest): Promise<MessageResponse> {
        if (isNewQueryRequest(request)) {
            return this.onNewQueryRequest(request);
        } else if (isResultsRequest(request)) {
            return this.onResultsRequest(request);
        }
    }

    private async onNewQueryRequest(request: NewQueryRequest): Promise<NewQueryResponse> {
        this.currentQuery = await this.createQuery(request.phrase, request.options);
        const response: NewQueryResponse = {
            type: 'new-query-response',
            queryId: ++this.currentQueryID
        };
        return response;
    }

    private async onResultsRequest(request: ResultsRequest): Promise<MessageResponse> {
        let results: SearchResult[] = [];
        if (request.queryId === this.currentQueryID) {
            results = await this.currentQuery.getResults(request.limit);
        }
        const response: ResultsResponse = {
            type: 'results-response',
            results: results,
            queryDone: this.currentQuery?.isComplete ?? true
        };
        return response;
    }
}
