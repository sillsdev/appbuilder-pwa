import type { FeatureConfig, ScriptureConfig } from '$config';
import type { BookmarkItem } from '$lib/data/bookmarks';
import type { HighlightItem } from '$lib/data/highlights';
import type { NoteItem } from '$lib/data/notes';
import type { PlansData } from '$lib/data/plansData';
import {
    checkSettingIs,
    type GlossaryBlock,
    type GlossaryQueryResult,
    type Modal,
    type PlanStore,
    type ScriptureLogConfig
} from '$lib/data/stores';
import type { Reference, ReferenceStore } from '$lib/data/stores/reference';
import { checkFeatureValueIs } from '$lib/scripts/configUtils';
import type { NumeralSystem } from '$lib/scripts/numeralSystem';
import type {
    RenderContext as PKRenderContext,
    RenderWorkspace as PKRenderWorkspace,
    RenderConfig
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
    'Row',
    'Table'
] as const;
type StartScope = `start${(typeof boundedScopes)[number]}`;
type EndScope = `end${(typeof boundedScopes)[number]}`;
const independentScopes = ['text', 'metaContent', 'mark', 'blockGraft', 'inlineGraft'] as const;
const additionalScopes = ['phrase'] as const;

export type RenderScopeLevel =
    | Lowercase<(typeof boundedScopes)[number]>
    | (typeof independentScopes | typeof additionalScopes)[number];

export type RenderScopeWithSubType = RenderScopeLevel | `${RenderScopeLevel}:${string}`;

export const renderEvents = [
    ...boundedScopes.flatMap((s) => [`start${s}`, `end${s}`]),
    ...independentScopes
] as const as RenderEvent[];
export type RenderEvent = StartScope | EndScope | (typeof independentScopes)[number];

export function RenderEvent2Scope(event: RenderEvent) {
    if (event.startsWith('start')) {
        return event.replace('start', '').toLowerCase() as RenderScopeLevel;
    } else if (event.startsWith('end')) {
        return event.replace('end', '').toLowerCase() as RenderScopeLevel;
    } else {
        return event as RenderScopeLevel;
    }
}

export function prettyRenderEvent(event: RenderEvent) {
    const caps = event.replaceAll(/[a-z]/g, '');
    return event
        .split(/[A-Z]/)
        .map((p, i) => {
            if (i === 0) {
                return p.replace(/^([a-z])/, (match) => match.toUpperCase());
            } else {
                return caps[i - 1] + p;
            }
        })
        .join(' ');
}

export class RenderScope {
    constructor(level: RenderScopeWithSubType, root: HTMLElement) {
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
    context: PKRenderContext;
    workspace: RenderWorkspace<Scratch>;
    output: any;
};

const stages = {
    init: 0,
    standard: 1,
    fallback: 2,
    cleanup: 3
} as const;

/**
 * - `standard`: nothing special happens here
 * - `fallback`: intended to be run after all standard actions but before cleanup. functions like the `default` clause of a `switch-case`
 * - `init`: run before all other actions
 * - `cleanup`: run after all other actions
 */
type RenderStage = keyof typeof stages;

export type RenderAction<Scratch extends DefaultScratchpad = DefaultScratchpad> = Readonly<{
    event: RenderEvent;
    name?: string;
    details?: (environment: RenderEnvironment<Scratch>) => unknown;
    stage: RenderStage;
    guard?: (environment: RenderEnvironment<Scratch>) => boolean | undefined;
    action: (environment: RenderEnvironment<Scratch>) => void;
}>;

export function noaction() {}

/**
 * Methodology from
 * https://stackoverflow.com/questions/55570729/how-to-limit-the-keys-of-an-object-to-the-strings-of-an-array-in-typescript
 */
export type ActionDictionary = Partial<{ [key in RenderEvent]: Array<RenderAction> }>;

export type FeatureFlag = { tag: string; enabledValue: string };

export class FeatureSpec<Scratch extends DefaultScratchpad = DefaultScratchpad> {
    constructor(actions: Array<RenderAction<Scratch>>, name?: string, flag?: FeatureFlag) {
        this.flag = flag;
        this.actions = actions.map((a) => ({ ...a, name: a.name || name }));
    }

