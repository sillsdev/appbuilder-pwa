<script>
    import AudioBar from '$lib/components/AudioBar.svelte';
    import BookSelector from '$lib/components/BookSelector.svelte';
    import ChapterSelector from '$lib/components/ChapterSelector.svelte';
    import {
        audioPlayer,
        audioActive,
        bodyFontSize,
        bodyLineHeight,
        bookmarks,
        convertStyle,
        currentFont,
        direction,
        isFirstLaunch,
        glossary,
        highlights,
        mainScroll,
        audioHighlightElements,
        notes,
        refs,
        s,
        scrolls,
        selectedVerses,
        showDesktopSidebar,
        t,
        themeColors,
        userSettings,
        contentsStack,
        modal,
        MODAL_TEXT_APPERANCE,
        MODAL_COLLECTION,
        NAVBAR_HEIGHT,
        userSettingsOrDefault,
        analytics
    } from '$lib/data/stores';
    import { updateAudioPlayer, seekToVerse } from '$lib/data/audio';
    import {
        AudioIcon,
        SearchIcon,
        ChevronIcon,
        TriangleLeftIcon,
        TriangleRightIcon,
        BibleIcon,
        TextAppearanceIcon
    } from '$lib/icons';
    import StackView from '$lib/components/StackView.svelte';
    import Navbar from '$lib/components/Navbar.svelte';
    import config from '$lib/data/config';
    import contents from '$lib/data/contents';
    import ScriptureViewSofria from '$lib/components/ScriptureViewSofria.svelte';
    import { getFeatureValueString, getFeatureValueBoolean } from '$lib/scripts/configUtils';
    import { pinch, swipe } from 'svelte-gestures';
    import TextSelectionToolbar from '$lib/components/TextSelectionToolbar.svelte';
    import { base } from '$app/paths';
    import { page } from '$app/stores';
    import { goto } from '$app/navigation';
    import { onDestroy, onMount, afterUpdate } from 'svelte';
    import { navigateToTextChapterInDirection } from '$lib/navigate';

    let savedScrollPosition = 0;
    function saveScrollPosition() {
        if (scrollingDiv) {
            savedScrollPosition = scrollingDiv.scrollTop;
        }
    }
    afterUpdate(() => {
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
        if (swipeBetweenBooks || 
            ($refs.prev.book === $refs.book && swipeDirection === 'right') || 
            ($refs.next.book === $refs.book && swipeDirection === 'left')) {
            await navigateToTextChapterInDirection(swipeDirection === 'right' ? -1 : 1);
        }
    }

    async function prevChapter() {
        await navigateToTextChapterInDirection(-1);
    }
    async function nextChapter() {
        await navigateToTextChapterInDirection(1);
    }

    $: navigateBetweenBooksPrev = swipeBetweenBooks || $refs.prev.book === $refs.book;
    $: navigateBetweenBooksNext = swipeBetweenBooks || $refs.next.book === $refs.book;
    $: hasPrev = $refs.prev.chapter !== null;
    $: hasNext = $refs.next.chapter !== null;
    $: viewShowVerses =
        $userSettings['verse-numbers'] ??
        getFeatureValueBoolean('show-verse-numbers', $refs.collection, $refs.book);

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

    $: audioPhraseEndChars = getFeatureValueString(
        'audio-phrase-end-chars',
        $refs.collection,
        $refs.book
    );

    const showSearch = config.mainFeatures['search'];
    const enoughCollections = config.bookCollections.length > 1;
    const showCollectionNavbar = config.mainFeatures['layout-config-change-toolbar-button'];
    const showCollectionsOnFirstLaunch = config.mainFeatures['layout-config-first-launch'];
    const showCollectionViewer = config.mainFeatures['layout-config-change-viewer-button'];
    const showAudio = config.mainFeatures['audio-allow-turn-on-off'];
    $: showBorderSetting = getFeatureValueBoolean('show-border', $refs.collection, $refs.book);
    $: showBorder =
        config.traits['has-borders'] && ($userSettings['show-border'] ?? showBorderSetting);
    $: viewSettings = {
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
        proskomma: $page.data?.proskomma
    };

    $: stackSettings = {
        bodyFontSize: $bodyFontSize,
        bodyLineHeight: $bodyLineHeight,
        font: $currentFont
    };

    $: extraIconsExist = showSearch || showCollectionNavbar; //Note: was trying document.getElementById('extraButtons').childElementCount; but that caused it to hang forever.
    let scrollingDiv;

    let showOverlowMenu = false; //Controls the visibility of the extraButtons div on mobile
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
    $: scrollTo(scrollId);

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
    $: highlightColor = $themeColors['TextHighlightColor'];
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

    $: updateHighlight($audioHighlightElements, highlightColor);
    $: updateAudioPlayer($refs);
    $: newRefScroll($refs);
    const navBarHeight = NAVBAR_HEIGHT;
    onMount(() => {
        if ($isFirstLaunch) {
            analytics.log('ab_first_run');
            if (showCollectionsOnFirstLaunch && enoughCollections) {
                modal.open(MODAL_COLLECTION);
            }
        }
    });

    let textCopied = false;
    function onTextCopy() {
        textCopied = true;
        setTimeout(() => {
            textCopied = false;
        }, 3000);
    }

    function handleBackNavigation(event) {
        event.preventDefault();
        if ($contentsStack.length > 0) {
            const menuId = contentsStack.popItem();
            goto(`${base}/contents/${menuId}`);
        }
    }
    $: showBackButton =
        contents?.features?.['navigation-type'] === 'up' && $contentsStack.length > 0;
</script>

<div class="grid grid-rows-[auto,1fr,auto]" style="height:100vh;height:100dvh;">
    <div class="navbar">
        <Navbar on:backNavigation={handleBackNavigation} {showBackButton}>
            <div
                slot="left-buttons"
                class={showOverlowMenu ? 'hidden md:flex flex-nowrap' : 'flex flex-nowrap'}
            >
                <BookSelector />
                <ChapterSelector />
            </div>
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <!-- svelte-ignore a11y-no-static-element-interactions -->
            <div
                slot="right-buttons"
                class="flex flex-nowrap"
                on:click={showOverlowMenu ? handleMenuClick : () => ({})}
            >
                <!-- (mobile) handleMenuClick() is called to collpase the extraButtons menu when any button inside right-buttons is clicked. -->
                <div class="flex">
                    {#if $refs.hasAudio && showAudio}
                        <!-- Mute/Volume Button -->
                        <button
                            class="dy-btn dy-btn-ghost dy-btn-circle"
                            on:click={() => {
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
                        <a
                            href="{base}/search/{$refs.collection}"
                            class="dy-btn dy-btn-ghost dy-btn-circle"
                        >
                            <SearchIcon color="white" />
                        </a>
                    {/if}

                    <!-- Text Appearance Selector Button -->
                    <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
                    <label
                        for="textAppearanceSelector"
                        class="dy-btn dy-btn-ghost p-0.5 dy-no-animation"
                        on:click={() => modal.open(MODAL_TEXT_APPERANCE)}
                        ><TextAppearanceIcon color="white" /></label
                    >

                    <!-- Collection Selector Button -->
                    {#if showCollectionNavbar && enoughCollections}
                        <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
                        <label
                            for="collectionSelector"
                            class="dy-btn dy-btn-ghost p-0.5 dy-no-animation"
                            on:click={() => modal.open(MODAL_COLLECTION)}
                            ><BibleIcon color="white" /></label
                        >
                    {/if}
                </div>
                {#if extraIconsExist}
                    <!-- overflowMenuButton (on mobile this toggles the visibility of the extraButtons div) -->
                    <button
                        class="md:hidden dy-btn dy-btn-ghost dy-btn-circle"
                        on:click={() => {
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
        </Navbar>
    </div>
    {#if showCollectionViewer && enoughCollections}
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <!-- svelte-ignore a11y-no-static-element-interactions -->
        <div
            class="absolute dy-badge dy-badge-outline dy-badge-md rounded-sm p-1 end-3 m-1 cursor-pointer"
            style:top={navBarHeight}
            style:background-color={convertStyle($s['ui.pane1'])}
            style={convertStyle($s['ui.pane1.name'])}
            on:click={() => modal.open(MODAL_COLLECTION)}
        >
            {config.bookCollections.find((x) => x.id === $refs.collection)?.collectionAbbreviation}
        </div>
    {/if}
    <div
        class:borderimg={showBorder}
        class="overflow-y-auto"
        bind:this={scrollingDiv}
        on:scroll={saveScrollPosition}
    >
        <div class="flex flex-row mx-auto justify-center" style:direction={$direction}>
            <div class="hidden md:flex basis-1/12 justify-center">
                <button
                    on:click={prevChapter}
                    class="fixed top-1/2 dy-btn dy-btn-circle dy-btn-ghost {hasPrev && navigateBetweenBooksPrev
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
                            on:pinch={doPinch}
                            use:swipe={{
                                timeframe: 300,
                                minSwipeDistance: 60,
                                touchAction: 'pan-y'
                            }}
                            on:swipe={doSwipe}
                        >
                            <ScriptureViewSofria {...viewSettings} />
                        </div>
                    </main>
                </div>
            </div>
            <div class="hidden basis-1/12 md:flex justify-center">
                <button
                    on:click={nextChapter}
                    class="fixed mx-auto top-1/2 dy-btn dy-btn-circle dy-btn-ghost {hasNext && navigateBetweenBooksNext
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
            <TextSelectionToolbar on:copied={onTextCopy} />
        </div>
    {:else if $refs.hasAudio && $audioActive}
        <!-- Upgrading to DaisyUI 3, bottom-0 became bottom=-(height of bar) -->
        <div class="audio-bar p-0" class:audio-bar-desktop={$showDesktopSidebar}>
            <div>
                <AudioBar />
            </div>
        </div>
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
