<script lang="ts">
    import AudioBar from '$lib/components/AudioBar.svelte';
    import ScriptureView from '$lib/components/ScriptureView.svelte';
    import BookSelector from '$lib/components/BookSelector.svelte';
    import ChapterSelector from '$lib/components/ChapterSelector.svelte';
    import CollectionSelector from '$lib/components/CollectionSelector.svelte';
    import ScrolledContent from '$lib/components/ScrolledContent.svelte';
    import { audioActive } from '$lib/data/stores';
    import { AudioIcon, SearchIcon } from '$lib/icons';
    import Navbar from '$lib/components/Navbar.svelte';
    import TextAppearanceSelector from '$lib/components/TextAppearanceSelector.svelte';
    import config from '$lib/data/config';

    const showSearch = config.mainFeatures['search'];
</script>

<div class="navbar">
    <Navbar>
        <div slot="left-buttons">
            <CollectionSelector />
            <BookSelector />
            <ChapterSelector />
        </div>
        <div slot="right-buttons">
            <!-- Mute/Volume Button -->
            <button class="dy-btn dy-btn-ghost dy-btn-circle">
                <label class="dy-swap">
                    <!-- this hidden checkbox controls the state -->
                    <input type="checkbox" bind:checked={$audioActive} />

                    <!-- volume on icon -->
                    <AudioIcon.Volume _class="dy-swap-on fill-white" />

                    <!-- volume off icon -->
                    <AudioIcon.Mute _class="dy-swap-off fill-white" />
                </label>
            </button>
            {#if showSearch}
                <!-- Search Button -->
                <a href="/search" class="dy-btn dy-btn-ghost dy-btn-circle">
                    <SearchIcon _class="fill-white" />
                </a>
            {/if}
            <!-- Text Appearance Options Menu -->
            <TextAppearanceSelector />
        </div>
    </Navbar>
</div>
<ScrolledContent>
    <div class={$audioActive ? 'smaller' : 'larger'} slot="scrolled-content">
        <ScriptureView />
    </div>
</ScrolledContent>
<div class="audio-bar">
    <AudioBar />
</div>

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
