<script lang="ts">
    import { page } from '$app/state';
    import IconCard from '$lib/components/IconCard.svelte';
    import Navbar from '$lib/components/Navbar.svelte';
    import SortMenu from '$lib/components/SortMenu.svelte';
    import { shareAnnotation, shareAnnotations } from '$lib/data/annotation-share';
    import { SORT_DATE, SORT_REFERENCE, toSorted } from '$lib/data/annotation-sort';
    import { removeNote, type NoteItem } from '$lib/data/notes';
    import { bodyFontSize, modal, MODAL_NOTE, monoIconColor, refs, t } from '$lib/data/stores';
    import { NoteIcon } from '$lib/icons';
    import ShareIcon from '$lib/icons/ShareIcon.svelte';
    import { gotoRoute } from '$lib/navigate';
    import { formatDate } from '$lib/scripts/dateUtils';
    import type { MenuActionEvent } from '$lib/types';

    async function handleMenuaction(event: MenuActionEvent, note: NoteItem) {
        switch (event.text) {
            case $t['Annotation_Menu_View']:
                refs.set(note);
                gotoRoute(`/`);
                break;
            case $t['Annotation_Menu_Edit']:
                // modal.open(MODAL_NOTE, note);
                goto(`/notes/edit/${note.date}`);
                break;
            case $t['Annotation_Menu_Share']:
                await shareAnnotation(note);
                break;
            case $t['Annotation_Menu_Delete']:
                await removeNote(note.date);
                break;
        }
    }

    function handleSortAction(event: MenuActionEvent) {
        switch (event.text) {
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
            {#snippet center()}
                <label for="sidebar">
                    <div class="btn btn-ghost normal-case text-xl">{$t['Annotation_Notes']}</div>
                </label>
            {/snippet}

            {#snippet end()}
                <button
                    class="dy-btn dy-btn-ghost dy-btn-circle"
                    onclick={async () =>
                        await shareAnnotations(toSorted(page.data.notes, sortOrder))}
                >
                    <ShareIcon color="white" />
                </button>
                <SortMenu menuaction={(e) => handleSortAction(e)} {...sortMenu} />
            {/snippet}
        </Navbar>
    </div>

    <div
        class="overflow-y-auto p-2.5 max-w-screen-md mx-auto w-full"
        style:font-size="{$bodyFontSize}px"
    >
        {#if page.data.notes.length === 0}
            <div class="annotation-message-none">{$t['Annotation_Notes_None']}</div>
            <div class="annotation-message-none-info">{$t['Annotation_Notes_None_Info']}</div>
        {:else}
            {#each toSorted(page.data.notes, sortOrder) as n}
                {@const iconCard = {
                    docSet: n.docSet,
                    collection: n.collection,
                    book: n.book,
                    chapter: n.chapter,
                    verse: n.verse,
                    reference: n.reference,
                    text: n.text,
                    date: formatDate(new Date(n.date)),
                    actions: [
                        $t['Annotation_Menu_View'],
                        $t['Annotation_Menu_Edit'],
                        $t['Annotation_Menu_Share'],
                        $t['Annotation_Menu_Delete']
                    ]
                }}
                <IconCard menuaction={(e) => handleMenuaction(e, n)} {...iconCard}>
                    {#snippet icon()}
                        <NoteIcon color={$monoIconColor} />
                    {/snippet}
                </IconCard>
            {/each}
        {/if}
    </div>
</div>
