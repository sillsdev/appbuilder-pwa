import type { SearchResult } from '$lib/search/domain/entities';
import type { MessageResponse } from '$lib/utils/worker-messenger/message';

// Type definitions for Messenger responses

export interface NewQueryResponse extends MessageResponse {
    type: 'new-query-response';
    queryId: number;
}

export function isNewQueryResponse(response: MessageResponse): response is NewQueryResponse {
    return response.type === 'new-query-response';
}

export interface ResultsResponse extends MessageResponse {
    type: 'results-response';
    results: SearchResult[];
    queryDone: boolean;
}

export function isResultsResponse(response: MessageResponse): response is ResultsResponse {
    return response.type === 'results-response';
}
