<script lang="ts">
    import Navbar from '$lib/components/Navbar.svelte';
    import { t, language } from '$lib/data/stores';
    import config from '$lib/data/config';
    import { base } from '$app/paths';

    //export let language = 'english'; //try switch statement
    $: googlePlayBadge = `https://play.google.com/intl/en_us/badges/static/images/badges/${$language}_badge_web_generic.png`;
    $: appleStoreBadge = `${base}/badges/${$language}_app_store.svg`;
    const badgeLanguages = ['en', 'fr', 'de'];
    const enAppleStoreBadge = `${base}/badges/en_app_store.svg`;
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
        <div id="grid" class="flex flex-col sm:flex-row mt-12 justify-center gap-8 items-center">
            {#if config.mainFeatures['share-app-link']}
                <div id="google-play" class="w-56 md:w-72 lg:w-[28rem]">
                    <img alt={$t['Share_App_Link']} src={googlePlayBadge} />
                </div>
            {/if}
            {#if config.mainFeatures['share-apple-app-link']}
                <div id="apple-store" class="w-48 md:w-64 lg:w-96">
                    {#if badgeLanguages.includes($language)}
                        <img
                            alt={$t['share-apple-app-link']}
                            src={appleStoreBadge}
                            class="w-full h-auto"
                        />
                    {:else}
                        <img
                            alt={$t['share-apple-app-link']}
                            src={enAppleStoreBadge}
                            class="w-full h-auto"
                        />
                    {/if}
                </div>
            {/if}
            <p />
        </div>
    </div>
</div>
