import type { FeatureConfig, FeatureValue, ScriptureConfig } from '$config';
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
    ProskommaRenderAction,
    RenderConfig
} from 'proskomma-json-tools';
import { getBlock, getElement, getSequence } from './features/common';
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
        const [scope, ...rest] = level.split(':');
        this.level = scope as RenderScopeLevel;
        this.subType = rest.length ? rest.join(':') : undefined;
        this.root = root;
    }

    level: RenderScopeLevel;
    subType?: string;
    root: HTMLElement;

    match(level: RenderScopeWithSubType) {
        const [scope, ...rest] = level.split(':');
        let matches = this.level === scope;
        if (rest.length) {
            matches &&= this.subType === rest.join(':');
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

export type FeatureFlag = ({ feature: string } | { setting: string }) & {
    enabledValue: FeatureValue;
};

export class FeatureSpec<Scratch extends DefaultScratchpad = DefaultScratchpad> {
    constructor(
        name: string,
        actions: Partial<
            Record<
                RenderEvent,
                Omit<RenderAction<Scratch>, 'event'> | Array<Omit<RenderAction<Scratch>, 'event'>>
            >
        >,
        flag?: FeatureFlag | FeatureFlag[]
    ) {
        this.flag = (flag && (Array.isArray(flag) ? flag : [flag])) ?? [];
        this.actions = Object.keys(actions).flatMap((key) => {
            const e = key as RenderEvent;
            const arr = Array.isArray(actions[e]) ? actions[e]! : [actions[e]!];
            return arr.map((a) => ({ ...a, name: a.name || name, event: e }));
        });
        this.name = name;
    }

    private flag: FeatureFlag[];
    readonly actions: Array<RenderAction<Scratch>>;
    readonly name: string;

    private log(enabled: boolean) {
        console.warn(`feature ${this.name} is ${enabled ? 'enabled' : 'disabled'}`);
    }

    enabled(
        config: ScriptureConfig,
        references: RenderWorkspace['stores']['references'],
        settings: FeatureConfig,
        log: boolean
    ): boolean {
        if (!this.flag.length) {
            return true;
        }
        const featureFlags = this.flag.filter((f) => 'feature' in f);
        const featureEnabled = featureFlags.some((f) =>
            checkFeatureValueIs(
                config,
                f.feature,
                f.enabledValue,
                references.collection,
                references.book
            )
        );
        const settingFlags = this.flag.filter((f) => 'setting' in f);
        const settingEnabled = settingFlags.some((f) =>
            checkSettingIs(settings, f.setting, f.enabledValue)
        );
        if (settingFlags.length) {
            if (log) {
                this.log(settingEnabled);
            }
            return settingEnabled;
        } else {
            if (log) {
                this.log(featureEnabled);
            }
            return featureEnabled;
        }
    }
}

type DefaultScratchpad = Partial<Record<RenderScopeLevel, Record<string, unknown>>>;

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
            updateAnnotations: () => void;
        };
        stores: {
            references: ReferenceStore;
            plan: PlanStore;
            currentPlanState: string;
            currentPlanData: PlansData | null;
            t: Record<string, string>;
            language: string;
            lastPlanReference: boolean;
            settings: FeatureConfig;
        };
        queries: {
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
    return (
        workspace.scopeManager.has('blockGraft:introduction') === workspace.hackRenderIntro ||
        (workspace.scopeManager.has('blockGraft:title') && workspace.hackRenderIntro)
    );
}

function errorOnDuplicateSection(section: RenderStage | undefined) {
    return section === 'fallback';
}
function warnOnDuplicateSection(section: RenderStage | undefined) {
    return section === 'init' || section === 'cleanup';
}

/**
 * Compile features into render actions
 * @param features - the features to compile
 * @param options - what to populate the render workspace with
 * @param logErrors - caught errors should be logged (allow disable for testing)
 */
export function compileRenderActions(
    features: FeatureSpec<any>[],
    options: Omit<RenderWorkspace, keyof PKRenderWorkspace>,
    logErrors = true
): Record<string, ProskommaRenderAction<RenderEnvironment>[]> {
    const actionsDict: ActionDictionary = {};
    for (const f of features) {
        if (
            f.enabled(
                options.config,
                options.stores.references,
                options.stores.settings,
                !!options.logSettings.actions
            )
        ) {
            for (const a of f.actions) {
                if (actionsDict[a.event]) {
                    actionsDict[a.event]!.push(a);
                } else {
                    actionsDict[a.event] = [a];
                }
            }
        }
    }
    let errorCount = 0;
    for (const e in actionsDict) {
        const sections = actionsDict[e as RenderEvent]?.reduce(
            (sections, a) => {
                if (a.stage !== 'standard') {
                    sections[a.stage].push(`${a.name}`);
                }
                return sections;
            },
            { init: [], fallback: [], cleanup: [] } as Record<
                Exclude<RenderStage, 'standard'>,
                string[]
            >
        );
        Object.entries(sections ?? {}).forEach(([key, handlers]) => {
            if (handlers.length > 1) {
                const stage = key as RenderStage;
                if (errorOnDuplicateSection(stage)) {
                    errorCount += handlers.length - 1;
                    console.error(
                        `Action handler ${e} has ${handlers.length} handlers in ${stage}.\n%o`,
                        [...handlers]
                    );
                } else if (warnOnDuplicateSection(stage) && options.logSettings.actions) {
                    console.warn(
                        `Action handler ${e} has ${handlers.length} handlers in ${stage}.\n%o`,
                        [...handlers]
                    );
                }
            }
        });
        // sort default handlers to end
        actionsDict[e as RenderEvent]?.sort((a, b) => stages[a.stage] - stages[b.stage]);
    }
    if (options.logSettings.actions) {
        console.warn('Compiled actions dictionary: %o', actionsDict);
    }
    if (errorCount) {
        throw new Error(`Action compilation failed with ${errorCount} error(s).`);
    }

    let initialized = false;

    function initRenderWorkspace(
        target: RenderEnvironment,
        options: Omit<RenderWorkspace, keyof PKRenderWorkspace>
    ) {
        options.root.replaceChildren();

        if (options.logSettings.root) {
            console.log('START: %o', options.root);
        }
        Object.assign(target.workspace, options);
    }

    /**
     * Generic callback for all (currently used) render events generated by Proskomma.
     * Uses a stored stack of scopes to effectively translate the event sequence into a
     * post-order traversal of the output document tree. Child scopes are rendered when
     * their scope ends (i.e., when the respective `end` event is seen).
     *
     * @param environment - the render environment passed in from Proskomma
     * @param eventName   - the Proskomma name of the event (e.g. `startDocument`, `text`)
     */
    function handleRenderEvent(environment: RenderEnvironment, eventName: RenderEvent) {
        if (!initialized) {
            initRenderWorkspace(environment, options);
            initialized = true;
        }
        let execFallback = true;
        for (const a of actionsDict[eventName] ?? []) {
            try {
                if (
                    (a.stage !== 'fallback' || execFallback) &&
                    (!a.guard || a.guard(environment))
                ) {
                    if (environment.workspace.logSettings[RenderEvent2Scope(eventName)]) {
                        console.log(
                            '%s%s [%o]\n%o',
                            prettyRenderEvent(eventName),
                            a.name ? ` - ${a.name}` : '',
                            a.stage,
                            a.details
                                ? a.details(environment)
                                : {
                                      sequence: getSequence(environment.context).type,
                                      element: { ...getElement(environment.context) },
                                      block: { ...getBlock(environment.context) }
                                  }
                        );
                    }
                    a.action(environment);
                    execFallback &&= !!a.stage && a.stage !== 'standard';
                } else {
                    if (environment.workspace.logSettings[RenderEvent2Scope(eventName)]) {
                        /* console.log(
                            'Skipped: %s%s%s',
                            prettyRenderEvent(eventName),
                            a.name ? ` - ${a.name}` : '',
                            ` (${a.section})`
                        ); */
                    }
                }
            } catch (e) {
                if (logErrors) {
                    console.log(`Error encountered while rendering:\n%o\n%o`, a, {
                        ...environment
                    });
                }
                throw e;
            }
        }
    }

    const actions: Record<string, ProskommaRenderAction<RenderEnvironment>[]> = {};
    for (const name of renderEvents) {
        actions[name] = [
            {
                description: `Handling ${name}`,
                test: () => true,
                action: (environment: RenderEnvironment) => handleRenderEvent(environment, name)
            }
        ];
    }
    return actions;
}
