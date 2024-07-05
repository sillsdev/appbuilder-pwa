import type { SearchOptions } from '$lib/search/domain/interfaces/data-interfaces';

export interface GQLBlockToken {
    scopes: string[];
    payload: string;
}

export interface GQLBookId {
    id: string;
    idParts: { type: string };
    bookCode: string;
}

/**
 * An interface for Proskomma-specific search functions
 */
export interface ProskommaSearchRepository {
    loadDocSet(data: ArrayBuffer): Promise<void>;

    queryBooks(phrase: string, options: SearchOptions): Promise<GQLBookId[]>;

    queryTokens(phrase: string, bookId: string, options: SearchOptions): Promise<GQLBlockToken[]>;
}
