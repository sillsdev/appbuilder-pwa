// eslint-disable-next-line @typescript-eslint/triple-slash-reference
///<reference path="./proskomma.d.ts" />

declare module 'proskomma-json-tools' {
    export type Block = Readonly<{
        type: string;
        subType?: string;
        sequence: Partial<RenderSequence>;
    }>;

    export type RenderElement = Readonly<{
        type: string;
        subType: string;
        text: string;
        atts: Record<string, string>;
        sequence: Partial<RenderSequence>;
    }>;

    export type RenderSequence = Readonly<{
        id: string;
        type: string;
        block: Block;
        element: RenderElement;
    }>;

    export type RenderContext = Readonly<{
        document: { metadata: { document: unknown } };
        sequences: RenderSequence[];
        renderer: SofriaRenderFromProskomma;
    }>;

    export type RenderWorkspace = Readonly<{
        chapters?: string[];
        blockId: number[];
        nbBlock: number;
        inTable: boolean;
        tableHasContent: boolean;
        skipEndRow: boolean;
    }>;

    export type RenderConfig = Readonly<{
        nbBlock: number;
        chapters?: string[];
        byVerseExperimental: boolean;
        excludeScopeTypes: string[];
    }>;

    export type ProskommaRenderAction<Params extends { context: RenderContext }> = {
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
        currentCV: Readonly<{ chapter: string | null; verses: string | null }>;
    }
}
