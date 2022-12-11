<script lang="ts">
    import Navbar from '$lib/components/Navbar.svelte';
    import { t } from '$lib/data/stores';
</script>

<div class="navbar">
    <Navbar>
        <!-- Button to close the drawer/sidebar -->
        <!-- <div slot="left-buttons" /> -->
        <label for="sidebar" slot="center">
            <div class="btn btn-ghost normal-case text-xl">{$t['Menu_Layout']}</div>
        </label>
        <!-- <div slot="right-buttons" /> -->
    </Navbar>
</div>

<style>
    .navbar {
        height: 10vh;
    }
</style>
