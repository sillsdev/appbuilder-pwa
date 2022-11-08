<script lang="ts">
    // Mark this as prerender?
    // Check kit.svelte.dev docs (Language Forge examples)
    import partial from '../../../static/about.partial.html?raw';
    import ScrolledContent from '$lib/components/ScrolledContent.svelte';
    import '../../tailwind.css';
    import Navbar from '$lib/components/Navbar.svelte';
</script>

<div class="navbar">
    <Navbar>
        <!-- <div slot="left-buttons" /> -->
        <label for="sidebar" slot="center">
            <div class="btn btn-ghost normal-case text-xl">About</div>
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
        height: 10vh;
    }
    .larger {
        height: 90vh;
    }
</style>
