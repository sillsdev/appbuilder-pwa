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

// export const RenderEventNames = [
//     'startDocument',
//     'endDocument',
//     'startParagraph',
//     'endParagraph',
//     'startVerses',
//     'endVerses',
//     'startChapter',
//     'endChapter',
//     'text',
//     'metaContent',
//     'mark',
//     'startSequence',
//     'endSequence',
//     'blockGraft',
//     'inlineGraft',
//     'startWrapper',
//     'endWrapper',
//     'startMilestone',
//     'endMilestone',
//     'startRow',
//     'endRow'
// ];

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

export type RenderAction = {
    scopeLevels: Set<RenderScopeLevel>;
    action(environment: any, params: any): void;
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
