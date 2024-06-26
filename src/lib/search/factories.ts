import { makeSearchQueryGenerator } from '$lib/search-worker/factories';
import { ConfigRepository } from './data/repositories/config-repository';
import { SearchConfigRepositoryImpl } from './data/repositories/search-config-repository-impl';
import { ConfigureSearch } from './domain/configure-search';
import type { SearchPresenter } from './domain/interfaces/presentation-interfaces';
import { SearchSession } from './domain/search-session';

export function makeSearchSession(presenter: SearchPresenter): SearchSession {
    const queryGenerator = makeSearchQueryGenerator();
    return new SearchSession(presenter, queryGenerator);
}

export function makeSearchConfigManager() {
    const config = new ConfigRepository();
    const repo = new SearchConfigRepositoryImpl(config);
    return new ConfigureSearch(repo);
}
