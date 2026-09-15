<script lang="ts">
    import { goto } from '$app/navigation';
    import config, { scriptureConfig } from '$assets/config';
    import contents from '$assets/contents';
    import AudioBar from '$lib/components/AudioBar.svelte';
    import BookSelector from '$lib/components/BookSelector.svelte';
    import BookTabs from '$lib/components/BookTabs.svelte';
    import BottomNavigationBar from '$lib/components/BottomNavigationBar.svelte';
    import ChapterSelector from '$lib/components/ChapterSelector.svelte';
    import HtmlBookView, {
        type Props as HtmlBookViewProps
    } from '$lib/components/HtmlBookView.svelte';
    import Navbar from '$lib/components/Navbar.svelte';
    import ScripturePager from '$lib/components/ScripturePager.svelte';
    import ScriptureViewSofria, {
        type Props as ScriptureViewSofriaProps
    } from '$lib/components/ScriptureViewSofria.svelte';
    import StackView from '$lib/components/StackView.svelte';
    import { showTextAppearance } from '$lib/components/TextAppearanceSelector.svelte';
    import TextSelectionToolbar from '$lib/components/TextSelectionToolbar.svelte';
    import {
        checkAudioAvailability,
        playStop,
        seekToVerse,
        updateAudioPlayer
    } from '$lib/data/audio';
    import {
        actionBarColor,
        analytics,
        audioActive,
        audioHighlightElements,
        audioPlayer,
        bodyFontSize,
        bodyLineHeight,
        bookmarks,
        contentsStack,
        convertStyle,
        currentFont,
        direction,
        fontChoices,
        glossary,
        highlights,
        isFirstLaunch,
        layoutSelected,
        modal,
        ModalType,
        moreThanOneCollection,
        NAVBAR_HEIGHT,
        notes,
        refs,
        s,
        selectedVerses,
        showCollection,
        showDesktopSidebar,
        t,
        themeColors,
        userSettings,
        userSettingsOrDefault
    } from '$lib/data/stores';
    import {
        AudioIcon,
        BibleIcon,
        SearchIcon,
        TextAppearanceIcon,
        TriangleLeftIcon,
        TriangleRightIcon
    } from '$lib/icons';
    import { navigateToTextChapterInDirection } from '$lib/navigate';
    import { getFeatureValueBoolean, getFeatureValueString } from '$lib/scripts/configUtils';
    import { pathJoin } from '$lib/scripts/stringUtils';
    import { resolve } from '$lib/utils/paths';
    import { onDestroy, onMount } from 'svelte';
    import { swipe, type SwipePointerEventDetail } from 'svelte-gestures';
    import type { PageData } from './$types';

    const illustrationURLs = import.meta.glob('./*', {
        eager: true,
        import: 'default',
        query: '?url',
        base: '/src/gen-assets/illustrations'
    }) as Record<string, string>;

    interface Props {
        data: PageData;
    }

    let { data }: Props = $props();

    let scrollingUp = $state(true);
    let savedScrollPosition = 0;
    let lastChangeTime = 0;
    function saveScrollPosition() {
        if (scrollingDiv) {
            const now = Date.now();
            const oldSavedScroll = savedScrollPosition;
            savedScrollPosition = scrollingDiv.scrollTop;
            const newScrollingUp = oldSavedScroll - savedScrollPosition > 0;
            if (newScrollingUp != scrollingUp) {
                if (now - lastChangeTime > 500) {
                    // The timing thing fixes a problem with occasional vibrating
                    // when you hit the bottom of the screen
                    scrollingUp = newScrollingUp;
                    lastChangeTime = now;
                }
            }
        }
    }
    $effect(() => {
        if (scrollingDiv) {
            scrollingDiv.scrollTop = savedScrollPosition;
        }
    });
    refs.subscribe((value) => {
        savedScrollPosition = 0;
    });

    let innerWidth = $state(0);
    const swipeBetweenBooks = config.mainFeatures['book-swipe-between-books'];
    async function doSwipe(event: CustomEvent<SwipePointerEventDetail>) {
        const swipeDirection = event.detail.direction;
        if (
            swipeBetweenBooks ||
            ($refs.prev.book === $refs.book && swipeDirection === 'right') ||
            ($refs.next.book === $refs.book && swipeDirection === 'left')
        ) {
            await navigateToTextChapterInDirection(swipeDirection === 'right' ? -1 : 1);
        }
    }

    let pager: ScripturePager;

    const book = $derived(
        scriptureConfig?.bookCollections
            ?.find((x) => x.id === $refs.collection)
            ?.books.find((x) => x.id === $refs.book)
    );
    const bookTabs = $derived(book?.bookTabs); //This should hopefully be reactive and find the book tabs if the current book has them.
    const bookType = $derived(book?.type);
    $effect(() => {
        if (bookType === 'quiz') {
            goto(resolve(`/quiz/${$refs.collection}/${book?.id}`), { replaceState: true });
        }
    });

    const bottomNavBarEnabled = config?.bottomNavBarItems && config?.bottomNavBarItems.length > 0;
    const barType = 'book';

    const viewShowVerses = $derived(
        ($userSettings['verse-numbers'] as boolean) ??
            getFeatureValueBoolean(
                scriptureConfig,
                'show-verse-numbers',
                $refs.collection,
                $refs.book
            )
    );

    const audioPhraseEndChars = $derived(
        getFeatureValueString(
            scriptureConfig,
            'audio-phrase-end-chars',
            $refs.collection,
            $refs.book
        )
    );

    const showSearch = !!config.mainFeatures['search'];
    const enoughCollections = (scriptureConfig.bookCollections?.length ?? 0) > 1;
    const showCollectionNavbar = !!config.mainFeatures['layout-config-change-toolbar-button'];
    const showCollectionsOnFirstLaunch = !!config.mainFeatures['layout-config-first-launch'];
    const showCollectionViewer = !!config.mainFeatures['layout-config-change-viewer-button'];
    const showAudio = !!config.mainFeatures['audio-allow-turn-on-off'];

    const viewSettings = $derived(
        book?.format === 'html'
            ? ({
                  references: $refs,
                  bodyFontSize: $bodyFontSize,
                  bodyLineHeight: $bodyLineHeight,
                  fetch: data.fetch
              } satisfies HtmlBookViewProps)
            : book?.testament !== 'quiz'
              ? ({
                    audioPhraseEndChars: audioPhraseEndChars,
                    bodyFontSize: $bodyFontSize,
                    bodyLineHeight: $bodyLineHeight,
                    bookmarks: $bookmarks,
                    notes: $notes,
                    highlights: $highlights,
                    maxSelections: config.mainFeatures['annotation-max-select'] as number,
                    redLetters: $userSettingsOrDefault['red-letters'] as boolean,
                    references: $refs,
                    glossary: $glossary,
                    themeColors: $themeColors,
                    verseLayout: $userSettingsOrDefault['verse-layout'] as string,
                    viewShowBibleImages: $userSettingsOrDefault[
                        'display-images-in-bible-text'
                    ] as string,
                    viewShowBibleVideos: $userSettingsOrDefault[
                        'display-videos-in-bible-text'
                    ] as string,
                    viewShowIllustrations: config.mainFeatures['show-illustrations'] as boolean,
                    viewShowVerses,
                    viewShowGlossaryWords: $userSettingsOrDefault['glossary-words'] as boolean,
                    font: $currentFont!,
                    proskomma: data?.proskomma,
                    selectedVersesStore: selectedVerses
                } satisfies ScriptureViewSofriaProps)
              : {}
    );

    function getFormat(bcId: string, bookId: string) {
        return scriptureConfig.bookCollections
            ?.find((x) => x.id === bcId)
            ?.books.find((x) => x.id === bookId)?.format;
    }

    const stackSettings = $derived({
        bodyFontSize: $bodyFontSize,
        bodyLineHeight: $bodyLineHeight,
        font: $currentFont
    });

    const extraIconsExist = $derived(showSearch || showCollection.navbar); //Note: was trying document.getElementById('extraButtons').childElementCount; but that caused it to hang forever.
    let scrollingDiv: HTMLDivElement | undefined = $state();

    let showOverlowMenu = $state(false); //Controls the visibility of the extraButtons div on mobile
    function handleMenuClick() {
        showOverlowMenu = false;
    }

    /**scrolls element with id into view*/
    const scrollTo = (id: string) => {
        let verseId = id === 'start-none' ? '1-a' : id;
        if (!verseId) {
            return;
        }
        let el = findVerseElement(verseId);
        makeElementVisible(el);
    };
    function delayedScroll(id: string) {
        let updateTimer;
        clearTimeout(updateTimer);
        updateTimer = setTimeout(() => {
            scrollTo(id);
        }, 100);
    }
    function delayedSeek(id: string) {
        let updateTimer;
        clearTimeout(updateTimer);
        updateTimer = setTimeout(() => {
            seekToVerse(id);
        }, 1000);
    }
    /**Scroll to start of chapter when reference changes*/
    const newRefScroll = (() => {
        let updateTimer: NodeJS.Timeout;
        return (_: unknown) => {
            clearTimeout(updateTimer);
            updateTimer = setTimeout(() => {
                let verse = $refs.verse;
                if (verse === '' || verse === '1') {
                    delayedScroll('start-none');
                } else {
                    let verseID = verse + '-a';
                    let audioID = verse + 'a';
                    delayedScroll(verseID);
                    updateAudioPlayer($refs);
                    delayedSeek(audioID);
                }
            }, 50);
        };
    })();

    function makeElementVisible(el?: Element | null) {
        if (el) {
            if (el.classList.contains('scroll-item')) {
                const rect = el.getBoundingClientRect();
                const win = document
                    .getElementsByClassName('container')[0]
                    ?.getBoundingClientRect();
                if (scrollingDiv) {
                    const scrollTop = scrollingDiv.scrollTop;
                    const scrollHeight = scrollingDiv.clientHeight;
                    const isVisible =
                        rect.top - win.top - 30 >= scrollTop &&
                        rect.bottom - win.top + 30 <= scrollHeight + scrollTop;
                    if (!isVisible) {
                        let newTop = rect.top - win.top - 30;
                        scrollingDiv.scrollTo({ top: newTop, behavior: 'smooth' });
                        if (newTop > 0) {
                            savedScrollPosition = newTop;
                        }
                    }
                }
            }
        }
    }
    function findVerseElement(verseId: string) {
        const [verseNumStr, phrase] = verseId.split('-');
        const verseNum = Number(verseNumStr);

        // Try direct match first
        let el = document.querySelector(
            `div[data-verse="${verseNumStr}"][data-phrase="${phrase}"]`
        );
        if (el) {
            return el;
        }
        // Fall back: look for ranges
        const candidates = document.querySelectorAll(`div[data-phrase="${phrase}"]`);

        for (const candidate of candidates) {
            const verseAttr = candidate.getAttribute('data-verse');
            if (!verseAttr) {
                continue;
            }

            if (/^\d+-\d+$/.test(verseAttr)) {
                const [start, end] = verseAttr.split('-').map(Number);
                if (verseNum >= start && verseNum <= end) {
                    return candidate;
                }
            }
        }

        return null;
    }
    const highlightColor = $derived($themeColors['TextHighlightColor']);
    let currentVerse = '';
    /**updates highlight*/
    const updateHighlight = (elementIds: string[], color: string) => {
        let container = document.getElementsByClassName('container')[0];
        // Remove highlighting for currently highlighted verses
        const elements = container?.getElementsByClassName('highlighting');
        for (let i = 0; i < elements?.length; i++) {
            const element = elements[i];
            const node = element.getAttributeNode('style');
            if (node) {
                element.removeAttributeNode(node);
            }
            element.classList.remove('highlighting');
        }

        for (const elementId of elementIds) {
            let containsAlpha = /[a-z]/.test(elementId);
            const adjustedId = containsAlpha ? elementId : elementId + 'a';
            const element = document.getElementById(adjustedId);
            if (element === null) {
                break;
            }
            element.setAttribute('style', 'background-color: ' + color + ';');
            element.classList.add('highlighting');
            const verseSegment = `${element?.getAttribute('data-verse')}-${element?.getAttribute(
                'data-phrase'
            )}`;
            if (verseSegment !== currentVerse) {
                currentVerse = verseSegment;
                makeElementVisible(element);
            }
        }
    };

    $effect(() => {
        updateHighlight($audioHighlightElements, highlightColor);
    });
    $effect(() => {
        updateAudioPlayer($refs);
    });
    $effect(() => {
        newRefScroll($refs);
    });
    const navBarHeight = $derived(bookTabs ? 'calc(' + NAVBAR_HEIGHT + ' + 2rem)' : NAVBAR_HEIGHT);
    onMount(() => {
        if ($isFirstLaunch) {
            analytics.log('ab_first_run');
            if (showCollection.onFirstLaunch && moreThanOneCollection && !$layoutSelected) {
                goto(resolve(`/layout`));
            }
        }
    });

    let textCopied = $state(false);
    function onTextCopy() {
        textCopied = true;
        setTimeout(() => {
            textCopied = false;
        }, 3000);
    }

    function backNavigation() {
        if ($contentsStack.length > 0) {
            const menuId = contentsStack.popItem();
            goto(resolve(`/contents/${menuId}`));
        }
    }
    const showBackButton = $derived(
        contents?.features?.['navigation-type'] === 'up' && $contentsStack.length > 0
    );

    onDestroy(() => {
        // stop audio when changing routes
        playStop();
    });
    function getCurrentIllustrationFile() {
        let illustrations = book?.pageIllustrations;
        if (illustrations) {
            for (let i = 0; i < illustrations.length; i++) {
                if (illustrations[i].num === Number($refs.chapter)) {
                    return illustrationURLs[`./${illustrations[i].filename}`];
                }
            }
        }
    }
