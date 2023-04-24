<script lang="ts">
    import Navbar from '$lib/components/Navbar.svelte';
    import { t } from '$lib/data/stores';
</script>

<div class="navbar h-16">
    <Navbar>
        <!-- <div slot="left-buttons" /> -->
        <label for="sidebar" slot="center">
            <div class="btn btn-ghost normal-case text-xl">{$t['Account_Page_Title']}</div>
        </label>
        <!-- <div slot="right-buttons" /> -->
    </Navbar>
</div>
