<script lang="ts">
    import IconCard from '$lib/components/IconCard.svelte';
    import { NoteIcon } from '$lib/icons';
    import ScrolledContent from '$lib/components/ScrolledContent.svelte';
    import Navbar from '$lib/components/Navbar.svelte';
    import { t, notes } from '$lib/data/stores';

    let staticnotes = [
        {
            id: '1',
            reference: 'John 1:9',
            text: 'He is the light',
            date: '23 May 2022',
            actions: ['View', 'Edit', 'Share', 'Delete']
        },
        {
            id: '0',
            reference: 'John 1:1',
            text: 'Similar to Genesis 1:1',
            date: '23 May 2022',
            actions: ['View', 'Edit', 'Share', 'Delete']
        }
    ];

    function handleMenuaction(event: CustomEvent, id: string) {
        console.log(event.detail.text + '-' + id);
    }
</script>

<div class="navbar">
    <Navbar>
        <!-- <div slot="left-buttons" /> -->
        <label for="sidebar" slot="center">
            <div class="btn btn-ghost normal-case text-xl">{$t['Annotation_Notes']}</div>
        </label>
        <!-- <div slot="right-buttons" /> -->
    </Navbar>
</div>

<ScrolledContent>
    <div class="larger" slot="scrolled-content">
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
                <NoteIcon slot="icon" />
            </IconCard>
        {/each}
    </div>
</ScrolledContent>

<style>
    .navbar {
        height: 4em;
    }
    .larger {
        height: calc (100vh - 4em);
        height: calc (100dvh - 4em);
    }
</style>
