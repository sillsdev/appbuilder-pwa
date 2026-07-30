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

    import type { Action } from '@sveltejs/kit';
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
        RenderEventNamesList,
        RenderEventPosition,
        renderFeatures,
        RenderScope,
        RenderScopeLevel,
        type ActionDictionary,
        type FeatureSpec,
        type RenderAction,
        type RenderEnvironment,
        type RenderEventNames
    } from '$lib/render-sofria/common';
    import type { SABProskomma } from '$lib/sab-proskomma';
    import { checkFeatureValueIs, getFeatureValueBoolean } from '$lib/scripts/configUtils';
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

    const currentBook = $derived(references.book);
    const currentChapter = $derived(references.chapter);
    const currentDocset = $derived(references.docSet);

    const openScopes: Array<RenderScope> = [];

    const actionsDict: ActionDictionary = $derived.by(() => {
        const result: ActionDictionary = {};
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
    let bookRoot = $state(document.createElement('div'));

    let loading = $state(true);

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

    /**
     * Generic callback for all (currently used) render events generated by Proskomma.
     * Uses a stored stack of scopes to effectively translate the event sequence into a
     * post-order traversal of the output document tree. Child scopes are rendered when
     * their scope ends (i.e., when the respective `end` event is seen).
     *
     * @param environment - the render environment passed in from Proskomma
     * @param eventName   - the Proskomma name of the event (e.g. `startDocument`, `text`)
     */
    function handleSofriaRenderEvent(environment: any, eventName: RenderEventNames) {
        console.log('Handling function called for %s on %o', eventName, environment);

        const eventDetails = new RenderEventDescriptor(eventName);

        if (eventDetails.position === RenderEventPosition.scopeStart) {
            openScopes.unshift(new RenderScope(document, eventDetails.level));
        }

        if (actionsDict[eventName]) {
            for (const a of actionsDict[eventName]) {
                a.action(environment);
                if (a.output) {
                    openScopes[0].contentRoot?.appendChild(a.output);
                }
            }
        }

        if (eventDetails.position === RenderEventPosition.scopeEnd) {
            // TODO: check for errors when stack is already empty
            const topScope = openScopes.shift();
            if (topScope?.contentRoot) {
                if (openScopes.length > 0) {
                    openScopes[0].contentRoot?.appendChild(topScope.contentRoot);
                } else {
                    environment.output.root = topScope.contentRoot;
                }
            }
        }
    }

    async function renderCurrentDocument(docSet: string, bookCode: string, chapter: string) {
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
