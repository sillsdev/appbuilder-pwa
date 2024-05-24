import { pk } from '$lib/data/stores/pk';
import { get } from 'svelte/store';

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

export async function search(
    phrase: string,
    wholeWords: boolean,
    docSet: string
): Promise<SearchResult[]> {
    const response = await doSearchQuery(phrase, wholeWords, docSet);
    return parseResponse(response, phrase);
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

/**
 * Get parameters for the GraphQL search query.
 */
export function searchParams(keywords: string[], wholeWords: boolean): string {
    const safeKeywords = keywords
        .map((wd) => wd.replaceAll('\\', '\\\\'))
        .map((wd) => wd.replaceAll('"', '\\"'));
    const searchTerms = wholeWords
        ? safeKeywords
        : safeKeywords.map((wd) => regexSafe(wd)).map((wd) => wd + '.*');
    const param = wholeWords ? 'withChars' : 'withMatchingChars';
    return `${param}: ["${searchTerms.join('", "')}"]`;
}

export function tokenize(input: string): string[] {
    return input.split(/\s+/).filter((t) => t);
}

/**
 * Query Proskomma text to search for teh given phrase.
 */
async function doSearchQuery(
    searchPhrase: string,
    wholeWords: boolean,
    docSet: string
): Promise<GraphQLResponse> {
    const params = searchParams(tokenize(searchPhrase), wholeWords);
    const query = `
        {
          docSets(ids: ["${docSet}"]) {
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
    let result: GraphQLResponse;
    await get(pk).gqlQuery(query, (r: GraphQLResponse) => (result = r));
    return result;
}

/**
 * Extract search results from a GraphQL query response.
 */
export function parseResponse(response: GraphQLResponse, searchString: string): SearchResult[] {
    let results: SearchResult[] = [];

    for (const doc of response.data.docSets[0].documents) {
        const allTokens = doc.mainSequence.blocks.flatMap((block) => block.tokens) as any[];
        const verseTexts = textByVerses(allTokens);

        results = results.concat(resultsInVerses(verseTexts, searchString.trim(), doc.book));
    }
    return results;
}

/**
 * Get search results from verses in a single book.
 */
function resultsInVerses(
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
                chunks: splitChunks(searchString, text)
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
function splitChunks(searchString: string, text: string) {
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
function textByVerses(allTokens: any[]): VerseTexts {
    return allTokens.reduce((verses, token) => {
        const ref = referenceFromScopes(token.scopes);
        if (!verses[ref]) verses[ref] = '';
        verses[ref] += token.payload;
        return verses;
    }, {});
}

/*
 * Get a chapter/verse reference string from Proskomma scopes
 */
export function referenceFromScopes(scopes: string[]): string {
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
