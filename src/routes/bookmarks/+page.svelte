<script lang="ts">
    import IconCard from '$lib/components/IconCard.svelte';
    import SortMenu from '$lib/components/SortMenu.svelte';
    import { BookmarkIcon } from '$lib/icons';
    import Navbar from '$lib/components/Navbar.svelte';
    import { t } from '$lib/data/stores';
    import { formatDate } from '$lib/scripts/dateUtils';
    import { removeBookmark } from '$lib/data/bookmarks';
    import { SORT_DATE, SORT_REFERENCE, toSorted } from '$lib/data/annotation-sort';
    import { invalidate } from '$app/navigation';
    import { page } from '$app/stores';

    async function handleMenuAction(event: CustomEvent, id: number) {
        switch (event.detail.text) {
            case $t['Annotation_Menu_View']:
                console.log('View: ', $page.data.bookmarks[id].reference);
                break;
            case $t['Annotation_Menu_Share']:
                console.log('Share: ', $page.data.bookmarks[id].reference);
                break;
            case $t['Annotation_Menu_Delete']:
                await removeBookmark(id);
                invalidate('bookmarks');
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
            <label slot="right-buttons">
                <SortMenu on:menuaction={(e) => handleSortAction(e)} {...sortMenu} />
            </label>
            <!-- <div slot="right-buttons" /> -->
        </Navbar>
    </div>

    <div id="bookmarks" class="overflow-y-auto">
        {#each toSorted($page.data.bookmarks, sortOrder) as b}
            {@const iconCard = {
                collection: b.collection,
                reference: b.reference,
                text: b.text,
                date: formatDate(new Date(b.date)),
                actions: [
                    $t['Annotation_Menu_View'],
                    $t['Annotation_Menu_Share'],
                    $t['Annotation_Menu_Delete']
                ]
            }}
            <IconCard on:menuaction={(e) => handleMenuAction(e, b.date)} {...iconCard}>
                <BookmarkIcon slot="icon" color="red" />
            </IconCard>
        {/each}
    </div>
</div>
