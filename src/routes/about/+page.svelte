<script lang="ts">
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

<div class="navbar h-16">
    <Navbar>
        <!-- <div slot="left-buttons" /> -->
        <label for="sidebar" slot="center">
            <div class="btn btn-ghost normal-case text-xl">{$t['Menu_About']}</div>
        </label>
        <!-- <div slot="right-buttons" /> -->
    </Navbar>
</div>
<ScrolledContent>
    <div slot="scrolled-content" style="height: calc(100vh - 5rem);height: calc(100dvh - 5rem);">
        {@html partial}
    </div>
</ScrolledContent>
