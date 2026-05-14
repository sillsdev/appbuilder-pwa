<script lang="ts">
    import config from '$assets/config';
    import BottomNavigationBar from '$lib/components/BottomNavigationBar.svelte';
    import Navbar from '$lib/components/Navbar.svelte';
    import { t } from '$lib/data/stores';

    let { data } = $props();

    const bottomNavBarEnabled = config?.bottomNavBarItems && config?.bottomNavBarItems.length > 0;
    const barType = 'about';
</script>

<div class="grid grid-rows-[auto,1fr]" style="height:100vh;height:100dvh;">
    <div class="navbar">
        <Navbar>
            {#snippet start()}
                <label for="sidebar">
                    <div class="btn btn-ghost normal-case text-xl text-white font-bold pl-1">
                        {$t['Menu_About']}
                    </div>
                </label>
            {/snippet}
        </Navbar>
    </div>
    <div class="overflow-y-auto mx-auto max-w-screen-md">
        <div id="container" class="about">
            <!-- `data` is fetched from a static asset file.
                 Using HTML is acceptable in this case. -->
            <!-- eslint-disable-next-line svelte/no-at-html-tags -->
            {@html data.partial}
        </div>
    </div>
    {#if bottomNavBarEnabled}
        <BottomNavigationBar {barType} />
    {/if}
</div>
