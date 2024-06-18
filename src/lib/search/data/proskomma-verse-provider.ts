import type { SABProskomma } from '$lib/sab-proskomma';
import type {
    QueryVerseProvider,
    SearchOptions,
    SearchCandidate
} from '../domain/interfaces/data-interfaces';
import { BufferedReader } from '../utils/buffered-reader';
import { makeRegexPattern, RegexHelpers } from '../utils/regex-helpers';

export interface GQLBooks {
    data: { docSet: { documents: { id: string; idParts: { type: string } }[] } };
}

export interface GQLBlockToken {
    scopes: string[];
    payload: string;
}

export interface GQLBlocks {
    data: {
        document: { bookCode: string; mainSequence: { blocks: { tokens: GQLBlockToken[] }[] } };
    };
}

function keywordToRegex(
    word: string,
    wholeWords: boolean = false,
    ignore: string = '',
    substitute: { [char: string]: string } = {},
    locale?: string
) {
    let pattern = word;
    pattern = makeRegexPattern(pattern, { ignore, substitute, locale });
    pattern = pattern.replaceAll('\\', '\\\\');
    pattern = pattern.replaceAll('"', '\\"');
    if (wholeWords) {
        pattern = '^' + pattern + '$';
    }
    return pattern;
}

function searchParams(
    keywords: string[],
    wholeWords: boolean = false,
    ignore: string = '',
    substitute: { [char: string]: string },
    locale?: string
): string {
    const terms = keywords.map((w) => keywordToRegex(w, wholeWords, ignore, substitute, locale));
    return `withMatchingChars: ["${terms.join('", "')}"]`;
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

export const gqlSearchHelpers = { keywordToRegex, chapterVerseFromScopes };

export class ProskommaVerseProvider implements QueryVerseProvider {
    constructor(pk: SABProskomma, searchPhrase: string, options: SearchOptions) {
        this.searchPhrase = searchPhrase;
        this.options = options;
        this.pk = pk;
        const tokens = RegexHelpers.wordsOf(searchPhrase);
        this.searchIsBlank = tokens.length === 0;
        this.searchParams = searchParams(
            tokens,
            options.wholeWords,
            options.ignore,
            options.substitute,
            options.locale
        );
    }

    searchPhrase: string;
    options: SearchOptions;
    pk: SABProskomma;
    books: string[];
    nextBook: number;
    searchParams: string;
    searchIsBlank: boolean;

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

    private collectVerseTexts(tokens: GQLBlockToken[]): { [verse: string]: string } {
        return tokens.reduce((verses, token) => {
            const ref = chapterVerseFromScopes(token.scopes);
            if (!verses[ref]) verses[ref] = '';
            verses[ref] += token.payload;
            return verses;
        }, {});
    }

    async queryForBooks(): Promise<GQLBooks> {
        const query = ` {
            docSet(id: "${this.options.docSet}") {
                documents(${this.searchParams} allChars: true sortedBy: "paratext") {
                    id
                    idParts { type }
                }
            }
        } `;
        return (await this.pk.gqlQuery(query)) as GQLBooks;
    }

    async queryForBlocks(bookId: string): Promise<GQLBlocks> {
        const query = `{
            document(id: "${bookId}") {
                bookCode: header(id: "bookCode") mainSequence {
                    blocks(${this.searchParams} allChars: true) {
                        tokens(includeContext: true) {
                            scopes(startsWith: ["chapter/" "verses/"]) payload
                        }
                    }
                }
            }
        }`;
        return (await this.pk.gqlQuery(query)) as GQLBlocks;
    }
}
