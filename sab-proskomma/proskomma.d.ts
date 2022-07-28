declare module 'proskomma' {
    export class Proskomma {
        gqlQuery(query: string, callback?: (r: any) => void): Promise<any>;
        validateSelectors(): void;
    }
}
