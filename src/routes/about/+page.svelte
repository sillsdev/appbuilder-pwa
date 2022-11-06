<script lang="ts">
    // Mark this as prerender?
    // Check kit.svelte.dev docs (Language Forge examples)
    import partial from '../../../static/about.partial.html?raw';
    import ScrolledContent from '$lib/components/ScrolledContent.svelte';
    import '../../tailwind.css';
    import Navbar from '$lib/components/Navbar.svelte';
    import { HamburgerIcon } from '$lib/icons';
    import { viewMode } from '$lib/data/stores';
    let drawerName = 'sidebar';
</script>

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
        <div for={drawerName} slot="left-buttons" />
        <label for={drawerName} slot="center">
            <div class="btn btn-ghost normal-case text-xl">About</div>
        </label>
        <div for={drawerName} slot="right-buttons" />
    </Navbar>
</div>
<ScrolledContent>
    <div class="larger" slot="scrolled-content">
        {@html partial}
    </div>
</ScrolledContent>

<style>
    .navbar {
        height: 10vh;
    }
    .larger {
        height: 90vh;
    }
</style>
