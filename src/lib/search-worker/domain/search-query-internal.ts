import type { SearchResult, SearchResultChunk } from '$lib/search/domain/entities';
import type { SearchOptions, SearchQuery } from '$lib/search/domain/interfaces/data-interfaces';
import { BufferedReader } from '../utils/buffered-reader';
import { makeRegex } from '../utils/regex-helpers';
import type { QueryVerseProvider, ScriptureRepository } from './interfaces/data-interfaces';

/**
 * Find search results that match the given criteria
 *
 * The query retrieves a list of "candidate verses" from a
 * ScriptureRepository and filters them appropriately
 * (for example, not all candidates may contain every search word).
 */
export class SearchQueryInternal implements SearchQuery {
    constructor(
        searchPhrase: string,
        options: SearchOptions,
        scriptureRepository: ScriptureRepository
    ) {
        this.searchPhrase = searchPhrase.trim();
        this.options = options;
        this.locale = options.locale;
        this.scriptureRepository = scriptureRepository;
    }

    scriptureRepository: ScriptureRepository;
    verseProvider: QueryVerseProvider;
    searchPhrase: string;
    options: SearchOptions;
    locale?: string;

    // Whether all search results have been returned.
    isComplete: boolean = false;

    private resultsReader = new BufferedReader({
        read: (limit: number) => this.getOneBatch(limit),
        done: () => this.isComplete
    });

    async init() {
        this.verseProvider = await this.scriptureRepository.queryVerses(
            this.searchPhrase,
            this.options
        );
    }

    async getResults(limit: number = 0): Promise<SearchResult[]> {
        if (!this.verseProvider) {
            await this.init();
        }
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

    private splitWordChunks(text: string) {
        const regex = makeRegex(this.searchPhrase, {
            substitute: this.options?.substitute,
            ignore: this.options?.ignore,
            locale: this.locale
        });
        const matches = this.wordMatchBoundaries(text, regex);
        return this.chunksByIndices(text, matches);
    }

    /**
     * Get a list of indices where the beginning or end of a match coincides
     * with the beginning or end of a word.
     */
    private wordMatchBoundaries(text: string, regex: RegExp): number[] {
        const wordIndex = this.wordBoundaries(text);
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

    /**
     * Get indices for the beginning and end of each word
     */
    private wordBoundaries(text: string) {
        const wordRegex = /[\p{L}\p{N}]+/gu;
        const starts = [];
        const stops = [];
        for (const word of text.matchAll(wordRegex)) {
            starts.push(word.index);
            stops.push(word.index + word[0].length);
        }
        return { starts, stops };
    }

    /**
     * Split text into chunks along given indicies
     */
    private chunksByIndices(text: string, indices: number[]): SearchResultChunk[] {
        const chunks: SearchResultChunk[] = [];
        let i = 0;
        let isMatch = false;
        for (const j of indices) {
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

    private splitCharChunks(text: string) {
        const regex = makeRegex(this.searchPhrase, {
            ignore: this.options?.ignore,
            substitute: this.options?.substitute,
            capture: true,
            locale: this.locale
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
