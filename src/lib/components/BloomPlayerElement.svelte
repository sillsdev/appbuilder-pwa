<svelte:options
    customElement={{
        tag: 'bloom-player',
        shadow: 'none'
    }}
/>

<script lang="ts">
    // Svelte wrapper around bloom-player's iframe embedding protocol.
    //
    // bloom-player is NOT a custom element itself - it's a React app served as
    // bloomplayer.htm, configured via URL query params and controlled via
    // window.postMessage. This component owns the iframe and translates its
    // postMessage protocol into Svelte props/events, and (via <svelte:options
    // customElement>) can also be compiled into a real <bloom-player> custom
    // element for use outside Svelte.
    //
    // Protocol reference: bloom-player's src/externalContext.ts and
    // src/bloom-player-controls.tsx (BloomPlayerProps / handleControlMessage).
    // This is an internal, unversioned contract - re-check those files when
    // upgrading the bloom-player version you point `playerUrl` at.

    import { createEventDispatcher, onDestroy, onMount } from 'svelte';
    import { SvelteURLSearchParams } from 'svelte/reactivity';

    export type AutoPlayType = 'yes' | 'no' | 'motion';

    // --- Props -------------------------------------------------------------

    /** Base URL of the bloom-player build, e.g. "/src/gen-assets/bloom-player/bloomplayer.htm" */
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
    export let showBackButton = false;
    export let hideFullScreenButton = false;
    export let centerVertically = true;
    export let useOriginalPageSize = false;
    export let skipActivities = false;
    export let hideNavButtons = false;
    export let videoPreviewMode = false;
    export let reportSoundLog = false;

    // --- Events --------------------------------------------------------
    // Used only when this file is consumed as a plain Svelte component
    // (import BloomPlayer from ".../BloomPlayer.svelte"). When compiled as a
    // custom element, Svelte automatically re-dispatches these as CustomEvents
    // on the host element (e.g. document.querySelector("bloom-player")
    // .addEventListener("playbackComplete", ...)).
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

    function buildSrc(): string {
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
    }

    $: src = buildSrc();

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

    // --- Scale-fix workaround -----------------------------------------
    // bloom-player computes the book's on-screen scale by measuring the
    // rendered .bloom-page box once per book load (see
    // scalePageToWindow()/localMaxPageDimension in bloom-player-controls.tsx).
    // In our setup that measurement comes back wrong: .bloom-page's CSS sizing
    // (min/max-width/height: var(--page-width)/var(--page-height), set in
    // basePage.css by the book's device-size class, e.g. Device16x9Landscape)
    // does not resolve - computed max-width is "none" - so the page renders at
    // its fluid/unconstrained content size instead of its true aspect-ratio
    // size, and bloom-player then bakes that wrong box in as "native" size for
    // the rest of the session (transform: scale(1), no further correction).
    //
    // We can't fix the variable resolution itself without patching
    // bloom-player, so instead we recompute the correct scale ourselves - using
    // the same page-size-class -> mm dimensions table bloom-player's own CSS
    // defines - and inject an overriding stylesheet directly into the iframe.
    const PX_PER_MM = 96 / 25.4;

    // Mirrors the per-class --page-width/--page-height rules in basePage.css.
    const PAGE_SIZE_MM: Record<string, { width: number; height: number }> = {
        Device16x9Portrait: { width: 100, height: 177.77777778 },
        Device16x9Landscape: { width: 177.77777778, height: 100 },
        PictureStoryLandscape: { width: 177.77777778, height: 100 },
        A5Portrait: { width: 148, height: 210 },
        A5Landscape: { width: 210, height: 148 },
        A4Portrait: { width: 210, height: 297 },
        A4Landscape: { width: 297, height: 210 },
        A6Portrait: { width: 105, height: 148 },
        A6Landscape: { width: 148, height: 105 },
        B5Portrait: { width: 176, height: 250 },
        B5Landscape: { width: 250, height: 176 },
        LetterPortrait: { width: 215.9, height: 279.4 },
        LetterLandscape: { width: 279.4, height: 215.9 },
        HalfLetterPortrait: { width: 139.7, height: 215.9 },
        HalfLetterLandscape: { width: 215.9, height: 139.7 },
        Cm13Landscape: { width: 130.175, height: 129.910417 }
    };

    let scaleFixStyleEl: HTMLStyleElement | null = null;

    function getActiveBloomPage(doc: Document): HTMLElement | null {
        return (
            doc.querySelector<HTMLElement>('.swiper-slide-active .bloom-page') ??
            doc.querySelector<HTMLElement>('.bloom-page')
        );
    }

    function getPageSizeMm(page: HTMLElement): { width: number; height: number } | null {
        for (const cls of page.classList) {
            if (PAGE_SIZE_MM[cls]) {
                return PAGE_SIZE_MM[cls];
            }
        }
        return null;
    }

    function applyScaleFix() {
        const doc = iframeEl?.contentDocument;
        const win = iframeEl?.contentWindow;
        if (!doc || !win) {
            return;
        }

        const page = getActiveBloomPage(doc);
        if (!page) {
            return;
        }
        const sizeMm = getPageSizeMm(page);
        if (!sizeMm) {
            return;
        }

        const nativeWidth = sizeMm.width * PX_PER_MM;
        const nativeHeight = sizeMm.height * PX_PER_MM;

        const winWidth = win.innerWidth;
        const winHeight = win.innerHeight;
        if (!winWidth || !winHeight) {
            return;
        }

        const scaleFactor = Math.min(winWidth / nativeWidth, winHeight / nativeHeight);
        const actualWidth = nativeWidth * scaleFactor;
        const actualHeight = nativeHeight * scaleFactor;
        const translateX = Math.max((winWidth - actualWidth) / 2, 0);
        const translateY = Math.max((winHeight - actualHeight) / 2, 0);

        // NOTE: .bloom-page's contents (.marginBox and everything inside
        // it - image containers, text boxes, etc.) are laid out in fixed,
        // absolute mm/px units matching the page's *native* size - they are
        // NOT sized as percentages of .bloom-page. bloom-player's own
        // approach (see scale-style-sheet in bloomPlayer-controls) is to
        // leave .bloom-page at its native size and instead scale the whole
        // .bloomPlayer wrapper down/up with a CSS transform. If we instead
        // resize .bloom-page itself to the final on-screen size (as an
        // earlier version of this fix did) and disable that transform, every
        // fixed-mm/px descendant keeps its native-size box inside a
        // differently-sized page, so content (images included) ends up
        // wrongly positioned/sized - effectively invisible - even though it
        // loaded fine. So we replicate bloom-player's own transform-based
        // approach here, just with a correctly computed scale factor,
        // leaving .bloom-page's native sizing untouched.
        const newCss = `
            .bloomPlayer {
                width: ${nativeWidth}px !important;
                transform-origin: left top !important;
                transform: translate(${translateX}px, ${translateY}px) scale(${scaleFactor}) !important;
                margin-left: 0 !important;
            }
            .bloomPlayer-page, .swiper-slide {
                height: ${nativeHeight}px !important;
                overflow: hidden !important;
            }
        `;

        if (scaleFixStyleEl?.textContent === newCss) {
            return;
        }

        if (!scaleFixStyleEl) {
            scaleFixStyleEl = doc.createElement('style');
            scaleFixStyleEl.setAttribute('id', 'app-scale-fix-style-sheet');
            doc.head?.appendChild(scaleFixStyleEl);
        }
        // Placed after (and !important over) bloom-player's own
        // #scale-style-sheet, so it wins regardless of DOM order.
        scaleFixStyleEl.textContent = newCss;
    }

    let scaleFixObserver: MutationObserver | null = null;
    let scaleFixResizeHandler: (() => void) | null = null;

    function setupScaleFix() {
        const doc = iframeEl?.contentDocument;
        const win = iframeEl?.contentWindow;
        if (!doc || !win) {
            return;
        }

        applyScaleFix();

        // Re-assert whenever bloom-player recomputes its own (wrong) scale,
        // e.g. on page turns or window resizes. Observing <head> (rather than
        // just #scale-style-sheet) also catches that element's first creation.
        if (doc.head && !scaleFixObserver) {
            scaleFixObserver = new MutationObserver((mutations) => {
                const isOwnEdit = mutations.every(
                    (m) =>
                        scaleFixStyleEl &&
                        (m.target === scaleFixStyleEl || scaleFixStyleEl.contains(m.target))
                );
                if (!isOwnEdit) {
                    applyScaleFix();
                }
            });
            scaleFixObserver.observe(doc.head, {
                childList: true,
                characterData: true,
                subtree: true
            });
        }

        if (!scaleFixResizeHandler) {
            scaleFixResizeHandler = () => applyScaleFix();
            win.addEventListener('resize', scaleFixResizeHandler);
        }
    }

    function teardownScaleFix() {
        scaleFixObserver?.disconnect();
        scaleFixObserver = null;
        if (scaleFixResizeHandler) {
            iframeEl?.contentWindow?.removeEventListener('resize', scaleFixResizeHandler);
            scaleFixResizeHandler = null;
        }
        scaleFixStyleEl = null;
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
            setupScaleFix();
        }

        dispatch(messageType as any, detail);
    }

    onMount(() => {
        window.addEventListener('message', handleWindowMessage);
    });

    // A new src means a new book/iframe document - drop the old fix state.
    $: if (src) {
        teardownScaleFix();
    }

    onDestroy(() => {
        pause();
        window.removeEventListener('message', handleWindowMessage);
        teardownScaleFix();
    });
</script>

<iframe
    bind:this={iframeEl}
    {src}
    title="Bloom Player"
    style="width: 100%; height: 100%; border: none;"
    allow="autoplay"
/>
