import type { RequestHandler } from '$lib/utils/worker-messenger/messenger';

/**
 * Constructor arguments for the window-facing component of a search query
 */
export interface ExternalQueryOptions {
    /**
     * The id for the worker's internal search query
     */
    id: number;

    /**
     * Handles any requests from the worker to the window
     */
    outboundHandler: RequestHandler;
}
