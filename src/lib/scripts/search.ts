import { pk } from '$lib/data/stores/pk';
import type { SABProskomma } from '$lib/sab-proskomma';
import { get } from 'svelte/store';
import config from '$lib/data/config';

export interface SearchResult {
    reference: {
        bookCode: string;
        chapter: string;
        verses: string;
    };

    // Split the content into chunks so the view can apply
    // special formatting to content matching the search query.
    chunks: {
        content: string;
        matchesQuery: boolean;
    }[];
}

export interface GraphQLResponse {
    data: {
        docSets: {
            documents: {
                book: string;
                mainSequence: {
                    blocks: {
                        tokens: {
                            scopes: string[];
                            payload: string;
                        }[];
                    }[];
                };
            }[];
        }[];
    };
}

interface VerseTexts {
    [verseRef: string]: string;
}

export class Search {
    phrase: string;
    docSet: string;
    collection: string;
    wholeWords: boolean;

    protected pk: SABProskomma = get(pk);
    protected config = config;

    constructor(phrase: string, wholeWords: boolean, docSet: string, collection: string) {
        this.phrase = phrase;
        this.wholeWords = wholeWords;
        this.docSet = docSet;
        this.collection = collection;
    }

    async makeQuery(): Promise<SearchResult[]> {
        const params = this.searchParams(this.tokenize(this.phrase), this.wholeWords);
        const query = `
        {
          docSets(ids: ["${this.docSet}"]) {
            documents(${params} allChars: true) {
              book: header(id: "bookCode")
              mainSequence {
                blocks(${params} allChars: false) {
                  tokens(includeContext: true) {
                    scopes(startsWith: ["chapter/" "verses/"])
                    payload
                  }
                }
              }
            }
          }
        }`;
        let results: SearchResult[];
        await this.pk.gqlQuery(query, (r: GraphQLResponse) => {
            results = this.parseResponse(r, this.phrase);
        });
        return results;
    }

    /**
     * Extract search results from a GraphQL query response.
     */
    private parseResponse(response: GraphQLResponse, searchString: string): SearchResult[] {
        let results: SearchResult[] = [];

        for (const doc of response.data.docSets[0].documents) {
            const allTokens = doc.mainSequence.blocks.flatMap((block) => block.tokens) as any[];
            const verseTexts = this.textByVerses(allTokens);

            results = results.concat(
                this.resultsInVerses(verseTexts, searchString.trim(), doc.book)
            );
        }

        this.sortByBook(results);
        return results;
    }

    private sortByBook(results: SearchResult[]) {
        const collections: { id: string; books: { id: string }[] }[] = this.config.bookCollections;
        const collectionData = collections.find((bc) => bc.id === this.collection);
        const books = collectionData.books.map((bk) => bk.id);

        results.sort((a, b) => {
            return books.indexOf(a.reference.bookCode) - books.indexOf(b.reference.bookCode);
        });
    }

    /**
     * Get search results from verses in a single book.
     */
    private resultsInVerses(
        verseTexts: VerseTexts,
        searchString: string,
        bookCode: string
    ): SearchResult[] {
        const results: SearchResult[] = [];

        for (const verse of Object.keys(verseTexts)) {
            const text: string = verseTexts[verse].replaceAll('\n', '');
            if (text.includes(searchString)) {
                const ref = verse.split(':');
                results.push({
                    reference: {
                        bookCode: bookCode,
                        chapter: ref[0],
                        verses: ref[1]
                    },
                    chunks: this.splitChunks(searchString, text)
                });
            }
        }
        return results;
    }

    /**
     * Split the given text into chuncks that isolate searchString.
     *
     * For example,
     *
     *  splitChunks('brown', 'The quick brown fox')
     *      == ['The quick ', 'brown', ' fox']
     */
    private splitChunks(searchString: string, text: string) {
        const regex = new RegExp(`(${searchString})`);
        const chunks = text
            .split(regex)
            .filter((part) => part)
            .map((part) => {
                return {
                    content: part,
                    matchesQuery: part === searchString
                };
            });
        return chunks;
    }

    /**
     * Collect Proskomma content tokens into verse texts.
     */
    private textByVerses(allTokens: any[]): VerseTexts {
        return allTokens.reduce((verses, token) => {
            const ref = this.referenceFromScopes(token.scopes);
            if (!verses[ref]) verses[ref] = '';
            verses[ref] += token.payload;
            return verses;
        }, {});
    }

    /*
     * Get a chapter/verse reference string from Proskomma scopes
     */
    protected referenceFromScopes(scopes: string[]): string {
        let verse: string;
        let chapter: string;
        for (const s of scopes) {
            if (s.startsWith('chapter/')) {
                chapter = s.split('/')[1];
            } else if (s.startsWith('verses/')) {
                verse = s.split('/')[1];
            }
        }
        return chapter + ':' + verse;
    }

    /**
     * Escape characters in a string so as to make it a regex literal.
     */
    protected regexSafe(input: string): string {
        let result = input.replaceAll('\\\\', '\\\\\\\\');
        for (const c of '$*.?+[]^&{}!<>|-') {
            result = result.replaceAll(c, `\\\\${c}`);
        }
        return result;
    }

    /**
     * Get parameters for the GraphQL search query.
     */
    protected searchParams(keywords: string[], wholeWords: boolean): string {
        const safeKeywords = keywords
            .map((wd) => wd.replaceAll('\\', '\\\\'))
            .map((wd) => wd.replaceAll('"', '\\"'));
        const searchTerms = wholeWords
            ? safeKeywords
            : safeKeywords.map((wd) => this.regexSafe(wd)).map((wd) => wd + '.*');
        const param = wholeWords ? 'withChars' : 'withMatchingChars';
        return `${param}: ["${searchTerms.join('", "')}"]`;
    }

    protected tokenize(input: string): string[] {
        return input.split(/\s+/).filter((t) => t);
    }
}
