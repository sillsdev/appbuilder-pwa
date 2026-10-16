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
        references: RenderWorkspace['stores']['references'];
        glossary: Promise<GlossaryQueryResult>;
        themeColors: Record<string, string>;
        verseLayout: string;
        userSettings: FeatureConfig;
        font: string;
        proskomma: SABProskomma;
        setReference: (value: Reference) => void;
        setBookTab: (value: number) => void;
        selectedVerses: SelectedVersesStore;
        isActivePanel: boolean;
        verseRange?: { start: number; end?: number };
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
        ModalType,
        monoIconColor,
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
        isBibleBook,
        type AnchorReference
    } from '$lib/scripts/scripture-reference-utils';
    import { onClickText, updateSelections } from '$lib/scripts/verseSelectUtil';
    import type { ProskommaRenderAction } from 'proskomma-core';
    import { SofriaRenderFromProskomma } from 'proskomma-json-tools';
    import { onDestroy, untrack } from 'svelte';

    // eslint-disable-next-line svelte/no-unused-props
    let props: Props = $props();

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
        userSettings,
        font,
        proskomma,
        setReference,
        setBookTab,
        selectedVerses,
        isActivePanel,
        verseRange
    } = $derived(props);

    const currentBook = $derived(references.book);
    const currentChapter = $derived(references.chapter);
    const currentDocset = $derived(references.docSet);

    // HACK: The introduction is handled as a block graft on chapter 1, so we need to render chapter 1, but only the introduction
    const hackRenderIntro = $derived(
        currentChapter === 'i' &&
            !!references.catalog.documents.find((x) => x.bookCode === currentBook)?.hasIntroduction
    );

    const actionsDict: ActionDictionary = $derived(
        compileActionDictionary(
            renderFeatures,
            scriptureConfig,
            references,
            userSettings,
            $scriptureLogs
        )
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
        const c = untrack(() => scriptureRoot);
        if (isActivePanel && c && $selectedVerses) {
            updateSelections(c, selectedVerses);
        }
    });

    // Annotations are only read after query() awaits, so the render effect doesn't
    // track them. Re-apply them to the rendered chapter whenever they change.
    $effect(() => {
        void [highlights, bookmarks, notes];
        if (untrack(() => loading || hackRenderIntro)) {
            return;
        }
        applyAnnotations();
    });

    // Each call bumps the generation so a slower, older pass can't overwrite a newer one.
    let annotationGeneration = 0;
    function applyAnnotations() {
        const generation = ++annotationGeneration;
        Promise.all([highlights, bookmarks, notes]).then(([highlights, bookmarks, notes]) => {
            if (generation !== annotationGeneration) {
                return;
            }
            for (const span of scriptureRoot.querySelectorAll('span[id^="notes"]') ?? []) {
                span.replaceChildren();
            }
            for (const span of scriptureRoot.querySelectorAll('span[id^="bookmarks"]') ?? []) {
                span.replaceChildren();
            }
            for (const div of scriptureRoot.querySelectorAll('div[class*="hlp"]') ?? []) {
                div.classList.remove(...[...div.classList].filter((c) => c.startsWith('hlp')));
            }
            addNotedVerses(notes);
            addBookmarkedVerses(bookmarks);
            addHighlightedVerses(highlights);
        });
    }

    function addNotedVerses(notes: NoteItem[]) {
        for (let k = 0; k < notes.length; k++) {
            const note = notes[k];
            const notesContainer = scriptureRoot.querySelector(`#notes${note.verse}`);
            if (!notesContainer) {
                console.warn('No notes span for verse %s', note.verse);
                continue;
            }

            const existingNoteSpan = scriptureRoot.querySelector(`#note${k}`);
            if (!existingNoteSpan) {
                const noteSpan = document.createElement('span');
                noteSpan.id = 'note' + k;
                noteSpan.innerHTML = noteSvg();
                noteSpan.onclick = (event) => editNote(note);
                notesContainer.appendChild(noteSpan);
            }
        }
    }

    function noteSvg() {
        const noteIconColor: string = themeColors?.TextColor || $monoIconColor;
        return `<svg fill="${noteIconColor}" style="display:inline" xmlns="http://www.w3.org/2000/svg" height="16" width="16" viewBox="0 0 96 96"><path d="M 21.07 74.80 L 8.76 87.35 Q 8.00 88.12 8.00 87.03 Q 8.00 52.12 8.00 18.00 Q 8.00 7.73 18.00 7.80 Q 48.00 8.00 78.00 8.00 Q 88.27 8.00 88.18 18.00 Q 88.00 40.13 88.09 62.25 Q 88.13 72.31 78.00 72.22 C 72.03 72.17 25.23 70.89 23.56 72.37 Q 22.78 73.07 21.07 74.80 Z M 72.00 21.60 A 0.60 0.60 0.0 0 0 71.40 21.00 L 24.60 21.00 A 0.60 0.60 0.0 0 0 24.00 21.60 L 24.00 28.40 A 0.60 0.60 0.0 0 0 24.60 29.00 L 71.40 29.00 A 0.60 0.60 0.0 0 0 72.00 28.40 L 72.00 21.60 Z M 72.00 35.60 A 0.60 0.60 0.0 0 0 71.40 35.00 L 24.60 35.00 A 0.60 0.60 0.0 0 0 24.00 35.60 L 24.00 42.40 A 0.60 0.60 0.0 0 0 24.60 43.00 L 71.40 43.00 A 0.60 0.60 0.0 0 0 72.00 42.40 L 72.00 35.60 Z M 60.00 49.60 A 0.60 0.60 0.0 0 0 59.40 49.00 L 24.60 49.00 A 0.60 0.60 0.0 0 0 24.00 49.60 L 24.00 56.40 A 0.60 0.60 0.0 0 0 24.60 57.00 L 59.40 57.00 A 0.60 0.60 0.0 0 0 60.00 56.40 L 60.00 49.60 Z"</path></svg>`;
    }

    function editNote(note: NoteItem) {
        modal.open(ModalType.Note, note);
    }

    function bookmarkSvg() {
        return '<svg fill="#b10000" style="display:inline" xmlns="http://www.w3.org/2000/svg" height="16" width="16" viewBox="0 0 24 24"><path d="M5 21V5q0-.825.588-1.413Q6.175 3 7 3h10q.825 0 1.413.587Q19 4.175 19 5v16l-7-3Z"/></svg>';
    }
    function addBookmarkedVerses(bookmarks: BookmarkItem[]) {
        for (let j = 0; j < bookmarks.length; j++) {
            const bookmarksSpan = scriptureRoot.querySelector(`#bookmarks${bookmarks[j].verse}`);
            if (!bookmarksSpan) {
                console.warn('No bookmarks span for verse %s', bookmarks[j].verse);
                continue;
            }

            const existingBookmarkSpan = scriptureRoot.querySelector(`#bookmark${j}`);
            if (!existingBookmarkSpan) {
                const bookmarkSpan = document.createElement('span');
                bookmarkSpan.id = 'bookmark' + j;
                bookmarkSpan.innerHTML = bookmarkSvg();
                bookmarksSpan.appendChild(bookmarkSpan);
            }
        }
    }

    function addHighlightedVerses(highlights: HighlightItem[]) {
        for (let i = 0; i < highlights.length; i++) {
            //Skip this entry if the next is a highlight for the same verse
            if (i < highlights.length - 1) {
                if (highlights[i].verse === highlights[i + 1].verse) {
                    continue;
                }
            }
            const elements = scriptureRoot.querySelectorAll(
                `div[data-verse="${highlights[i].verse}"]`
            );
            for (const element of elements ?? []) {
                const penClass = 'hlp' + highlights[i].penColor;
                element.classList.add(penClass);
            }
        }
    }

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
        workspace.currentTextPosition = {
            verse: 'none',
            render: !verseRange
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
            redLetters,
            verseLayout,
            verseRange
        };
        workspace.events = {
            navigate(ref: Reference) {
                setReference(ref);
                footnotes.reset();
            },
            openFootnoote(event: MouseEvent, footnoteId: string) {
                if ($footnotes.length === 0) {
                    event.stopPropagation();
                    const footnote = scriptureRoot.querySelector(`div[id="${footnoteId}"]`);
                    const workingSpan = footnote?.cloneNode(true) as HTMLDivElement;
                    const spans = workingSpan?.querySelectorAll('span.xt');
                    // Loop through each span and modify its inner HTML
                    spans.forEach((span) => {
                        span.innerHTML = generateHTML(span.innerHTML, ''); // Change inner HTML as needed
                    });
                    const parsed = workingSpan?.innerHTML;
                    footnotes.push({ type: 'plain', body: parsed, style: 'footnote' });
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
                    footnotes.push({ type: 'plain', body: glossaryHTML, style: 'glossary' });
                }
            },
            setPlanStore(data: PlanStore) {
                plan.set(data);
            },
            clickHeaderRef(event: MouseEvent, target: HTMLElement, workspace: RenderWorkspace) {
                event.stopPropagation();
                const start: AnchorReference = JSON.parse(
                    target.getAttribute('data-start-ref') || '{}'
                );
                const end: AnchorReference | undefined =
                    target.getAttribute('data-end-ref') === 'undefined'
                        ? undefined
                        : JSON.parse(target.getAttribute('data-end-ref') || '{}');
                if (workspace.config.mainFeatures['scripture-refs-display'] === 'viewer') {
                    workspace.events.navigate(start);
                } else {
                    /* handleHeaderLinkPressed(start, end, themeColors).then((footnoteHTML) =>
                        footnotes.push({ type: 'plain', body: footnoteHTML})
                    ); */
                    footnotes.push({ type: 'rich', start, end, props, style: 'crossref' });
                }
            },
            clickText: (e) => {
                if (!$audioPlayer.playing) {
                    onClickText(e, selectedVerses, maxSelections);
                }
            },
            updateAnnotations: applyAnnotations
        };
        workspace.stores = {
            references,
            plan: $plan,
            currentPlanState: $currentPlanState,
            currentPlanData: $currentPlanData,
            t: $t,
            language: $language,
            lastPlanReference,
            settings: userSettings
        };
        workspace.queries = {
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
        if (!renderWorkspaceInitialized) {
            if ($scriptureLogs.actions) {
                console.log('Initializing renderer\n%o', { ...environment });
            }
            initRenderWorkspace(environment, workspaceOptions);
            renderWorkspaceInitialized = true;
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
                console.log(`Error encountered while rendering:\n%o\n%o`, a, {
                    ...environment
                });
                throw e;
            }
        }
    }

    async function renderDocumentSofria(docSet: string, bookCode: string, chapter: string) {
        console.warn(`Rendering Document ${docSet}.${bookCode}.${chapter}`);
        const actionObject: { [key in RenderEvent]?: ProskommaRenderAction[] } = {};

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

        performance.mark('pk-query-books-start');
        const docId = await getCurrentDocumentID(docSet, bookCode);
        performance.mark('pk-query-books-end');
        performance.measure(
            'pk-query-books-duration',
            'pk-query-books-start',
            'pk-query-books-end'
        );
        if ($scriptureLogs.docResult) {
            console.warn(`found docId ${docId}`);
        }

        renderWorkspaceInitialized = false;

        const pkRenderer = new SofriaRenderFromProskomma({
            proskomma,
            actions: actionObject,
            debugLevel: 0
        });
        performance.mark('cl-render-start');
        pkRenderer.renderDocument({
            docId,
            config: chapterCount(references.book) ? { chapters: [chapter] } : {},
            output
        });
        performance.mark('cl-render-end');
        performance.measure('cl-render-duration', 'cl-render-start', 'cl-render-end');

        if ($scriptureLogs.root) {
            console.warn('Final rendering output: %o', output.root);
        }
        loading = false;

        if (references) {
            observeVisibility();
        }
    }

    $effect(() => {
        performance.mark('query-start');
        renderDocumentSofria(
            currentDocset,
            references.bookTab > 0
                ? currentBook + bookTabs?.tabs[references.bookTab - 1].bookTabID
                : currentBook,
            currentChapter
        );
        performance.mark('query-end');
        performance.measure('query-duration', 'query-start', 'query-end');
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
