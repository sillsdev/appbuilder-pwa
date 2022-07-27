declare module 'proskomma' {
    export class Proskomma {
        gqlQuery(query: string, callback?: (r: any) => void): Promise<any>;
    }
}

declare module 'proskomma-freeze' {
    export function freeze(proskommaInstance: Proskomma): Promise<string>;
}

declare module 'proskomma-tools' {
    namespace queries {
        function catalogQuery(options: any): string;
    }
    namespace postQueries {
        function parseChapterVerseMapInDocSets(options: any): string[];
    }
}
