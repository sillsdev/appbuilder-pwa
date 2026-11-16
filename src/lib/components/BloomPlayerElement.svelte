<script module lang="ts">
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

    import { SvelteURLSearchParams } from 'svelte/reactivity';

    type BloomPlayerEvents = {
        onplaybackComplete?: (detail: Record<string, unknown>) => void;
        onreportBookProperties?: (detail: Record<string, unknown>) => void;
        onsendAnalytics?: (detail: Record<string, unknown>) => void;
        onupdateBookProgressReport?: (detail: Record<string, unknown>) => void;
        onbackButtonClicked?: (detail: Record<string, unknown>) => void;
        onshowNavBar?: (detail: Record<string, unknown>) => void;
        onhideNavBar?: (detail: Record<string, unknown>) => void;
        onlogError?: (detail: Record<string, unknown>) => void;
        onstorePageData?: (detail: Record<string, unknown>) => void;
        oncapabilities?: (detail: Record<string, unknown>) => void;
    };

    interface Props extends BloomPlayerEvents {
        /** Base URL of the bloom-player build, e.g. "/gen-assets/bloom-player/bloomplayer.htm" */
        playerUrl: string;
        /** URL of the book folder to load. */
        bookUrl: string;
        /** BCP-47 code of the language to display initially. */
        lang?: string;
        paused?: boolean;
        autoplay?: AutoPlayType;
        startPage?: number;
        backButtonIcon: string;
        allowToggleAppBar?: boolean;
        initiallyShowAppBar?: boolean;
        showBackButton?: boolean;
        hideFullScreenButton?: boolean;
        centerVertically?: boolean;
        useOriginalPageSize?: boolean;
        skipActivities?: boolean;
        hideNavButtons?: boolean;
        videoPreviewMode?: boolean;
        reportSoundLog?: boolean;
    }

    let {
        playerUrl,
        bookUrl,
        lang,
        paused = false,
        autoplay = 'motion',
        startPage,
        backButtonIcon = 'arrow',
        allowToggleAppBar = true,
        initiallyShowAppBar = false,
        showBackButton = true,
        hideFullScreenButton = false,
        centerVertically = true,
        useOriginalPageSize = false,
        skipActivities = false,
        hideNavButtons = false,
        videoPreviewMode = false,
        reportSoundLog = false,
        ...events
    }: Props = $props();

    let iframeEl = $state<HTMLIFrameElement>();

    const src = $derived.by(() => {
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
        params.set('backButtonIcon', String(backButtonIcon));
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
    });

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

        const handler = events[`on${messageType}` as keyof BloomPlayerEvents];
        handler?.(detail);
    }

    $effect(() => {
        window.addEventListener('message', handleWindowMessage);
        return () => {
            pause();
            window.removeEventListener('message', handleWindowMessage);
        };
    });
</script>

<iframe
    bind:this={iframeEl}
    {src}
    title="Bloom Player"
    style="width: 100%; height: 100%; border: none;"
    allow="autoplay"
></iframe>
