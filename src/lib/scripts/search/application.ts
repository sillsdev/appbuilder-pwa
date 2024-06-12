import type { Reference, SearchResult } from './entities';
import { BufferedReader } from './utils/buffered-reader';
import { RegexHelpers, makeRegex, makeRegexPattern } from './utils/regex-helpers';

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
}

// Finds verses that match the given search parameters.
export abstract class SearchQueryBase {
    constructor(searchPhrase: string, verseProvider: VerseProvider, options: SearchOptions) {
        this.searchPhrase = searchPhrase;
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

    private splitChunks(text: string) {
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

    private indexWordMatches(text: string, regex: RegExp) {
        const wordIndex = this.getWordIndices(text);
        const matches = [];
        for (const match of text.matchAll(new RegExp(regex, 'g'))) {
            const start = match.index;
            const stop = match.index + match[0].length;
            if (wordIndex.starts.includes(start) && wordIndex.stops.includes(stop)) {
                matches.push(start, stop);
            }
        }
        return matches;
    }

    private chunksByIndex(text: string, index: number[]) {
        const chunks = [];
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

    // private splitChunks(text: string) {
    //     // Split the text and search phrase into characters or whole words.
    //     const tokens = this.options.wholeWords ? RegexHelpers.splitByWords(text) : [...text];
    //     const groupBy = this.options.wholeWords
    //         ? RegexHelpers.splitByWords(this.searchPhrase)
    //         : [...this.searchPhrase];

    //     const matcher = makeRegex(this.searchPhrase, {
    //         equivalent: this.options?.equivalent,
    //         ignore: this.options?.ignore,
    //         wholeLine: true
    //     });

    //     return this.groupTokens(tokens, groupBy)
    //         .map((g) => g.join(''))
    //         .map((s) => ({
    //             content: s,
    //             matchesQuery: matcher.test(s)
    //         }));
    // }

    // /**
    //  * Group string tokens into groups that match groupBy and groups that do not.
    //  */
    // private groupTokens(tokens: string[], groupBy: string[]): string[][] {
    //     const matchers = groupBy.map((t) =>
    //         makeRegex(t, {
    //             equivalent: this.options?.equivalent,
    //             ignore: this.options?.ignore,
    //             wholeLine: true
    //         })
    //     );
    //     const groups = [];
    //     let match = [];
    //     let nonmatch = [];
    //     let i = 0; // The number of consecutive characters that have matched groupBy
    //     for (const t of tokens) {
    //         if (this.options?.ignore?.includes(t)) {
    //             if (match.length > 0) {
    //                 match.push(t);
    //             } else {
    //                 nonmatch.push(t);
    //             }
    //             continue;
    //         }
    //         if (i >= groupBy.length) {
    //             // Found a complete match.
    //             groups.push(nonmatch);
    //             groups.push(match);
    //             nonmatch = [];
    //             match = [];
    //             i = 0;
    //         }
    //         if (matchers[i].test(t)) {
    //             match.push(t);
    //             i++;
    //         } else {
    //             if (match.length) {
    //                 nonmatch.push(...match);
    //                 match = [];
    //             }
    //             nonmatch.push(t);
    //             i = 0;
    //         }
    //     }
    //     // Push remaining non-matching tokens.
    //     nonmatch.push(...match);
    //     if (nonmatch.length) {
    //         groups.push(nonmatch);
    //     }
    //     return groups;
    // }

    private matchesQuery(text: string): boolean {
        const pattern = makeRegexPattern(this.searchPhrase, {
            ignore: this.options?.ignore,
            substitute: this.options?.substitute,
            wholeLine: this.options?.wholeWords
        });
        const regex = new RegExp(pattern);

        return this.options?.wholeWords
            ? RegexHelpers.wordsOf(text).some((w) => regex.test(w))
            : regex.test(text);
    }
}
