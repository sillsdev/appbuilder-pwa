<script lang="ts">
    import { goto } from '$app/navigation';
    import IconCard from '$lib/components/IconCard.svelte';
    import Navbar from '$lib/components/Navbar.svelte';
    import SortMenu from '$lib/components/SortMenu.svelte';
    import { shareAnnotation, shareAnnotations } from '$lib/data/annotation-share';
    import { Sort, toSorted } from '$lib/data/annotation-sort';
    import { removeBookmark, type BookmarkItem } from '$lib/data/bookmarks';
    import { actionBarColor, bodyFontSize, refs, t } from '$lib/data/stores';
    import { BookmarkIcon } from '$lib/icons';
    import ShareIcon from '$lib/icons/ShareIcon.svelte';
    import { formatDate } from '$lib/scripts/dateUtils';
    import type { MenuActionEvent } from '$lib/types';
    import { resolve } from '$lib/utils/paths';
    import type { PageData } from './$types';

    interface Props {
        data: PageData;
    }

    let { data }: Props = $props();

    async function handleMenuAction(event: MenuActionEvent, bookmark: BookmarkItem) {
        switch (event.text) {
            case $t['Annotation_Menu_View']:
                refs.set(bookmark);
                goto(resolve(`/`));
                break;
            case $t['Annotation_Menu_Share']:
                await shareAnnotation(bookmark);
                break;
            case $t['Annotation_Menu_Delete']:
                await removeBookmark(bookmark.date);
                break;
        }
    }

    function handleSortAction(event: MenuActionEvent) {
        switch (event.text) {
            case $t['Annotation_Sort_Order_Reference']:
                sortOrder = Sort.Reference;
                break;
            case $t['Annotation_Sort_Order_Date']:
                sortOrder = Sort.Date;
                break;
        }
    }

    const sortMenu = {
        actions: [$t['Annotation_Sort_Order_Reference'], $t['Annotation_Sort_Order_Date']]
    };

    let sortOrder: Sort = $state(Sort.Date);
</script>

<div class="grid grid-rows-[auto_1fr]" style="height:100vh;height:100dvh;">
    <div class="navbar">
        <Navbar>
            {#snippet center()}
                <label for="sidebar">
                    <div class="dy-btn dy-btn-ghost normal-case text-xl">
                        {$t['Annotation_Bookmarks']}
                    </div>
                </label>
            {/snippet}

            {#snippet end()}
                <button
                    class="dy-btn dy-btn-ghost dy-btn-circle"
                    onclick={async () =>
                        await shareAnnotations(toSorted(data.bookmarks, sortOrder))}
                >
                    <ShareIcon color={$actionBarColor} />
                </button>
                <SortMenu menuaction={(e) => handleSortAction(e)} {...sortMenu} />
            {/snippet}
        </Navbar>
    </div>

    <div
        id="bookmarks"
        class="overflow-y-auto p-2.5 max-w-breakpoint-md mx-auto w-full"
        style:font-size="{$bodyFontSize}px"
    >
        {#if data.bookmarks.length === 0}
            <div class="annotation-message-none">{$t['Annotation_Bookmarks_None']}</div>
            <div class="annotation-message-none-info">{$t['Annotation_Bookmarks_None_Info']}</div>
        {:else}
            {#each toSorted(data.bookmarks, sortOrder) as b}
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
                <IconCard menuaction={(e) => handleMenuAction(e, b)} {...iconCard}>
                    {#snippet icon()}
                        <BookmarkIcon color="#b10000" />
                    {/snippet}
                </IconCard>
            {/each}
        {/if}
    </div>
</div>
