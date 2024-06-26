import { thaw } from '$lib/scripts/thaw';
import type {
    QueryGenerator,
    SearchOptions,
    SearchQuery
} from '$lib/search/domain/interfaces/data-interfaces';
import type { Message } from '$lib/utils/worker-messenger/message';
import { Messenger, type MessageIO } from '$lib/utils/worker-messenger/messenger';
import { ProskommaSearchRepositoryImpl } from './data/repositories/pk-search-repository-impl';
import { ProksommaWorkerSearchRepository } from './data/repositories/pk-worker-search-repository';
import { ScriptureRepositoryImpl } from './data/repositories/scripture-repository-impl';
import type { ScriptureRepository } from './domain/interfaces/data-interfaces';
import { SearchQueryInternal } from './domain/search-query-internal';
import { SearchSessionInternal } from './domain/search-session-internal';

const messageIO: MessageIO = {
    postMessage: function (message: Message): void {
        self.postMessage(message);
    },

    setOnMessage: function (handler: (event: MessageEvent<Message>) => void): void {
        self.onmessage = handler;
    }
};

const messenger = new Messenger(messageIO);

function makeScriptureRepository(): ScriptureRepository {
    const pk = new ProksommaWorkerSearchRepository({
        outboundHandler: messenger.outboundHandler(),
        fetch: (url: any) => fetch(url),
        getImplementation: (pk) => new ProskommaSearchRepositoryImpl(pk, thaw)
    });
    return new ScriptureRepositoryImpl(pk);
}

async function makeQuery(phrase: string, options: SearchOptions): Promise<SearchQuery> {
    const scritpureRepo = makeScriptureRepository();
    return new SearchQueryInternal(phrase, options, scritpureRepo);
}

const session = new SearchSessionInternal(makeQuery);
messenger.setInboundHandler(session.getRequestHandler());
