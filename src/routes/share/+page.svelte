<script lang="ts">
    import Navbar from '$lib/components/Navbar.svelte';
    import { t, language } from '$lib/data/stores';
    import config from '$lib/data/config';

    //export let language = 'english'; //try switch statement
    $: googlePlayBadge = `https://play.google.com/intl/en_us/badges/static/images/badges/${$language}_badge_web_generic.png`;
    $: appleStoreBadge = `https://developer.apple.com/app-store/marketing/guidelines/images/badge-download-on-the-app-store.svg`;
</script>

<!-- TODO: make share functional -->
<div class="grid grid-rows-[auto,1fr]" style="height:100vh;height:100dvh;">
    <div class="navbar">
        <Navbar>
            <!-- <div slot="left-buttons" /> -->
            <label for="sidebar" slot="center">
                <div class="btn btn-ghost normal-case text-xl">{$t['Menu_Share_App']}</div>
            </label>
            <!-- <div slot="right-buttons" /> -->
            <!-- class="grid gap-4 items-center range-row m-2" -->
        </Navbar>
    </div>
    <div id="content" class="overflow-y-auto">
        <div id="grid" class="flex flex-col sm:flex-row mt-12 justify-center gap-4 items-center">
            <div id="google-play" class="w-56 md:w-72 lg:w-104S">
                {#if config.mainFeatures['share-app-link']}
                    <img alt={$t['Share_App_Link']} src={googlePlayBadge} class="w-full h-auto" />
                {/if}
            </div>
            <div id="apple-store" class="w-48 md:w-64 lg:w-96">
                {#if config.mainFeatures['share-apple-app-link']}
                    <img
                        alt={$t['share-apple-app-link']}
                        src={appleStoreBadge}
                        class="w-full h-auto"
                    />
                {/if}
            </div>
            <p />
        </div>
    </div>
</div>
