<script lang="ts">
    import { base } from '$app/paths';
    import { convertStyle, language, s } from '$lib/data/stores';

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
    function onClickFallback(e: Event, item: any) {
        console.warn('Using onClickFallback');
    }

    function checkImageSizeFallback(item: any) {
        console.warn('Using checkImageSizeFallback');
    }

    function loadReferenceTextFallback(item: any) {
        console.warn('Using loadReferenceTextFallback');
    }
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div id="grid-{item.id}" class="contents-grid">
    <div class="contents-grid-heading">
        {#if features['show-titles'] === true}
            <div class="contents-grid-heading-title">
                {item.title?.[$language] ?? item.title?.default ?? ''}
            </div>
        {/if}
        {#if features['show-subtitles'] === true}
            <div class="contents-grid-heading-subtitle">
                {item.subtitle?.[$language] ?? item.subtitle?.default ?? ''}
            </div>
        {/if}
    </div>

    <div class="contents-grid-row contents-grid-cols-3">
        {#each item.children as child}
            <!-- Grid items go here -->
            <div
                class="contents-grid-item-block contents-grid-item-block-base contents-link-ref"
                id={child.id}
                onclick={(event) => onClickCallback(event, child)}
            >
                {#if child.imageFilename}
                    <img
                        src="{base}/{imageFolder}/{child.imageFilename}"
                        alt={child.imageFilename}
                    />
                {/if}

                <div class="contents-grid-item-text-block" style:font-size="{$contentsFontSize}px">
                    <!-- Check for title -->
                    {#if features['show-titles'] === true}
                        <div class="contents-grid-item-title-block contents-grid-item-title">
                            {child.title?.[$language] ?? child.title?.default ?? ''}
                        </div>
                    {/if}

                    <!-- Check for subtitles -->
                    {#if features['show-subtitles'] === true}
                        <div class="contents-grid-item-subtitle-block contents-grid-item-subtitle">
                            {child.subtitle?.[$language] ?? child.subtitle?.default ?? ''}
                        </div>
                    {/if}

                    <!-- Check for references -->
                    {#if features['show-references'] === true}
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
