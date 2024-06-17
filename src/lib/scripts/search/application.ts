import type { Reference, SearchResult, SearchResultChunk } from './entities';
import { BufferedReader } from './utils/buffered-reader';
import { makeRegex } from './utils/regex-helpers';

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
abstract class VerseProvider {
    constructor(searchPhrase: string, options: SearchOptions) {}

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
    abstract getVerses(limit: number): Promise<SearchCandidate[]>;
}

/**
 * A wrapper around search-related base classes.
 *
 * This was done to put generic-sounding classes like `VerseProvider`
 * into a namepsace to avoid confusion.
 */
export const SearchInterface = { VerseProvider };

export interface SearchOptions {
    wholeWords?: boolean;
    ignore?: string;
    substitute?: { [char: string]: string };
    caseInsensitive?: boolean;
}

// Finds verses that match the given search parameters.
export abstract class SearchQueryBase {
    constructor(searchPhrase: string, verseProvider: VerseProvider, options: SearchOptions) {
        this.searchPhrase = searchPhrase.trim();
        this.verseProvider = verseProvider;
        this.options = options;
    }

    verseProvider: VerseProvider;
    searchPhrase: string;
    options: SearchOptions;

    // Whether all search results have been returned.
    isComplete: boolean = false;

    private resultsReader = new BufferedReader({
        read: (limit: number) => this.getOneBatch(limit),
        done: () => this.isComplete
    });

    async getResults(limit: number = 0): Promise<SearchResult[]> {
        if (this.searchPhrase.trim() === '') {
            return [];
        }
        return this.resultsReader.read(limit);
    }

    private async getOneBatch(limit: number): Promise<SearchResult[]> {
        const verses = await this.verseProvider.getVerses(limit);

        if (verses.length === 0) {
            // No more verses to search.
            this.isComplete = true;
            return [];
        }

        return verses
            .map((v) => ({
                reference: v.reference,
                chunks: this.splitChunks(v.text)
            }))
            .filter((v) => v.chunks.some((c) => c.matchesQuery));
    }

    private splitChunks(text: string): SearchResultChunk[] {
        const chunks = this.options?.wholeWords
            ? this.splitWordChunks(text)
            : this.splitCharChunks(text);
        return chunks;
    }

    private getWordIndices(text: string) {
        const wordRegex = /[\p{L}\p{N}]+/gu;
        const starts = [];
        const stops = [];
        for (const word of text.matchAll(wordRegex)) {
            starts.push(word.index);
            stops.push(word.index + word[0].length);
        }
        return { starts, stops };
    }

    private indexWordMatches(text: string, regex: RegExp): number[] {
        const wordIndex = this.getWordIndices(text);
        const matches: number[] = [];
        for (const match of text.matchAll(new RegExp(regex, 'g'))) {
            const start = match.index;
            const stop = match.index + match[0].length;
            if (wordIndex.starts.includes(start) && wordIndex.stops.includes(stop)) {
                matches.push(start, stop);
            }
        }
        return matches;
    }

    private chunksByIndex(text: string, index: number[]): SearchResultChunk[] {
        const chunks: SearchResultChunk[] = [];
        let i = 0;
        let isMatch = false;
        for (const j of index) {
            chunks.push({
                content: text.slice(i, j),
                matchesQuery: isMatch
            });
            isMatch = !isMatch;
            i = j;
        }
        chunks.push({
            content: text.slice(i),
            matchesQuery: isMatch
        });
        return chunks;
    }

    private splitWordChunks(text: string) {
        const regex = makeRegex(this.searchPhrase, {
            substitute: this.options?.substitute,
            ignore: this.options?.ignore
        });
        const matches = this.indexWordMatches(text, regex);
        return this.chunksByIndex(text, matches);
    }

    private splitCharChunks(text: string) {
        const regex = makeRegex(this.searchPhrase, {
            ignore: this.options?.ignore,
            substitute: this.options?.substitute,
            capture: true
        });
        const chunks = text
            .split(regex)
            .filter((part) => part)
            .map((part) => {
                return {
                    content: part,
                    matchesQuery: regex.test(part)
                };
            });
        return chunks;
    }
}
