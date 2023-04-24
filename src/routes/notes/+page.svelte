<script lang="ts">
    import IconCard from '$lib/components/IconCard.svelte';
    import { NoteIcon } from '$lib/icons';
    import ScrolledContent from '$lib/components/ScrolledContent.svelte';
    import Navbar from '$lib/components/Navbar.svelte';
    import { t, notes, monoIconColor } from '$lib/data/stores';

    function handleMenuaction(event: CustomEvent, id: string) {
        switch (event.detail.text) {
            case $t['Annotation_Menu_View']:
                console.log('View: ', $notes[id].reference);
                break;
            case $t['Annotation_Menu_Share']:
                console.log('Share: ', $notes[id].reference);
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
            <div class="btn btn-ghost normal-case text-xl">{$t['Annotation_Notes']}</div>
        </label>
        <!-- <div slot="right-buttons" /> -->
    </Navbar>
</div>

<ScrolledContent>
    <div slot="scrolled-content" style="height: calc(100vh - 5rem);height: calc(100dvh - 5rem);">
        {#each $notes as n}
            {@const iconCard = {
                reference: n.reference,
                text: n.text,
                date: n.date,
                actions: [
                    $t['Annotation_Menu_View'],
                    $t['Annotation_Menu_Edit'],
                    $t['Annotation_Menu_Share'],
                    $t['Annotation_Menu_Delete']
                ]
            }}
            <IconCard on:menuaction={(e) => handleMenuaction(e, n.id)} {...iconCard}>
                <NoteIcon slot="icon" color={$monoIconColor} />
            </IconCard>
        {/each}
    </div>
</ScrolledContent>
