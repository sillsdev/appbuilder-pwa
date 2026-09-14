<!--
@component
Renders the current chapter alongside its previous/next neighbors as three
side-by-side, absolutely-positioned panels and drives swiping/dragging
between them (with momentum) plus pinch-to-zoom font sizing and the desktop
prev/next chevron buttons. The caller only supplies the current chapter's
view settings and a `panel` snippet that knows how to render one panel given
its settings (the panel content format - Scripture, HTML book, etc. - is a
concern of the caller, not the pager).
-->
<script module lang="ts">
    import type { Snippet } from 'svelte';

    export interface Props {
        viewSettings: Record<string, any>;
        panel: Snippet<[Record<string, any>]>;
    }
</script>

<script lang="ts">
    import config, { scriptureConfig } from '$assets/config';
    import { bodyFontSize, direction, refs, userSettings } from '$lib/data/stores';
    import { ChevronIcon } from '$lib/icons';
    import { navigateToTextChapterInDirection } from '$lib/navigate';
    import { getFeatureValueBoolean } from '$lib/scripts/configUtils';
    import { tick, untrack } from 'svelte';
    import { pinch, swipe, type PinchPointerEventDetail } from 'svelte-gestures';
    import { Tween } from 'svelte/motion';

    let { viewSettings, panel }: Props = $props();

    const borders = import.meta.glob('./*', {
        import: 'default',
        eager: true,
        query: '?url',
        base: '/src/gen-assets/borders'
    }) as Record<string, string>;

    const swipeBetweenBooks = config.mainFeatures['book-swipe-between-books'];
    const navigateBetweenBooksPrev = $derived(swipeBetweenBooks || $refs.prev.book === $refs.book);
    const navigateBetweenBooksNext = $derived(swipeBetweenBooks || $refs.next.book === $refs.book);
    const hasPrev = $derived($refs.prev.chapter !== null);
    const hasNext = $derived($refs.next.chapter !== null);

    const isIntro = $derived($refs.chapter === 'i');
    const showBorderSetting = $derived(
        isIntro
            ? getFeatureValueBoolean(
                  scriptureConfig,
                  'show-border-intro',
                  $refs.collection,
                  $refs.book
              )
            : getFeatureValueBoolean(scriptureConfig, 'show-border', $refs.collection, $refs.book)
    );
    const showBorder = $derived(
        !!(
            scriptureConfig.traits?.['has-borders'] &&
            ($userSettings['show-border'] ?? showBorderSetting)
        )
    );

    let innerHeight = $state(0);
    let x = new Tween(0);
    let startX = 0;
    let isDragging = $state(false);
    let draggableWidth = $state(0);
    let panels_X = $state([-1, 0, 1]);
    let minSlideDistance = () => draggableWidth / 2; // use to determine how far a user has to slide to move to the next chapter
    let minSlideMomentum = 1; // measured in pixels per millisecond
    let lastX = 0;
    let lastTime = 0;
    let momentum = 0;
    let maxMomentum = 0;
    let transitionDone = true;

    const settings0 = $derived({
        // Initial settings for left panel
        ...viewSettings,
        highlights: Promise.resolve([]),
        bookmarks: Promise.resolve([]),
        notes: Promise.resolve([]),
        references: {
            ...viewSettings.references,
            book: hasPrev ? viewSettings.references!.prev.book : viewSettings.references!.book,
            chapter: hasPrev ? viewSettings.references!.prev.chapter : '1'
        }
    });

    const settings1 = $derived({
        // Initial settings for center panel
        ...viewSettings
    });

    const settings2 = $derived({
        // Initial settings for right panel
        ...viewSettings,
        highlights: Promise.resolve([]),
        bookmarks: Promise.resolve([]),
        notes: Promise.resolve([]),
        references: {
            ...viewSettings.references,
            book: hasNext ? viewSettings.references!.next.book : viewSettings.references!.book,
            chapter: hasNext ? viewSettings.references!.next.chapter : '1'
        }
    });

    let settingsCache: Record<string, any>[] = $state(
        // svelte-ignore state_referenced_locally
        [settings0, settings1, settings2]
    );

    let previousSettings = {
        // svelte-ignore state_referenced_locally
        ...viewSettings
    };

    // Update the panels for any updates from different format changes
    $effect(() => {
        if (
            previousSettings.bodyFontSize !== viewSettings.bodyFontSize ||
            previousSettings.bodyLineHeight !== viewSettings.bodyLineHeight ||
            previousSettings.font !== viewSettings.font ||
            previousSettings.themeColors !== viewSettings.themeColors ||
            previousSettings.viewShowVerses !== viewSettings.viewShowVerses
        ) {
            setupSettingsCache();
            previousSettings = { ...viewSettings };
        }
    });

    // Exposed via bind:this so callers can force a full re-init of the three panels
    // (e.g. after an explicit book/chapter pick, which isn't a prev/next swipe and so
    // can't be handled by adjustSettingsCache's rotation logic).
    export async function setupSettingsCache() {
        settingsCache[0] = {
            // Initial settings for left panel
            ...viewSettings,
            highlights: Promise.resolve([]),
            bookmarks: Promise.resolve([]),
            notes: Promise.resolve([]),
            references: {
                ...viewSettings.references,
                book: hasPrev ? viewSettings.references!.prev.book : viewSettings.references!.book,
                chapter: hasPrev ? viewSettings.references!.prev.chapter : '1'
            }
        };

        settingsCache[1] = {
            // Initial settings for center panel
            ...viewSettings
        };

        settingsCache[2] = {
            // Initial settings for right panel
            ...viewSettings,
            highlights: Promise.resolve([]),
            bookmarks: Promise.resolve([]),
            notes: Promise.resolve([]),
            references: {
                ...viewSettings.references,
                book: hasNext ? viewSettings.references!.next.book : viewSettings.references!.book,
                chapter: hasNext ? viewSettings.references!.next.chapter : '1'
            }
        };

        if (Math.sign(panels_X[0]) > -1) {
            panels_X[0] = -draggableWidth;
            panels_X[1] = 0;
            panels_X[2] = draggableWidth;
        }
    }

    async function adjustSettingsCache(direction: number) {
        let idx;
        adjustPanelX(0, direction);
        adjustPanelX(1, direction);
        adjustPanelX(2, direction);
        if (direction === -1) {
            panels_X = [panels_X[1], panels_X[2], panels_X[0]];
            if (hasPrev) {
                idx = panels_X.indexOf(Math.min(...panels_X));
                settingsCache[idx] = {
                    ...viewSettings, // load in the page before
                    highlights: Promise.resolve([]),
                    bookmarks: Promise.resolve([]),
                    notes: Promise.resolve([]),
                    references: {
                        ...viewSettings.references,
                        book: viewSettings.references!.prev.book,
                        chapter: viewSettings.references!.prev.chapter
                    }
                };
            }
        } else if (direction === 1) {
            panels_X = [panels_X[2], panels_X[0], panels_X[1]];
            if (hasNext) {
                idx = panels_X.indexOf(Math.max(...panels_X));
                settingsCache[idx] = {
                    ...viewSettings, // load in the next page
                    highlights: Promise.resolve([]),
                    bookmarks: Promise.resolve([]),
                    notes: Promise.resolve([]),
                    references: {
                        ...viewSettings.references,
                        book: viewSettings.references!.next.book,
                        chapter: viewSettings.references!.next.chapter
                    }
                };
            }
        }
        idx = panels_X.indexOf(0);
        settingsCache[idx].highlights = viewSettings.highlights;
        settingsCache[idx].bookmarks = viewSettings.bookmarks;
        settingsCache[idx].notes = viewSettings.notes;
    }

    $effect(() => {
        const highlights = viewSettings.highlights;

        // untrack prevents these reads from becoming dependencies
        untrack(() => {
            if (x.current === 0 && transitionDone) {
                const idx = panels_X.indexOf(0);
                settingsCache[idx].highlights = highlights;
            }
        });
    });

    $effect(() => {
        const bookmarks = viewSettings.bookmarks;

        // untrack prevents these reads from becoming dependencies
        untrack(() => {
            if (x.current === 0 && transitionDone) {
                const idx = panels_X.indexOf(0);
                settingsCache[idx].bookmarks = bookmarks;
            }
        });
    });

    async function adjustPanelX(panelX: number, direction: number) {
        if (Math.abs(panels_X[panelX]) > draggableWidth) {
            // this panel needs to be rotated to the other side and reloaded with a new page content
            if (direction === -1) {
                panels_X[panelX] = draggableWidth;
            } else {
                panels_X[panelX] = -draggableWidth;
            }
        }
    }

    // Duration (ms) to finish carrying a committed swipe the rest of the way to the
    // edge, based on the velocity the user released at. This keeps the release feeling
    // like a continuation of the finger's motion (momentum) instead of a separate,
    // fixed-speed animation tacked on afterwards.
    function slideFinishDuration(remainingDistance: number, velocity: number) {
        const speed = Math.max(Math.abs(velocity), 0.5); // px/ms floor avoids overlong tweens
        return Math.min(300, Math.max(60, remainingDistance / speed));
    }

    async function handlePointerCancel(_e: PointerEvent) {
        isDragging = false;
        momentum = 0;
        maxMomentum = 0;
        await x.set(0, { duration: Math.abs(x.current) });
    }

    async function handleMouseUp(_event: PointerEvent) {
        if (!isDragging) {
            return;
        }
        isDragging = false;
        const releaseX = x.current;
        const releaseMomentum = momentum;
        momentum = 0;
        maxMomentum = 0;

        const distancePassed = Math.abs(releaseX) >= minSlideDistance();
        // Only let momentum substitute for distance when it agrees with the direction
        // the user actually ended up dragging toward.
        const momentumPassed =
            Math.sign(releaseMomentum) === Math.sign(releaseX) &&
            Math.abs(releaseMomentum) >= minSlideMomentum;
        const committing =
            draggableWidth > 0 && releaseX !== 0 && (distancePassed || momentumPassed);

        if (committing && releaseX < 0 && hasNext && navigateBetweenBooksNext) {
            // Finish sliding the next chapter fully into view first (using the release
            // velocity so it reads as a continuation of the swipe), then swap the
            // underlying chapter data while the view is already settled off-screen.
            const duration = slideFinishDuration(draggableWidth + releaseX, releaseMomentum);
            await x.set(-draggableWidth, { duration });
            await navigateToTextChapterInDirection(1);
            await adjustSettingsCache(1);
            await x.set(0, { duration: 0 });
            await tick();
        } else if (committing && releaseX > 0 && hasPrev && navigateBetweenBooksPrev) {
            const duration = slideFinishDuration(draggableWidth - releaseX, releaseMomentum);
            await x.set(draggableWidth, { duration });
            await navigateToTextChapterInDirection(-1);
            await adjustSettingsCache(-1);
            await x.set(0, { duration: 0 });
            await tick();
        } else {
            await x.set(0, { duration: Math.abs(releaseX) });
        }
    }

    function handleMouseDown(event: PointerEvent) {
        if (navigateBetweenBooksPrev || navigateBetweenBooksNext) {
            isDragging = true;
            startX = event.clientX - x.current;
            lastX = x.current;
            lastTime = performance.now();
            momentum = 0;
            maxMomentum = 0;
        }
    }

    function handleMouseMove(event: PointerEvent) {
        if (isDragging) {
            let delta = event.clientX - startX;
            x.set(delta, { duration: 0 });
            if (x.current > 0 && !(hasPrev && navigateBetweenBooksPrev)) {
                x.set(0, { duration: 0 });
                return;
            } else if (x.current < 0 && !(hasNext && navigateBetweenBooksNext)) {
                x.set(0, { duration: 0 });
                return;
            } else if (x.current > draggableWidth) {
                x.set(draggableWidth, { duration: 0 });
            } else if (x.current < -draggableWidth) {
                x.set(-draggableWidth, { duration: 0 });
            }
            const currentTime = performance.now();

            const deltaX = x.current - lastX;
            const deltaT = currentTime - lastTime;

            momentum = deltaX / deltaT;
            maxMomentum = Math.max(momentum, maxMomentum);

            lastTime = currentTime;
            lastX = x.current;
        }
    }

    function measure(node: Element) {
        const observer = new ResizeObserver(([entry]) => {
            draggableWidth = entry.contentRect.width;
            panels_X = panels_X.map((x) => {
                return draggableWidth * Math.sign(x);
            });
        });

        observer.observe(node);

        return {
            destroy() {
                observer.disconnect();
            }
        };
    }

    async function prevChapter() {
        transitionDone = false;
        await navigateToTextChapterInDirection(-1);
        await adjustSettingsCache(-1);
        await x.set(-draggableWidth, { duration: 0 });
        await tick();
        await x.set(0);
        transitionDone = true;
    }
    async function nextChapter() {
        transitionDone = false;
        await navigateToTextChapterInDirection(1);
        await adjustSettingsCache(1);
        await x.set(draggableWidth, { duration: 0 });
        await tick();
        await x.set(0);
        transitionDone = true;
    }

    const minFontSize = config.mainFeatures['text-size-min'] as number;
    const maxFontSize = config.mainFeatures['text-size-max'] as number;
    let lastPinch = 1.0;
    function doPinch(event: CustomEvent<PinchPointerEventDetail>) {
        const currPinch = event.detail.scale;
        bodyFontSize.update((fontSize) => {
            if (Math.abs(currPinch - lastPinch) > 0.1) {
                const newFontSize = currPinch > lastPinch ? fontSize + 1.0 : fontSize - 1.0;
                lastPinch = currPinch;
                const clampedFontSize = Math.max(minFontSize, Math.min(maxFontSize, newFontSize));
                return clampedFontSize;
            } else {
                return fontSize;
            }
        });
    }
