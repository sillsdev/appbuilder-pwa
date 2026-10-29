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
import { SofriaRenderFromProskomma } from 'proskomma-json-tools';
import {
    applyFilters,
    usfmFilterFunctions,
    type ConvertBookContext
} from '../../../../convert/convertBooks';
import { compileRenderActions, type RenderWorkspace } from '../common';
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
    /** overrides for `traits` (e.g. `{ 'has-glossary': true }`) */
    traits?: Record<string, unknown>;
    /** user settings (e.g. `{ 'verse-numbers': true }`) */
    settings?: Record<string, unknown>;
    redLetters?: boolean;
    /** treat the book as a Bible book (affects phrase ids / data-verse attributes) */
    bibleBook?: boolean;
    hasAudio?: boolean;
    hackRenderIntro?: boolean;
    /** run the real `convert/convertBooks.ts` USFM filter chain before import (default true) */
    convert?: boolean;
    bcGlossary?: string[];
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
        traits: options.traits,
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
            bcId: COLLECTION,
            bcGlossary: options.bcGlossary ?? []
        };
        content = applyFilters(content, usfmFilterFunctions, COLLECTION, BOOK, ctx);
    }
    const pk = new SABProskomma();
    pk.importDoc({ lang: 'eng', abbr: COLLECTION }, 'usfm', content, []);
    const docId: string = pk.gqlQuerySync('{ documents { id } }').data.documents[0].id;

    const root = document.createElement('div');

    const noop = () => {};

    const actions = compileRenderActions(
        renderFeatures,
        {
            document: document,
            root,
            scopeManager: new ScopeManager(),
            currentTextPosition: { verse: 'none' },
            logSettings: {} as RenderWorkspace['logSettings'],
            scratch: {},
            textConfig: {
                numeralSystem: numerals.systemFromString('Default'),
                separatorRegex: getSeparatorRegex('.?!,;'),
                verseRangeSeparator: '-'
            },
            config,
            viewSettings: {
                isBibleBook: options.bibleBook ?? true,
                redLetters: options.redLetters ?? false,
                verseLayout: 'paragraphs'
            },
            hackRenderIntro: options.hackRenderIntro ?? false,
            events: {
                navigate: noop,
                openFootnoote: noop,
                openGlossary: noop,
                setPlanStore: noop,
                clickHeaderRef: noop,
                clickText: noop,
                updateAnnotations: noop
            },
            stores: {
                references: {
                    docSet: `eng_${COLLECTION}`,
                    collection: COLLECTION,
                    book: BOOK,
                    chapter: options.chapter ?? '1',
                    verse: '1',
                    hasAudio: !!options.hasAudio
                } as unknown as RenderWorkspace['stores']['references'],
                plan: { planEntry: -1 } as never,
                currentPlanState: '',
                currentPlanData: null,
                t: {},
                language: 'eng',
                lastPlanReference: false,
                settings: { ...DEFAULT_SETTINGS, ...options.settings }
            },
            queries: { glossary: Promise.resolve({} as never) }
        },
        false
    );

    const output: { root?: HTMLDivElement } = {};
    new SofriaRenderFromProskomma({ proskomma: pk, actions, debugLevel: 0 }).renderDocument({
        docId,
        config: { chapters: [options.chapter ?? '1'] },
        output
    });
    return root;
}
