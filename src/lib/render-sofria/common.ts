import type { ScriptureConfig } from '$config';
import type { ScriptureLogConfig } from '$lib/data/stores';
import type { ReferenceStore } from '$lib/data/stores/reference';
import type { NumeralSystem } from '$lib/scripts/numeralSystem';
import type {
    RenderWorkspace as PKRenderWorkspace,
    RenderConfig,
    RenderContext
} from 'proskomma-json-tools';
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
const additionalScopes = ['table', 'unsupported', 'phrase'] as const;

export type RenderScopeLevel =
    | Lowercase<(typeof boundedScopes)[number]>
    | (typeof independentScopes | typeof additionalScopes)[number];

export type RenderScopeWithSubType = RenderScopeLevel | `${RenderScopeLevel}:${string}`;

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
    constructor(doc: Document, level: RenderScopeWithSubType, root: HTMLElement) {
        const parts = level.split(':');
        this.level = parts[0] as RenderScopeLevel;
        this.subType = parts[1];
        this.root = root;
    }

    level: RenderScopeLevel;
    subType?: string;
    root: HTMLElement;

    match(level: RenderScopeWithSubType) {
        const parts = level.split(':');
        let matches = this.level === parts[0];
        if (parts[1]) {
            matches &&= this.subType === parts[1];
        }
        return matches;
    }
}

/**
 * This should eventually go in proskomma.d.ts
 */
export type RenderEnvironment<Scratch extends DefaultScratchpad = DefaultScratchpad> = {
    config: RenderConfig;
    context: RenderContext;
    workspace: RenderWorkspace<Scratch>;
    output: any;
};

/**
 * pass `default: true` if this is meant to be a fallback after other actions have been filtered out. required if no guard is specified
 */
export type RenderAction<Scratch extends DefaultScratchpad = DefaultScratchpad> = Readonly<
    {
        event: RenderEvent;
        name?: string;
        action(environment: RenderEnvironment<Scratch>): void;
    } & ({ guard: Guard<Scratch>; default?: boolean } | { default: true; guard?: Guard<Scratch> })
>;

type Guard<Scratch extends DefaultScratchpad> = (
    environment: RenderEnvironment<Scratch>
) => boolean | undefined;

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
    actions: Readonly<Array<RenderAction<Scratch>>>;
}

type DefaultScratchpad = Partial<Record<RenderScopeLevel, any>>;

export type RenderScratchpad<Coerce extends DefaultScratchpad = DefaultScratchpad> = Coerce;

export function addToScratchPad<
    S extends RenderScopeLevel,
    T extends DefaultScratchpad = DefaultScratchpad
>(pad: RenderScratchpad<T>, scope: S, values: T[S]) {
    pad[scope] = { ...pad[scope], ...values };
}

export type SequenceType = 'main' | 'title' | 'introduction';

export type RenderWorkspace<Scratch extends DefaultScratchpad = DefaultScratchpad> =
    PKRenderWorkspace & {
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
        viewShowBibleImages: string;
        viewShowIllustrations: boolean;
        viewShowGlossaryWords: boolean;
        viewShowRedLetters: boolean;
        usfmWrapperType: string;
        textType: string[];
        config: Readonly<ScriptureConfig>;
        hackRenderIntro: boolean;
    };

/**
 * returns true if:
 * 1. Proskomma has encountered an introduction block graft and we are rendering the introduction instead of chapter 1.
 * OR
 * 2. Proskomma has not encountered an introduction block graft and we are rendering a chapter normally.
 * OR
 * 3. Proskomma has encountered a title block graft and we are rendering the introduction instead of chapter 1.
 */
export function renderIfRegularOrIfHackedIntro(workspace: RenderWorkspace) {
    const hasIntroductionGraft = !!workspace.scopeManager.find('blockGraft:introduction');
    const hasTitleGraft = !!workspace.scopeManager.find('blockGraft:title');
    return (
        hasIntroductionGraft === workspace.hackRenderIntro ||
        (hasTitleGraft && workspace.hackRenderIntro)
    );
}
