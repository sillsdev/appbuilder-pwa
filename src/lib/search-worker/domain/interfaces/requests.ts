import type { SearchOptions } from '$lib/search/domain/interfaces/data-interfaces';
import type { MessageRequest } from '$lib/utils/worker-messenger/message';

// Type definitions for Messenger requests

export interface NewQueryRequest extends MessageRequest {
    type: 'new-query-request';
    phrase: string;
    options: SearchOptions;
}

export function isNewQueryRequest(request: MessageRequest): request is NewQueryRequest {
    return request.type === 'new-query-request';
}

export interface ResultsRequest extends MessageRequest {
    type: 'results-request';
    queryId: number;
    limit?: number;
}

export function isResultsRequest(request: MessageRequest): request is ResultsRequest {
    return request.type === 'results-request';
}
