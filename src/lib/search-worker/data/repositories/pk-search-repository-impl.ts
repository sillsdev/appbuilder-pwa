import type { SABProskomma } from '$lib/sab-proskomma';
import type { SearchOptions } from '$lib/search/domain/interfaces/data-interfaces';
import { RegexHelpers, makeRegexPattern } from '$lib/search-worker/utils/regex-helpers';
import type {
    GQLBlockToken,
    GQLBookId,
    ProskommaSearchRepository
} from '../interfaces/pk-search-repository';

/**
 * Generate regex to match acceptable variations of the given keyword
 *
 * Returns a regex string that can be safely embedded into a GraphQL string literal
 */
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

/**
 * Construct GraphQL parameters for the given search
 */
function searchParams(phrase: string, options: SearchOptions): string {
    const keywords = RegexHelpers.wordsOf(phrase);
    const terms = keywords.map((w) =>
        keywordToRegex(w, options.wholeWords, options.ignore, options.substitute, options.locale)
    );
    return `withMatchingChars: ["${terms.join('", "')}"]`;
}

export const GQLSearchHelpers = { keywordToRegex };

/**
 * Implements search-related Proskomma functions using GraphQL
 */
export class ProskommaSearchRepositoryImpl implements ProskommaSearchRepository {
    constructor(pk: SABProskomma, thaw: (pk: SABProskomma, data: Uint8Array) => void) {
        this.pk = pk;
        this.thaw = thaw;
    }

    pk: SABProskomma;
    thaw: (pk: SABProskomma, data: Uint8Array) => void;

    async loadDocSet(data: ArrayBuffer): Promise<void> {
        this.thaw(this.pk, new Uint8Array(data));
    }

    async queryBooks(phrase: string, options: SearchOptions): Promise<GQLBookId[]> {
        if (this.phraseIsEmtpy(phrase)) return [];
        const query = `{
            docSet(id: "${options.docSet}") {
                documents(sortedBy: "paratext") {
                    id
                    idParts { type }
                    bookCode: header(id: "bookCode")
                }
            }
        } `;
        const results = await this.makeQuery(query);
        return results.data.docSet.documents;
    }

    async queryTokens(
        phrase: string,
        bookId: string,
        options: SearchOptions
    ): Promise<GQLBlockToken[]> {
        if (this.phraseIsEmtpy(phrase)) return [];
        const params = searchParams(phrase, options);
        const query = `{
            document(id: "${bookId}") {
                mainSequence {
                    blocks(${params} allChars: true) {
                        tokens(includeContext: true) {
                            scopes(startsWith: ["chapter/" "verses/"])
                            payload
                        }
                    }
                }
            }
        }`;
        const results = await this.makeQuery(query);
        const blocks: any[] = results.data.document.mainSequence.blocks;
        return blocks.flatMap((b) => b.tokens);
    }

    private async makeQuery(query: string) {
        const response = await this.pk.gqlQuery(query);
        if (!response.data) {
            throw new Error(`Unexpected GQL Response: ${response}`);
        }
        return response;
    }

    private phraseIsEmtpy(phrase: string) {
        return RegexHelpers.wordsOf(phrase).length === 0;
    }
}
