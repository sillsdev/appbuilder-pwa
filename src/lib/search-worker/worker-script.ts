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

import initSqlJs from 'sql.js';

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

async function searchDictionary(phrase: string, options: SearchOptions) {
    const db = await openDatabase('/data.sqlite');

    // Determine which column to search (with or without accents)
    const column = options.matchAccents ? 'word' : 'word_no_accents';

    let query = `SELECT locations FROM search_words WHERE ${column} LIKE ?`;
    let searchPattern = options.wholeWords ? ` ${phrase} ` : `%${phrase}%`;

    const results = await db.get(query, [searchPattern]);

    if (!results) {
        return [];
    }
 // Parse and sort locations by weight
 const locations = results.locations.split(' ').map(loc => {
    const [id, weight] = loc.split('(').map(v => v.replace(')', ''));
    return { id: parseInt(id, 10), weight: parseInt(weight, 10) };
});

return locations.sort((a, b) => b.weight - a.weight); // Sort by weight (descending)
}

async function makeQuery(phrase: string, options: SearchOptions): Promise<SearchQuery> {
    const dictionaryResults = await searchDictionary(phrase, options);
    const scritpureRepo = makeScriptureRepository();
    return new SearchQueryInternal(phrase, options, scritpureRepo);
    return new SearchQueryInternal(phrase, options, [...dictionaryResults, ...scriptureResults]);
}

const session = new SearchSessionInternal(makeQuery);
messenger.setInboundHandler(session.getRequestHandler());
