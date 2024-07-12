import type { SearchResult } from '../entities';
import type { SearchOptions } from './data-interfaces';
import type { UserSearchOptions } from './presentation-interfaces';

/**
 * Options for how search results should be returned
 */
export interface SearchResultOptions {
    batchSize?: number;
    limit?: number;
}

/**
 * Creates and interacts with search queries
 */
export interface SearchQueryManager {
    setOnResults(callback: (results: SearchResult[]) => void): void;
    setOnNewQuery(callback: () => void): void;
    submit(
        phrase: string,
        options: SearchOptions,
        resultOptions: SearchResultOptions
    ): Promise<void>;
}

export type SearchConfigManager = (options: UserSearchOptions) => SearchOptions;
