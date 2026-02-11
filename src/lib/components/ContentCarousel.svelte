<script lang="ts">
    import { base } from '$app/paths';
    import { convertStyle, language, s } from '$lib/data/stores';
    import { onMount } from 'svelte';

    let {
        item,
        imageFolder,
        onClick,
        checkImageSize,
        loadReferenceText,
        contentsFontSize,
        features
    } = $props();

    const onClickCallback = onClick ?? onClickFallback;
    const checkImageSizeCallback = checkImageSize ?? checkImageSizeFallback;
    const loadReferenceTextCallback = loadReferenceText ?? loadReferenceTextFallback;
    const carouselId = `contents-carousel-${item.id}`;
    let curIdx: number = 0;

    function onClickFallback(event: Event, item: any) {
        console.warn('USING THE onClickFallback');
    }

    function checkImageSizeFallback(item: any) {
        console.warn('USING checkImageSizeFallback');
    }

    function loadReferenceTextFallback(item: any) {
        console.warn('USING loadReferenceFallback');
    }

    function carouselOnClickHandler(e: Event, item: any) {
        onClickCallback(e, item);
    }

    function hasIdUnderMouseItem(item: Element | HTMLElement | undefined) {
        if (item === undefined) return false;
        if (!item.hasAttribute('id')) return false;
        if (item.id === null) return false;
        return item.id !== '';
    }

    onMount(() => {
        const carousel: HTMLElement = document.getElementById(carouselId);
        const carouselScroll: HTMLElement = carousel.querySelector('.contents-carousel-row');

        let isDown = false;
        let startX = 0;
        let scrollLeft = 0;
        let isScrolling = false;

        carouselScroll.addEventListener('mousedown', (e: MouseEvent) => {
            isDown = true;
            startX = e.pageX - carouselScroll.offsetLeft;
            scrollLeft = carouselScroll.scrollLeft;
        });

        carouselScroll.addEventListener('mouseleave', (e: MouseEvent) => {
            isDown = false;
            isScrolling = false;
        });

        carouselScroll.addEventListener('mouseup', (e: MouseEvent) => {
            if (!isScrolling) {
                // register onclick event
                let itemUnderMouse = document.elementFromPoint(e.clientX, e.clientY);
                if (!hasIdUnderMouseItem(itemUnderMouse)) {
                    if (hasIdUnderMouseItem(itemUnderMouse.parentElement)) {
                        itemUnderMouse = itemUnderMouse.parentElement;
                    } else if (hasIdUnderMouseItem(itemUnderMouse.parentElement.parentElement)) {
                        itemUnderMouse = itemUnderMouse.parentElement.parentElement;
                    }
                }

                if (itemUnderMouse.hasAttribute('id')) {
                    const curItem = item.children.find((x) => x.id === Number(itemUnderMouse.id));
                    carouselOnClickHandler(e, curItem);
                } else {
                    console.error('itemUnderMouse does not have an id');
                }
            }

            // finish
            isScrolling = false;
            isDown = false;
        });

        carouselScroll.addEventListener('mousemove', (e: MouseEvent) => {
            if (!isDown) return;

            isScrolling = true;
            e.preventDefault();
            const x = e.pageX - carouselScroll.offsetLeft;
            const walk = (x - startX) * 3; //NOTE: this may need to be evaluated based on perPage options
            carouselScroll.scrollLeft = scrollLeft - walk;
        });
    });
</script>

<div id={carouselId} class="contents-carousel no-select">
    <div class="contents-carousel-heading">
        <!-- Carousel title and subtitle -->
        {#if features['show-titles'] === true}
            <div class="contents-carousel-heading-title">
                {item.title?.[$language] ?? item.title?.default ?? ''}
            </div>
        {/if}
        {#if features['show-titles'] === true}
            <div class="contents-carousel-heading-subtitle">
                {item.subtitle?.[$language] ?? item.subtitle?.default ?? ''}
            </div>
        {/if}
    </div>
    <div
        class="contents-carousel-row"
        style="overscroll-behavior: auto contain; overflow-y: hidden; scrollbar-width:none; -ms-overflow-style:none; -webkit-scrollbar: none;"
    >
        <div class="contents-carousel-inner n2">
            {#each item.children as child}
                <!-- svelte-ignore a11y_click_events_have_key_events -->
                <!-- svelte-ignore a11y_no_static_element_interactions -->

                <div
                    class="contents-carousel-item-block contents-carousel-item-block-base"
                    id={child.id}
                    style="scroll-snap-type: center;"
                >
                    {#if child.imageFilename}
                        <img
                            src="{base}/{imageFolder}/{child.imageFilename}"
                            alt={child.imageFilename}
                            draggable="false"
                        />
                    {/if}

                    <div
                        class="contents-carousel-item-text-block"
                        style:font-size="{$contentsFontSize}px"
                    >
                        <!-- carousel item title -->
                        {#if features['show-titles'] === true}
                            <div
                                class="contents-carousel-item-title-block contents-carousel-item-title"
                            >
                                {child.title?.[$language] ?? child.title?.default ?? ''}
                            </div>
                        {/if}

                        <!-- carousel item subtitles -->
                        {#if features['show-subtitles'] === true}
                            <div
                                class="contents-caoursel-item-subtitle-block contents-carousel-item-subtitle"
                            >
                                {child.subtitle?.[$language] ?? child.subtitle?.default ?? ''}
                            </div>
                        {/if}

                        <!-- Check for reference -->
                        {#if child.features['show-references'] === true}
                            {#if child.linkType === 'reference'}
                                {#await loadReferenceTextCallback(child)}
                                    <div class="contents-ref"></div>
                                {:then referenceText}
                                    <div class="contents-ref" style="text-align:center;">
                                        {referenceText}
                                    </div>
                                {:catch error}
                                    <div class="contents-ref"></div>
                                {/await}
                            {/if}
                        {/if}
                    </div>
                </div>
            {/each}
        </div>
    </div>
</div>

<style>
    .no-select {
        -webkit-touch-callout: none;
        -webkit-user-select: none;
        -ms-user-select: none;
        user-select: none;
    }
</style>
