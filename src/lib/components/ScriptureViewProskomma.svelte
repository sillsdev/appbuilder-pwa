<!--
@component
A component for displaying scripture.
TODO:
- find a way to scroll smoothly, as CSS only option does not work as expected.
- save graft info so that references can be handled
- parse introduction for references
LOGGING:
- add logs entry to local storage with this value (and change 1 to 0 to disable topic)
    { "scripture" : {"root": 1, "docResult": 1, "document":1, "paragraph": 1, "phrase" :1 , "chapter": 1, "verses": 1, "text": 1, "sequence": 1, "wrapper":1, "milestone":1, "blockGraft": 1, "inlineGraft": 1, "mark": 1, "meta": 1, "row": 1} }
-->
<script module lang="ts">
    export interface Props {
        audioPhraseEndChars: string;
        bodyFontSize: number;
        bodyLineHeight: number;
        bookmarks: Promise<BookmarkItem[]>;
        notes: Promise<NoteItem[]>;
        highlights: Promise<HighlightItem[]>;
        maxSelections: number;
        redLetters: boolean;
        references: ReferenceStore;
        glossary: Promise<GlossaryQueryResult>;
        themeColors: Record<string, string>;
        verseLayout: string;
        viewShowBibleImages: string;
        viewShowBibleVideos: string;
        viewShowIllustrations: boolean;
        viewShowVerses: boolean;
        viewShowGlossaryWords: boolean;
        font: string;
        proskomma: SABProskomma;
    }
</script>

