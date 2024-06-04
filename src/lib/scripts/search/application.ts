import type { Reference, SearchResult } from './entities';
import { BufferedReader } from './utils';

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
    constructor(searchPhrase: string) {}

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
    wholeWords: boolean;
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
        const regex = new RegExp(`(${this.searchPhrase})`);
        const chunks = text
            .split(regex)
            .filter((part) => part)
            .map((part) => {
                return {
                    content: part,
                    matchesQuery: part === this.searchPhrase
                };
            });
        return chunks;
    }

    private matchesQuery(text: string): boolean {
        if (this.options.wholeWords) {
            const pattern = new RegExp('\\b' + this.searchPhrase + '\\b');
            return pattern.test(text);
        }
        return text.includes(this.searchPhrase);
    }
}
