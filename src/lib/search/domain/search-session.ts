import type { ConfigRepository } from '../data/repositories/config-repository';
import type { SearchResult } from './entities';
import type { SearchStorageRepository } from './interfaces/data-interfaces';
import type { SearchConfigManager, SearchQueryManager } from './interfaces/domain-interfaces';
import type { SearchPresenter, UserSearchOptions } from './interfaces/presentation-interfaces';

interface SearchSessionOptions {
    presenter: SearchPresenter;
    config: ConfigRepository;
    configureOptions: SearchConfigManager;
    queryManager: SearchQueryManager;
    storage: SearchStorageRepository;
}

/**
 * Responds directly to search requests from the user
 */
export class SearchSession {
    constructor({
        presenter,
        config,
        configureOptions,
        queryManager,
        storage
    }: SearchSessionOptions) {
        this.presenter = presenter;
        this.config = config;
        this.configureOptions = configureOptions;
        this.queryManager = queryManager;
        this.storage = storage;

        queryManager.setOnResults((results) => this.onResults(results));
        queryManager.setOnNewQuery(() => presenter.onNewQuery());

        presenter.setOptions('', {
            wholeWords: config.searchWholeWordsDefault(),
            matchAccents: config.searchAccentsDefault(),
            collection: ''
        });
    }

    presenter: SearchPresenter;
    config: ConfigRepository;
    configureOptions: SearchConfigManager;
    queryManager: SearchQueryManager;
    storage: SearchStorageRepository;

    private results: SearchResult[];

    onResults(results: SearchResult[]) {
        this.results.push(...results);
        this.presenter.onResults(results);
    }

    async submit(phrase: string, options: UserSearchOptions) {
        this.results = [];
        await this.queryManager.submit(phrase, this.configureOptions(options), {
            batchSize: 1,
            limit: 1000
        });
        const results = this.results;
        this.storage.save({
            phrase,
            options,
            results
        });
        this.presenter.onQueryDone();
    }

    /**
     * Retreive saved search results
     */
    async loadLastQuery() {
        const data = await this.storage.read();
        if (data) {
            this.presenter.setOptions(data.phrase, data.options);
            this.presenter.onResults(data?.results ?? []);
        }
    }
}
