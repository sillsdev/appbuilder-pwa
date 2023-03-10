<script lang="ts">
    // Mark this as prerender?
    // Check kit.svelte.dev docs (Language Forge examples)
    import { onMount } from 'svelte';
    import ScrolledContent from '$lib/components/ScrolledContent.svelte';
    import Navbar from '$lib/components/Navbar.svelte';
    import { t } from '$lib/data/stores';

    var partial: string;
    onMount(async function () {
        const response = await fetch('about.partial.html?raw');
        partial = await response.text();
    });
</script>

<div class="navbar">
    <Navbar>
        <!-- <div slot="left-buttons" /> -->
        <label for="sidebar" slot="center">
            <div class="btn btn-ghost normal-case text-xl">{$t['Menu_About']}</div>
        </label>
        <!-- <div slot="right-buttons" /> -->
    </Navbar>
</div>
<ScrolledContent>
    <div class="larger" slot="scrolled-content">
        {@html partial}
    </div>
</ScrolledContent>

<style>
    .navbar {
        height: 4em;
    }
    .larger {
        height: calc (100vh - 4em);
        height: calc (100dvh - 4em);
    }
</style>
