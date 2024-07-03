import type {
    QueryGenerator,
    SearchOptions,
    SearchQuery
} from '$lib/search/domain/interfaces/data-interfaces';
import {
    Messenger,
    type MessageIO,
    type RequestHandler
} from '$lib/utils/worker-messenger/messenger';
import type { ExternalQueryOptions } from './interfaces/domain-interfaces';
import type { NewQueryRequest } from './interfaces/requests';
import { isNewQueryResponse } from './interfaces/responses';

export class SearchSessionExternal {
    constructor(
        messageIO: MessageIO,
        queryGenerator: (options: ExternalQueryOptions) => SearchQuery,
        windowRepository: RequestHandler
    ) {
        this.messenger = new Messenger(messageIO, {
            inboundHandler: windowRepository,
            timeout: null
        });
        this.queryGenerator = queryGenerator;
    }

    messenger: Messenger;

    // Generates a SearchQuery from custom parameters
    queryGenerator: (options: ExternalQueryOptions) => SearchQuery;

    createQuery: QueryGenerator = async (phrase, options) => {
        const id = await this.requestNewQuery(phrase, options);
        const outboundHandler = this.messenger.outboundHandler();
        return this.queryGenerator({ id, outboundHandler });
    };

    private async requestNewQuery(phrase: string, options: SearchOptions): Promise<number> {
        const request: NewQueryRequest = {
            type: 'new-query-request',
            phrase,
            options
        };
        const response = await this.messenger.postRequest(request);
        if (isNewQueryResponse(response)) {
            return response.queryId;
        }
        throw new Error(`Upexpected response type for request ${request.type}: ${response.type}`);
    }
}
