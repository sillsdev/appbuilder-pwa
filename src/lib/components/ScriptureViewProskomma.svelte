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
        // we don't actually care about this value, we just care if it changes
        selectedVerses: Readable<unknown>;
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
    import { type GlossaryQueryResult } from '$lib/data/stores';
    import type { Reference, ReferenceStore } from '$lib/data/stores/reference';
    import EntryView from '$lib/lexicon/components/EntryView.svelte';
    import {
        RenderEventDescriptor,
        RenderEventNames,
        RenderEventPosition,
        RenderScope,
        RenderScopeLevel,
        type FeatureSpec,
        type RenderAction
    } from '$lib/render-sofria/common';
    import type { SABProskomma } from '$lib/sab-proskomma';
    import { getFeatureValueBoolean } from '$lib/scripts/configUtils';
    import type { ProskommaRenderAction } from 'proskomma-core';
    import { SofriaRenderFromProskomma } from 'proskomma-json-tools';
    import { fromStore, type Readable } from 'svelte/store';

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

    const fontSize = $derived(bodyFontSize + 'px');
    const lineHeight = $derived(bodyLineHeight + '%');
    const direction = $derived(
        scriptureConfig.bookCollections?.find((x) => x.id === references.collection)?.style
            ?.textDirection || 'ltr'
    );

    const renderFeatures: Array<FeatureSpec> = getEnabledRenderFeatures();
    const renderActions = renderFeatures.flatMap((v) => ({ ...v.actions }));
    const actionsDict: { [key: string]: Array<RenderAction> } = {};
    for (const a of renderActions) {
        for (const s of a.scopeLevels) {
            // TODO: figure out how to map to actual event names
            actionsDict[s].push(a);
        }
    }
    const openScopes: Array<RenderScope> = [];

    function getEnabledRenderFeatures() {
        return [];
    }

    function handleSofriaRenderEvent(environment: any, eventName: string) {
        console.log('Handling function called for %s on %o', eventName, environment);
        const eventDetails = new RenderEventDescriptor(eventName);
        let topScope: RenderScope | undefined;

        switch (eventDetails.position) {
            case RenderEventPosition.scopeStart:
                openScopes.unshift(new RenderScope(document, eventDetails.level));
                break;
            case RenderEventPosition.scopeEnd:
                topScope = openScopes.shift();
                if (topScope?.level === eventDetails.level) {
                    console.log(`---> Matched end scope type: ${eventDetails.level}`);
                    for (const action of actionsDict[eventName]) {
                        // perform action
                        // append result to content root
                        // update workspace if needed
                    }
                }
                break;
            case RenderEventPosition.standalone:
                // similar as for RenderEventType.end
                break;
        }
    }

    type Environment = {
        config: any;
        context: any;
        workspace: any;
        output: any;
    };

    const currentBook = $derived(references.book);
    const currentChapter = $derived(references.chapter);
    const currentDocset = $derived(references.docSet);

    async function getCurrentDocumentID() {
        await loadDocSetIfNotLoaded(proskomma, currentDocset, fetch);
        const bookDocuments = proskomma.gqlQuerySync(
            '{documents { docSetId id bookCode: header(id: "bookCode") } }'
        );
        console.warn('book query result: %o', bookDocuments);

        for (const doc of bookDocuments?.data?.documents ?? []) {
            console.warn(`Checking current docset ${currentDocset} against id ${doc.docSetId}`);
            if (currentDocset === doc.docSetId) {
                return doc.id;
            }
        }

        return undefined;
    }

    let container: HTMLElement | undefined = $state();
    let loading = $state(true);
    let bookRoot = $state(document.createElement('div'));

    const output: { root?: HTMLDivElement } = {};

    async function renderCurrentDocument(docSet: string, bookCode: string, chapter: string) {
        const actionObject: { [key: string]: ProskommaRenderAction[] } = {};
        for (var name of RenderEventNames) {
            actionObject[name] = [
                {
                    description: `Handling ${name}`,
                    test: () => true,
                    action: (environment: Environment) => {
                        handleSofriaRenderEvent(environment, name);
                    }
                }
            ];
        }

        await loadDocSetIfNotLoaded(proskomma, docSet, fetch);
        const docId = await getCurrentDocumentID();
        console.warn(`found docId ${docId}`);

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

        bookRoot = output.root ?? bookRoot;
        loading = false;
    }

    $effect(() => {
        renderCurrentDocument(currentDocset, currentBook, currentChapter);
    });
</script>

<article class="container" bind:this={container}>
    {#if loading}
        <span class="spin"></span>
    {/if}
    <div
        id="content"
        bind:this={bookRoot}
        class:hidden={loading}
        style:font-family={font}
        style:font-size={fontSize}
        style:line-height={lineHeight}
        class="single"
        style:direction
    ></div>
</article>
