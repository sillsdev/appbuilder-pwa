declare module 'proskomma-tools' {
    namespace queries {
        function catalogQuery(options: any): string;
    }
    namespace postQueries {
        function parseChapterVerseMapInDocSets(options: any): string[];
    }
}
