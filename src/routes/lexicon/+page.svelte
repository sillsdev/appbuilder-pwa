<script lang="ts">
    import { page } from '$app/stores';
    import Navbar from '$lib/components/Navbar.svelte';
    import config from '$lib/data/config';

    const { entries } = $page.data;
</script>

<div class="grid grid-rows-[auto,1fr]" style="height:100vh;height:100dvh;">
    <div class="navbar">
        <Navbar showBackButton={false}>
            <!-- <div slot="left-buttons" /> -->
            <label for="sidebar" slot="center">
                <div class="btn btn-ghost normal-case text-xl">{config.name}</div>
            </label>
            <!-- <div slot="right-buttons" /> -->
        </Navbar>
    </div>
    <div class="overflow-y-auto max-w-screen-md">
        <div id="container" class="lexicon">
            <ul>
                {#if entries.length > 0}
                    {#each entries as entry}
                        <li>{entry.name}</li>
                    {/each}
                {:else}
                    <li>No entries available or table 'entries' not found.</li>
                {/if}
            </ul>
        </div>
    </div>
</div>
