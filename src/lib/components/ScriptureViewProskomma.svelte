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
        bodyFontSize: any;
        bodyLineHeight: any;
        bookmarks: any;
        notes: any;
        highlights: any;
        maxSelections: any;
        redLetters: boolean;
        references: any;
        glossary: any;
        selectedVerses: any;
        themeColors: any;
        verseLayout: any;
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
    import { scriptureLogs } from '$lib/data/stores';
    import EntryView from '$lib/lexicon/components/EntryView.svelte';
    import { renderFeatures } from '$lib/render-sofria';
    import {
        RenderEventDescriptor,
        RenderEventNamesList,
        RenderEventPosition,
        RenderScope,
        RenderScopeLevel,
        type ActionDictionary,
        type FeatureSpec,
        type RenderAction,
        type RenderEnvironment,
        type RenderEventNames,
        type RenderWorkspace
    } from '$lib/render-sofria/common';
    import ScopeManager from '$lib/render-sofria/ScopeManager';
    import { getSeparatorRegex } from '$lib/render-sofria/util';
    import type { SABProskomma } from '$lib/sab-proskomma';
    import { checkFeatureValueIs, getFeatureValueBoolean } from '$lib/scripts/configUtils';
    import type { ProskommaRenderAction } from 'proskomma-core';
    import { SofriaRenderFromProskomma } from 'proskomma-json-tools';
    import { fromStore, type Readable } from 'svelte/store';
    import ScriptureViewSofria from './ScriptureViewSofria.svelte';

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
        selectedVerses,
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
            if (
                !f.flag ||
                checkFeatureValueIs(
                    scriptureConfig,
                    f.flag.tag,
                    f.flag.enabledValue,
                    references.collection,
                    references.book
                )
            ) {
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
    function initRenderWorkspace({ workspace, output }: RenderEnvironment) {
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
        workspace.logSettings = scriptureLogs;
        workspace.separatorRegex = getSeparatorRegex(audioPhraseEndChars);
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
    function handleSofriaRenderEvent(environment: RenderEnvironment, eventName: RenderEventNames) {
        console.log('Handling function called for %s on %o', eventName, environment);

        if (!renderWorkspaceInitialized) {
            initRenderWorkspace(environment);
            renderWorkspaceInitialized = true;
        }

        for (const a of actionsDict[eventName] ?? []) {
            console.log('Processing action %o for event %s', a, eventName);
            a.action(environment);
        }
    }

    async function renderDocumentSofria(docSet: string, bookCode: string, chapter: string) {
        const actionObject: { [key in RenderEventNames]?: ProskommaRenderAction[] } = {};
        for (const name of RenderEventNamesList) {
            actionObject[name] = [
                {
                    description: `Handling ${name}`,
                    test: () => true,
                    action: (environment: RenderEnvironment) => {
                        handleSofriaRenderEvent(environment, name);
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
        class="single"
        style:direction
    ></div>
</article>
