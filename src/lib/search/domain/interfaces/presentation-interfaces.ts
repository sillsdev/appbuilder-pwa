import type { SearchResult } from '../entities';

export interface SearchPresenter {
    onResults(results: SearchResult[]): void;
    onNewQuery(): void;
    onQueryDone(): void;
}

/**
 * A collection of options controlled by the user interface
 */
export interface UserSearchOptions {
    collection: string;
    wholeWords: boolean;
    matchAccents: boolean;
}

export interface UserSearchRequest {
    phrase: string;
    options: UserSearchOptions;
}
