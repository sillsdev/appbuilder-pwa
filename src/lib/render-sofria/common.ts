import documentFeature from './DocumentFeature';
import type ScopeManager from './ScopeManager';

export enum RenderScopeLevel {
    document,
    paragraph,
    sequence,
    text,
    phrase,
    verses,
    chapter,
    metaContent,
    mark,
    blockGraft,
    inlineGraft,
    wrapper,
    milestone,
    table,
    row,
    cell,
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
export type RenderEventNames = (typeof RenderEventNamesList)[number];

export class RenderEventDescriptor {
    constructor(eventName: string) {
        if (eventName.startsWith('start')) {
            this.position = RenderEventPosition.scopeStart;
            this.level = RenderScopeLevel[eventName.replace('start', '').toLowerCase()];
        } else if (eventName.startsWith('end')) {
            this.position = RenderEventPosition.scopeEnd;
            this.level = RenderScopeLevel[eventName.replace('end', '').toLowerCase()];
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
    workspace: RenderWorkspace;
    output: any;
};

export type RenderAction = {
    eventTriggers: Array<RenderEventNames>;
    action(environment: RenderEnvironment): void;
    actionState?: any;
    output?: HTMLElement;
};

/**
 * Methodology from
 * https://stackoverflow.com/questions/55570729/how-to-limit-the-keys-of-an-object-to-the-strings-of-an-array-in-typescript
 */
export type ActionDictionary = Partial<{ [key in RenderEventNames]: Array<RenderAction> }>;

export type FeatureFlag = { tag: string; enabledValue: string };

export class FeatureSpec {
    constructor(actions: Array<RenderAction>, flag?: FeatureFlag) {
        this.flag = flag;
        this.actions = actions;
    }

    flag: FeatureFlag;
    actions: Array<RenderAction>;
}

export type RenderScratchpad = {
    [key in RenderEventNames]?: any;
};

export type RenderWorkspace = {
    document: Document;
    currentTextPosition: { chapter: string; verse: string; phrase?: string };
    bookRoot: HTMLDivElement;
    activeElements: any;
    scopeManager: ScopeManager;
    logSettings: any;
    scratch: RenderScratchpad;
};
