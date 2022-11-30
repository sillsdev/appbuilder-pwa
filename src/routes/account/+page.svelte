<script lang="ts">
    // Mark this as prerender?
    // Check kit.svelte.dev docs (Language Forge examples)
    import ScrolledContent from '$lib/components/ScrolledContent.svelte';
    import '../../tailwind.css';
    import Navbar from '$lib/components/Navbar.svelte';
</script>

<div class="navbar">
    <Navbar>
        <!-- <div slot="left-buttons" /> -->
        <label for="sidebar" slot="center">
            <div class="btn btn-ghost normal-case text-xl">My Account</div>
        </label>
        <!-- <div slot="right-buttons" /> -->
    </Navbar>
</div>
<ScrolledContent>
    <div class="larger" slot="scrolled-content" />
</ScrolledContent>

<style>
    .navbar {
        height: 10vh;
    }
    .larger {
        height: 90vh;
    }
</style>