</script>

<svelte:window
    bind:innerHeight
    onpointermove={handleMouseMove}
    onpointerup={handleMouseUp}
    onpointercancel={handlePointerCancel}
/>

<!-- flex causes the imported html to display outside of the view port. Use md: -->
<div class="md:flex md:flex-row mx-auto justify-center" style:direction={$direction}>
    <div class="hidden md:flex basis-1/12 justify-center">
        <button
            onclick={prevChapter}
            class="fixed top-1/2 dy-btn dy-btn-circle dy-btn-ghost {hasPrev &&
            navigateBetweenBooksPrev
                ? 'visible'
                : 'invisible'}"
        >
            <ChevronIcon size={36} color="gray" deg={$direction === 'ltr' ? 180 : 0} />
        </button>
    </div>
    <div
        class="basis-5/6 max-w-breakpoint-md"
        style="position: relative; left: {x.current}px; height: {innerHeight}px"
        use:measure
    >
        {#each [0, 1, 2] as i (i)}
            <div
                class="p-2 w-full overflow-y-hidden"
                style="position: absolute; left: {panels_X[i]}px; display: {Math.abs(
                    panels_X[i] + x.current
                ) === draggableWidth
                    ? 'none'
                    : 'block'}; clip-path: inset(0 {1 * panels_X[i] + x.current}px 0 {-1 *
                    panels_X[i] -
                    x.current}px);"
            >
                <main>
                    <div
                        style="--borderImageSource: url({borders['./border.png']});"
                        class:borderimg={showBorder}
                        aria-hidden="true"
                        class="max-w-breakpoint-md mx-auto"
                        onpointerdown={handleMouseDown}
                        use:pinch
                        onpinch={doPinch}
                        use:swipe={{
                            timeframe: 300,
                            minSwipeDistance: 60,
                            touchAction: 'pan-y'
                        }}
                    >
                        {@render panel(settingsCache[i])}
                    </div>
                </main>
            </div>
        {/each}
    </div>
    <div class="hidden basis-1/12 md:flex justify-center">
        <button
            onclick={nextChapter}
            class="fixed mx-auto top-1/2 dy-btn dy-btn-circle dy-btn-ghost {hasNext &&
            navigateBetweenBooksNext
                ? 'visible'
                : 'invisible'}"
        >
            <ChevronIcon size={36} color="gray" deg={$direction === 'ltr' ? 0 : 180} />
        </button>
    </div>
</div>

<style>
    .borderimg {
        border: 30px solid transparent;
        border-image-source: var(--borderImageSource);
        border-image-slice: 100;
    }
</style>
