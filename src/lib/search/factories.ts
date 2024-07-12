import { makeSearchQueryGenerator } from '$lib/search-worker/factories';
import { ConfigRepository } from './data/repositories/config-repository';
import { SearchConfigRepositoryImpl } from './data/repositories/search-config-repository-impl';
import { SearchStorageRepositoryImpl } from './data/repositories/search-storage-repository-impl';
import { SearchConfigManagerImpl } from './domain/search-config-manager-impl';
import type { SearchPresenter } from './domain/interfaces/presentation-interfaces';
import { SearchQueryManagerImpl } from './domain/search-query-manager-impl';
import { SearchSession } from './domain/search-session';

export function makeSearchSession(presenter: SearchPresenter): SearchSession {
    const config = new ConfigRepository();
    const searchConfig = new SearchConfigRepositoryImpl(config);
    const configManager = new SearchConfigManagerImpl(searchConfig);

    const queryGenerator = makeSearchQueryGenerator();

    return new SearchSession({
        presenter,
        config,
        configureOptions: (options) => configManager.configureOptions(options),
        queryManager: new SearchQueryManagerImpl({ queryGenerator }),
        storage: new SearchStorageRepositoryImpl()
    });
}
