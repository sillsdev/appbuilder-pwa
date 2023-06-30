<script lang="ts">
    import IconCard from '$lib/components/IconCard.svelte';
    import { BookmarkIcon } from '$lib/icons';
    import Navbar from '$lib/components/Navbar.svelte';
    import { t } from '$lib/data/stores';
    import { formatDate } from '$lib/scripts/dateUtils.js';

    function handleMenuaction(event: CustomEvent, id: string) {
        switch (event.detail.text) {
            case $t['Annotation_Menu_View']:
                console.log('View: ', data.bookmarks[id].reference);
                break;
            case $t['Annotation_Menu_Share']:
                console.log('Share: ', data.bookmarks[id].reference);
                break;
            case $t['Annotation_Menu_Delete']:
                console.log('Delete: ', id);
                break;
        }
    }

    export let data;
</script>

<div class="grid grid-rows-[auto,1fr]" style="height:100vh;height:100dvh;">
    <div class="navbar h-16">
        <Navbar>
            <!-- <div slot="left-buttons" /> -->
            <label for="sidebar" slot="center">
                <div class="btn btn-ghost normal-case text-xl">{$t['Annotation_Bookmarks']}</div>
            </label>
            <!-- <div slot="right-buttons" /> -->
        </Navbar>
    </div>

    <div class="overflow-y-auto">
        {#each data.bookmarks as b}
            {@const iconCard = {
                reference: b.reference,
                text: b.text,
                date: formatDate(new Date(b.date)),
                actions: [
                    $t['Annotation_Menu_View'],
                    $t['Annotation_Menu_Share'],
                    $t['Annotation_Menu_Delete']
                ]
            }}
            <IconCard on:menuaction={(e) => handleMenuaction(e, b.reference)} {...iconCard}>
                <BookmarkIcon slot="icon" color="red" />
            </IconCard>
        {/each}
    </div>
</div>
