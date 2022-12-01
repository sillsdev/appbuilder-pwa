<script lang="ts">
    import AudioBar from '$lib/components/AudioBar.svelte';
    import ScriptureView from '$lib/components/ScriptureView.svelte';
    import BookSelector from '$lib/components/BookSelector.svelte';
    import ChapterSelector from '$lib/components/ChapterSelector.svelte';
    import CollectionSelector from '$lib/components/CollectionSelector.svelte';
    import Dropdown from '$lib/components/Dropdown.svelte';
    import ScrolledContent from '$lib/components/ScrolledContent.svelte';
    import { audioActive } from '$lib/data/stores';
    import { AudioIcon, SearchIcon, TextAppearanceIcon } from '$lib/icons';
    import Navbar from '$lib/components/Navbar.svelte';
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
                    <AudioIcon.Volume _class="dy-swap-on fill-black-100" />

                    <!-- volume off icon -->
                    <AudioIcon.Mute _class="dy-swap-off fill-black-100" />
                </label>
            </button>
            <!-- Search Button -->
            <a href="/search" class="dy-btn dy-btn-ghost dy-btn-circle">
                <SearchIcon />
            </a>
            <!-- Text Appearance Options Menu -->
            <Dropdown>
                <svelte:fragment slot="label">
                    <TextAppearanceIcon />
                </svelte:fragment>
                <!-- TODO: implement text appearance options -->
            </Dropdown>
        </div>
    </Navbar>
</div>
<ScrolledContent>
    <div class={$audioActive ? 'smaller' : 'larger'} slot="scrolled-content">
        <ScriptureView />
    </div>
</ScrolledContent>
{#if $audioActive}
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
