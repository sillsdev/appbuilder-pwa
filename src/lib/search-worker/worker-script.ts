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

async function openDatabase() {
    const SQL = await initSqlJs({
        locateFile: (file) => `/wasm/sql-wasm.wasm`
    });

    const response = await fetch(`/data.sqlite`);
    const buffer = await response.arrayBuffer();
    const db = new SQL.Database(new Uint8Array(buffer));
    
    console.log('Database loaded successfully');
    return db;
}

async function searchDictionary(phrase: string, options: SearchOptions) {
    const db = await openDatabase();

    const column = options.accentsAndTones ? 'word' : 'word_no_accents';
    
    const searchPattern = options.wholeWords ? ` ${phrase} ` : `%${phrase}%`;

    const results = db.exec(`SELECT locations FROM search_words WHERE ${column} LIKE ?`, [searchPattern]);

    if (!results.length || !results[0].values.length) {
        return [];
    }

    // Extract and process locations from the query result
    const locations = results[0].values[0][0].split(' ').map(loc => {
        const [id, weight] = loc.split('(').map(v => v.replace(')', ''));
        return { id: parseInt(id, 10), weight: parseInt(weight, 10) };
    });

    // Sort results by weight in descending order
    return locations.sort((a, b) => b.weight - a.weight);
}

async function makeQuery(phrase: string, options: SearchOptions): Promise<SearchQuery> {

    const dictionaryResults = await searchDictionary(phrase, options);
    const scriptureRepo = makeScriptureRepository();
    const scriptureResults = await scriptureRepo.queryVerses(phrase, options);
    return new SearchQueryInternal(phrase, options, scriptureRepo);
}

const session = new SearchSessionInternal(makeQuery);
messenger.setInboundHandler(session.getRequestHandler());