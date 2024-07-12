import type { SearchResult } from '../entities';
import type { UserSearchOptions } from './presentation-interfaces';

export interface SearchOptions {
    docSet: string;
    collection: string;
    wholeWords?: boolean;
    ignore?: string;
    substitute?: { [char: string]: string };
    caseInsensitive?: boolean;
    locale?: string;
}

export interface SearchQuery {
    // Whether the query has returned all results
    isComplete: boolean;

    getResults(limit?: number): Promise<SearchResult[]>;
}

export type QueryGenerator = (phrase: string, options: SearchOptions) => Promise<SearchQuery>;

/**
 * Maps characters that may be substituted during a search
 */
export type SubstitutionMap = { [char: string]: string };

/**
 * Interface for getting search configuration data
 */
export interface SearchConfigRepository {
    /**
     * Get a string of characters to ignore in a search.
     */
    searchIgnore(): string;

    /**
     * Get substitutions that may be peformed during a search.
     */
    searchSubtitute(): SubstitutionMap;

    collectionToDocSet(collection: string): string;

    /**
     * The current UI language as a BCP 47 code
     */
    userLanguage(): string;
}

export interface SearchStorageData {
    phrase: string;
    options: UserSearchOptions;
    results: SearchResult[];
}

/**
 * Save search query results in persistent storage
 */
export interface SearchStorageRepository {
    save(data: SearchStorageData): Promise<void>;
    read(): Promise<SearchStorageData>;
}
