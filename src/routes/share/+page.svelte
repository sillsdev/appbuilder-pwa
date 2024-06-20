<script lang="ts">
    import Navbar from '$lib/components/Navbar.svelte';
    import { t, language, languageDefault } from '$lib/data/stores';
    import config from '$lib/data/config';
    import { base } from '$app/paths';
    import { page } from '$app/stores';
    import { shareText } from '$lib/data/share';
    import { logShareApp } from '$lib/data/analytics';

    const googlePlayBadgesRoot = 'https://play.google.com/intl/en_us/badges/static/images/badges/';
    const googlePlayBadgeSuffix = '_badge_web_generic.png';
    let googlePlayStoreLanguage = 'en';
    $: updateGooglePlayLanguage($language);

    $: googlePlayBadge = googlePlayBadgesRoot + googlePlayStoreLanguage + googlePlayBadgeSuffix;
    $: appStoreBadge = `${base}/badges/${$language}_app_store.svg`;
    const badgeLanguages = $page.data.languages;
    const fallbackAppStoreLanguage = badgeLanguages.includes(languageDefault)
        ? languageDefault
        : 'en';
    const fallbackAppStoreBadge = `${base}/badges/${fallbackAppStoreLanguage}_app_store.svg`;

    async function updateGooglePlayLanguage(language: string): Promise<string> {
        if (await verifyImageUrl(googlePlayBadgesRoot + language + googlePlayBadgeSuffix)) {
            googlePlayStoreLanguage = language;
            return;
        }

        if (await verifyImageUrl(googlePlayBadgesRoot + languageDefault + googlePlayBadgeSuffix)) {
            googlePlayStoreLanguage = languageDefault;
            return;
        }

        googlePlayStoreLanguage = 'en';
    }

    function verifyImageUrl(url) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve(true);
            img.onerror = () => resolve(false);
            img.src = url;
        });
    }

    function shareLink(store: string, link: string) {
        shareText(undefined, link, `${store} Link.txt`);
        const appName = config.name;
        const appVersion = config.version;
        const appType = 'share-link';
        logShareApp(appName, appVersion, appType);
    }
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
                <!-- svelte-ignore a11y-click-events-have-key-events -->
                <!-- svelte-ignore a11y-no-static-element-interactions -->
                <div
                    id="google-play"
                    class="w-48 md:w-72 lg:w-[25rem]"
                    on:click={() =>
                        shareLink(
                            'Google Play',
                            `https://play.google.com/store/apps/details?id=${config.package}&hl=${$language}`
                        )}
                >
                    <img alt={$t['Share_App_Link']} src={googlePlayBadge} />
                </div>
            {/if}
            {#if config.mainFeatures['share-apple-app-link']}
                <!-- svelte-ignore a11y-click-events-have-key-events -->
                <!-- svelte-ignore a11y-no-static-element-interactions -->
                <div
                    id="apple-store"
                    class="w-48 md:w-64 lg:w-96"
                    on:click={() =>
                        shareLink(
                            'App Store',
                            `https://apps.apple.com/app/${config.mainFeatures['share-apple-id']}?l=${$language}`
                        )}
                >
                    {(console.log(
                        badgeLanguages.includes($language)
                            ? `Using ${appStoreBadge}`
                            : `Fallback to ${fallbackAppStoreBadge}`
                    ),
                    '')}
                    <img
                        alt={$t['share-apple-app-link']}
                        src={badgeLanguages.includes($language)
                            ? appStoreBadge
                            : fallbackAppStoreBadge}
                        class="w-full h-auto"
                    />
                </div>
            {/if}
            <p />
        </div>
    </div>
</div>
