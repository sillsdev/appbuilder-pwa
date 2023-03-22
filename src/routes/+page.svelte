<script lang="ts">
    import AudioBar from '$lib/components/AudioBar.svelte';
    import BookSelector from '$lib/components/BookSelector.svelte';
    import ChapterSelector from '$lib/components/ChapterSelector.svelte';
    import CollectionSelector from '$lib/components/CollectionSelector.svelte';
    import ScrolledContent from '$lib/components/ScrolledContent.svelte';
    import {
        audioActive,
        refs,
        showDesktopSidebar,
        bodyFontSize,
        bodyLineHeight,
        userSettings
    } from '$lib/data/stores';
    import { AudioIcon, SearchIcon } from '$lib/icons';
    import Navbar from '$lib/components/Navbar.svelte';
    import TextAppearanceSelector from '$lib/components/TextAppearanceSelector.svelte';
    import config from '$lib/data/config';
    import ScriptureViewSofria from '$lib/components/ScriptureViewSofria.svelte';
    import { swipe } from 'svelte-gestures';
    import { base } from '$app/paths';

    function doSwipe(
        event: CustomEvent<{
            direction: 'left' | 'top' | 'right' | 'bottom';
            target: EventTarget;
        }>
    ) {
        (refs as any).skip(event.detail.direction === 'right' ? -1 : 1);
    }

    const showSearch = config.mainFeatures['search'];
    const showCollections = config.bookCollections.length > 1;
    const showAudio = config.mainFeatures['audio-allow-turn-on-off'];
    $: showBorder = config.traits['has-borders'] && $userSettings['show-border'];
    $: viewSettings = {
        bodyFontSize: $bodyFontSize,
        bodyLineHeight: $bodyLineHeight,
        viewShowVerses: $userSettings['verse-numbers'],
        redLetters: $userSettings['red-letters']
    };
    // Border Subtraction
    $: bs = 4 + ($refs.hasAudio && $audioActive ? ($refs.hasAudio.timingFile ? 4 : 5) : 0);
    // Content Subtarction
    $: cs = 1 + bs + (showBorder ? 3.5 : 0);
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
        >
            <ScriptureViewSofria {...viewSettings} />
        </div>
    </ScrolledContent>
</div>
{#if $refs.hasAudio && $audioActive}
    <div
        class="audio-bar p-0 left-0 right-0 bottom-0 absolute"
        class:audio-bar-desktop={$showDesktopSidebar}
    >
        <div style:height={$refs.hasAudio?.timingFile ? '4rem' : '5rem'}>
            <AudioBar />
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
