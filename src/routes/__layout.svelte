<script lang="ts">
    import '../tailwind.css';
    import Navbar from '$lib/components/Navbar.svelte';
    import Sidebar from '$lib/components/Sidebar.svelte';
    import { HamburgerIcon } from '$lib/icons';
    import { viewMode, playingAudio } from '$lib/data/stores';
    import AudioBar from '$lib/components/AudioBar.svelte';
    let drawerName = 'sidebar';
</script>

<Sidebar drawerId={drawerName}>
    <div class="navbar">
        <Navbar>
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
    <main class="p-2 w-full overflow-y-auto {$playingAudio ? 'smaller' : 'larger'}">
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
