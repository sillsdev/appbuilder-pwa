<script>
    import AudioBar from '$lib/components/AudioBar.svelte';
    import BookSelector from '$lib/components/BookSelector.svelte';
    import ChapterSelector from '$lib/components/ChapterSelector.svelte';
    import ScrolledContent from '$lib/components/ScrolledContent.svelte';
    import {
        audioPlayer,
        audioActive,
        bodyFontSize,
        bodyLineHeight,
        bookmarks,
        convertStyle,
        currentFont,
        direction,
        firstLaunch,
        highlights,
        mainScroll,
        audioHighlightElements,
        notes,
        refs,
        s,
        scrolls,
        selectedVerses,
        showDesktopSidebar,
        themeColors,
        userSettings,
        modal,
        MODAL_TEXT_APPERANCE,
        MODAL_COLLECTION,
        NAVBAR_HEIGHT
    } from '$lib/data/stores';
    import { addHistory } from '$lib/data/history';
    import { updateAudioPlayer } from '$lib/data/audio';
    import { parseReference } from '$lib/data/stores/store-types';
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
    import ScriptureViewSofria from '$lib/components/ScriptureViewSofria.svelte';
    import { getFeatureValueString } from '$lib/scripts/configUtils';
    import { pinch, swipe } from 'svelte-gestures';
    import TextSelectionToolbar from '$lib/components/TextSelectionToolbar.svelte';
    import { base } from '$app/paths';
    import { page } from '$app/stores';
    import { onDestroy, onMount } from 'svelte';

    function doSwipe(event){
        console.log('SWIPE', event.detail.direction);
        const prev = $refs;
        (refs).skip(event.detail.direction === 'right' ? -1 : 1);
        if (prev !== $refs) {
            addHistory({
                collection: $refs.collection,
                book: $refs.book,
                chapter: $refs.chapter
            });
        }
    }

    function prevChapter() {
        (refs).skip(-1);
        addHistory({
            collection: $refs.collection,
            book: $refs.book,
            chapter: $refs.chapter
        });
    }
    function nextChapter() {
        (refs).skip(1);
        addHistory({
            collection: $refs.collection,
            book: $refs.book,
            chapter: $refs.chapter
        });
    }

    $: hasPrev = $refs.prev.chapter !== null;
    $: hasNext = $refs.next.chapter !== null;

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
    $: showBorder = config.traits['has-borders'] && $userSettings['show-border'];
    $: viewSettings = {
        audioPhraseEndChars: audioPhraseEndChars,
        bodyFontSize: $bodyFontSize,
        bodyLineHeight: $bodyLineHeight,
        bookmarks: $bookmarks,
        notes: $notes,
        highlights: $highlights,
        maxSelections: config.mainFeatures['annotation-max-select'],
        redLetters: $userSettings['red-letters'],
        references: $refs,
        selectedVerses: selectedVerses,
        verseLayout: $userSettings['verse-layout'],
        viewShowVerses: $userSettings['verse-numbers'],
        font: $currentFont,
        proskomma: $page.data?.proskomma
    };

    $: extraIconsExist = showSearch || showCollectionNavbar; //Note: was trying document.getElementById('extraButtons').childElementCount; but that caused it to hang forever.
    let showOverlowMenu = false; //Controls the visibility of the extraButtons div on mobile
    function handleMenuClick(event) {
        showOverlowMenu = false;
    }

    // Process page parameters
    if ($page.data?.ref) {
        refs.set(parseReference($page.data.ref));
    }
    if ($page.data?.audio) {
        $audioActive = $page.data.audio === '1';
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
        document
            .querySelector(
                `div[data-verse="${id.split('-')[0]}"][data-phrase="${id.split('-')[1]}"]`
            )
            ?.scrollIntoView();
    };
    $: scrollTo(scrollId);

    let lastVerseInView = '';
    const handleScroll = (() => {
        let scrollTimer;
        return (trigger) => {
            clearTimeout(scrollTimer);
            scrollTimer = setTimeout(() => {
                const items = Array.from(document.getElementsByClassName('scroll-item'))
                    .filter((it, i) => {
                        const rect = it.getBoundingClientRect();
                        const win = document
                            .getElementsByClassName('container')[0]
                            ?.getBoundingClientRect();

                        return (
                            rect.top - win.top >= $mainScroll.top &&
                            rect.bottom - win.top <= $mainScroll.height + $mainScroll.top
                        );
                    })
                    .map(
                        (el) => `${el.getAttribute('data-verse')}-${el.getAttribute('data-phrase')}`
                    );

                scrolls.set(items[0], group, key);
                lastVerseInView = items.pop();
            }, 500);
        };
    })();
    $: handleScroll([$mainScroll, $refs]);

    $: highlightColor = $themeColors['TextHighlightColor'];
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
            const element = document.getElementById(elementId);
            if (element === null) {
                break;
            }
            element.setAttribute('style', 'background-color: ' + color + ';');
            element.classList.add('highlighting');
        }

        // todo implement scrolling
        // if (
        //     `${el?.getAttribute('data-verse')}-${el?.getAttribute('data-phrase')}` ===
        //     lastVerseInView
        // )
        //     el?.scrollIntoView();
    };

    $: updateHighlight($audioHighlightElements, highlightColor);
    $: updateAudioPlayer($refs);
    const navBarHeight = NAVBAR_HEIGHT;
    onMount(() => {
        if ($firstLaunch) {
            if (showCollectionsOnFirstLaunch && enoughCollections) {
                modal.open(MODAL_COLLECTION);
            }
            $firstLaunch = false;
        }
    });
