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
    import { parseReference } from '$lib/data/stores/store-types';
    import { AudioIcon, SearchIcon } from '$lib/icons';
    import Navbar from '$lib/components/Navbar.svelte';
    import TextAppearanceSelector from '$lib/components/TextAppearanceSelector.svelte';
    import config from '$lib/data/config';
    import ScriptureViewSofria from '$lib/components/ScriptureViewSofria.svelte';
    import { getFeatureValueString } from '$lib/scripts/configUtils';
    import { pinch, swipe } from 'svelte-gestures';
    import TextSelectionToolbar from '$lib/components/TextSelectionToolbar.svelte';
    import { base } from '$app/paths';
    import { page } from '$app/stores';

    function doSwipe(
        event: CustomEvent<{
            direction: 'left' | 'top' | 'right' | 'bottom';
            target: EventTarget;
        }>
    ) {
        (refs as any).skip(event.detail.direction === 'right' ? -1 : 1);
    }

    var lastPinch = 1.0;
    function doPinch(
        event: CustomEvent<{
            scale: number;
            center: {
                x: number;
                y: number;
            };
        }>,
        minFontSize: number,
        maxFontSize: number
    ) {
        const currPinch = event.detail.scale;
        bodyFontSize.update((fontSize) => {
            const newFontSize = currPinch > lastPinch ? fontSize + 1.0 : fontSize - 1.0;
            lastPinch = currPinch;
            const clampedFontSize = Math.max(minFontSize, Math.min(maxFontSize, newFontSize));
            return clampedFontSize;
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
        audioActive: $audioActive,
        audioHighlight: $audioHighlight,
        audioPhraseEndChars: audioPhraseEndChars,
        bodyFontSize: $bodyFontSize,
        bodyLineHeight: $bodyLineHeight,
        bookmarks: $bookmarks,
        highlights: $highlights,
        mainScroll: $mainScroll,
        maxSelections: config.mainFeatures['annotation-max-select'],
        redLetters: $userSettings['red-letters'],
        references: $refs,
        scrolls: scrolls,
        selectedVerses: selectedVerses,
        themeColors: $themeColors,
        verseLayout: $userSettings['verse-layout'],
        viewShowVerses: $userSettings['verse-numbers']
    };

    // Border Subtraction
    $: bs =
        4 +
        ($selectedVerses.length > 0
            ? 2
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
            <!-- {#if showCollections}
                <CollectionSelector />
            {/if} -->
        </div>
    </Navbar>
</div>
<div
    class:borderimg={showBorder}
    style={'height:calc(100vh - ' + bs + 'rem);height:calc(100dvh - ' + bs + 'rem)'}
>
    <ScrolledContent>
        <div
            style={'height:calc(100vh - ' + cs + 'rem);height:calc(100dvh - ' + cs + 'rem);'}
            slot="scrolled-content"
            use:swipe={{ timeframe: 300, minSwipeDistance: 60, touchAction: 'pan-y' }}
            on:swipe={doSwipe}
            use:pinch
            on:pinch={(event) =>
                doPinch(
                    event,
                    config.mainFeatures['text-size-min'],
                    config.mainFeatures['text-size-max']
                )}
        >
            <ScriptureViewSofria {...viewSettings} />
        </div>
    </ScrolledContent>
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
</style>
