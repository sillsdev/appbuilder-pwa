declare module 'proskomma-core' {
    export class Proskomma {
        gqlQuerySync(query: string, callback?: (r: any) => void): any;
        gqlQuery(query: string, callback?: (r: any) => void): Promise<any>;
        validateSelectors(): void;
        loadSuccinctDocSet(succinctOb: any): any;
        docSets: [];
        serializeSuccinct(document: any): any;
    }

    export const typeDefs: string;

    export const resolvers: object;
}
