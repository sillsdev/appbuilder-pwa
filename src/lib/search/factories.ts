import { fetchDocSet } from '$lib/data/scripture';

import { ConfigRepository } from './data/repositories/config-repository';
import { ProskommaSearchWorkerRepository } from './data/repositories/pk-search-worker-repository';
import { ScriptureRepositoryImpl } from './data/repositories/scripture-repository-impl';
import { SearchConfigRepositoryImpl } from './data/repositories/search-config-repository-impl';
import { SearchWorkerImpl } from './data/worker/search-worker-impl';
import type {
    ScriptureRepository,
    SearchConfigRepository
} from './domain/interfaces/data-interfaces';
import type { SearchPresenter } from './domain/interfaces/presentation-interfaces';
import { SearchConfig } from './domain/use-cases/search-config';
import { SearchSession } from './domain/use-cases/search-session';

function docSetFetcher() {
    return (docSet: string) => fetchDocSet(docSet, fetch);
}

function makeScriptureRepository(): ScriptureRepository {
    const worker = new SearchWorkerImpl();
    const pk = new ProskommaSearchWorkerRepository(worker, docSetFetcher());
    return new ScriptureRepositoryImpl(pk);
}

export function makeSearchSession(presenter: SearchPresenter): SearchSession {
    return new SearchSession(presenter, makeScriptureRepository());
}

function makeSearchConfigRepository(): SearchConfigRepository {
    return new SearchConfigRepositoryImpl(new ConfigRepository());
}

export function makeSearchConfig() {
    return new SearchConfig(makeSearchConfigRepository());
}
