import type { SearchOptions } from '../interfaces/data-interfaces';
import type { SearchPresenter } from '../interfaces/presentation-interfaces';
import type { SearchQuery } from './search-query';

export abstract class SearchSessionBase {
    constructor(presenter: SearchPresenter) {
        this.presenter = presenter;
    }

    presenter: SearchPresenter;

    private queryID = 0;

    async submit(phrase: string, options: SearchOptions, batchSize: number = 10) {
        this.queryID++;
        const queryID = this.queryID;

        const query = this.createQuery(phrase, options);
        this.presenter.onNewQuery();

        while (!query.isComplete) {
            const results = await query.getResults(batchSize);

            // Cancel if another query comes in before this one completes.
            if (queryID != this.queryID) break;
            this.presenter.onResults(results);
        }
    }

    protected abstract createQuery(phrase: string, options: SearchOptions): SearchQuery;
}
