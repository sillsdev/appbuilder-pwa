<script lang="ts">
    import Navbar from '$lib/components/Navbar.svelte';
    import Settings from '$lib/components/Settings.svelte';
    import { direction, t } from '$lib/data/stores';
    import { devPreferenceSettings } from '$lib/data/stores/setting';
</script>

<div
    class="grid grid-rows-[auto,1fr]"
    style="height:100vh;height:100dvh; font-family: initial;"
    dir={$direction}
>
    <div class="navbar">
        <Navbar>
            {#snippet center()}
                <label for="sidebar">
                    <div class="btn btn-ghost normal-case text-xl">{$t['Menu_Settings']}</div>
                </label>
            {/snippet}
        </Navbar>
    </div>
    <div class="overflow-y-auto">
        <Settings settings={devPreferenceSettings}></Settings>
    </div>
</div>
