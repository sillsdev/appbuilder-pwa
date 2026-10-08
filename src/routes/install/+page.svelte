<script lang="ts">
    import { goto } from '$app/navigation';
    import appleIconHref from '$assets/icons/apple-touch-icon.png';
    import { backgroundColor, convertStyle, s, t, themeColors } from '$lib/data/stores';
    import { isIOS } from '$lib/scripts/safariUtils';
    import { resolve } from '$lib/utils/paths';
    import { onMount } from 'svelte';
    import type { PageData } from './$types';

    interface BeforeInstallPromptEvent extends Event {
        prompt(): Promise<void>;
        userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
    }

    interface Props {
        data: PageData;
    }
    let { data }: Props = $props();

    // Captured in app.html, since the browser may fire it before this page mounts
    const earlyPrompt = (window as Window & { deferredInstallPrompt?: BeforeInstallPromptEvent })
        .deferredInstallPrompt;
    let deferredPrompt: BeforeInstallPromptEvent | null = $state(earlyPrompt ?? null);
    let installing = $state(false);
    let status: 'installing' | 'installed' | null = $state(null);
    const showIosSteps = isIOS();
    // iOS ignores manifest icons and uses the apple-touch-icon for the home screen
    const iconUrl = $derived(showIosSteps ? appleIconHref : data.iconUrl);

    // Translation strings with fallback (actual string keys will be added to 14.7)
    const instructionText = $derived(
        $t['Install_Instruction'] || 'Install this dictionary on your device to use it offline.'
    );
    const alreadyInstalledText = $derived(
        $t['Install_Already_Installed'] ||
            'Already installed? Look for this icon on your home screen or in your list of apps.'
    );
    const installButtonText = $derived($t['Install_Button'] || 'Install');
    const installingText = $derived(
        $t['Install_Installing'] || 'Installing… you can close this tab.'
    );
    const installedText = $derived(
        $t['Install_Installed'] ||
            '✓ Installed! Open the app from your home screen or your list of apps.'
    );
    const iosStepsText = $derived(
        $t['Install_iOS_Steps'] || 'Tap the Share button in Safari, then choose Add to Home Screen.'
    );
    const statusText = $derived(
        status === 'installing' ? installingText : status === 'installed' ? installedText : ''
    );

    const standaloneQuery =
        '(display-mode: standalone), (display-mode: minimal-ui), (display-mode: fullscreen)';

    function isStandalone() {
        return (
            window.matchMedia(standaloneQuery).matches ||
            (navigator as Navigator & { standalone?: boolean }).standalone === true
        );
    }

    function openApp() {
        goto(resolve('/'), { replaceState: true });
    }

    function onBeforeInstallPrompt(e: Event) {
        e.preventDefault();
        deferredPrompt = e as BeforeInstallPromptEvent;
    }

    function onAppInstalled() {
        deferredPrompt = null;
        status = 'installed';
    }

    async function install() {
        if (!deferredPrompt) {
            return;
        }
        installing = true;
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        installing = false;
        // A prompt can only be shown once
        delete (window as Window & { deferredInstallPrompt?: unknown }).deferredInstallPrompt;
        if (outcome === 'accepted') {
            deferredPrompt = null;
            status = 'installing';
        }
    }

    onMount(() => {
        // Already running as an installed app, so there is nothing to install
        if (isStandalone()) {
            openApp();
            return;
        }

        // Desktop PWA first launch: display-mode may change after the page loads
        const mediaQuery = window.matchMedia(standaloneQuery);
        const onDisplayModeChange = (e: MediaQueryListEvent) => {
            if (e.matches) {
                openApp();
            }
        };
        mediaQuery.addEventListener('change', onDisplayModeChange);
        window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
        window.addEventListener('appinstalled', onAppInstalled);

        return () => {
            mediaQuery.removeEventListener('change', onDisplayModeChange);
            window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
            window.removeEventListener('appinstalled', onAppInstalled);
        };
    });
</script>

<div
    class="flex flex-col items-center justify-center text-center px-6 py-10 overflow-y-auto"
    style="height:100vh;height:100dvh;"
    style:background-color={$backgroundColor}
    style:color={$themeColors['TextColor']}
>
    {#if iconUrl}
        <img
            src={iconUrl}
            alt={data.name}
            class="w-24 h-24 mb-5"
            style="border-radius:20%;box-shadow:0 4px 16px rgba(0,0,0,0.15);"
        />
    {/if}
    <h1 class="text-[26px] font-bold mb-2.5">{data.name}</h1>
    <p class="text-[15px] leading-[1.7] mb-2 max-w-[340px] opacity-80">
        {instructionText}
    </p>
    <!-- The browser only offers to install when the app isn't installed yet -->
    {#if !deferredPrompt && !status}
        <p class="text-[13px] mb-7 max-w-[300px] opacity-60">
            {alreadyInstalledText}
        </p>
    {/if}
    {#if deferredPrompt}
        <button
            class="dy-btn border-none rounded-lg px-10 h-auto py-3.5 text-base font-semibold mt-5 mb-3.5 normal-case"
            style={convertStyle($s['ui.share.button'])}
            disabled={installing}
            onclick={install}
        >
            {installButtonText}
        </button>
    {/if}
    <p class="text-[15px] font-medium min-h-[22px]" style:color="#276749">{statusText}</p>
    {#if showIosSteps}
        <p class="text-[15px] leading-[1.9] max-w-[300px]">
            {iosStepsText}
        </p>
    {/if}
</div>
