import type { Reference } from '$lib/search/domain/entities';
import type { SearchOptions } from '$lib/search/domain/interfaces/data-interfaces';
import type { MessageRequest } from '$lib/utils/worker-messenger/message';
import type { RequestHandler } from '@sveltejs/kit';

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

/**
 * A generic interface for retreiving Scritpture content
 */
export interface ScriptureRepository {
    queryVerses(phrase: string, options: SearchOptions): Promise<QueryVerseProvider>;
}
