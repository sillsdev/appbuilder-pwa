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
    equivalent?: string[];
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

        const matching = verses.filter((v) => this.matchesQuery(v.text));
        return matching.map((v) => ({
            reference: v.reference,
            chunks: this.splitChunks(v.text)
        }));
    }

    private splitChunks(text: string) {
        // Split the text and search phrase into characters or whole words.
        const tokens = this.options.wholeWords ? RegexHelpers.wordsOf(text) : [...text];
        const groupBy = this.options.wholeWords
            ? RegexHelpers.wordsOf(this.searchPhrase)
            : [...this.searchPhrase];

        return this.groupTokens(tokens, groupBy).map((g) => ({
            content: g.join(''),
            matchesQuery: g.join('') === this.searchPhrase
        }));
    }

    /**
     * Group string tokens into groups that match groupBy and groups that do not.
     */
    private groupTokens(tokens: string[], groupBy: string[]): string[][] {
        const groups = [];
        let grp = []; // Holds a group that does not match groupBy
        let i = 0; // The number of consecutive characters that have matched groupBy
        for (const t of tokens) {
            if (i >= groupBy.length) {
                // Found a complete match.
                groups.push(grp, groupBy);
                grp = [];
                i = 0;
            }
            if (t === groupBy[i]) {
                // Keep looking to see if the next token matches.
                i++;
            } else {
                // Push t along with any tokens from a partial match.
                grp.push(...groupBy.slice(0, i), t);
                i = 0;
            }
        }
        // Push remaining non-matching tokens.
        if (grp.length) {
            groups.push(grp);
        }
        return groups;
    }

    private matchesQuery(text: string): boolean {
        let pattern = makeRegexPattern(this.searchPhrase, {
            ignore: this.options?.ignore,
            equivalent: this.options?.equivalent
        });
        if (this.options.wholeWords) {
            pattern = '^' + pattern + '$';
        }
        const regex = new RegExp(pattern);

        return this.options?.wholeWords
            ? RegexHelpers.wordsOf(text).some((w) => regex.test(w))
            : regex.test(text);
    }
}
