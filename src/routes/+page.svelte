<script lang="ts">
    import AudioBar from '$lib/components/AudioBar.svelte';
    import BookSelector from '$lib/components/BookSelector.svelte';
    import ChapterSelector from '$lib/components/ChapterSelector.svelte';
    import CollectionSelector from '$lib/components/CollectionSelector.svelte';
    import ScrolledContent from '$lib/components/ScrolledContent.svelte';
    import { audioActive, refs } from '$lib/data/stores';
    import { AudioIcon, SearchIcon } from '$lib/icons';
    import Navbar from '$lib/components/Navbar.svelte';
    import TextAppearanceSelector from '$lib/components/TextAppearanceSelector.svelte';
    import config from '$lib/data/config';
    import ScriptureViewSofria from '$lib/components/ScriptureViewSofria.svelte';

    const showSearch = config.mainFeatures['search'];
    const showCollections = config.bookCollections.length > 1;
    $: barClass =
        $refs.hasAudio && $audioActive
            ? $refs.hasAudio.timingFile
                ? 'content-with-bar'
                : 'content-with-bar-progress'
            : '';
    $: footerClass = $refs.hasAudio?.timingFile ? 'footer' : 'footer-progress';
</script>

<div class="navbar">
    <Navbar>
        <div slot="left-buttons">
            <BookSelector />
            <ChapterSelector />
        </div>
        <div slot="right-buttons">
            {#if $refs.hasAudio}
                <!-- Mute/Volume Button -->
                <button class="dy-btn dy-btn-ghost dy-btn-circle">
                    <label class="dy-swap">
                        <!-- this hidden checkbox controls the state -->
                        <input type="checkbox" bind:checked={$audioActive} />

                        <!-- volume on icon -->
                        <AudioIcon.Volume _class="dy-swap-on" color="white" />

                        <!-- volume off icon -->
                        <AudioIcon.Mute _class="dy-swap-off" color="white" />
                    </label>
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
    <div class={barClass} slot="scrolled-content">
        <ScriptureViewSofria />
    </div>
</ScrolledContent>
{(console.log('HasAudio', $refs.hasAudio), '')}
{#if $refs.hasAudio && $audioActive}
    <div class={footerClass}>
        <div class="audio-bar">
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
        height: calc(100vh - 8rem);
        height: calc(100dvh - 8rem);
    }
    .audio-bar-with-progress {
        height: 4rem;
    }
    .audio-bar {
        height: 1rem;
    }
    .footer {
        padding: 0 0 2.1rem 0;
        position: absolute;
        bottom: 0;
        right: 0;
        left: 0;
    }
    .footer-progress {
        padding: 0 0 4rem 0;
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
