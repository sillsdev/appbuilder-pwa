<script lang="ts">
    import AudioBar from '$lib/components/AudioBar.svelte';
    import ScriptureView from '$lib/components/ScriptureView.svelte';
    import BookSelector from '$lib/components/BookSelector.svelte';
    import ChapterSelector from '$lib/components/ChapterSelector.svelte';
    import CollectionSelector from '$lib/components/CollectionSelector.svelte';
    import ScrolledContent from '$lib/components/ScrolledContent.svelte';
    import { audioActive, refs, themeColors } from '$lib/data/stores';
    import { AudioIcon, SearchIcon, BibleIcon } from '$lib/icons';
    import Navbar from '$lib/components/Navbar.svelte';
    import TextAppearanceSelector from '$lib/components/TextAppearanceSelector.svelte';
    import config from '$lib/data/config';
    import ScriptureViewSofria from '$lib/components/ScriptureViewSofria.svelte';

    const showSearch = config.mainFeatures['search'];
    const showCollections = config.bookCollections.length > 1;
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
    <div class={$refs.hasAudio && $audioActive ? 'smaller' : 'larger'} slot="scrolled-content">
        <ScriptureViewSofria />
    </div>
</ScrolledContent>
{#if $refs.hasAudio && $audioActive}
    <div class="audio-bar">
        <AudioBar />
    </div>
{/if}

<style>
    .navbar {
        height: 10vh;
    }
    /*shrink to accomodate the audio bar*/
    .smaller {
        height: 80vh;
    }
    .larger {
        height: 90vh;
    }
    .audio-bar {
        height: 10vh;
    }
</style>
