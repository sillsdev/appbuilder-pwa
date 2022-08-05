<script lang="ts">
    import '../tailwind.css';
    import Navbar from '$lib/components/Navbar.svelte';
    import Sidebar from '$lib/components/Sidebar.svelte';
    import { HamburgerIcon } from '$lib/icons';
    import { viewMode, playingAudio, mainScroll } from '$lib/data/stores';
    import { onMount } from 'svelte';
    import AudioBar from '$lib/components/AudioBar.svelte';
    let drawerName = 'sidebar';
    let main: HTMLElement;

    const updateScroll = (() => {
        let updateTimer: NodeJS.Timeout;

        return () => {
            clearTimeout(updateTimer);
            updateTimer = setTimeout(() => {
                $mainScroll = { top: main.scrollTop, height: main.clientHeight };
            }, 50);
        };
    })();

    onMount(updateScroll);
</script>

<Sidebar drawerId={drawerName}>
    <div class="navbar">
        <Navbar>
            <!-- Button to close the drawer/sidebar -->
            <label
                for={drawerName}
                slot="drawer-button"
                class="dy-btn dy-btn-ghost p-1 dy-drawer-button {$viewMode === 'Side By Side'
                    ? ''
                    : 'lg:hidden'}"
            >
                <HamburgerIcon />
            </label>
        </Navbar>
    </div>
    <main
        bind:this={main}
        class="p-2 w-full overflow-y-auto {$playingAudio ? 'smaller' : 'larger'}"
        on:scroll={updateScroll}
    >
        <slot />
    </main>
    {#if $playingAudio}
        <div class="audio-bar">
            <AudioBar />
        </div>
    {/if}
</Sidebar>

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
