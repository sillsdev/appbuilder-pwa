export interface Reference {
    docSet: string;
    collection: string;
    bookCode: string;
    chapter: string;
    verses: string;
}

export interface SearchResult {
    reference: Reference;

    // Split the content into chunks so the view can apply
    // special formatting to content matching the search query.
    chunks: {
        content: string;
        matchesQuery: boolean;
    }[];
}
