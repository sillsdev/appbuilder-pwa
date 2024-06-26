import { getDocSetUrl } from '$lib/data/scripture';

import { WorkerRequestRepository } from '$lib/search/data/repositories/worker-request-repository';
import type { QueryGenerator } from '$lib/search/domain/interfaces/data-interfaces';
import type { Message } from '$lib/utils/worker-messenger/message';
import type { MessageIO } from '$lib/utils/worker-messenger/messenger';
import { SearchQueryExternal } from './domain/search-query-external';
import { SearchSessionExternal } from './domain/search-session-external';

const worker = new Worker(new URL('./worker-script.ts', import.meta.url), { type: 'module' });

const messageIO: MessageIO = {
    postMessage: function (message: Message): void {
        worker.postMessage(message);
    },

    setOnMessage: function (handler: (event: MessageEvent<Message>) => void): void {
        worker.onmessage = handler;
    }
};

export function makeSearchQueryGenerator(): QueryGenerator {
    const windowRepository = new WorkerRequestRepository(getDocSetUrl, document.baseURI);
    const session = new SearchSessionExternal(
        messageIO,
        (options) => new SearchQueryExternal(options),
        windowRepository.requestHandler()
    );
    return (phrase, options) => session.createQuery(phrase, options);
}
