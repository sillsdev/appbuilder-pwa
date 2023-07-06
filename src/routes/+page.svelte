<script lang="ts">
    import AudioBar from '$lib/components/AudioBar.svelte';
    import BookSelector from '$lib/components/BookSelector.svelte';
    import ChapterSelector from '$lib/components/ChapterSelector.svelte';
    import CollectionSelector from '$lib/components/CollectionSelector.svelte';
    import ScrolledContent from '$lib/components/ScrolledContent.svelte';
    import {
        audioActive,
        audioHighlight,
        bodyFontSize,
        bodyLineHeight,
        bookmarks,
        highlights,
        mainScroll,
        notes,
        refs,
        scrolls,
        selectedVerses,
        showDesktopSidebar,
        themeColors,
        userSettings
    } from '$lib/data/stores';
    import { addHistory } from '$lib/data/history';
    import { parseReference } from '$lib/data/stores/store-types';
    import {
        AudioIcon,
        SearchIcon,
        TriangleLeftIcon,
        TriangleRightIcon,
        BibleIcon,
        TextAppearanceIcon
    } from '$lib/icons';
    import Navbar from '$lib/components/Navbar.svelte';
    import TextAppearanceSelector from '$lib/components/TextAppearanceSelector.svelte';
    import config from '$lib/data/config';
    import ScriptureViewSofria from '$lib/components/ScriptureViewSofria.svelte';
    import { getFeatureValueString } from '$lib/scripts/configUtils';
    import { pinch, swipe } from 'svelte-gestures';
    import TextSelectionToolbar from '$lib/components/TextSelectionToolbar.svelte';
    import { base } from '$app/paths';
    import { page } from '$app/stores';
    import { onDestroy } from 'svelte';

    function doSwipe(
        event: CustomEvent<{
            direction: 'left' | 'top' | 'right' | 'bottom';
            target: EventTarget;
        }>
    ) {
        console.log('SWIPE', event.detail.direction);
        const prev = $refs;
        (refs as any).skip(event.detail.direction === 'right' ? -1 : 1);
        if (prev !== $refs) {
            addHistory({
                collection: $refs.collection,
                book: $refs.book,
                chapter: $refs.chapter
            });
        }
    }

    const minFontSize = config.mainFeatures['text-size-min'];
    const maxFontSize = config.mainFeatures['text-size-max'];
    let lastPinch = 1.0;
    function doPinch(
        event: CustomEvent<{
            scale: number;
            center: {
                x: number;
                y: number;
            };
        }>
    ) {
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
    const showCollections =
        config.bookCollections.length > 1 &&
        config.mainFeatures['layout-config-change-toolbar-button'];
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
        proskomma: $page.data?.proskomma
    };

    $: extraIconsExist = showSearch || showCollections; //Note: was trying document.getElementById('extraButtons').childElementCount; but that caused it to hang forever.
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
    let scrollId: string;
    let scrollMod: any;
    const unSub = scrolls.subscribe((val, mod) => {
        scrollId = val;
        scrollMod = mod;
    }, group);
    onDestroy(unSub);

    /**scrolls element with id into view*/
    const scrollTo = (id: string) => {
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
        let scrollTimer: NodeJS.Timeout;
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
    const updateHighlight = (h: string, color: string, timing: any) => {
        if (!timing) {
            return;
        }
        let container = document.getElementsByClassName('container')[0];
        const a = h.split(',');
        // Remove highlighting for currently highlighted verses
        let el = container?.getElementsByClassName('highlighting')?.item(0);
        let node = el?.getAttributeNode('style');
        el?.removeAttributeNode(node);
        el?.classList.remove('highlighting');
        // If audio off or if not in the right chapter, return
        if (
            !audioActive ||
            a[0] !== $refs.docSet ||
            a[1] !== $refs.book ||
            a[2] !== $refs.chapter
        ) {
            return;
        }
        // Try to get verse for timing
        el = container?.querySelector(`div[data-verse="${a[3]}"][data-phrase="${a[4]}"]`);
        // If failed to get 'verse #, none' then try for 'verse # a' instead
        if (el == null && a[4] == 'none') {
            el = container?.querySelector(`div[data-verse="${a[3]}"][data-phrase="a"]`);
        }
        // Highlight verse if found
        el?.setAttribute('style', 'background-color: ' + color + ';');
        el?.classList.add('highlighting');
        if (
            `${el?.getAttribute('data-verse')}-${el?.getAttribute('data-phrase')}` ===
            lastVerseInView
        )
            el?.scrollIntoView();
    };
    $: updateHighlight($audioHighlight, highlightColor, $refs.hasAudio?.timingFile);

    let textAppearanceSelector;
    function handleTextAppearanceSelector() {
        textAppearanceSelector.showModal(); //Uses an exported modal function (see Modal.svelte) to trigger the modal popup
    }

    let collectionSelector;
    function handleCollectionSelector() {
        collectionSelector.showModal(); //Uses an exported modal function (see Modal.svelte) to trigger the modal popup
    }

    let navBarHeight = '4rem';
</script>

<div>
    <!--Div containing the popup modals triggered by the navBar buttons:-->

    <!-- Text Appearance Options Menu -->
    <TextAppearanceSelector bind:this={textAppearanceSelector} vertOffset={navBarHeight} />

    <!-- Collection Selector Menu -->
    <CollectionSelector bind:this={collectionSelector} vertOffset={navBarHeight} />
</div>

<div class="grid grid-rows-[auto,1fr,auto]" style="height:100vh;height:100dvh;">
    <div class="navbar" style="height: {navBarHeight};">
        <Navbar>
            <div
                slot="left-buttons"
                class={showOverlowMenu ? 'hidden md:flex flex-nowrap' : 'flex flex-nowrap'}
            >
                <BookSelector />
                <ChapterSelector />
            </div>
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <div
                slot="right-buttons"
                class="flex flex-nowrap"
                on:click={showOverlowMenu
                    ? handleMenuClick
                    : () => {
                          console.log('Clicked in right-buttons but showOverlowMenu = false.');
                      }}
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
                    <label
                        for="textAppearanceSelector"
                        class="dy-btn dy-btn-ghost p-0.5 dy-no-animation"
                        on:click={handleTextAppearanceSelector}
                        ><TextAppearanceIcon color="white" /></label
                    >

                    <!-- Search Button -->
                    {#if showSearch}
                        <a href="{base}/search" class="dy-btn dy-btn-ghost dy-btn-circle">
                            <SearchIcon color="white" />
                        </a>
                    {/if}

                    <!-- Collection Selector Button -->
                    {#if showCollections}
                        <label
                            for="collectionSelector"
                            class="dy-btn dy-btn-ghost p-0.5 dy-no-animation"
                            on:click={handleCollectionSelector}><BibleIcon color="white" /></label
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
                        {#if showOverlowMenu}
                            <TriangleRightIcon color="white" scale={1.25} />
                        {:else}
                            <TriangleLeftIcon color="white" scale={1.25} />
                        {/if}
                    </button>
                {/if}
            </div>
        </Navbar>
    </div>

    <div class:borderimg={showBorder} class="overflow-y-auto">
        <ScrolledContent>
            <div
                slot="scrolled-content"
                class="max-w-screen-md mx-auto"
                use:pinch
                on:pinch={doPinch}
                use:swipe={{ timeframe: 300, minSwipeDistance: 60, touchAction: 'pan-y' }}
                on:swipe={doSwipe}
            >
                <ScriptureViewSofria {...viewSettings} />
            </div>
        </ScrolledContent>
    </div>
    {#if $selectedVerses.length > 0}
        <div class="text-selection">
            <TextSelectionToolbar />
        </div>
    {:else if $refs.hasAudio && $audioActive}
        <!-- Upgrading to DaisyUI 3, bottom-0 became bottom=-(height of bar) -->
        <div class="audio-bar p-0" class:audio-bar-desktop={$showDesktopSidebar}>
            <div>
                <AudioBar audio={$refs.hasAudio?.audio} />
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
