<script lang="ts">
    import BottomNavigationBar from '$lib/components/BottomNavigationBar.svelte';
    import Navbar from '$lib/components/Navbar.svelte';
    import config from '$lib/data/config';
    import { t } from '$lib/data/stores';

    export let data;

    const bottomNavBarEnabled = config?.bottomNavBarItems && config?.bottomNavBarItems.length > 0;
    const barType = 'about';
</script>

<div class="grid grid-rows-[auto,1fr]" style="height:100vh;height:100dvh;">
    <div class="navbar">
        <Navbar>
            {#snippet center()}
                <label for="sidebar">
                    <div data-testid="about-title" class="btn btn-ghost normal-case text-xl">
                        {$t['Menu_About']}
                    </div>
                </label>
            {/snippet}
        </Navbar>
    </div>
    <div class="overflow-y-auto mx-auto max-w-screen-md">
        <div id="container" class="about">
            {@html data.partial}
        </div>
    </div>
    {#if bottomNavBarEnabled}
        <BottomNavigationBar {barType} />
    {/if}
</div>
