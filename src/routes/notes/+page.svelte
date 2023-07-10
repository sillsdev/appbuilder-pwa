<script lang="ts">
    import IconCard from '$lib/components/IconCard.svelte';
    import { NoteIcon } from '$lib/icons';
    import Navbar from '$lib/components/Navbar.svelte';
    import { t, notes, monoIconColor } from '$lib/data/stores';
    import { formatDate } from '$lib/scripts/dateUtils.js';

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

    export let data;
</script>

<div class="grid grid-rows-[auto,1fr]" style="height:100vh;height:100dvh;">
    <div class="navbar">
        <Navbar>
            <!-- <div slot="left-buttons" /> -->
            <label for="sidebar" slot="center">
                <div class="btn btn-ghost normal-case text-xl">{$t['Annotation_Notes']}</div>
            </label>
            <!-- <div slot="right-buttons" /> -->
        </Navbar>
    </div>

    <div class="overflow-y-auto">
        {#each data.notes as n}
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
