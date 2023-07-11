<script lang="ts">
    import ColorCard from '$lib/components/ColorCard.svelte';
    import SortMenu from '$lib/components/SortMenu.svelte';
    import Navbar from '$lib/components/Navbar.svelte';
    import { t } from '$lib/data/stores';
    import { formatDate } from '$lib/scripts/dateUtils.js';
    import { page } from '$app/stores';

    function handleMenuaction(event: CustomEvent, id: string) {
        switch (event.detail.text) {
            case $t['Annotation_Menu_View']:
                console.log('View: ', highlights[id].reference);
                break;
            case $t['Annotation_Menu_Share']:
                console.log('Share: ', highlights[id].reference);
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
            case $t['Annotation_Sort_Order_Color']:
                sortByColor();
                break;
        }
    }

    function sortByReference() {
        highlights.sort((a, b) => {
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

        highlights = highlights
    }

    function sortByDate() {
        highlights.sort((a, b) => {
            if (a.date < b.date) {
                return 1;
            }
            else {
                return -1;
            }
        })

        highlights = highlights;
    }

    function sortByColor() {
        highlights.sort((a, b) => {
            if (a.penColor > b.penColor) {
                return 1;
            }
            else if (a.penColor < b.penColor) {
                return -1;
            }
            else if (a.date < b.date) {
                return 1;
            }
            else {
                return -1;
            }
        })

        highlights = highlights;
    }
    
    let highlights = $page.data.highlights;
    sortByDate();
</script>

<div class="grid grid-rows-[auto,1fr]" style="height:100vh;height:100dvh;">
    <div class="navbar">
        <Navbar>
            <!-- <div slot="left-buttons" /> -->
            <label for="sidebar" slot="center">
                <div class="btn btn-ghost normal-case text-xl">{$t['Annotation_Highlights']}</div>
            </label>

            <!-- svelte-ignore a11y-label-has-associated-control -->
            <label slot="right-buttons">
                {@const sortMenu = {
                    actions: [
                        $t['Annotation_Sort_Order_Reference'],
                        $t['Annotation_Sort_Order_Date'],
                        $t['Annotation_Sort_Order_Color']
                    ]
                }}
                <SortMenu on:menuaction={(e) => handleSortAction(e)} {...sortMenu}>
                </SortMenu>
            </label>
            <!-- <div slot="right-buttons" /> -->
        </Navbar>
    </div>

    <div class="overflow-y-auto">
        {#each highlights as h}
            {@const colorCard = {
                collection: h.collection,
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
            <ColorCard on:menuaction={(e) => handleMenuaction(e, h.reference)} {...colorCard} />
        {/each}
    </div>
</div>
