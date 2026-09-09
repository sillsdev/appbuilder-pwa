import type { ScriptureLogConfig } from '$lib/data/stores';
import type { ReferenceStore } from '$lib/data/stores/reference';
import type { NumeralSystem } from '$lib/scripts/numeralSystem';
import type { RenderContext } from 'proskomma-json-tools';
import type ScopeManager from './ScopeManager';

const boundedScopes = [
    'Document',
    'Paragraph',
    'Verses',
    'Chapter',
    'Sequence',
    'Wrapper',
    'Milestone',
    'Row'
] as const;
type StartScope = `start${(typeof boundedScopes)[number]}`;
type EndScope = `end${(typeof boundedScopes)[number]}`;
const independentScopes = ['text', 'metaContent', 'mark', 'blockGraft', 'inlineGraft'] as const;
const additionalScopes = ['table', 'cell', 'unsupported'] as const;

export type RenderScopeLevel =
    | Lowercase<(typeof boundedScopes)[number]>
    | (typeof independentScopes | typeof additionalScopes)[number];

export enum RenderEventPosition {
    scopeStart,
    scopeEnd,
    standalone
}

export const renderEvents = [
    ...boundedScopes.flatMap((s) => [`start${s}`, `end${s}`]),
    ...independentScopes
] as const as RenderEvent[];
export type RenderEvent = StartScope | EndScope | (typeof independentScopes)[number];

export class RenderEventDescriptor {
    constructor(eventName: RenderEvent) {
        if (eventName.startsWith('start')) {
            this.position = RenderEventPosition.scopeStart;
            this.level = eventName.replace('start', '').toLowerCase() as RenderScopeLevel;
        } else if (eventName.startsWith('end')) {
            this.position = RenderEventPosition.scopeEnd;
            this.level = eventName.replace('end', '').toLowerCase() as RenderScopeLevel;
        } else {
            this.position = RenderEventPosition.standalone;
            this.level = eventName as RenderScopeLevel;
        }
    }

    level: RenderScopeLevel;
    position: RenderEventPosition;
}

export class RenderScope {
    constructor(doc: Document, level: RenderScopeLevel, contentRoot?: HTMLElement) {
        this.level = level;
        this.contentRoot = contentRoot;
    }

    level: RenderScopeLevel;
    contentRoot?: HTMLElement;
}

/**
 * This should eventually go in proskomma.d.ts
 */
export type RenderEnvironment<Scratch extends DefaultScratchpad = DefaultScratchpad> = {
    config: any;
    context: RenderContext;
    workspace: RenderWorkspace<Scratch>;
    output: any;
};

export type RenderAction<Scratch extends DefaultScratchpad = DefaultScratchpad> = {
    eventTriggers: Array<RenderEvent>;
    action(environment: RenderEnvironment<Scratch>): void;
};

/**
 * Methodology from
 * https://stackoverflow.com/questions/55570729/how-to-limit-the-keys-of-an-object-to-the-strings-of-an-array-in-typescript
 */
export type ActionDictionary = Partial<{ [key in RenderEvent]: Array<RenderAction> }>;

export type FeatureFlag = { tag: string; enabledValue: string };

export class FeatureSpec<Scratch extends DefaultScratchpad = DefaultScratchpad> {
    constructor(actions: Array<RenderAction<Scratch>>, flag?: FeatureFlag) {
        this.flag = flag;
        this.actions = actions;
    }

    flag?: FeatureFlag;
    actions: Array<RenderAction<Scratch>>;
}

type DefaultScratchpad = Partial<Record<RenderEvent, any>>;

export type RenderScratchpad<Coerce extends DefaultScratchpad = DefaultScratchpad> = Coerce;

export function addToScratchPad<
    E extends RenderEvent,
    T extends DefaultScratchpad = DefaultScratchpad
>(pad: RenderScratchpad<T>, scope: E, values: T[E]) {
    pad[scope] = { ...pad[scope], ...values };
}

export type SequenceType = 'main' | 'title' | 'introduction';

export type RenderWorkspace<Scratch extends DefaultScratchpad = DefaultScratchpad> = {
    document: Document;
    references: ReferenceStore;
    currentTextPosition: {
        chapter: string;
        verse: string;
        phraseIndex?: number;
    };
    showVerseNumbers: boolean;
    verseRangeNumber?: string;
    sequenceTypes: Array<SequenceType>;
    root: HTMLDivElement;
    scopeManager: ScopeManager;
    logSettings: ScriptureLogConfig;
    scratch: RenderScratchpad<Scratch>;
    separatorRegex: RegExp;
    numeralSystem: NumeralSystem;
    verseLayout: string;
};
