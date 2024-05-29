import { pk } from '$lib/data/stores/pk';
import type { SABProskomma } from '$lib/sab-proskomma';
import { get } from 'svelte/store';
import config from '$lib/data/config';

export interface SearchResult {
    reference: {
        bookCode: string;
        bookName: string;
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
                bookCode: string;
                bookName: string;
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
        this.phrase = phrase.trim();
        this.wholeWords = wholeWords;
        this.docSet = docSet;
        this.collection = collection;
    }

    async makeQuery(): Promise<SearchResult[]> {
        const params = this.searchParams(this.tokenize(this.phrase));
        const query = `
        {
          docSets(ids: ["${this.docSet}"]) {
            documents(${params} allChars: true) {
              bookCode: header(id: "bookCode")
              bookName: header(id: "toc2")
              mainSequence {
                blocks(${params} allChars: true) {
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
            results = this.parseResponse(r);
        });
        return results;
    }

    /**
     * Extract search results from a GraphQL query response.
     */
    private parseResponse(response: GraphQLResponse): SearchResult[] {
        let results: SearchResult[] = [];

        for (const doc of response.data.docSets[0].documents) {
            const allTokens = doc.mainSequence.blocks.flatMap((block) => block.tokens) as any[];
            const verseTexts = this.textByVerses(allTokens);

            results = results.concat(this.resultsInVerses(verseTexts, doc.bookCode, doc.bookName));
        }

        this.sortByBook(results);
        return results;
    }

    private sortByBook(results: SearchResult[]) {
        const collections: { id: string; books: { id: string }[] }[] = this.config.bookCollections;
        const collectionData = collections.find((bc) => bc.id === this.collection);
        const books = collectionData.books.map((bk) => bk.id);

        results.sort((a, b) => {
            let x = books.indexOf(a.reference.bookCode);
            let y = books.indexOf(b.reference.bookCode);
            if (x === y) {
                return 0;
            }
            // Books with unrecongnized book codes are listed last.
            // (This may happen with song books).
            if (x < 0) {
                return 1;
            }
            if (y < 0) {
                return -1;
            }
            return books.indexOf(a.reference.bookCode) - books.indexOf(b.reference.bookCode);
        });
    }

    /**
     * Get search results from verses in a single book.
     */
    private resultsInVerses(
        verseTexts: VerseTexts,
        bookCode: string,
        bookName: string
    ): SearchResult[] {
        const results: SearchResult[] = [];

        for (const verse of Object.keys(verseTexts)) {
            const text: string = verseTexts[verse].replaceAll('\n', '');
            if (this.textMatchesQuery(text)) {
                const ref = verse.split(':');
                results.push({
                    reference: {
                        bookCode,
                        bookName,
                        chapter: ref[0] ?? null,
                        verses: ref[1] ?? null
                    },
                    chunks: this.splitChunks(text)
                });
            }
        }
        return results;
    }

    private textMatchesQuery(text: string): boolean {
        if (this.wholeWords) {
            const pattern = new RegExp('\\b' + this.phrase + '\\b');
            return pattern.test(text);
        }
        return text.includes(this.phrase);
    }

    /**
     * Split the given text into chuncks that isolate searchString.
     *
     * For example,
     *
     *  splitChunks('brown', 'The quick brown fox')
     *      == ['The quick ', 'brown', ' fox']
     */
    private splitChunks(text: string) {
        const regex = new RegExp(`(${this.phrase})`);
        const chunks = text
            .split(regex)
            .filter((part) => part)
            .map((part) => {
                return {
                    content: part,
                    matchesQuery: part === this.phrase
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
        let ref = chapter;
        if (verse) {
            ref += ':' + verse;
        }
        return ref;
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
    protected searchParams(keywords: string[]): string {
        const safeKeywords = keywords
            .map((wd) => wd.replaceAll('\\', '\\\\'))
            .map((wd) => wd.replaceAll('"', '\\"'));
        const searchTerms = this.wholeWords
            ? safeKeywords
            : safeKeywords.map((wd) => this.regexSafe(wd)).map((wd) => wd + '.*');
        const param = this.wholeWords ? 'withChars' : 'withMatchingChars';
        return `${param}: ["${searchTerms.join('", "')}"]`;
    }

    protected tokenize(input: string): string[] {
        return input.split(/\s+/).filter((t) => t);
    }
}
