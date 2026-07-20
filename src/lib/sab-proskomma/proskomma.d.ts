declare module 'proskomma-core' {
    export class Proskomma {
        gqlQuerySync(query: string, callback?: (r: any) => void): any;
        gqlQuery(query: string, callback?: (r: any) => void): Promise<any>;
        validateSelectors(): void;
        loadSuccinctDocSet(succinctOb: any): any;
        docSets: [];
        serializeSuccinct(document: any): any;
        importDocument(
            selectors: any,
            contentType: string,
            contentString: string,
            filterOptions?: any,
            customTags?: any,
            emptyBlocks?: any,
            tags?: any
        ): any;
    }

    export const typeDefs: string;

    export const resolvers: object;

    /**
     * Placeholder type since Proskomma doesn't yet use TypeScript
     * (see https://github.com/Proskomma/proskomma-json-tools/blob/main/src/render/renderers/ProskommaRenderAction.js)
     */
    export type ProskommaRenderAction = {
        description: string;
        test: () => boolean;
        action: ({}: any) => void;
    };
}
