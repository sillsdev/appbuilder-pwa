<script>
    import { base } from '$app/paths';
    import { page } from '$app/state';
    import AudioBar from '$lib/components/AudioBar.svelte';
    import BookSelector from '$lib/components/BookSelector.svelte';
    import BookTabs from '$lib/components/BookTabs.svelte';
    import BottomNavigationBar from '$lib/components/BottomNavigationBar.svelte';
    import ChapterSelector from '$lib/components/ChapterSelector.svelte';
    import HtmlBookView from '$lib/components/HtmlBookView.svelte';
    import Navbar from '$lib/components/Navbar.svelte';
    import ScriptureViewSofria from '$lib/components/ScriptureViewSofria.svelte';
    import StackView from '$lib/components/StackView.svelte';
    import TextSelectionToolbar from '$lib/components/TextSelectionToolbar.svelte';
    import { playStop, seekToVerse, updateAudioPlayer } from '$lib/data/audio';
    import config from '$lib/data/config';
    import contents from '$lib/data/contents';
    import {
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
        mainScroll,
        modal,
        MODAL_COLLECTION,
        MODAL_TEXT_APPEARANCE,
        NAVBAR_HEIGHT,
        notes,
        refs,
        s,
        scrolls,
        selectedVerses,
        showDesktopSidebar,
        t,
        themeColors,
        themes,
        userSettings,
        userSettingsOrDefault
    } from '$lib/data/stores';
    import {
        AudioIcon,
        BibleIcon,
        ChevronIcon,
        SearchIcon,
        TextAppearanceIcon,
        TriangleLeftIcon,
        TriangleRightIcon
    } from '$lib/icons';
    import { gotoRoute, navigateToTextChapterInDirection } from '$lib/navigate';
    import { getFeatureValueBoolean, getFeatureValueString } from '$lib/scripts/configUtils';
    import { onDestroy, onMount } from 'svelte';
    import { pinch, swipe } from 'svelte-gestures';
    import { slide } from 'svelte/transition';

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
    const swipeBetweenBooks = config.mainFeatures['book-swipe-between-books'];
    async function doSwipe(event) {
        const swipeDirection = event.detail.direction;
        console.log('SWIPE', swipeDirection);
        if (
            swipeBetweenBooks ||
            ($refs.prev.book === $refs.book && swipeDirection === 'right') ||
            ($refs.next.book === $refs.book && swipeDirection === 'left')
        ) {
            await navigateToTextChapterInDirection(swipeDirection === 'right' ? -1 : 1);
        }
    }

    const bookTabs = $derived(
        config?.bookCollections
            .find((x) => x.id === $refs.collection)
            .books.find((x) => x.id === $refs.book)?.bookTabs
    ); //This should hopefully be reactive and find the book tabs if the current book has them.

    const bottomNavBarEnabled = config?.bottomNavBarItems && config?.bottomNavBarItems.length > 0;
    const barType = 'book';

    async function prevChapter() {
        await navigateToTextChapterInDirection(-1);
    }
    async function nextChapter() {
        await navigateToTextChapterInDirection(1);
    }

    const navigateBetweenBooksPrev = $derived(swipeBetweenBooks || $refs.prev.book === $refs.book);
    const navigateBetweenBooksNext = $derived(swipeBetweenBooks || $refs.next.book === $refs.book);
    const hasPrev = $derived($refs.prev.chapter !== null);
    const hasNext = $derived($refs.next.chapter !== null);
    const viewShowVerses = $derived(
        $userSettings['verse-numbers'] ??
            getFeatureValueBoolean('show-verse-numbers', $refs.collection, $refs.book)
    );

    const minFontSize = config.mainFeatures['text-size-min'];
    const maxFontSize = config.mainFeatures['text-size-max'];
    let lastPinch = 1.0;
    function doPinch() {
        const currPinch = event.detail.scale;
        bodyFontSize.update((fontSize) => {
            if (Math.abs(currPinch - lastPinch) > 0.1) {
                const newFontSize = currPinch > lastPinch ? fontSize + 1.0 : fontSize - 1.0;
                lastPinch = currPinch;
                const clampedFontSize = Math.max(minFontSize, Math.min(maxFontSize, newFontSize));
                return clampedFontSize;
            } else {
                return fontSize;
            }
        });
    }

    const audioPhraseEndChars = $derived(
        getFeatureValueString('audio-phrase-end-chars', $refs.collection, $refs.book)
    );

    const showSearch = config.mainFeatures['search'];
    const enoughCollections = config.bookCollections.length > 1;
    const showCollectionNavbar = config.mainFeatures['layout-config-change-toolbar-button'];
    const showCollectionsOnFirstLaunch = config.mainFeatures['layout-config-first-launch'];
    const showCollectionViewer = config.mainFeatures['layout-config-change-viewer-button'];
    const showAudio = config.mainFeatures['audio-allow-turn-on-off'];
    const showThemes = themes.length > 1;
    const showFontSize = config.mainFeatures['text-font-size-slider'];
    let showLineHeight = $state(config.mainFeatures['text-line-height-slider']);
    const showFonts = $derived($fontChoices.length > 1);
    const showTextAppearance = $derived(showFontSize || showLineHeight || showThemes || showFonts);

    const showBorderSetting = $derived(
        getFeatureValueBoolean('show-border', $refs.collection, $refs.book)
    );
    const showBorder = $derived(
        config.traits['has-borders'] && ($userSettings['show-border'] ?? showBorderSetting)
    );
    const format = $derived(getFormat($refs.collection, $refs.book));
    const viewSettings = $derived(
        format === 'html'
            ? {
                  references: $refs,
                  bodyFontSize: $bodyFontSize,
                  bodyLineHeight: $bodyLineHeight,
                  fetch: page.data.fetch
              }
            : {
                  audioPhraseEndChars: audioPhraseEndChars,
                  bodyFontSize: $bodyFontSize,
                  bodyLineHeight: $bodyLineHeight,
                  bookmarks: $bookmarks,
                  notes: $notes,
                  highlights: $highlights,
                  maxSelections: config.mainFeatures['annotation-max-select'],
                  redLetters: $userSettingsOrDefault['red-letters'],
                  references: $refs,
                  glossary: $glossary,
                  selectedVerses: selectedVerses,
                  themeColors: $themeColors,
                  verseLayout: $userSettingsOrDefault['verse-layout'],
                  viewShowBibleImages: $userSettingsOrDefault['display-images-in-bible-text'],
                  viewShowBibleVideos: $userSettingsOrDefault['display-videos-in-bible-text'],
                  viewShowIllustrations: config.mainFeatures['show-illustrations'],
                  viewShowVerses,
                  viewShowGlossaryWords: $userSettingsOrDefault['glossary-words'],
                  font: $currentFont,
                  proskomma: page.data?.proskomma
              }
    );

    function getFormat(bcId, bookId) {
        return config.bookCollections.find((x) => x.id === bcId)?.books.find((x) => x.id === bookId)
            ?.format;
    }

    const stackSettings = $derived({
        bodyFontSize: $bodyFontSize,
        bodyLineHeight: $bodyLineHeight,
        font: $currentFont
    });

    const extraIconsExist = $derived(showSearch || showCollectionNavbar); //Note: was trying document.getElementById('extraButtons').childElementCount; but that caused it to hang forever.
    let scrollingDiv = $state();

    let showOverlowMenu = $state(false); //Controls the visibility of the extraButtons div on mobile
    function handleMenuClick(event) {
        showOverlowMenu = false;
    }

    /**unique key to use for groupStore modifier*/
    const key = {};

    let group = 'default';
    let scrollId;
    let scrollMod;
    const unSub = scrolls.subscribe((val, mod) => {
        scrollId = val;
        scrollMod = mod;
    }, group);
    onDestroy(unSub);

    /**scrolls element with id into view*/
    const scrollTo = (id) => {
        if (scrollMod === key) return;
        if (!id) return;
        let el = document.querySelector(
            `div[data-verse="${id.split('-')[0]}"][data-phrase="${id.split('-')[1]}"]`
        );
        makeElementVisible(el);
    };
    $effect(() => {
        scrollTo(scrollId);
    });

    function delayedSeek(id) {
        let updateTimer;
        clearTimeout(updateTimer);
        updateTimer = setTimeout(() => {
            seekToVerse(id);
        }, 1000);
    }
    /**Scroll to start of chapter when reference changes*/
    const newRefScroll = (() => {
        let updateTimer;
        return () => {
            clearTimeout(updateTimer);
            updateTimer = setTimeout(() => {
                let verse = $refs.verse;
                if (verse === '' || verse === '1') {
                    scrolls.set('start-none');
                } else {
                    let verseID = verse + '-a';
                    let audioID = verse + 'a';
                    scrolls.set(verseID);
                    updateAudioPlayer($refs);
                    delayedSeek(audioID);
                }
            }, 50);
        };
    })();

    function makeElementVisible(el) {
        if (el) {
            if (el.classList.contains('scroll-item')) {
                const rect = el.getBoundingClientRect();
                const win = document
                    .getElementsByClassName('container')[0]
                    ?.getBoundingClientRect();
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
    const highlightColor = $derived($themeColors['TextHighlightColor']);
    let currentVerse = '';
    /**updates highlight*/
    const updateHighlight = (elementIds, color) => {
        let container = document.getElementsByClassName('container')[0];
        // Remove highlighting for currently highlighted verses
        const elements = container?.getElementsByClassName('highlighting');
        for (let i = 0; i < elements?.length; i++) {
            const element = elements[i];
            const node = element.getAttributeNode('style');
            element.removeAttributeNode(node);
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
    const navBarHeight = NAVBAR_HEIGHT;
    onMount(() => {
        if ($isFirstLaunch) {
            analytics.log('ab_first_run');
            if (showCollectionsOnFirstLaunch && enoughCollections) {
                modal.open(MODAL_COLLECTION);
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
            gotoRoute(`/contents/${menuId}`);
        }
    }
    const showBackButton = $derived(
        contents?.features?.['navigation-type'] === 'up' && $contentsStack.length > 0
    );

    onDestroy(() => {
        // stop audio when changing routes
        playStop();
    });
</script>

<div class="grid grid-rows-[auto,1fr,auto]" style="height:100vh;height:100dvh;">
    <div class="navbar">
        <Navbar {backNavigation} {showBackButton}>
            {#snippet start()}
                <div class={showOverlowMenu ? 'hidden md:flex flex-nowrap' : 'flex flex-nowrap'}>
                    <BookSelector />
                    <ChapterSelector />
                </div>
            {/snippet}

            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            {#snippet end()}
                <div
                    class="flex flex-nowrap"
                    onclick={showOverlowMenu ? handleMenuClick : () => ({})}
                >
                    <!-- (mobile) handleMenuClick() is called to collpase the extraButtons menu when any button inside right-buttons is clicked. -->
                    <div class="flex">
                        {#if $refs.hasAudio && showAudio}
                            <!-- Mute/Volume Button -->
                            <button
                                class="dy-btn dy-btn-ghost dy-btn-circle"
                                onclick={() => {
                                    $audioActive = !$audioActive;
                                }}
                            >
                                {#if $audioActive}
                                    <AudioIcon.Volume color="white" />
                                {:else}
                                    <AudioIcon.Mute color="white" />
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
                                onclick={() => gotoRoute(`/search/${$refs.collection}`)}
                            >
                                <SearchIcon color="white" />
                            </button>
                        {/if}

                        <!-- Text Appearance Selector Button -->
                        {#if showTextAppearance}
                            <button
                                class="dy-btn dy-btn-ghost dy-btn-circle"
                                onclick={() => modal.open(MODAL_TEXT_APPEARANCE)}
                            >
                                <TextAppearanceIcon color="white" />
                            </button>
                        {/if}

                        <!-- Collection Selector Button -->
                        {#if showCollectionNavbar && enoughCollections}
                            <button
                                class="dy-btn dy-btn-ghost dy-btn-circle"
                                onclick={() => modal.open(MODAL_COLLECTION)}
                            >
                                <BibleIcon color="white" />
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
                                <TriangleRightIcon color="white" scale={1.25} />
                            {:else}
                                <TriangleLeftIcon color="white" scale={1.25} />
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

    {#if showCollectionViewer && enoughCollections}
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div
            class="absolute dy-badge dy-badge-outline dy-badge-md rounded-sm p-1 end-3 m-1 cursor-pointer"
            style:top={navBarHeight}
            style:background-color={convertStyle($s['ui.pane1'])}
            style={convertStyle($s['ui.pane1.name'])}
            onclick={() => modal.open(MODAL_COLLECTION)}
        >
            {config.bookCollections.find((x) => x.id === $refs.collection)?.collectionAbbreviation}
        </div>
    {/if}
    <div
        class:borderimg={showBorder}
        class="overflow-y-auto"
        bind:this={scrollingDiv}
        onscroll={saveScrollPosition}
    >
        <!-- flex causes the imported html to display outside of the view port. Use md: -->
        <div class="md:flex md:flex-row mx-auto justify-center" style:direction={$direction}>
            <div class="hidden md:flex basis-1/12 justify-center">
                <button
                    onclick={prevChapter}
                    class="fixed top-1/2 dy-btn dy-btn-circle dy-btn-ghost {hasPrev &&
                    navigateBetweenBooksPrev
                        ? 'visible'
                        : 'invisible'}"
                >
                    <ChevronIcon size={36} color={'gray'} deg={$direction === 'ltr' ? 180 : 0} />
                </button>
            </div>
            <div class="basis-5/6 max-w-screen-md">
                <div class="p-2 w-full">
                    <main>
                        <div
                            class="max-w-screen-md mx-auto"
                            use:pinch
                            onpinch={doPinch}
                            use:swipe={{
                                timeframe: 300,
                                minSwipeDistance: 60,
                                touchAction: 'pan-y'
                            }}
                            onswipe={doSwipe}
                        >
                            {#if format === 'html'}
                                <HtmlBookView {...viewSettings} />
                            {:else}
                                <ScriptureViewSofria {...viewSettings} />
                            {/if}
                        </div>
                    </main>
                </div>
            </div>
            <div class="hidden basis-1/12 md:flex justify-center">
                <button
                    onclick={nextChapter}
                    class="fixed mx-auto top-1/2 dy-btn dy-btn-circle dy-btn-ghost {hasNext &&
                    navigateBetweenBooksNext
                        ? 'visible'
                        : 'invisible'}"
                >
                    <ChevronIcon size={36} color={'gray'} deg={$direction === 'ltr' ? 0 : 180} />
                </button>
            </div>
        </div>
    </div>
    <div class="flex justify-center">
        <StackView {...stackSettings} />
    </div>
    {#if textCopied}
        <div
            class="flex h-12 p-2 bg-black text-white items-center justify-center text-center text-sm"
        >
            {$t['Text_Copied']}
        </div>
    {:else if $selectedVerses.length > 0 && !$audioPlayer.playing}
        <div class="text-selection">
            <TextSelectionToolbar oncopied={onTextCopy} />
        </div>
    {:else if $refs.hasAudio && $audioActive}
        <!-- Upgrading to DaisyUI 3, bottom-0 became bottom=-(height of bar) -->
        <div class="audio-bar p-0" class:audio-bar-desktop={$showDesktopSidebar}>
            <div>
                <AudioBar />
            </div>
        </div>
    {/if}
    {#if scrollingUp && bottomNavBarEnabled && !$selectedVerses.length > 0}
        <BottomNavigationBar {barType} />
    {/if}
</div>

<style>
    @media (min-width: 1024px) {
        .audio-bar-desktop {
            left: 320px;
        }
    }
    .borderimg {
        border: 30px solid transparent;
        border-image-source: url(/borders/border.png);
        border-image-slice: 100;
    }
</style>
