export enum RenderScopeLevel {
    document,
    paragraph,
    sequence,
    text,
    verses,
    chapter,
    metaContent,
    mark,
    blockGraft,
    inlineGraft,
    wrapper,
    milestone,
    row,
    unsupported
}

export enum RenderEventPosition {
    scopeStart,
    scopeEnd,
    standalone
}

export const RenderEventNamesList = [
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
] as const;

export class RenderEventDescriptor {
    constructor(eventName: string) {
        if (eventName.startsWith('start')) {
            this.position = RenderEventPosition.scopeStart;
            this.level = RenderScopeLevel[eventName.replace('start', '')];
        } else if (eventName.startsWith('end')) {
            this.position = RenderEventPosition.scopeEnd;
            this.level = RenderScopeLevel[eventName.replace('end', '')];
        } else {
            this.position = RenderEventPosition.standalone;
            this.level = RenderScopeLevel[eventName];
        }
    }

    level: RenderScopeLevel;
    position: RenderEventPosition;
}

export class RenderScope {
    constructor(doc: Document, level: RenderScopeLevel, contentRoot?: HTMLElement) {
        this.level = level;
        this.contentRoot = contentRoot ?? doc.createElement('div');
    }

    level: RenderScopeLevel;
    contentRoot: HTMLElement | null = null;
}

/**
 * This should eventually go in proskomma.d.ts
 */
export type RenderEnvironment = {
    config: any;
    context: any;
    workspace: any;
    output: any;
};

export type RenderAction = {
    eventTriggers: Set<RenderEventNames>;
    action(environment: RenderEnvironment): void;
    output?: HTMLElement;
};

/**
 * Methodology from
 * https://stackoverflow.com/questions/55570729/how-to-limit-the-keys-of-an-object-to-the-strings-of-an-array-in-typescript
 */
export type RenderEventNames = (typeof RenderEventNamesList)[number];
export type ActionDictionary = Partial<{ [key in RenderEventNames]: Array<RenderAction> }>;

export class FeatureSpec {
    constructor(tag: string, enabledValue: string, actions: Array<RenderAction>) {
        this.configTag = tag;
        this.enabledValue = enabledValue;
        this.actions = actions;
    }
    configTag: string;
    enabledValue: string;
    actions: Array<RenderAction>;
}

export const renderFeatures: Array<FeatureSpec> = [];
