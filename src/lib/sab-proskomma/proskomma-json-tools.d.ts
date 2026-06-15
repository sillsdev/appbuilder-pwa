// eslint-disable-next-line @typescript-eslint/triple-slash-reference
///<reference path="./proskomma.d.ts" />

declare module 'proskomma-json-tools' {
    export type Block = { type: string; subType?: string; sequence: Partial<Sequence> };

    export type Element = {
        type: string;
        subType: string;
        text: string;
        atts: Record<string, string>;
        sequence: Partial<Sequence>;
    };

    export type Sequence = {
        id: string;
        type: string;
        block: Block;
        element: Element;
    };

    export type Context = {
        document: { metadata: { document: unknown } };
        sequences: Sequence[];
        renderer: SofriaRenderFromProskomma;
    };

    export type ProskommaRenderAction<Params extends { context: Context }> = {
        description: string;
        test: (args: Params) => boolean;
        action: (args: Params) => void;
    };
    export class SofriaRenderFromProskomma<ActionParams> {
        constructor(args: {
            proskomma: Proskomma;
            actions: Record<string, ProskommaRenderAction<ActionParams>[]>;
            debugLevel: number;
        });
        renderDocument(args: {
            docId: string;
            config: { chapters?: string[] };
            output: unknown;
        }): void;
        renderSequence(args: ActionParams);
    }
}
