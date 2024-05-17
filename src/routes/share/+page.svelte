<script lang="ts">
    import Navbar from '$lib/components/Navbar.svelte';
    import { t, language } from '$lib/data/stores';
    import config from '$lib/data/config';
    import { base } from '$app/paths';

    $: googlePlayBadge = `https://play.google.com/intl/en_us/badges/static/images/badges/${$language}_badge_web_generic.png`;
    $: appleStoreBadge = `${base}/badges/${$language}_app_store.svg`;
    const badgeLanguages = ['en', 'fr', 'de', 'es'];
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
        </Navbar>
    </div>
    <div id="content" class="overflow-y-auto">
        <div id="grid" class="flex flex-col sm:flex-row mt-12 justify-center gap-8 items-center">
            {#if config.mainFeatures['share-app-link']}
                <a
                    href="https://play.google.com/store/apps/details?id={config.package}&hl={$language}"
                >
                    <div id="google-play" class="w-56 md:w-72 lg:w-[28rem]">
                        <img alt={$t['Share_App_Link']} src={googlePlayBadge} />
                    </div>
                </a>
            {/if}
            {#if config.mainFeatures['share-apple-app-link']}
                <div id="apple-store" class="w-48 md:w-64 lg:w-96">
                    {#if badgeLanguages.includes($language)}
                        <a
                            href="https://apps.apple.com/app/{config.mainFeatures[
                                'share-apple-id'
                            ]}?l={$language}"
                        >
                            <img
                                alt={$t['share-apple-app-link']}
                                src={appleStoreBadge}
                                class="w-full h-auto"
                            />
                        </a>
                    {:else}
                        <a
                            href="https://apps.apple.com/app/{config.mainFeatures[
                                'share-apple-id'
                            ]}"
                        >
                            <img
                                alt={$t['share-apple-app-link']}
                                src={enAppleStoreBadge}
                                class="w-full h-auto"
                            />
                        </a>
                    {/if}
                </div>
            {/if}
            <p />
        </div>
    </div>
</div>
