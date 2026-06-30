<script lang="ts">
    import config from '$assets/config';
    import Navbar from '$lib/components/Navbar.svelte';
    import { logShareApp } from '$lib/data/analytics';
    import { shareText } from '$lib/data/share';
    import { language, languageDefault, t } from '$lib/data/stores';
    import type { PageData } from './$types';

    const badges = import.meta.glob('./*', {
        import: 'default',
        eager: true,
        query: '?url',
        base: '/src/gen-assets/badges'
    }) as Record<string, string>;

    const googlePlayBadgesRoot = 'https://play.google.com/intl/en_us/badges/static/images/badges/';
    const googlePlayBadgeSuffix = '_badge_web_generic.png';
    let googlePlayStoreLanguage = 'en';
    $effect(() => {
        updateGooglePlayLanguage($language);
    });

    const googlePlayBadge = $derived(
        googlePlayBadgesRoot + googlePlayStoreLanguage + googlePlayBadgeSuffix
    );
    const appStoreBadge = $derived(badges[`./${$language}_app_store.svg`] ?? '');

    interface Props {
        data: PageData;
    }
    let { data }: Props = $props();

    const fallbackAppStoreLanguage = $derived(
        languageDefault && data.languages.includes(languageDefault) ? languageDefault : 'en'
    );
    const fallbackAppStoreBadge = $derived(
        badges[`./${fallbackAppStoreLanguage}_app_store.svg`] ?? ''
    );

    async function updateGooglePlayLanguage(language: string) {
        if (await verifyImageUrl(googlePlayBadgesRoot + language + googlePlayBadgeSuffix)) {
            googlePlayStoreLanguage = language;
            return;
        }

        if (
            languageDefault &&
            (await verifyImageUrl(googlePlayBadgesRoot + languageDefault + googlePlayBadgeSuffix))
        ) {
            googlePlayStoreLanguage = languageDefault;
            return;
        }

        googlePlayStoreLanguage = 'en';
    }

    function verifyImageUrl(url: string) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve(true);
            img.onerror = () => resolve(false);
            img.src = url;
        });
    }

    function shareLink(store: string, link: string) {
        shareText('', link, `${store} Link.txt`);
        const appName = config.name;
        const appVersion = config.version;
        const appType = 'share-link';
        logShareApp(appName, appVersion, appType);
    }
</script>

<!-- TODO: make share functional -->
<div class="grid grid-rows-[auto_1fr]" style="height:100vh;height:100dvh;">
    <div class="navbar">
        <Navbar>
            {#snippet center()}
                <label for="sidebar">
                    <div class="dy-btn dy-btn-ghost normal-case text-xl">
                        {$t['Menu_Share_App']}
                    </div>
                </label>
            {/snippet}
        </Navbar>
    </div>
    <div id="content" class="overflow-y-auto">
        <div id="grid" class="flex flex-col sm:flex-row mt-12 justify-center gap-8 items-center">
            {#if config.mainFeatures['share-app-link']}
                <!-- svelte-ignore a11y_click_events_have_key_events -->
                <!-- svelte-ignore a11y_no_static_element_interactions -->
                <div
                    id="google-play"
                    class="w-48 md:w-72 lg:w-100"
                    onclick={() =>
                        shareLink(
                            'Google Play',
                            `https://play.google.com/store/apps/details?id=${config.package}&hl=${$language}`
                        )}
                >
                    <img alt={$t['Share_App_Link']} src={googlePlayBadge} />
                </div>
            {/if}
            {#if config.mainFeatures['share-apple-app-link']}
                <!-- svelte-ignore a11y_click_events_have_key_events -->
                <!-- svelte-ignore a11y_no_static_element_interactions -->
                <div
                    id="apple-store"
                    class="w-48 md:w-64 lg:w-96"
                    onclick={() =>
                        shareLink(
                            'App Store',
                            `https://apps.apple.com/app/${config.mainFeatures['share-apple-id']}?l=${$language}`
                        )}
                >
                    {(console.log(
                        data.languages.includes($language)
                            ? `Using ${appStoreBadge}`
                            : `Fallback to ${fallbackAppStoreBadge}`
                    ),
                    '')}
                    <img
                        alt={$t['share-apple-app-link']}
                        src={data.languages.includes($language)
                            ? appStoreBadge
                            : fallbackAppStoreBadge}
                        class="w-full h-auto"
                    />
                </div>
            {/if}
            <p></p>
        </div>
    </div>
</div>
