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
        viewShowBibleVideos: string;
        userSettings: FeatureConfig;
        font: string;
        proskomma: SABProskomma;
        setReference: (value: Reference) => void;
        setBookTab: (value: number) => void;
        selectedVerses: SelectedVersesStore;
    }
</script>

<script lang="ts">
    /* eslint-disable svelte/no-dom-manipulating */

    import { scriptureConfig } from '$assets/config';
    import type { FeatureConfig } from '$config';
    import type { BookmarkItem } from '$lib/data/bookmarks';
    import type { HighlightItem } from '$lib/data/highlights';
    import type { NoteItem } from '$lib/data/notes';
    import {
        addPlanProgressItem,
        deleteAllProgressItemsForPlan,
        getFirstIncompleteDay
    } from '$lib/data/planProgressItems';
    import { addPlanState, getLastPlanState } from '$lib/data/planStates';
    import { loadDocSetIfNotLoaded } from '$lib/data/scripture';
    import {
        audioPlayer,
        currentPlanData,
        currentPlanState,
        footnotes,
        language,
        modal,
        plan,
        scriptureLogs,
        t,
        type GlossaryBlock,
        type GlossaryQueryResult,
        type PlanStore,
        type SelectedVersesStore
    } from '$lib/data/stores';
    import type { Reference, ReferenceStore } from '$lib/data/stores/reference';
    import { renderFeatures } from '$lib/render-sofria';
    import {
        compileActionDictionary,
        prettyRenderEvent,
        RenderEvent2Scope,
        renderEvents,
        type ActionDictionary,
        type RenderEnvironment,
        type RenderEvent,
        type RenderWorkspace
    } from '$lib/render-sofria/common';
    import { getBlock, getElement, getSequence } from '$lib/render-sofria/features/common';
    import { planDivInChapter } from '$lib/render-sofria/features/common/plans';
    import ScopeManager from '$lib/render-sofria/ScopeManager';
    import { getSeparatorRegex } from '$lib/render-sofria/util';
    import type { SABProskomma } from '$lib/sab-proskomma';
    import * as numerals from '$lib/scripts/numeralSystem';
    import {
        generateHTML,
        handleHeaderLinkPressed,
        isBibleBook
    } from '$lib/scripts/scripture-reference-utils';
    import { onClickText, updateSelections } from '$lib/scripts/verseSelectUtil';
    import type { ProskommaRenderAction } from 'proskomma-core';
    import { SofriaRenderFromProskomma } from 'proskomma-json-tools';
    import { onDestroy } from 'svelte';

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
        viewShowBibleVideos,
        userSettings,
        font,
        proskomma,
        setReference,
        setBookTab,
        selectedVerses
    }: Props = $props();

    const currentBook = $derived(references.book);
    const currentChapter = $derived(references.chapter);
    const currentDocset = $derived(references.docSet);

    const actionsDict: ActionDictionary = $derived(
        compileActionDictionary(renderFeatures, scriptureConfig, references, userSettings)
    );

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
    let scriptureRoot = $state(document.createElement('div'));
    let loading = $state(true);
    let renderWorkspaceInitialized = $state(false);

    let planDivObserver: IntersectionObserver | null = $state(null); // To store the observer instance
    let planObservationCompleted = $state(false);
    // Function to observe the visibility of the plan div
    function observeVisibility() {
        if (planDivObserver) {
            planDivObserver.disconnect(); // Disconnect any previous observer before creating a new one
            planDivObserver = null; // Clear the observer reference
        }
        if (planDivInChapter($plan, references) && !$plan.completed) {
            const target = scriptureRoot.querySelector('#PLAN-next');
            if (target) {
                planObservationCompleted = false;
                planDivObserver = new IntersectionObserver(
                    (entries) => {
                        entries.forEach((entry) => {
                            if (entry.isIntersecting && !planObservationCompleted) {
                                $plan.completed = true;
                                planObservationCompleted = true;
                                planDivObserver?.disconnect(); // Stop observing after it becomes visible
                                planDivObserver = null; // Clear the observer reference after disconnecting
                                addPlanProgressItem({
                                    id: $plan.planId,
                                    day: $plan.planDay,
                                    itemIndex: $plan.planEntry
                                });
                                if (lastPlanReference) {
                                    addPlanState({
                                        id: $plan.planId,
                                        state: 'completed'
                                    });
                                    deleteAllProgressItemsForPlan($plan.planId);
                                }
                            }
                        });
                    },
                    {
                        threshold: 0.1 // Adjust as needed
                    }
                );

                planDivObserver.observe(target);
            }
        }
    }
    onDestroy(() => {
        if (planDivObserver) {
            planDivObserver.disconnect();
            planDivObserver = null;
        }
    });

    let nextPlanDay: number | null = $state(null);
    let lastPlanReference = $state(false);
    $effect(() => {
        if ($currentPlanData && $plan.planDay) {
            getFirstIncompleteDay($currentPlanData, $plan.planDay).then((day) => {
                nextPlanDay = day;
                if ($plan.planId) {
                    // The first is true before the end of plan div becomes visible
                    // When it becomes visible, the records are deleted and nextPlanDay
                    // is 1 but the plan status is now completed.  So must check both
                    // to know if the reference being viewed is the last.
                    if ($plan.planNextReference === '' && nextPlanDay === -1) {
                        lastPlanReference = true;
                    } else {
                        getLastPlanState($plan.planId).then((state) => {
                            lastPlanReference = state === 'completed';
                        });
                    }
                }
            });
        } else {
            nextPlanDay = null;
        }
    });

    const bookTabs = $derived(
        scriptureConfig.bookCollections
            ?.find((x) => x.id === references.collection)
            ?.books.find((x) => x.id === references.book)?.bookTabs
    );

    $effect(() => {
        if (!bookTabs && references.bookTab > 0) {
            setBookTab(0);
        }
    });

    function chapterCount(book: string) {
        if (references.bookTab > 0 && bookTabs?.tabs[references.bookTab - 1].chapters === 1) {
            return 0;
        }
        const count = Object.keys(
            references.catalog.documents.find((x) => x.bookCode === book)?.versesByChapters ?? {}
        ).length;
        return count;
    }

    $effect(() => {
        if (scriptureRoot && $selectedVerses) {
            updateSelections(scriptureRoot, selectedVerses);
        }
    });

    async function getCurrentDocumentID(docSet: string, bookCode: string) {
        await loadDocSetIfNotLoaded(proskomma, docSet, fetch);
        const bookDocuments = proskomma.gqlQuerySync(
            '{documents { docSetId id bookCode: header(id: "bookCode") } }'
        );

        if ($scriptureLogs.docResult) {
            console.warn('book query result: %o', bookDocuments);
        }

        for (const doc of bookDocuments?.data?.documents ?? []) {
            if ($scriptureLogs.docResult) {
                console.warn(`Checking current doc ${doc.bookCode} against id ${bookCode}`);
            }
            if (doc.docSetId === docSet && doc.bookCode === bookCode) {
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

        if ($scriptureLogs.root) {
            console.log('START: %o', scriptureRoot);
        }

        workspace.document = document;
        workspace.root = scriptureRoot;
        workspace.scopeManager = new ScopeManager();
        workspace.currentTextPosition = workspace.currentTextPosition ?? {
            chapter: 'none',
            verse: 'none'
        };
        workspace.logSettings = $scriptureLogs;
        workspace.scratch = {};
        workspace.textConfig = {
            numeralSystem,
            separatorRegex: getSeparatorRegex(audioPhraseEndChars),
            verseRangeSeparator: scriptureConfig.bookCollections?.find(
                (x) => x.id === references.collection
            )?.features['ref-verse-range-separator'] as string
        };
        workspace.config = scriptureConfig;
        workspace.viewSettings = {
            isBibleBook: isBibleBook(references, workspace.config),
            bibleVideos: viewShowBibleVideos,
            redLetters,
            verseLayout
        };
        workspace.events = {
            navigate(ref: Reference) {
                setReference(ref);
                footnotes.reset();
            },
            openFootnoote(event: MouseEvent, footnoteId: string) {
                if ($footnotes.length === 0) {
                    event.stopPropagation();
                    const footnote = workspace.document?.querySelector(`div[id="${footnoteId}"]`);
                    const workingSpan = footnote?.cloneNode(true) as HTMLDivElement;
                    const spans = workingSpan?.querySelectorAll('span.xt');
                    // Loop through each span and modify its inner HTML
                    spans.forEach((span) => {
                        span.innerHTML = generateHTML(span.innerHTML, ''); // Change inner HTML as needed
                    });
                    const parsed = workingSpan?.innerHTML;
                    footnotes.push(parsed);
                }
            },
            openGlossary(glossaryLink: string, block: GlossaryBlock) {
                if ($footnotes.length === 0) {
                    const glossaryDiv = document.createElement('div');
                    glossaryDiv.classList.add('txs');
                    const glossarySpan = document.createElement('span');
                    glossarySpan.classList.add('k');
                    //const titleText = document.createTextNode(glossaryLink);
                    glossarySpan.append(block.key);
                    glossaryDiv.append(glossarySpan);
                    const blockText = block.text.slice(glossaryLink?.length);
                    glossaryDiv.innerHTML += blockText;
                    const glossaryHTML = glossaryDiv.outerHTML;
                    footnotes.push(glossaryHTML);
                }
            },
            setPlanStore(data: PlanStore) {
                plan.set(data);
            },
            clickHeaderRef(event: MouseEvent, target: HTMLElement, workspace: RenderWorkspace) {
                event.stopPropagation();
                const start = JSON.parse(target.getAttribute('data-start-ref') || '{}');
                const end =
                    target.getAttribute('data-end-ref') === 'undefined'
                        ? undefined
                        : JSON.parse(target.getAttribute('data-end-ref') || '{}');
                if (workspace.config.mainFeatures['scripture-refs-display'] === 'viewer') {
                    workspace.events.navigate(start);
                } else {
                    handleHeaderLinkPressed(start, end, themeColors).then((footnoteHTML) =>
                        footnotes.push(footnoteHTML)
                    );
                }
            },
            clickText: (e) => {
                if (!$audioPlayer.playing) {
                    onClickText(e, maxSelections);
                }
            }
        };
        workspace.stores = {
            references,
            plan: $plan,
            currentPlanState: $currentPlanState,
            currentPlanData: $currentPlanData,
            t: $t,
            language: $language,
            lastPlanReference,
            themeColors,
            modal,
            settings: userSettings
        };
        workspace.queries = {
            notes,
            bookmarks,
            highlights,
            glossary
        };

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
            console.log(environment);
            initRenderWorkspace(environment, workspaceOptions);
            renderWorkspaceInitialized = true;
        }

        let execFallback = true;

        for (const a of actionsDict[eventName] ?? []) {
            if ((a.stage !== 'fallback' || execFallback) && (!a.guard || a.guard(environment))) {
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
                        ` (${a.section ?? 'standard'})`
                    ); */
                }
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
            config: chapterCount(references.book) ? { chapters: [chapter] } : {},
            output
        });

        if ($scriptureLogs.root) {
            console.warn('Final rendering output: %o', output.root);
        }
        loading = false;

        if (references) {
            observeVisibility();
        }
    }

    $effect(() => {
        renderDocumentSofria(
            currentDocset,
            references.bookTab > 0
                ? currentBook + bookTabs?.tabs[references.bookTab - 1].bookTabID
                : currentBook,
            currentChapter
        );
    });
</script>

<svelte:head>
    <style>
        /* Add CSS for fullscreen popup */
        .fullscreen-popup {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
        }

        .fullscreen-popup img {
            width: 100%;
            height: 100%;
            object-fit: contain;
            border: 2px solid white;
        }
        .fullscreen-popup .close-btn {
            position: absolute;
            top: 10px;
            left: 40px;
            background: none;
            border: none;
            font-size: 35px;
            color: white;
            cursor: pointer;
            z-index: 1001;
        }

        .fullscreen-popup .close-btn::before {
            content: '\\2190'; /* Unicode for left arrow */
        }
    </style>
</svelte:head>

<article class="container">
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