</script>

<svelte:window bind:innerWidth />

<div class="grid grid-rows-[auto_1fr_auto]" style="height:100vh;height:100dvh;">
    <div class="navbar">
        <Navbar {backNavigation} {showBackButton}>
            {#snippet start()}
                <div class={showOverlowMenu ? 'hidden md:flex flex-nowrap' : 'flex flex-nowrap'}>
                    <BookSelector onBookSelection={() => pager?.setupSettingsCache()} />
                    <ChapterSelector onChapterSelection={() => pager?.setupSettingsCache()} />
                </div>
            {/snippet}

            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            {#snippet end()}
                <div
                    class="flex flex-nowrap"
                    onclick={showOverlowMenu ? handleMenuClick : () => ({})}
                >
                    <!-- (mobile) handleMenuClick() is called to collapse the extraButtons menu when any button inside right-buttons is clicked. -->
                    <div class="flex">
                        {#if $refs.hasAudio && showAudio}
                            <!-- Mute/Volume Button -->
                            <button
                                class="dy-btn dy-btn-ghost dy-btn-circle"
                                onclick={() => {
                                    if (!$audioActive) {
                                        checkAudioAvailability();
                                    }
                                    $audioActive = !$audioActive;
                                }}
                            >
                                {#if $audioActive}
                                    <AudioIcon.Volume color={$actionBarColor} />
                                {:else}
                                    <AudioIcon.Mute color={$actionBarColor} />
                                {/if}
                            </button>
                        {/if}
                    </div>
                    <div id="extraButtons" class={showOverlowMenu ? 'flex' : 'hidden md:flex'}>
                        <!-- An overflow menu containing the other right-buttons. On mobile it expands when overflowMenuButton is clicked and collpases when handleMenuClick() is called, on larger screens these buttons are always visible. -->

                        <!-- Search Button -->
                        {#if showSearch}
                            <button
                                class="dy-btn dy-btn-ghost dy-btn-circle"
                                onclick={() => goto(resolve(`/search/${$refs.collection}`))}
                            >
                                <SearchIcon color={$actionBarColor} />
                            </button>
                        {/if}

                        <!-- Text Appearance Selector Button -->
                        {#if showTextAppearance($fontChoices)}
                            <button
                                class="dy-btn dy-btn-ghost dy-btn-circle"
                                onclick={() => modal.open(ModalType.TextAppearance)}
                            >
                                <TextAppearanceIcon color={$actionBarColor} />
                            </button>
                        {/if}

                        <!-- Collection Selector Button -->
                        {#if showCollection.navbar && moreThanOneCollection}
                            <button
                                class="dy-btn dy-btn-ghost dy-btn-circle"
                                onclick={() => goto(resolve(`/layout`))}
                            >
                                <BibleIcon color={$actionBarColor} />
                            </button>
                        {/if}
                    </div>
                    {#if extraIconsExist}
                        <!-- overflowMenuButton (on mobile this toggles the visibility of the extraButtons div) -->
                        <button
                            class="md:hidden dy-btn dy-btn-ghost dy-btn-circle"
                            onclick={(event) => {
                                showOverlowMenu = !showOverlowMenu;
                                event.stopPropagation();
                            }}
                        >
                            <!-- tricky logic: this causes the direction of the arrows to switch when rtl -->
                            {#if showOverlowMenu === ($direction === 'ltr')}
                                <TriangleRightIcon color={$actionBarColor} scale={1.25} />
                            {:else}
                                <TriangleLeftIcon color={$actionBarColor} scale={1.25} />
                            {/if}
                        </button>
                    {/if}
                </div>
            {/snippet}
        </Navbar>
        {#if bookTabs}
            <BookTabs></BookTabs>
        {/if}
    </div>

    <div class="flex flex-col overflow-y-auto">
        {#if bookType === 'story'}
            {@const illustrationFile = getCurrentIllustrationFile()}
            {#if illustrationFile}
                <!-- svelte-ignore a11y_missing_attribute -->
                <img
                    src={illustrationFile}
                    class="w-screen md:max-w-2xl mx-auto object-cover"
                    use:swipe={{
                        timeframe: 300,
                        minSwipeDistance: 60,
                        touchAction: 'pan-y'
                    }}
                    onswipe={doSwipe}
                />
            {/if}
        {/if}
        <div
            class="overflow-y-auto grow overflow-x-hidden"
            bind:this={scrollingDiv}
            onscroll={saveScrollPosition}
        >
            <ScripturePager bind:this={pager} {viewSettings}>
                {#snippet panel(settings)}
                    {#if book?.format === 'html'}
                        <HtmlBookView {...settings as HtmlBookViewProps} />
                    {:else if book?.testament !== 'quiz'}
                        <ScriptureViewSofria {...settings as ScriptureViewSofriaProps} />
                    {/if}
                {/snippet}
            </ScripturePager>
        </div>
        <!-- Display pop-ups for cross-references, footnotes, etc. -->
        <StackView {...stackSettings} />
        <!-- TODO: CHECK THAT THIS IS CORRECT, CHANGED FROM INSIDE ABOVE DIV-->
    </div>

    {#if showCollectionViewer && enoughCollections}
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div
            class="absolute dy-badge dy-badge-outline dy-badge-md rounded-xs p-1 inset-e-3 m-1"
            style:top={navBarHeight}
            style={convertStyle($s?.['ui.pane1.name'])}
            onclick={() => goto(resolve(`/layout`))}
        >
            {scriptureConfig.bookCollections?.find((x) => x.id === $refs.collection)
                ?.collectionAbbreviation}
        </div>
    {/if}
    {#if textCopied}
        <div
            class="flex h-12 p-2 bg-black text-white items-center justify-center text-center text-sm"
        >
            {$t['Text_Copied']}
        </div>
    {:else if $selectedVerses.length > 0 && !$audioPlayer.playing}
        <div class="text-selection">
            <TextSelectionToolbar oncopy={onTextCopy} />
        </div>
    {:else if $refs.hasAudio && $audioActive}
        <!-- Upgrading to DaisyUI 3, bottom-0 became bottom=-(height of bar) -->
        <div class="audio-bar p-0" class:audio-bar-desktop={$showDesktopSidebar}>
            <div>
                <AudioBar {checkAudioAvailability} />
            </div>
        </div>
    {/if}
    {#if scrollingUp && bottomNavBarEnabled && !$selectedVerses.length}
        <BottomNavigationBar {barType} />
    {/if}
</div>

<style>
    @media (min-width: 1024px) {
        .audio-bar-desktop {
            left: 320px;
        }
    }
</style>
