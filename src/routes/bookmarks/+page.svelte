<script lang="ts">
    import IconCard from '$lib/components/IconCard.svelte';
    import { BookmarkIcon } from '$lib/icons';
    import Navbar from '$lib/components/Navbar.svelte';
    import ScrolledContent from '$lib/components/ScrolledContent.svelte';
    import { t, bookmarks } from '$lib/data/stores';

    function handleMenuaction(event: CustomEvent, id: string) {
        switch (event.detail.text) {
            case $t['Annotation_Menu_View']:
                console.log('View: ', $bookmarks[id].reference);
                break;
            case $t['Annotation_Menu_Share']:
                console.log('Share: ', $bookmarks[id].reference);
                break;
            case $t['Annotation_Menu_Delete']:
                console.log('Delete: ', id);
                break;
        }
    }
</script>

<div class="navbar h-16">
    <Navbar>
        <!-- <div slot="left-buttons" /> -->
        <label for="sidebar" slot="center">
            <div class="btn btn-ghost normal-case text-xl">{$t['Annotation_Bookmarks']}</div>
        </label>
        <!-- <div slot="right-buttons" /> -->
    </Navbar>
</div>

<ScrolledContent>
    <div slot="scrolled-content" style="height: calc(100vh - 5rem);height: calc(100dvh - 5rem);">
        {#each $bookmarks as b}
            {@const iconCard = {
                reference: b.reference,
                text: b.text,
                date: b.date,
                actions: [
                    $t['Annotation_Menu_View'],
                    $t['Annotation_Menu_Share'],
                    $t['Annotation_Menu_Delete']
                ]
            }}
            <IconCard on:menuaction={(e) => handleMenuaction(e, b.id)} {...iconCard}>
                <BookmarkIcon slot="icon" color="red" />
            </IconCard>
        {/each}
    </div>
</ScrolledContent>
