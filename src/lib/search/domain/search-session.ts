import type { QueryGenerator, SearchOptions, SearchQuery } from './interfaces/data-interfaces';
import type { SearchPresenter } from './interfaces/presentation-interfaces';

export class SearchSession {
    constructor(presenter: SearchPresenter, queryGenerator: QueryGenerator) {
        this.presenter = presenter;
        this.createQuery = queryGenerator;
    }

    presenter: SearchPresenter;
    createQuery: QueryGenerator;

    private queryID = 0;

    async submit(phrase: string, options: SearchOptions, batchSize: number = 10) {
        this.queryID++;
        const queryID = this.queryID;

        const query = await this.createQuery(phrase, options);
        this.presenter.onNewQuery();

        while (!query.isComplete) {
            const results = await query.getResults(batchSize);

            // Cancel if another query comes in before this one completes.
            if (queryID != this.queryID) break;
            this.presenter.onResults(results);
        }
        this.presenter.onQueryDone();
    }
}
