/**
 * Test harness: USFM -> SABProskomma -> SofriaRenderFromProskomma -> render-sofria features -> DOM.
 *
 * Uses the real `renderFeatures` list and `compileActionDictionary`. The per-event dispatch loop
 * mirrors `handleSofriaRenderEvent` in `ScriptureViewProskomma.svelte`; if that loop changes,
 * this copy must change with it (or the loop should be extracted so both share it).
 */
import type { ScriptureConfig } from '$config';
import { SABProskomma } from '$lib/sab-proskomma';
import * as numerals from '$lib/scripts/numeralSystem';
import type { ProskommaRenderAction } from 'proskomma-core';
import { SofriaRenderFromProskomma } from 'proskomma-json-tools';
import {
    applyFilters,
    usfmFilterFunctions,
    type ConvertBookContext
} from '../../../../convert/convertBooks';
import {
    compileActionDictionary,
    renderEvents,
    type RenderEnvironment,
    type RenderEvent,
    type RenderWorkspace
} from '../common';
import { renderFeatures } from '../index';
import ScopeManager from '../ScopeManager';
import { getSeparatorRegex } from '../util';

export const COLLECTION = 'C01';
export const BOOK = 'GEN';

export type RenderOptions = {
    /** chapter to render (default '1') */
    chapter?: string;
    /** overrides for `mainFeatures` (e.g. `{ 'show-glossary-words': true }`) */
    features?: Record<string, unknown>;
    /** user settings (e.g. `{ 'verse-numbers': true }`) */
    settings?: Record<string, unknown>;
    redLetters?: boolean;
    /** treat the book as a Bible book (affects phrase ids / data-verse attributes) */
    bibleBook?: boolean;
    hackRenderIntro?: boolean;
    /** run the real `convert/convertBooks.ts` USFM filter chain before import (default true) */
    convert?: boolean;
};

const DEFAULT_FEATURES = {
    'show-chapter-numbers': true,
    'show-verse-numbers': true,
    'show-glossary-words': false,
    'show-illustrations': true,
    'chapter-number-format': 'normal'
};

const DEFAULT_SETTINGS = {
    'verse-numbers': true,
    'glossary-words': false,
    'display-images-in-bible-text': 'normal',
    'display-videos-in-bible-text': 'normal'
};

function makeConfig(options: RenderOptions): ScriptureConfig {
    return {
        mainFeatures: { ...DEFAULT_FEATURES, ...options.features },
        bookCollections: [
            {
                id: COLLECTION,
                languageCode: 'eng',
                features: { 'ref-verse-range-separator': '-' },
                style: { textDirection: 'ltr' },
                books: [
                    {
                        id: BOOK,
                        testament: options.bibleBook === false ? '' : 'OT',
                        features: {}
                    }
                ]
            }
        ],
        illustrations: [],
        videos: [],
        audio: { files: [], sources: {} }
    } as unknown as ScriptureConfig;
}

/** Import `usfm` (an `\id` line is added if missing) and render one chapter into a detached div. */
export function renderUsfm(usfm: string, options: RenderOptions = {}): HTMLDivElement {
    let content = /^\s*\\id /.test(usfm) ? usfm : `\\id ${BOOK} test\n${usfm}`;
    const config = makeConfig(options);
    if (options.convert ?? true) {
        const ctx: ConvertBookContext = {
            dataDir: 'data',
            scriptureConfig: config,
            verbose: 0,
            lang: 'eng',
            docSet: `eng_${COLLECTION}`,
            bcId: COLLECTION
        };
        content = applyFilters(content, usfmFilterFunctions, COLLECTION, BOOK, ctx);
    }
    const pk = new SABProskomma();
    pk.importDoc({ lang: 'eng', abbr: COLLECTION }, 'usfm', content, []);
    const docId: string = pk.gqlQuerySync('{ documents { id } }').data.documents[0].id;

    const settings = { ...DEFAULT_SETTINGS, ...options.settings };
    const references = {
        docSet: `eng_${COLLECTION}`,
        collection: COLLECTION,
        book: BOOK,
        chapter: options.chapter ?? '1',
        verse: '1',
        hasAudio: false
    } as unknown as RenderWorkspace['stores']['references'];
    const logSettings = {} as RenderWorkspace['logSettings'];

    const actionsDict = compileActionDictionary(
        renderFeatures,
        config,
        references,
        settings as never,
        logSettings
    );

    const root = document.createElement('div');
    let initialized = false;

    function init(workspace: RenderWorkspace) {
        workspace.document = document;
        workspace.root = root;
        workspace.scopeManager = new ScopeManager();
        workspace.currentTextPosition = { verse: 'none' };
        workspace.logSettings = logSettings;
        workspace.scratch = {};
        workspace.textConfig = {
            numeralSystem: numerals.systemFromString('Default'),
            separatorRegex: getSeparatorRegex('.?!'),
            verseRangeSeparator: '-'
        };
        workspace.config = config;
        workspace.viewSettings = {
            isBibleBook: options.bibleBook ?? true,
            redLetters: options.redLetters ?? false,
            verseLayout: 'paragraphs'
        };
        workspace.hackRenderIntro = options.hackRenderIntro ?? false;
        const noop = () => {};
        workspace.events = {
            navigate: noop,
            openFootnoote: noop,
            openGlossary: noop,
            setPlanStore: noop,
            clickHeaderRef: noop,
            clickText: noop,
            updateAnnotations: noop
        };
        workspace.stores = {
            references,
            plan: { planEntry: -1 } as never,
            currentPlanState: '',
            currentPlanData: null,
            t: {},
            language: 'eng',
            lastPlanReference: false,
            settings: settings as never
        };
        workspace.queries = { glossary: Promise.resolve({} as never) };
    }

    // Mirrors handleSofriaRenderEvent (ScriptureViewProskomma.svelte)
    function dispatch(environment: RenderEnvironment, eventName: RenderEvent) {
        if (!initialized) {
            init(environment.workspace);
            initialized = true;
        }
        let execFallback = true;
        for (const a of actionsDict[eventName] ?? []) {
            if ((a.stage !== 'fallback' || execFallback) && (!a.guard || a.guard(environment))) {
                a.action(environment);
                execFallback &&= !!a.stage && a.stage !== 'standard';
            }
        }
    }

    const actions: Record<string, ProskommaRenderAction[]> = {};
    for (const name of renderEvents) {
        actions[name] = [
            {
                description: `Handling ${name}`,
                test: () => true,
                action: (environment: RenderEnvironment) => dispatch(environment, name)
            }
        ];
    }

    const output: { root?: HTMLDivElement } = {};
    new SofriaRenderFromProskomma({ proskomma: pk, actions, debugLevel: 0 }).renderDocument({
        docId,
        config: { chapters: [options.chapter ?? '1'] },
        output
    });
    return root;
}