    flag?: FeatureFlag;
    actions: Array<RenderAction<Scratch>>;
}

type DefaultScratchpad = Partial<Record<RenderScopeLevel, any>>;

export type RenderScratchpad<Coerce extends DefaultScratchpad = DefaultScratchpad> = Coerce;

export function addToScratchPad<
    S extends RenderScopeLevel,
    T extends DefaultScratchpad = DefaultScratchpad
>(pad: RenderScratchpad<T>, scope: S, values: T[S]) {
    pad[scope] = { ...pad[scope], ...values };
}

export type RenderWorkspace<Scratch extends DefaultScratchpad = DefaultScratchpad> =
    PKRenderWorkspace & {
        document: Document;
        currentTextPosition: {
            chapter: string;
            verse: string;
            phraseIndex?: number;
        };
        root: HTMLDivElement;
        scopeManager: ScopeManager;
        logSettings: ScriptureLogConfig;
        scratch: RenderScratchpad<Scratch>;
        textConfig: {
            separatorRegex: RegExp;
            numeralSystem: NumeralSystem;
            verseRangeSeparator: string;
        };
        viewSettings: {
            isBibleBook: boolean;
            redLetters: boolean;
            verseLayout: string;
            verseRangeNumber?: string;
        };
        config: Readonly<ScriptureConfig>;
        hackRenderIntro: boolean;
        events: {
            navigate: (refs: Reference) => void;
            openFootnoote: (event: MouseEvent, footnoteId: string) => void;
            openGlossary: (link: string, block: GlossaryBlock) => void;
            setPlanStore: (data: PlanStore) => void;
            clickHeaderRef: (
                event: MouseEvent,
                target: HTMLElement,
                workspace: RenderWorkspace
            ) => void;
            clickText: (event: MouseEvent) => void;
        };
        stores: {
            references: ReferenceStore;
            plan: PlanStore;
            currentPlanState: string;
            currentPlanData: PlansData | null;
            t: Record<string, string>;
            language: string;
            lastPlanReference: boolean;
            themeColors: Record<string, string>;
            modal: Modal;
            settings: FeatureConfig;
        };
        queries: {
            notes: Promise<NoteItem[]>;
            bookmarks: Promise<BookmarkItem[]>;
            highlights: Promise<HighlightItem[]>;
            glossary: Promise<GlossaryQueryResult>;
        };
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

function errorOnDuplicateSection(section: RenderStage | undefined) {
    return section === 'fallback';
}
function warnOnDuplicateSection(section: RenderStage | undefined) {
    return section === 'init' || section === 'cleanup';
}

export function compileActionDictionary(
    features: FeatureSpec<any>[],
    config: Readonly<ScriptureConfig>,
    references: ReferenceStore,
    settings: FeatureConfig
) {
    const result: ActionDictionary = {};
    for (const f of features) {
        const enabled =
            !f.flag ||
            checkFeatureValueIs(
                config,
                f.flag.tag,
                f.flag.enabledValue,
                references.collection,
                references.book
            ) ||
            checkSettingIs(settings, f.flag.tag, f.flag.enabledValue);

        if (f.flag) {
            console.warn(
                `feature with ${f.flag.tag} === ${f.flag.enabledValue} is ${enabled ? 'enabled' : 'disabled'}`
            );
        }
        if (enabled) {
            for (const a of f.actions) {
                if (result[a.event]) {
                    result[a.event]!.push(a);
                } else {
                    result[a.event] = [a];
                }
            }
        }
    }
    let errorCount = 0;
    for (const e in result) {
        const sections = {} as Record<RenderStage, string>;
        result[e as RenderEvent]?.forEach((a) => {
            if (errorOnDuplicateSection(a.stage)) {
                if (sections[a.stage]) {
                    console.error(
                        `Action handler ${e} has more than one handler in ${a.stage}. Encountered: ${a.name}, Existing: ${sections[a.stage]}`
                    );
                    errorCount++;
                } else {
                    sections[a.stage] = `${a.name}`;
                }
            } else if (warnOnDuplicateSection(a.stage)) {
                if (sections[a.stage]) {
                    console.warn(
                        `Action handler ${e} has more than one handler in ${a.stage}. Encountered: ${a.name}, Existing: ${sections[a.stage]}`
                    );
                } else {
                    sections[a.stage] = `${a.name}`;
                }
            }
        });
        // sort default handlers to end
        result[e as RenderEvent]?.sort(
            (a, b) => stages[a.stage ?? 'standard'] - stages[b.stage ?? 'standard']
        );
    }
    console.warn('Compiled actions dictionary: %o', result);
    if (errorCount) {
        throw new Error(`Action compilation failed with ${errorCount} error(s).`);
    }
    return result;
}
