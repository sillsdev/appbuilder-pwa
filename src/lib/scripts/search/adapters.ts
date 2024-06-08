import type { SABProskomma } from '$lib/sab-proskomma';
import {
    SearchInterface,
    SearchQueryBase,
    type SearchCandidate,
    type SearchOptions
} from './application';
import { BufferedReader } from './utils/buffered-reader';

export interface GQLBooks {
    data: {
        docSet: {
            documents: {
                id: string;
                idParts: {
                    type: string;
                };
            }[];
        };
    };
}

export interface GQLBlockToken {
    scopes: string[];
    payload: string;
}

export interface GQLBlocks {
    data: {
        document: {
            bookCode: string;
            mainSequence: {
                blocks: {
                    tokens: GQLBlockToken[];
                }[];
            };
        };
    };
}

/**
 * Escape characters in a string so as to make it a regex literal.
 */
function regexSafe(input: string): string {
    let result = input.replaceAll('\\\\', '\\\\\\\\');
    for (const c of '$*.?+[]^&{}!<>|-') {
        result = result.replaceAll(c, `\\\\${c}`);
    }
    return result;
}

function searchParams(keywords: string[], wholeWords: boolean = false): string {
    const safeKeywords = keywords
        .map((wd) => wd.replaceAll('\\', '\\\\'))
        .map((wd) => wd.replaceAll('"', '\\"'));
    const searchTerms = wholeWords
        ? safeKeywords
        : safeKeywords.map((wd) => regexSafe(wd)).map((wd) => wd + '.*');
    const param = wholeWords ? 'withChars' : 'withMatchingChars';
    return `${param}: ["${searchTerms.join('", "')}"]`;
}

function tokenize(input: string): string[] {
    return input.split(/\s+/).filter((t) => t);
}

/**
 * Get a chapter/verse reference string from Proskomma scopes
 */
function chapterVerseFromScopes(scopes: string[]): string {
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

export const gqlSearchHelpers = {
    searchParams,
    tokenize,
    chapterVerseFromScopes
};

class ProskommaVerseProvider extends SearchInterface.VerseProvider {
    constructor(args: {
        pk: SABProskomma;
        searchPhrase: string;
        wholeWords: boolean;
        docSet: string;
        collection: string;
    }) {
        super(args.searchPhrase);
        this.pk = args.pk;
        this.docSet = args.docSet;
        this.collection = args.collection;

        const tokens = tokenize(args.searchPhrase);
        this.searchParams = searchParams(tokens, args.wholeWords);
    }

    pk: SABProskomma;
    books: string[];
    nextBook: number;
    searchParams: string;

    docSet: string;
    collection: string;

    private verseReader = new BufferedReader({
        read: () => this.queryNextBook(),
        done: () => this.nextBook >= this.books.length
    });

    async getVerses(limit: number = 0): Promise<SearchCandidate[]> {
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

    private async ensureBooksSet() {
        if (this.books == undefined) {
            await this.setBooks();
        }
    }

    async setBooks() {
        this.nextBook = 0;
        const queryData = await this.queryForBooks();
        this.books = queryData.data.docSet.documents
            .filter((bk) => bk.idParts.type === 'book')
            .map((bk) => bk.id);
    }

    async versesOfBook(bookId: string): Promise<SearchCandidate[]> {
        const queryData = await this.queryForBlocks(bookId);
        const bookCode = queryData.data.document.bookCode;
        const tokens = queryData.data.document.mainSequence.blocks
            .map((block) => block.tokens)
            .flat();
        return this.versesFromTokens(tokens, bookCode);
    }

    versesFromTokens(tokens: GQLBlockToken[], bookCode: string): SearchCandidate[] {
        const verseTexts = this.collectVerseTexts(tokens);
        return Object.keys(verseTexts).map((cv) => {
            const ref = cv.split(':');
            return {
                reference: {
                    docSet: this.docSet,
                    collection: this.collection,
                    bookCode,
                    chapter: ref[0],
                    verses: ref[1]
                },
                text: verseTexts[cv]
            };
        });
    }

    private collectVerseTexts(tokens: GQLBlockToken[]): { [verse: string]: string } {
        return tokens.reduce((verses, token) => {
            const ref = chapterVerseFromScopes(token.scopes);
            if (!verses[ref]) verses[ref] = '';
            verses[ref] += token.payload;
            return verses;
        }, {});
    }

    async queryForBooks(): Promise<GQLBooks> {
        return (await this.pk.gqlQuery(`
            {
                docSet(id: "${this.docSet}") {
                    documents(${this.searchParams} allChars: true) {
                        id
                        idParts {
                            type
                        }
                    }
                }
            }
        `)) as GQLBooks;
    }

    async queryForBlocks(bookId: string): Promise<GQLBlocks> {
        return (await this.pk.gqlQuery(`
            {
                document(id: "${bookId}") {
                    bookCode: header(id: "bookCode")
                    mainSequence {
                        blocks(${this.searchParams} allChars: true) {
                            tokens(includeContext: true) {
                                scopes(startsWith: ["chapter/" "verses/"])
                                payload
                            }
                        }
                    }
                }
            }
        `)) as GQLBlocks;
    }
}

export const ProksommaSearchInterface = { ProskommaVerseProvider };

/**
 * Implements search queries using Proskomma
 */
export class SearchQuery extends SearchQueryBase {
    constructor(
        searchPhrase: string,
        pk: SABProskomma,
        docSet: string,
        collection: string,
        options: SearchOptions
    ) {
        const verseProvider = new ProskommaVerseProvider({
            pk,
            searchPhrase,
            wholeWords: options.wholeWords,
            docSet,
            collection
        });
        super(searchPhrase, verseProvider, options);
    }
}
