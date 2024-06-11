<script lang="ts">
    import ColorCard from '$lib/components/ColorCard.svelte';
    import SortMenu from '$lib/components/SortMenu.svelte';
    import ShareIcon from '$lib/icons/ShareIcon.svelte';
    import Navbar from '$lib/components/Navbar.svelte';
    import { bodyFontSize, refs, t } from '$lib/data/stores';
    import { formatDate } from '$lib/scripts/dateUtils';
    import { removeHighlight, type HighlightItem } from '$lib/data/highlights';
    import { SORT_COLOR, SORT_DATE, SORT_REFERENCE, toSorted } from '$lib/data/annotation-sort';
    import { page } from '$app/stores';
    import { base } from '$app/paths';
    import { goto } from '$app/navigation';
    import { shareAnnotation, shareAnnotations } from '$lib/data/annotation-share';

    async function handleMenuaction(event: CustomEvent, highlight: HighlightItem) {
        switch (event.detail.text) {
            case $t['Annotation_Menu_View']:
                refs.set(highlight);
                goto(`${base}/`);
                break;
            case $t['Annotation_Menu_Share']:
                await shareAnnotation(highlight);
                break;
            case $t['Annotation_Menu_Delete']:
                await removeHighlight(highlight.date);
                break;
        }
    }

    function handleSortAction(event: CustomEvent) {
        switch (event.detail.text) {
            case $t['Annotation_Sort_Order_Reference']:
                sortOrder = SORT_REFERENCE;
                break;
            case $t['Annotation_Sort_Order_Date']:
                sortOrder = SORT_DATE;
                break;
            case $t['Annotation_Sort_Order_Color']:
                sortOrder = SORT_COLOR;
                break;
        }
    }

    const sortMenu = {
        actions: [
            $t['Annotation_Sort_Order_Reference'],
            $t['Annotation_Sort_Order_Date'],
            $t['Annotation_Sort_Order_Color']
        ]
    };

    let sortOrder = SORT_DATE;
</script>

<div class="grid grid-rows-[auto,1fr]" style="height:100vh;height:100dvh;">
    <div class="navbar">
        <Navbar>
            <!-- <div slot="left-buttons" /> -->
            <label for="sidebar" slot="center">
                <div class="btn btn-ghost normal-case text-xl">{$t['Annotation_Highlights']}</div>
            </label>

            <!-- svelte-ignore a11y-label-has-associated-control -->
            <div slot="right-buttons">
                <button
                    class="dy-btn dy-btn-ghost dy-btn-circle"
                    on:click={async () =>
                        await shareAnnotations(toSorted($page.data.highlights, sortOrder))}
                >
                    <ShareIcon color="white" />
                </button>
                <SortMenu on:menuaction={(e) => handleSortAction(e)} {...sortMenu} />
            </div>
            <!-- <div slot="right-buttons" /> -->
        </Navbar>
    </div>

    <div
        class="overflow-y-auto p-2.5 max-w-screen-md mx-auto w-full"
        style:font-size="{$bodyFontSize}px"
    >
        {#if $page.data.highlights.length === 0}
            <div class="annotation-message-none">{$t['Annotation_Highlights_None']}</div>
            <div class="annotation-message-none-info">{$t['Annotation_Highlights_None_Info']}</div>
        {:else}
            {#each toSorted($page.data.highlights, sortOrder) as h}
                {@const colorCard = {
                    docSet: h.docSet,
                    book: h.book,
                    chapter: h.chapter,
                    verse: h.verse,
                    reference: h.reference,
                    text: h.text,
                    date: formatDate(new Date(h.date)),
                    actions: [
                        $t['Annotation_Menu_View'],
                        $t['Annotation_Menu_Share'],
                        $t['Annotation_Menu_Delete']
                    ],
                    penColor: h.penColor
                }}
                <ColorCard on:menuaction={(e) => handleMenuaction(e, h)} {...colorCard} />
            {/each}
        {/if}
    </div>
</div>
