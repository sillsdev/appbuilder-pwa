<script lang="ts">
    import AudioBar from '$lib/components/AudioBar.svelte';
    import BookSelector from '$lib/components/BookSelector.svelte';
    import ChapterSelector from '$lib/components/ChapterSelector.svelte';
    import CollectionSelector from '$lib/components/CollectionSelector.svelte';
    import ScrolledContent from '$lib/components/ScrolledContent.svelte';
    import { audioActive, refs, selectedVerses } from '$lib/data/stores';
    import { AudioIcon, SearchIcon } from '$lib/icons';
    import Navbar from '$lib/components/Navbar.svelte';
    import TextAppearanceSelector from '$lib/components/TextAppearanceSelector.svelte';
    import config from '$lib/data/config';
    import ScriptureViewSofria from '$lib/components/ScriptureViewSofria.svelte';
    import { swipe } from 'svelte-gestures';
    import TextSelectionToolbar from '$lib/components/TextSelectionToolbar.svelte';

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
    $: contentClass =
        $refs.hasAudio && $audioActive
            ? $refs.hasAudio.timingFile
                ? 'content-with-bar'
                : 'content-with-bar-progress'
            : '';
    $: audioBarClass = $refs.hasAudio?.timingFile ? 'audio-bar' : 'audio-bar-progress';
</script>

<div class="navbar">
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
                <a href="/search" class="dy-btn dy-btn-ghost dy-btn-circle">
                    <SearchIcon color="white" />
                </a>
            {/if}
            <!-- Text Appearance Options Menu -->
            <TextAppearanceSelector />
            {#if showCollections}
                <!-- Book Collection Menu Button -->
                <CollectionSelector />
            {/if}
        </div>
    </Navbar>
</div>
<ScrolledContent>
    <div
        class={contentClass}
        slot="scrolled-content"
        use:swipe={{ timeframe: 300, minSwipeDistance: 60, touchAction: 'pan-y' }}
        on:swipe={doSwipe}
    >
        <ScriptureViewSofria />
    </div>
</ScrolledContent>
{#if $selectedVerses.length > 0}
    <div class="footer">
        <TextSelectionToolbar />
    </div>
{:else if $refs.hasAudio && $audioActive}
    <div class="footer">
        <div class={audioBarClass}>
            <AudioBar />
        </div>
    </div>
{/if}

<style>
    .navbar {
        height: 4rem;
    }
    /*shrink to accomodate the audio bar*/
    .content-with-bar-progress {
        height: calc(100vh - 10rem);
        height: calc(100dvh - 10rem);
    }
    .content-with-bar {
        height: calc(100vh - 9rem);
        height: calc(100dvh - 9rem);
    }
    .audio-bar-with-progress {
        height: 5rem;
    }
    .audio-bar {
        height: 4rem;
    }
    .footer {
        padding: 0 0 0 0;
        position: absolute;
        bottom: 0;
        right: 0;
        left: 0;
    }
    @media (min-width: 1024px) {
        .footer {
            left: 320px;
        }
        .footer-progress {
            left: 320px;
        }
    }
</style>
