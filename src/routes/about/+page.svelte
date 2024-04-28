<script lang="ts">
    import Navbar from '$lib/components/Navbar.svelte';
    import { t } from '$lib/data/stores';

    export let data;
</script>

<div class="grid grid-rows-[auto,1fr]" style="height:100vh;height:100dvh;">
    <div class="navbar">
        <Navbar>
            <!-- <div slot="left-buttons" /> -->
            <label for="sidebar" slot="center">
                <div class="btn btn-ghost normal-case text-xl">{$t['Menu_About']}</div>
            </label>
            <!-- <div slot="right-buttons" /> -->
        </Navbar>
    </div>
    <div class="overflow-y-auto mx-auto max-w-screen-md">
        <div id="container" class="about">
            {@html data.partial}
        </div>
    </div>
</div>
