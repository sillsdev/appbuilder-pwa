import type { SearchResult } from '../entities';

export interface SearchPresenter {
    onResults(results: SearchResult[]): void;
    onNewQuery(): void;
}

/**
 * A collection of options controlled by the user interface
 */
export interface UserSearchOptions {
    collection: string;
    wholeWords: boolean;
    matchAccents: boolean;

    // Locale really doesn't belong here since it comes from the language store,
    // not the search UI. However, as of 6/21/24, search uses web workers,
    // which can't access local storage. Currently, the language store tries to reference
    // localStorage as soon as it gets imported, even if the store is never used.
    //
    // Consequently, no web worker may touch a module that imports the store, and the
    // locale must be passed in from a Svelte component on the main thread.
    locale: string;
}

export interface UserSearchRequest {
    phrase: string;
    options: UserSearchOptions;
}
