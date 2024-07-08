/**
 * A fully qualified Scripture reference
 */
export interface Reference {
    docSet: string;
    collection: string;
    bookCode: string;
    chapter: string;
    verses: string;
}

// Each search result is split into "chunks" to distinguish
// between parts that match the search query and parts that
// do not. That way special formatting can be applied to
// matching text.
export interface SearchResultChunk {
    content: string;
    matchesQuery: boolean;
}

export interface SearchResult {
    reference: Reference;

    chunks: SearchResultChunk[];
}
