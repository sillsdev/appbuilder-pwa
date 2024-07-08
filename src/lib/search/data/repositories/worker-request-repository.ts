import {
    isDocsetUrlRequest,
    type DocsetUrlRequest
} from '$lib/search-worker/data/interfaces/requests';
import type { DocsetUrlResponse } from '$lib/search-worker/data/interfaces/responses';
import type {
    ErrorResponse,
    MessageRequest,
    MessageResponse
} from '$lib/utils/worker-messenger/message';
import type { RequestHandler } from '$lib/utils/worker-messenger/messenger';

/**
 * Handles any requests from the web worker
 */
export class WorkerRequestRepository {
    constructor(getDocSetUrl: (docSet: string) => string, baseURI: string) {
        this.getDocSetUrl = getDocSetUrl;
        this.baseURI = baseURI;
    }

    getDocSetUrl: (docSet: string) => string;
    baseURI: string;

    /**
     * Get a function that will handle requests from the worker
     */
    requestHandler(): RequestHandler {
        return (request) => this.onRequest(request);
    }

    private async onRequest(request: MessageRequest): Promise<MessageResponse> {
        if (isDocsetUrlRequest(request)) {
            return this.onDocsetUrlRequest(request);
        }
        return this.onUnknownRequest(request);
    }

    private onDocsetUrlRequest(request: DocsetUrlRequest) {
        const url = this.getDocSetUrl(request.docSet);
        const response: DocsetUrlResponse = {
            type: 'docset-url',
            url,
            base: this.baseURI
        };
        return response;
    }

    private onUnknownRequest(request: MessageRequest) {
        const response: ErrorResponse = {
            type: 'error',
            message: `Unrecognized worker request: ${request.type}`
        };
        return response;
    }
}
