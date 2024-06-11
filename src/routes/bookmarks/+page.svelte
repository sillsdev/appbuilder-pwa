<script lang="ts">
    import IconCard from '$lib/components/IconCard.svelte';
    import SortMenu from '$lib/components/SortMenu.svelte';
    import { BookmarkIcon } from '$lib/icons';
    import ShareIcon from '$lib/icons/ShareIcon.svelte';
    import Navbar from '$lib/components/Navbar.svelte';
    import { bodyFontSize, refs, t } from '$lib/data/stores';
    import { formatDate } from '$lib/scripts/dateUtils';
    import { removeBookmark, type BookmarkItem } from '$lib/data/bookmarks';
    import { SORT_DATE, SORT_REFERENCE, toSorted } from '$lib/data/annotation-sort';
    import { page } from '$app/stores';
    import { base } from '$app/paths';
    import { goto } from '$app/navigation';
    import { shareAnnotation, shareAnnotations } from '$lib/data/annotation-share';

    async function handleMenuAction(event: CustomEvent, bookmark: BookmarkItem) {
        switch (event.detail.text) {
            case $t['Annotation_Menu_View']:
                refs.set(bookmark);
                goto(`${base}/`);
                break;
            case $t['Annotation_Menu_Share']:
                await shareAnnotation(bookmark);
                break;
            case $t['Annotation_Menu_Delete']:
                await removeBookmark(bookmark.date);
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
        }
    }

    const sortMenu = {
        actions: [$t['Annotation_Sort_Order_Reference'], $t['Annotation_Sort_Order_Date']]
    };

    let sortOrder = SORT_DATE;
</script>

<div class="grid grid-rows-[auto,1fr]" style="height:100vh;height:100dvh;">
    <div class="navbar">
        <Navbar>
            <!-- <div slot="left-buttons" /> -->
            <label for="sidebar" slot="center">
                <div class="btn btn-ghost normal-case text-xl">{$t['Annotation_Bookmarks']}</div>
            </label>

            <!-- svelte-ignore a11y-label-has-associated-control -->
            <div slot="right-buttons">
                <button
                    class="dy-btn dy-btn-ghost dy-btn-circle"
                    on:click={async () =>
                        await shareAnnotations(toSorted($page.data.bookmarks, sortOrder))}
                >
                    <ShareIcon color="white" />
                </button>
                <SortMenu on:menuaction={(e) => handleSortAction(e)} {...sortMenu} />
            </div>
            <!-- <div slot="right-buttons" /> -->
        </Navbar>
    </div>

    <div
        id="bookmarks"
        class="overflow-y-auto p-2.5 max-w-screen-md mx-auto w-full"
        style:font-size="{$bodyFontSize}px"
    >
        {#if $page.data.bookmarks.length === 0}
            <div class="annotation-message-none">{$t['Annotation_Bookmarks_None']}</div>
            <div class="annotation-message-none-info">{$t['Annotation_Bookmarks_None_Info']}</div>
        {:else}
            {#each toSorted($page.data.bookmarks, sortOrder) as b}
                {@const iconCard = {
                    docSet: b.docSet,
                    collection: b.collection,
                    book: b.book,
                    chapter: b.chapter,
                    verse: b.verse,
                    reference: b.reference,
                    text: b.text,
                    date: formatDate(new Date(b.date)),
                    actions: [
                        $t['Annotation_Menu_View'],
                        $t['Annotation_Menu_Share'],
                        $t['Annotation_Menu_Delete']
                    ]
                }}
                <IconCard on:menuaction={(e) => handleMenuAction(e, b)} {...iconCard}>
                    <BookmarkIcon slot="icon" color="#b10000" />
                </IconCard>
            {/each}
        {/if}
    </div>
</div>
