import { ConfigRepository } from './data/repositories/config-repository';
import { ScriptureRepositoryImpl } from './data/repositories/scripture-repository-impl';
import { SearchConfigRepositoryImpl } from './data/repositories/search-config-repository-impl';
import type { SearchPresenter } from './domain/interfaces/presentation-interfaces';
import { SearchConfig } from './domain/use-cases/search-config';
import { SearchSession } from './domain/use-cases/search-session';

export function makeSearchSession(presenter: SearchPresenter): SearchSession {
    return new SearchSession(presenter, new ScriptureRepositoryImpl());
}

function makeSearchConfigRepository() {
    return new SearchConfigRepositoryImpl(new ConfigRepository());
}

export function makeSearchConfig() {
    return new SearchConfig(makeSearchConfigRepository());
}
