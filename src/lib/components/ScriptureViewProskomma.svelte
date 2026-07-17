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

    import { randomUUID, type UUID } from 'crypto';
    import { scriptureConfig } from '$assets/config';
    import type { BookmarkItem } from '$lib/data/bookmarks';
    import type { HighlightItem } from '$lib/data/highlights';
    import type { NoteItem } from '$lib/data/notes';
    import { type GlossaryQueryResult } from '$lib/data/stores';
    import type { Reference, ReferenceStore } from '$lib/data/stores/reference';
    import type { SABProskomma } from '$lib/sab-proskomma';
    import { getFeatureValueBoolean } from '$lib/scripts/configUtils';
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

    enum RenderScopeType {
        this_first,
        that
    }

    enum RenderEventType {
        start,
        end,
        single
    }

    class RenderScope {
        constructor(doc: Document, name: string, type: RenderScopeType, contentRoot?: HTMLElement) {
            this.name = name;
            this.type = type;
            this.id = randomUUID();
            this.contentRoot = contentRoot ?? doc.createElement('div');
        }

        name: string;
        type: RenderScopeType;
        id: UUID;
        contentRoot: HTMLElement | null = null;
    }

    type RenderAction = {
        scopeTypes: Set<RenderScopeType>;
        action(params: any, environment: any): void;
    };

    class FeatureSpec {
        constructor(tag: string, actions: Array<RenderAction>) {
            this.configTag = tag;
            this.enabled = getFeatureValueBoolean(
                scriptureConfig,
                tag,
                references.collection,
                references.book
            );
            this.actions = actions;
        }
        configTag: string;
        enabled: boolean;
        actions: Array<RenderAction>;
    }

    const renderFeatures: Array<FeatureSpec> = getEnabledRenderFeatures();
    const renderActions = renderFeatures.flatMap((v) => {
        return { ...v.actions };
    });
    const openScopes: Array<RenderScope> = [];

    function getEnabledRenderFeatures() {
        return [];
    }

    function getSofriaEventDetails(environment: any, eventName: string) {
        //TODO
        return { eventType: RenderEventType.start, scopeType: RenderScopeType.that };
    }

    function handleSofriaRenderEvent(environment: any, eventName: string) {
        const eventDetails = getSofriaEventDetails(environment, eventName);
        let topScope: RenderScope | undefined;

        switch (eventDetails.eventType) {
            case RenderEventType.start:
                openScopes.unshift(new RenderScope(document, eventName, eventDetails.scopeType));
                // update workspace if needed
                break;
            case RenderEventType.end:
                topScope = openScopes.shift();
                if (topScope?.type === eventDetails.scopeType) {
                    for (const feature of renderFeatures.filter((f) => f.enabled)) {
                        for (const action of feature.actions) {
                            // perform action
                            // append result to content root
                            // update workspace if needed
                        }
                    }
                }
                break;
            case RenderEventType.single:
                // similar as for RenderEventType.end
                break;
        }
    }

    let container: HTMLElement | undefined = $state();
    let loading = $state(false);
    let bookRoot = $state(document.createElement('div'));
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
