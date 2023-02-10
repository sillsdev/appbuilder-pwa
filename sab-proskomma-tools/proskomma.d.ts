declare module 'proskomma-core' {
    export class Proskomma {
        gqlQuerySync(query: string, callback?: (r: any) => void): any;
        gqlQuery(query: string, callback?: (r: any) => void): Promise<any>;
        validateSelectors(): void;
        loadSuccinctDocSet(succinctOb: string): any;
        docSets: [];
        serializeSuccinct(document: any): any;
    }
}
