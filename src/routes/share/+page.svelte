<script lang="ts">
    import Navbar from '$lib/components/Navbar.svelte';
    import ScrolledContent from '$lib/components/ScrolledContent.svelte';
    import { t } from '$lib/data/stores';
</script>

<!-- TODO: make share functional -->
<div class="navbar">
    <Navbar>
        <!-- <div slot="left-buttons" /> -->
        <label for="sidebar" slot="center">
            <div class="btn btn-ghost normal-case text-xl">{$t['Menu_Share_App']}</div>
        </label>
        <!-- <div slot="right-buttons" /> -->
    </Navbar>
</div>
<ScrolledContent>
    <div class="larger" slot="scrolled-content" />
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
