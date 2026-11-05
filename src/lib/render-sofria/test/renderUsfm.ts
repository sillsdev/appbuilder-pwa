/**
 * Test harness: USFM -> SABProskomma -> SofriaRenderFromProskomma -> render-sofria features -> DOM.
 *
 * Uses the real `renderFeatures` list and `compileActionDictionary`. The per-event dispatch loop
 * mirrors `handleSofriaRenderEvent` in `ScriptureViewProskomma.svelte`; if that loop changes,
 * this copy must change with it (or the loop should be extracted so both share it).
 */
import type { BookSourceType, ScriptureConfig } from '$config';
import { SABProskomma } from '$lib/sab-proskomma';
import * as numerals from '$lib/scripts/numeralSystem';
import { test_generateReferenceLinkHTML } from '$lib/scripts/scripture-reference-utils';
import { SofriaRenderFromProskomma } from 'proskomma-json-tools';
import {
    applyFilters,
    usfmFilterFunctions,
    type ConvertBookContext
} from '../../../../convert/convertBooks';
import { parseCustomTags } from '../../../../convert/convertConfig';
import { catalog } from '../../../../test_data/data/catalog';
import { compileRenderActions, type RenderWorkspace } from '../common';
import { renderFeatures } from '../index';
import ScopeManager from '../ScopeManager';
import { getSeparatorRegex } from '../util';

export const COLLECTION = 'C01';
export const BOOK = 'GEN';
export const BOOK_NAME = 'Genesis';

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
    /** `viewSettings.verseLayout` (default 'paragraphs') */
    verseLayout?: RenderWorkspace['viewSettings']['verseLayout'];
    /** run the real `convert/convertBooks.ts` USFM filter chain before import (default true) */
    convert?: boolean;
    bcGlossary?: string[];
    /** `config.illustrations` (appDef-placed illustrations) */
    illustrations?: ScriptureConfig['illustrations'];
    /** `config.videos` (\\video ids and appDef-placed videos) */
    videos?: ScriptureConfig['videos'];
    /** `config.audio` (audio sources and files, used by audio clips) */
    audio?: ScriptureConfig['audio'];
    verseRange?: { start: number; end: number };
    footer?: string;
    sourceFormat?: BookSourceType;
    styles?: {
        name: string;
        type?: string;
        category?: string;
        properties: {
            [key: string]: string;
        };
    }[];
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
                features: {
                    'ref-verse-range-separator': '-',
                    'ref-chapter-verse-separator': ':',
                    'show-scripture-refs': true
                },
                style: { textDirection: 'ltr' },
                books: [
                    {
                        id: BOOK,
                        name: BOOK_NAME,
                        testament: options.bibleBook === false ? '' : 'OT',
                        features: {},
                        footer: options.footer,
                        sourceFormat: options.sourceFormat
                    }
                ]
            }
        ],
        illustrations: options.illustrations ?? [],
        videos: options.videos ?? [],
        audio: options.audio ?? { files: [], sources: {} },
        styles: options.styles,
        customTags: parseCustomTags(options.styles)
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
    pk.importDoc({ lang: 'eng', abbr: COLLECTION }, 'usfm', content, [], config.customTags);
    const docId: string = pk.gqlQuerySync('{ documents { id } }').data.documents[0].id;

    const root = document.createElement('div');

    const noop = () => {};

    const refs = {
        docSet: `eng_${COLLECTION}`,
        collection: COLLECTION,
        book: BOOK,
        chapter: options.chapter ?? '1',
        verse: '1',
        hasAudio: !!options.hasAudio,
        sourceFormat: options.sourceFormat
    } as unknown as RenderWorkspace['stores']['references'];

    const actions = compileRenderActions(
        renderFeatures,
        {
            document: document,
            root,
            scopeManager: new ScopeManager(),
            currentTextPosition: { verse: 'none', render: !options.verseRange },
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
                verseLayout: options.verseLayout ?? 'paragraphs',
                verseRange: options.verseRange
            },
            hackRenderIntro: options.hackRenderIntro ?? false,
            events: {
                navigate: noop,
                openFootnote: noop,
                openGlossary: noop,
                setPlanStore: noop,
                openCrossRef: noop,
                clickText: noop,
                updateAnnotations: noop
            },
            stores: {
                references: refs,
                plan: { planEntry: -1 } as never,
                currentPlanState: '',
                currentPlanData: null,
                t: {},
                language: 'eng',
                lastPlanReference: false,
                settings: { ...DEFAULT_SETTINGS, ...options.settings }
            },
            queries: { glossary: Promise.resolve({} as never) },
            functions: {
                generateReferenceLinkHTML: (crossRef, refClass, linkHref) =>
                    test_generateReferenceLinkHTML(
                        crossRef,
                        refClass,
                        linkHref,
                        refs,
                        config.bookCollections,
                        catalog[0]
                    )
            }
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
