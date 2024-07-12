import type { SearchResult } from './entities';
import type { QueryGenerator, SearchOptions, SearchQuery } from './interfaces/data-interfaces';
import type { SearchQueryManager, SearchResultOptions } from './interfaces/domain-interfaces';

interface SearchQueryManagerOptions {
    queryGenerator: QueryGenerator;
}

/**
 * Creates and interacts with search queries
 */
export class SearchQueryManagerImpl implements SearchQueryManager {
    constructor({ queryGenerator }: SearchQueryManagerOptions) {
        this.createQuery = queryGenerator;
    }
    private createQuery: QueryGenerator;

    private onResults: (results: SearchResult[]) => void;
    private onNewQuery: () => void;

    private queryID = 0;

    setOnResults(callback: (results: SearchResult[]) => void) {
        this.onResults = callback;
    }

    setOnNewQuery(callback: () => void): void {
        this.onNewQuery = callback;
    }

    async submit(
        phrase: string,
        options: SearchOptions,
        { batchSize = 10, limit = Infinity }: SearchResultOptions = {}
    ) {
        this.queryID++;
        const queryID = this.queryID;

        if (this.onNewQuery) this.onNewQuery();

        const query = await this.createQuery(phrase, options);
        await this.runQuery(query, queryID, { batchSize, limit });
    }

    private async runQuery(
        query: SearchQuery,
        id: number,
        { batchSize, limit }: SearchResultOptions
    ) {
        let nResults = 0;
        while (!query.isComplete && nResults < limit) {
            let results = await query.getResults(batchSize);

            if (nResults + results.length > limit) {
                results = results.slice(0, limit - nResults);
            }

            // Cancel if another query comes in before this one completes.
            if (id != this.queryID) break;
            if (this.onResults) this.onResults(results);

            nResults += results.length;
        }
    }
}
