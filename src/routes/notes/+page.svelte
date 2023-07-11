<script lang="ts">
    import IconCard from '$lib/components/IconCard.svelte';
    import SortMenu from '$lib/components/SortMenu.svelte';
    import { NoteIcon } from '$lib/icons';
    import Navbar from '$lib/components/Navbar.svelte';
    import { t, monoIconColor } from '$lib/data/stores';
    import { formatDate } from '$lib/scripts/dateUtils.js';
    import { page } from '$app/stores';

    function handleMenuaction(event: CustomEvent, id: string) {
        switch (event.detail.text) {
            case $t['Annotation_Menu_View']:
                console.log('View: ', notes[id].reference);
                break;
            case $t['Annotation_Menu_Share']:
                console.log('Share: ', notes[id].reference);
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
        notes.sort((a, b) => {
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

        notes = notes
    }

    function sortByDate() {
        notes.sort((a, b) => {
            if (a.date < b.date) {
                return 1;
            }
            else {
                return -1;
            }
        })

        notes = notes;
    }
    
    let notes = $page.data.notes;
    sortByDate();
</script>

<div class="grid grid-rows-[auto,1fr]" style="height:100vh;height:100dvh;">
    <div class="navbar h-16">
        <Navbar>
            <!-- <div slot="left-buttons" /> -->
            <label for="sidebar" slot="center">
                <div class="btn btn-ghost normal-case text-xl">{$t['Annotation_Notes']}</div>
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

    <div class="overflow-y-auto">
        {#each notes as n}
            {@const iconCard = {
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
            <IconCard on:menuaction={(e) => handleMenuaction(e, n.reference)} {...iconCard}>
                <NoteIcon slot="icon" color={$monoIconColor} />
            </IconCard>
        {/each}
    </div>
</div>
