<script lang="ts">
    import { asset } from '$app/paths';
    import type { ContentItem, FeatureConfig, FeatureValue } from '$config';
    import { contentsFontSize, convertStyle, language, s } from '$lib/data/stores';

    interface Props {
        item: ContentItem;
        imageFolder: string;
        onClick?: (target: HTMLElement, item: ContentItem) => void;
        checkImageSize?: (item: ContentItem) => string;
        features?: FeatureConfig;
    }

    let {
        item,
        imageFolder,
        onClick = onClickFallback,
        checkImageSize = checkImageSizeFallback,
        features
    }: Props = $props();

    function onClickFallback(target: HTMLElement, item: ContentItem) {
        console.warn('USING the onClickFallback');
    }

    function checkImageSizeFallback(item: ContentItem) {
        console.warn('USING checkImageSizeFallback');
        return '';
    }

    function renderLastTextBox(layout?: FeatureValue): boolean {
        if (layout === undefined) {
            return false;
        }
        const exclude: FeatureValue[] = ['image-left-text-right', 'image-right-text-left'];
        console.log(`renderLastTextBox: ${!!exclude.find((x) => x === layout)}`);
        return !exclude.includes(layout);
    }
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
    id={String(item.id)}
    onclick={(event) => onClick(event.currentTarget, item)}
    class="contents-item-block contents-item-block-base"
    style="padding-top:10px;padding-bottom:10px;"
>
    {#snippet img(item: ContentItem)}
        <div
            class="contents-image-block"
            style="{convertStyle($s?.['div.contents-image-block'])}{checkImageSize(item)}"
        >
            <img
                class="contents-image"
                style={convertStyle($s?.['div.contents-image'])}
                src={asset(`/${imageFolder}/${item.imageFilename}`)}
                alt={item.imageFilename}
            />
        </div>
    {/snippet}

    {#snippet text(item: ContentItem)}
        <div style:font-size="{$contentsFontSize}px">
            <!-- Check for title -->
            {#if features?.['show-titles'] === true}
                <div class="contents-heading-title">
                    {item.title?.[$language] ?? item.title?.default ?? ''}
                </div>
            {/if}

            <!-- Check for subtitles -->
            {#if features?.['show-subtitles'] === true}
                <div class="contents-heading-subtitle">
                    {item.subtitle?.[$language] ?? item.subtitle?.default ?? ''}
                </div>
            {/if}
        </div>
    {/snippet}

    <!-- Heading items go here -->

    {#if item.imageFilename}
        {#if item.features?.['layout'] === 'image-left-text-right'}
            <div class="contents-layout-horizontal">
                {@render img(item)}
                {@render text(item)}
            </div>
        {:else if item.features?.['layout'] === 'image-right-text-left'}
            <div class="contents-layout-horizontal contents-layout-reverse">
                {@render img(item)}
                {@render text(item)}
            </div>
        {:else if item.features?.['layout'] === 'image-top-text-bottom'}
            <div class="contents-layout-vertical">
                {@render img(item)}
                {@render text(item)}
            </div>
        {:else if renderLastTextBox(features?.['layout'])}
            {@render img(item)}
        {/if}
    {/if}

    {#if item.features?.['layout'] === 'text-only'}
        {@render text(item)}
    {/if}
</div>
