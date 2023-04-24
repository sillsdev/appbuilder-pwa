<script lang="ts">
    import ColorCard from '$lib/components/ColorCard.svelte';
    import Navbar from '$lib/components/Navbar.svelte';
    import ScrolledContent from '$lib/components/ScrolledContent.svelte';
    import { t, highlights } from '$lib/data/stores';

    function handleMenuaction(event: CustomEvent, id: string) {
        switch (event.detail.text) {
            case $t['Annotation_Menu_View']:
                console.log('View: ', $highlights[id].reference);
                break;
            case $t['Annotation_Menu_Share']:
                console.log('Share: ', $highlights[id].reference);
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
            <div class="btn btn-ghost normal-case text-xl">{$t['Annotation_Highlights']}</div>
        </label>
        <!-- <div slot="right-buttons" /> -->
    </Navbar>
</div>

<ScrolledContent>
    <div slot="scrolled-content" style="height: calc(100vh - 5rem);height: calc(100dvh -5rem);">
        {#each $highlights as h}
            {@const colorCard = {
                reference: h.reference,
                text: h.text,
                date: h.date,
                actions: [
                    $t['Annotation_Menu_View'],
                    $t['Annotation_Menu_Share'],
                    $t['Annotation_Menu_Delete']
                ],
                penColor: h.penColor
            }}
            <ColorCard on:menuaction={(e) => handleMenuaction(e, h.id)} {...colorCard} />
        {/each}
    </div>
</ScrolledContent>
