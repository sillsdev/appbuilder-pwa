export enum RenderScopeType {
    this_first,
    that,
    document,
    paragraph,
    sequence,
    text
}

export enum RenderEventType {
    start,
    end,
    single
}

export const RenderEventNames = [
    'startDocument',
    'endDocument',
    'startParagraph',
    'endParagraph',
    'startVerses',
    'endVerses',
    'startChapter',
    'endChapter',
    'text',
    'metaContent',
    'mark',
    'startSequence',
    'endSequence',
    'blockGraft',
    'inlineGraft',
    'startWrapper',
    'endWrapper',
    'startMilestone',
    'endMilestone',
    'startRow',
    'endRow'
];

export class RenderScope {
    constructor(doc: Document, name: string, type: RenderScopeType, contentRoot?: HTMLElement) {
        this.name = name;
        this.type = type;
        this.contentRoot = contentRoot ?? doc.createElement('div');
    }

    name: string;
    type: RenderScopeType;
    contentRoot: HTMLElement | null = null;
}

export type RenderAction = {
    scopeTypes: Set<RenderScopeType>;
    action(environment: any, params: any): void;
};

export type RenderEventDetails = {
    eventType: RenderEventType;
    scopeType: RenderScopeType;
};

export class FeatureSpec {
    constructor(tag: string, actions: Array<RenderAction>) {
        this.configTag = tag;
        this.enabled = false;
        this.actions = actions;
    }
    configTag: string;
    enabled: boolean;
    actions: Array<RenderAction>;
}
