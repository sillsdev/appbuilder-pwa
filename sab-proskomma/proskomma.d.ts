declare module 'proskomma' {
    export class Proskomma {
        gqlQuerySync(query: string, callback?: (r: any) => void): any;
        gqlQuery(query: string, callback?: (r: any) => void): Promise<any>;
        validateSelectors(): void;
    }
}
