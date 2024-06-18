import type { W } from 'vitest/dist/reporters-rzC174PQ';
import type { Reference } from '../entities';

export interface SearchOptions {
    docSet: string;
    collection: string;
    wholeWords?: boolean;
    ignore?: string;
    substitute?: { [char: string]: string };
    caseInsensitive?: boolean;
    locale?: string;
}

/**
 * Represents a verse that might match the search query.
 */
export interface SearchCandidate {
    reference: Reference;
    text: string;
}

/**
 * Queries a database for verses that might match a search query.
 */
export interface QueryVerseProvider {
    /**
     * Get a list of verses that could match the search query
     *
     * Subsequent calls return a new list of verses.
     *
     * @param limit The maximum number of verses to return. A
     * non-positive limit will return all candidate verses at once.
     * @returns A list of verses, or an emtpy list if no candidate
     * verses remain.
     */
    getVerses(limit: number): Promise<SearchCandidate[]>;
}

export interface ScriptureRepository {
    queryVerses(phrase: string, options: SearchOptions): Promise<QueryVerseProvider>;
}

/**
 * Maps characters that may be substituted during a search
 */
export type SubstitutionMap = { [char: string]: string };

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

    userLocale(): string;
}