</script>

<div class="grid grid-rows-[auto,1fr,auto]" style="height:100vh;height:100dvh;">
    <div class="navbar">
        <Navbar>
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

                    <!-- Text Appearance Selector Button -->
                    <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
                    <label
                        for="textAppearanceSelector"
                        class="dy-btn dy-btn-ghost p-0.5 dy-no-animation"
                        on:click={() => modal.open(MODAL_TEXT_APPERANCE)}
                        ><TextAppearanceIcon color="white" /></label
                    >

                    <!-- Search Button -->
                    {#if showSearch}
                        <a href="{base}/search" class="dy-btn dy-btn-ghost dy-btn-circle">
                            <SearchIcon color="white" />
                        </a>
                    {/if}

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
    <div class:borderimg={showBorder} class="overflow-y-auto">
        <div class="flex flex-row mx-auto justify-center" style:direction={$direction}>
            <div class="hidden md:flex basis-1/12 justify-center">
                <button
                    on:click={prevChapter}
                    class="fixed top-1/2 dy-btn dy-btn-circle dy-btn-ghost {hasPrev
                        ? 'visible'
                        : 'invisible'}"
                >
                    <ChevronIcon size={36} color={'gray'} deg={$direction === 'ltr' ? 180 : 0} />
                </button>
            </div>
            <div class="basis-5/6 max-w-screen-md">
                <ScrolledContent>
                    <div
                        slot="scrolled-content"
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
                </ScrolledContent>
            </div>
            <div class="hidden basis-1/12 md:flex justify-center">
                <button
                    on:click={nextChapter}
                    class="fixed mx-auto top-1/2 dy-btn dy-btn-circle dy-btn-ghost {hasNext
                        ? 'visible'
                        : 'invisible'}"
                >
                    <ChevronIcon size={36} color={'gray'} deg={$direction === 'ltr' ? 0 : 180} />
                </button>
            </div>
        </div>
    </div>
    <div class="flex justify-center">
        <StackView />
    </div>
    {#if $selectedVerses.length > 0 && !$audioPlayer.playing}
        <div class="text-selection">
            <TextSelectionToolbar />
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
