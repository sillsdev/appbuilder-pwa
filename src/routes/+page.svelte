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
        refs,
        scrolls,
        selectedVerses,
        showDesktopSidebar,
        themeColors,
        userSettings
    } from '$lib/data/stores';
    import { addHistory } from '$lib/data/history';
    import { parseReference } from '$lib/data/stores/store-types';
    import { AudioIcon, SearchIcon, ChevronLeftIcon, ChevronRightIcon } from '$lib/icons';
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
                chapter: $refs.chapter,
                verse: $refs.verse
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
    const showCollections = config.bookCollections.length > 1;
    const showAudio = config.mainFeatures['audio-allow-turn-on-off'];
    $: showBorder = config.traits['has-borders'] && $userSettings['show-border'];
    $: viewSettings = {
        audioPhraseEndChars: audioPhraseEndChars,
        bodyFontSize: $bodyFontSize,
        bodyLineHeight: $bodyLineHeight,
        bookmarks: $bookmarks,
        highlights: $highlights,
        maxSelections: config.mainFeatures['annotation-max-select'],
        redLetters: $userSettings['red-letters'],
        references: $refs,
        selectedVerses: selectedVerses,
        verseLayout: $userSettings['verse-layout'],
        viewShowVerses: $userSettings['verse-numbers']
    };

    // Border Subtraction
    $: bs =
        4 +
        ($selectedVerses.length > 0
            ? 3
            : $refs.hasAudio && $audioActive
            ? $refs.hasAudio.timingFile
                ? 4
                : 5
            : 0);
    // Content Subtraction
    $: cs = 1 + bs + (showBorder ? 3.5 : 0);

    // Process page parameters
    if ($page.data?.ref) {
        $refs = parseReference($page.data.ref);
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
</script>

<div class="navbar h-16">
    <Navbar>
        <div slot="left-buttons">
            <BookSelector />
            <ChapterSelector />
        </div>
        <div slot="right-buttons">
            {#if $refs.hasAudio && showAudio}
                <!-- Mute/Volume Button -->
                <button
                    class="dy-btn dy-btn-ghost dy-btn-circle"
                    on:click={() => ($audioActive = !$audioActive)}
                >
                    {#if $audioActive}
                        <AudioIcon.Volume color="white" />
                    {:else}
                        <AudioIcon.Mute color="white" />
                    {/if}
                </button>
            {/if}
            {#if showSearch}
                <!-- Search Button -->
                <a href="{base}/search" class="dy-btn dy-btn-ghost dy-btn-circle">
                    <SearchIcon color="white" />
                </a>
            {/if}
            <!-- Text Appearance Options Menu -->
            <TextAppearanceSelector />
            {#if showCollections}
                <CollectionSelector />
            {/if}
        </div>
    </Navbar>
</div>
<div
    class:borderimg={showBorder}
    style={'height:calc(100vh - ' + bs + 'rem);height:calc(100dvh - ' + bs + 'rem)'}
>
    <div class="flex flex-row justify-center space-x-4 ml-4 mr-4">
        <!-- TODO: we shouldn't show these buttons on smaller screens -->
        <div class="grow flex flex-column items-center justify-end">
            <button
                class="dy-btn dy-btn-ghost dy-btn-circle"
                disabled={!$refs.prev.book || !$refs.prev.chapter}
                on:click={() => {
                    refs.skip(-1);
                    addHistory({
                        collection: $refs.collection,
                        book: $refs.book,
                        chapter: $refs.chapter,
                        verse: $refs.verse
                    });
                }}
            >
                {#if $refs.prev.book && $refs.prev.chapter}
                    <ChevronLeftIcon color="gray" />
                {/if}
            </button>
        </div>

        <!-- div class="flex flex-col justify-center">
    </div -->
        <ScrolledContent class="grow-0">
            <div
                style={'height:calc(100vh - ' + cs + 'rem);height:calc(100dvh - ' + cs + 'rem);'}
                slot="scrolled-content"
                class="max-w-screen-md"
                use:pinch
                on:pinch={doPinch}
                use:swipe={{ timeframe: 300, minSwipeDistance: 60, touchAction: 'pan-y' }}
                on:swipe={doSwipe}
            >
                <ScriptureViewSofria {...viewSettings} />
            </div>
        </ScrolledContent>
        <div class="grow flex flex-column items-center justify-start">
            <!-- TODO: we shouldn't show these buttons on smaller screens -->
            <button
                class="dy-btn dy-btn-ghost dy-btn-circle"
                disabled={!$refs.next.book || !$refs.next.chapter}
                on:click={() => {
                    refs.skip(1);
                    addHistory({
                        collection: $refs.collection,
                        book: $refs.book,
                        chapter: $refs.chapter,
                        verse: $refs.verse
                    });
                }}
            >
                {#if $refs.next.book && $refs.next.chapter}
                    <ChevronRightIcon color="gray" />
                {/if}
            </button>
        </div>
    </div>
</div>
{#if $selectedVerses.length > 0}
    <div class="left-0 right-0 bottom-0 absolute">
        <TextSelectionToolbar />
    </div>
{:else if $refs.hasAudio && $audioActive}
    <div
        class="audio-bar p-0 left-0 right-0 bottom-0 absolute"
        class:audio-bar-desktop={$showDesktopSidebar}
    >
        <div style:height={$refs.hasAudio?.timingFile ? '4rem' : '5rem'}>
            <AudioBar audio={$refs.hasAudio?.audio} />
        </div>
    </div>
{/if}

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
    button[disabled] {
        background-color: transparent;
        &:hover {
            background-color: transparent;
        }
    }
</style>
