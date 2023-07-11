<script lang="ts">
    import IconCard from '$lib/components/IconCard.svelte';
    import SortMenu from '$lib/components/SortMenu.svelte';
    import { BookmarkIcon } from '$lib/icons';
    import Navbar from '$lib/components/Navbar.svelte';
    import { t } from '$lib/data/stores';
    import { formatDate } from '$lib/scripts/dateUtils.js';
    import { page } from '$app/stores';
    
    function handleMenuAction(event: CustomEvent, id: string) {
        switch (event.detail.text) {
            case $t['Annotation_Menu_View']:
                console.log('View: ', bookmarks[id].reference);
                break;
            case $t['Annotation_Menu_Share']:
                console.log('Share: ', bookmarks[id].reference);
                break;
            case $t['Annotation_Menu_Delete']:
                console.log('Delete: ', id);
                break;
        }
    }

    function handleSortAction(event: CustomEvent) {
        switch (event.detail.text) {
            case $t['Annotation_Sort_Order_Reference']:
                sortByReference();
                break;
            case $t['Annotation_Sort_Order_Date']:
                sortByDate();
                break;
        }
    }

    function sortByReference() {
        bookmarks.sort((a, b) => {
            if (a.bookIndex > b.bookIndex) {
                return 1;
            }
            else if (a.bookIndex < b.bookIndex) {
                return -1;
            }
            else if (parseInt(a.chapter) > parseInt(b.chapter)) {
                return 1;
            }
            else if (parseInt(a.chapter) < parseInt(b.chapter)) {
                return -1;
            }
            else if (parseInt(a.verse) > parseInt(b.verse)) {
                return 1;
            }
            else {
                return -1;
            }
        })

        bookmarks = bookmarks
    }

    function sortByDate() {
        bookmarks.sort((a, b) => {
            if (a.date < b.date) {
                return 1;
            }
            else {
                return -1;
            }
        })

        bookmarks = bookmarks;
    }
    
    let bookmarks = $page.data.bookmarks;
    sortByDate();
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
                {@const sortMenu = {
                    actions: [
                        $t['Annotation_Sort_Order_Reference'],
                        $t['Annotation_Sort_Order_Date']
                    ]
                }}
                <SortMenu on:menuaction={(e) => handleSortAction(e)} {...sortMenu}>
                </SortMenu>
            </label>
            <!-- <div slot="right-buttons" /> -->
        </Navbar>
    </div>

    <div id="bookmarks" class="overflow-y-auto">
        {#each bookmarks as b}
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
            <IconCard on:menuaction={(e) => handleMenuAction(e, b.reference)} {...iconCard}>
                <BookmarkIcon slot="icon" color="red" />
            </IconCard>
        {/each}
    </div>
</div>
