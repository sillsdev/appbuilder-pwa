import type { RequestHandler } from '$lib/utils/worker-messenger/messenger';

export interface ExternalQueryOptions {
    id: number;
    outboundHandler: RequestHandler;
}
