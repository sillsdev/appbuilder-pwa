<script context="module" lang="ts">
    export type AutoPlayType = 'yes' | 'no' | 'motion';
</script>

<script lang="ts">
    // Svelte wrapper around bloom-player's iframe embedding protocol.
    //
    // bloom-player is NOT a custom element itself - it's a React app served as
    // bloomplayer.htm, configured via URL query params and controlled via
    // window.postMessage. This component owns the iframe and translates its
    // postMessage protocol into Svelte props/events.
    //
    // Protocol reference: bloom-player's src/externalContext.ts and
    // src/bloom-player-controls.tsx (BloomPlayerProps / handleControlMessage).
    // This is an internal, unversioned contract - re-check those files when
    // upgrading the bloom-player version you point `playerUrl` at.

    import { createEventDispatcher, onDestroy, onMount } from 'svelte';
    import { SvelteURLSearchParams } from 'svelte/reactivity';

    /** Base URL of the bloom-player build, e.g. "/gen-assets/bloom-player/bloomplayer.htm" */
    export let playerUrl: string;
    /** URL of the book folder to load. */
    export let bookUrl: string;
    /** BCP-47 code of the language to display initially. */
    export let lang: string | undefined = undefined;
    export let paused = false;
    export let autoplay: AutoPlayType = 'motion';
    export let startPage: number | undefined = undefined;
    export let allowToggleAppBar = true;
    export let initiallyShowAppBar = false;
    export let showBackButton = true;
    export let hideFullScreenButton = false;
    export let centerVertically = true;
    export let useOriginalPageSize = false;
    export let skipActivities = false;
    export let hideNavButtons = false;
    export let videoPreviewMode = false;
    export let reportSoundLog = false;

    const dispatch = createEventDispatcher<{
        playbackComplete: any;
        reportBookProperties: any;
        sendAnalytics: any;
        updateBookProgressReport: any;
        backButtonClicked: any;
        showNavBar: any;
        hideNavBar: any;
        logError: any;
        storePageData: any;
        capabilities: any;
    }>();

    let iframeEl: HTMLIFrameElement;

    $: src = (() => {
        const params = new SvelteURLSearchParams();
        params.set('url', bookUrl);
        if (lang) {
            params.set('lang', lang);
        }
        params.set('paused', String(paused));
        params.set('autoplay', autoplay);
        if (startPage !== undefined) {
            params.set('start-page', String(startPage));
        }
        params.set('allowToggleAppBar', String(allowToggleAppBar));
        params.set('initiallyShowAppBar', String(initiallyShowAppBar));
        params.set('showBackButton', String(showBackButton));
        params.set('hideFullScreenButton', String(hideFullScreenButton));
        params.set('centerVertically', String(centerVertically));
        params.set('useOriginalPageSize', String(useOriginalPageSize));
        params.set('skipActivities', String(skipActivities));
        params.set('hideNavButtons', String(hideNavButtons));
        params.set('videoPreviewMode', String(videoPreviewMode));
        params.set('reportSoundLog', String(reportSoundLog));
        return `${playerUrl}?${params.toString()}`;
    })();

    function postToPlayer(message: Record<string, unknown>) {
        iframeEl?.contentWindow?.postMessage(JSON.stringify(message), '*');
    }

    /** Pause playback/narration in the player. */
    export function pause() {
        postToPlayer({ messageType: 'control', pause: true });
    }

    /** Resume playback if the player was paused by an external pause() call. */
    export function resume() {
        postToPlayer({ messageType: 'control', resume: true });
    }

    /** Start/restart playing, optionally overriding the autoplay mode. */
    export function play(playAutoplay?: AutoPlayType) {
        postToPlayer({
            messageType: 'control',
            play: true,
            ...(playAutoplay ? { autoplay: playAutoplay } : {})
        });
    }

    /** Reset to the configured start page. */
    export function reset() {
        postToPlayer({ messageType: 'control', reset: true });
    }

    /** Send a raw controlAction string (see bloom-player's handleControlMessage). */
    export function controlAction(action: string) {
        postToPlayer({ messageType: 'control', controlAction: action });
    }

    // Injecting the arrow into the Bloom Player seems to be the only way to make the back arrow show up.
    // This is because bloom-player does not see this as window.top and replaces it with '...' because
    // we are using an iframe. Currently for android it is calling the webview with the path to the webview thus
    // making window == window.top which shows the arrow instead of the elipses.
    const BACK_ARROW_PATH = 'M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z';

    let backArrowObserver: MutationObserver | null = null;

    function applyBackArrowFix() {
        const doc = iframeEl?.contentDocument;
        const icon = doc?.querySelector<SVGSVGElement>(
            '[data-testid="history-back-button"] svg[aria-label="More Menu"]'
        );
        const path = icon?.querySelector('path');
        if (!icon || !path) {
            return;
        }
        path.setAttribute('d', BACK_ARROW_PATH);
        icon.setAttribute('aria-label', 'Go Back');
    }

    function setupBackArrowFix() {
        const doc = iframeEl?.contentDocument;
        if (!doc?.body || backArrowObserver) {
            return;
        }

        applyBackArrowFix();

        backArrowObserver = new MutationObserver(applyBackArrowFix);
        backArrowObserver.observe(doc.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['aria-label']
        });
    }

    function teardownBackArrowFix() {
        backArrowObserver?.disconnect();
        backArrowObserver = null;
    }

    function handleWindowMessage(event: MessageEvent) {
        // Only handle messages from our own iframe.
        if (!iframeEl || event.source !== iframeEl.contentWindow) {
            return;
        }
        if (!event.data) {
            return;
        }

        // bloom-player's externalContext.ts posts messages as plain objects
        // via window.parent.postMessage(message, "*") - not JSON strings -
        // but older/other bloom-player builds may still send JSON strings,
        // so accept both.
        let message: any;
        if (typeof event.data === 'string') {
            try {
                message = JSON.parse(event.data);
            } catch {
                return;
            }
        } else if (typeof event.data === 'object') {
            message = event.data;
        } else {
            return;
        }

        const { messageType, ...detail } = message ?? {};
        if (!messageType) {
            return;
        }

        if (messageType === 'reportBookProperties') {
            setupBackArrowFix();
        }

        dispatch(messageType as any, detail);
    }

    onMount(() => {
        window.addEventListener('message', handleWindowMessage);
    });

    // A new src means a new book/iframe document - drop the old fix state.
    $: if (src) {
        teardownBackArrowFix();
    }

    onDestroy(() => {
        pause();
        window.removeEventListener('message', handleWindowMessage);
        teardownBackArrowFix();
    });
</script>

<iframe
    bind:this={iframeEl}
    {src}
    title="Bloom Player"
    style="width: 100%; height: 100%; border: none;"
    allow="autoplay"
></iframe>