<script lang="ts">
    /* eslint-disable svelte/no-dom-manipulating */

    import { scriptureConfig } from '$assets/config';
    import type { BookmarkItem } from '$lib/data/bookmarks';
    import type { HighlightItem } from '$lib/data/highlights';
    import type { NoteItem } from '$lib/data/notes';
    import { loadDocSetIfNotLoaded } from '$lib/data/scripture';
    import { scriptureLogs, type GlossaryQueryResult } from '$lib/data/stores';
    import type { ReferenceStore } from '$lib/data/stores/reference';
    import EntryView from '$lib/lexicon/components/EntryView.svelte';
    import { renderFeatures } from '$lib/render-sofria';
    import {
        RenderEventDescriptor,
        RenderEventPosition,
        renderEvents,
        RenderScope,
        type ActionDictionary,
        type FeatureSpec,
        type RenderAction,
        type RenderEnvironment,
        type RenderEvent,
        type RenderWorkspace
    } from '$lib/render-sofria/common';
    import ScopeManager from '$lib/render-sofria/ScopeManager';
    import { getSeparatorRegex } from '$lib/render-sofria/util';
    import type { SABProskomma } from '$lib/sab-proskomma';
    import { checkFeatureValueIs, getFeatureValueBoolean } from '$lib/scripts/configUtils';
    import * as numerals from '$lib/scripts/numeralSystem';
    import type { ProskommaRenderAction } from 'proskomma-core';
    import { SofriaRenderFromProskomma } from 'proskomma-json-tools';

    let {
        audioPhraseEndChars,
        bodyFontSize,
        bodyLineHeight,
        bookmarks,
        notes,
        highlights,
        maxSelections,
        redLetters,
        references,
        glossary,
        themeColors,
        verseLayout,
        viewShowBibleImages,
        viewShowBibleVideos,
        viewShowIllustrations,
        viewShowVerses,
        viewShowGlossaryWords,
        font,
        proskomma
    }: Props = $props();

    const currentBook = $derived(references.book);
    const currentChapter = $derived(references.chapter);
    const currentDocset = $derived(references.docSet);

    // const openScopes: Array<RenderScope> = $state([]);
    const scopeManager = $state(new ScopeManager(document, []));

    const actionsDict: ActionDictionary = $derived.by(() => {
        const result: ActionDictionary = {};
        // TODO: ensure iteration is sequential across the list
        // to perform actions for each feature in order specified in render-sofria/common.ts
        for (const f of renderFeatures) {
            const enabled =
                !f.flag ||
                checkFeatureValueIs(
                    scriptureConfig,
                    f.flag.tag,
                    f.flag.enabledValue,
                    references.collection,
                    references.book
                );

            if (f.flag) {
                console.warn(
                    `feature with ${f.flag.tag} === ${f.flag.enabledValue} is ${enabled ? 'enabled' : 'disabled'}`
                );
            }
            if (enabled) {
                for (const a of f.actions) {
                    for (const t of a.eventTriggers) {
                        if (result[t]) {
                            result[t].push(a);
                        } else {
                            result[t] = [a];
                        }
                    }
                }
            }
        }
        console.warn('Compiled actions dictionary: %o', result);
        return result;
    });

    const fontSize = $derived(bodyFontSize + 'px');
    const lineHeight = $derived(bodyLineHeight + '%');
    const direction = $derived(
        scriptureConfig.bookCollections?.find((x) => x.id === references.collection)?.style
            ?.textDirection || 'ltr'
    );
    const numeralSystem = $derived(
        numerals.systemForBook(scriptureConfig, references.collection, currentBook)
    );

    const output: { root?: HTMLDivElement } = {};
    let container: HTMLElement | undefined = $state();
    let scriptureRoot = $state(document.createElement('div'));
    let loading = $state(true);
    let renderWorkspaceInitialized = $state(false);

    async function getCurrentDocumentID(docSet: string, bookCode: string) {
        await loadDocSetIfNotLoaded(proskomma, docSet, fetch);
        const bookDocuments = proskomma.gqlQuerySync(
            '{documents { docSetId id bookCode: header(id: "bookCode") } }'
        );
        console.warn('book query result: %o', bookDocuments);

        for (const doc of bookDocuments?.data?.documents ?? []) {
            console.warn(`Checking current doc ${doc.bookCode} against id ${bookCode}`);
            if (doc.bookCode === bookCode) {
                return doc.id;
            }
        }

        return undefined;
    }

    /**
     * Bootstrap state from this component into the render workspace that
     * Proskomma uses to handle events, for easier access within render actions.
     * @param environment - the render environment on which to set state from this component
     */
    function initRenderWorkspace(
        { workspace }: RenderEnvironment,
        workspaceOptions: Partial<RenderWorkspace> = {}
    ) {
        scriptureRoot.replaceChildren();
        scopeManager.reset();
        workspace.document = document;
        workspace.root = scriptureRoot;
        workspace.scopeManager = scopeManager;
        workspace.sequenceTypes = [];
        workspace.references = references;
        workspace.currentTextPosition = workspace.currentTextPosition ?? {
            chapter: 'none',
            verse: 'none'
        };
        workspace.showVerseNumbers = viewShowVerses;
        workspace.logSettings = $scriptureLogs;
        workspace.scratch = {};
        workspace.numeralSystem = numeralSystem;
        workspace.separatorRegex = getSeparatorRegex(audioPhraseEndChars);
        workspace.verseLayout = verseLayout;
        workspace.viewShowBibleImages = viewShowBibleImages;
        workspace.viewShowIllustrations = viewShowIllustrations;
        workspace.viewShowGlossaryWords = viewShowGlossaryWords;
        workspace.viewShowRedLetters = redLetters;
        workspace.usfmWrapperType = '';
        workspace.textType = [];
        workspace.config = scriptureConfig;

        Object.assign(workspace, workspaceOptions);
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
    function handleSofriaRenderEvent(
        environment: RenderEnvironment,
        eventName: RenderEvent,
        workspaceOptions: Partial<RenderWorkspace> = {}
    ) {
        //console.log('Handling function called for %s on %o', eventName, environment);

        if (!renderWorkspaceInitialized) {
            initRenderWorkspace(environment, workspaceOptions);
            renderWorkspaceInitialized = true;
        }

        for (const a of actionsDict[eventName] ?? []) {
            /* console.log(
                'Processing action for event %s\naction: %o\nenv: %o',
                eventName,
                a,
                environment
            ); */
            // cleanup table scope
            if (
                scopeManager.getScope('table') &&
                !scopeManager.getScope('row') &&
                eventName !== 'startRow'
            ) {
                const scope = scopeManager.removeScope('table');
                if (scope?.contentRoot) {
                    environment.workspace.root.appendChild(scope?.contentRoot);
                }
            }
            if (!a.guard || a.guard(environment)) {
                a.action(environment);
            } else {
                //console.log('Skipped action for event %s', eventName);
            }
        }
    }

    async function renderDocumentSofria(docSet: string, bookCode: string, chapter: string) {
        const actionObject: { [key in RenderEvent]?: ProskommaRenderAction[] } = {};

        // HACK: The introduction is handled as a block graft on chapter 1, so we need to render chapter 1, but only the introduction
        const hackRenderIntro =
            chapter === 'i' &&
            references.catalog.documents.find((x) => x.bookCode === bookCode)?.hasIntroduction;
        if (hackRenderIntro) {
            chapter = '1';
        }
        for (const name of renderEvents) {
            actionObject[name] = [
                {
                    description: `Handling ${name}`,
                    test: () => true,
                    action: (environment: RenderEnvironment) => {
                        handleSofriaRenderEvent(environment, name, { hackRenderIntro });
                    }
                }
            ];
        }

        await loadDocSetIfNotLoaded(proskomma, docSet, fetch);
        const docId = await getCurrentDocumentID(docSet, bookCode);
        console.warn(`found docId ${docId}`);

        renderWorkspaceInitialized = false;

        const pkRenderer = new SofriaRenderFromProskomma({
            proskomma,
            actions: actionObject,
            debugLevel: 0
        });
        pkRenderer.renderDocument({
            docId,
            config: { chapters: [chapter] },
            output
        });

        console.warn('Final rendering output: %o', output.root);
        loading = false;
    }

    $effect(() => {
        renderDocumentSofria(currentDocset, currentBook, currentChapter);
    });
</script>

<article class="container" bind:this={container}>
    {#if loading}
        <span class="spin"></span>
    {/if}
    <div
        id="content"
        bind:this={scriptureRoot}
        class:hidden={loading}
        style:font-family={font}
        style:font-size={fontSize}
        style:line-height={lineHeight}
        class="single mx-2"
        style:direction
    ></div>
</article>
