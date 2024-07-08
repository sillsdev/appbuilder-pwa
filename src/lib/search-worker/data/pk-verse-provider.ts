import type { SearchOptions } from '$lib/search/domain/interfaces/data-interfaces';
import { BufferedReader } from '../utils/buffered-reader';
import { RegexHelpers } from '../utils/regex-helpers';
import type { QueryVerseProvider, SearchCandidate } from '../domain/interfaces/data-interfaces';
import type {
    GQLBlockToken,
    GQLBookId,
    ProskommaSearchRepository
} from './interfaces/pk-search-repository';

/**
 * Get a chapter/verse reference string from Proskomma scopes
 */
export function chapterVerseFromScopes(scopes: string[]): string {
    let verse: string;
    let chapter: string;
    for (const s of scopes) {
        if (s.startsWith('chapter/')) {
            chapter = s.split('/')[1];
        } else if (s.startsWith('verses/')) {
            verse = s.split('/')[1];
        }
    }
    let ref = chapter;
    if (verse) {
        ref += ':' + verse;
    }
    return ref;
}

/**
 * Queries Proskomma for verses that may match the search parameters
 */
export class ProskommaVerseProvider implements QueryVerseProvider {
    constructor(
        proskommaRepository: ProskommaSearchRepository,
        searchPhrase: string,
        options: SearchOptions
    ) {
        this.pk = proskommaRepository;
        this.searchPhrase = searchPhrase;
        this.options = options;
        this.searchIsBlank = RegexHelpers.wordsOf(searchPhrase).length === 0;
    }

    pk: ProskommaSearchRepository;

    searchPhrase: string;
    options: SearchOptions;
    books: GQLBookId[];
    nextBook: number;
    searchIsBlank: boolean;

    // Loads results into a buffer to be used on demand
    private verseReader = new BufferedReader({
        read: () => this.queryNextBook(),
        done: () => this.nextBook >= this.books.length
    });

    async getVerses(limit: number = 0): Promise<SearchCandidate[]> {
        if (this.searchIsBlank) return [];
        await this.ensureBooksSet();
        return await this.verseReader.read(limit);
    }

    async queryNextBook(): Promise<SearchCandidate[]> {
        await this.ensureBooksSet();
        if (this.nextBook >= this.books.length) {
            return [];
        }
        const book = this.books[this.nextBook];
        this.nextBook++;
        return this.versesOfBook(book);
    }

    // If necessary, get the list of books in this docset
    private async ensureBooksSet() {
        if (this.books == undefined) {
            await this.setBooks();
        }
    }

    // Get the list of books in this docset
    async setBooks() {
        this.nextBook = 0;
        const queryData = await this.pk.queryBooks(this.searchPhrase, this.options);
        this.books = queryData.filter((bk) => bk.idParts.type === 'book');
    }

    async versesOfBook(book: GQLBookId): Promise<SearchCandidate[]> {
        const tokens = await this.pk.queryTokens(this.searchPhrase, book.id, this.options);
        return this.versesFromTokens(tokens, book.bookCode);
    }

    // Get search candidates from the given list of tokens
    versesFromTokens(tokens: GQLBlockToken[], bookCode: string): SearchCandidate[] {
        const verseTexts = this.collectVerseTexts(tokens);
        return Object.keys(verseTexts).map((cv) => {
            const ref = cv.split(':');
            return {
                reference: {
                    docSet: this.options.docSet,
                    collection: this.options.collection,
                    bookCode,
                    chapter: ref[0],
                    verses: ref[1]
                },
                text: verseTexts[cv]
            };
        });
    }

    // Reconstruct the text of each verse
    private collectVerseTexts(tokens: GQLBlockToken[]): { [verse: string]: string } {
        return tokens.reduce((verses, token) => {
            const ref = chapterVerseFromScopes(token.scopes);
            if (!verses[ref]) verses[ref] = '';
            verses[ref] += token.payload;
            return verses;
        }, {});
    }
}
