<script lang="ts">
    import IconCard from '$lib/components/IconCard.svelte';
    import { NoteIcon } from '$lib/icons';
    import ScrolledContent from '$lib/components/ScrolledContent.svelte';
    import '../../tailwind.css';
    import Navbar from '$lib/components/Navbar.svelte';
    import { HamburgerIcon } from '$lib/icons';
    import { viewMode } from '$lib/data/stores';
    let drawerName = 'sidebar';
    let notes = [
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
        <!-- Button to close the drawer/sidebar -->
        <label
            for={drawerName}
            slot="drawer-button"
            class="dy-btn dy-btn-ghost p-1 dy-drawer-button {$viewMode === 'Side By Side'
                ? ''
                : 'lg:hidden'}"
        >
            <HamburgerIcon />
        </label>
        <label
            for={drawerName}
            slot="left-buttons"
        >

        </label>
        <label
            for={drawerName}
            slot="center"
            >
            <div class="btn btn-ghost normal-case text-xl">Notes</div>
        </label>
        <label
            for={drawerName}
            slot="right-buttons"
        >

        </label>
    </Navbar>
</div>

<ScrolledContent>
    <div class="larger" slot="scrolled-content">
        {#each notes as n}
            {  @const iconCard = {
                reference: n.reference,
                text: n.text,
                date: n.date,
                actions: n.actions,
               }
            }
            <IconCard on:menuaction={(e) => handleMenuaction(e, n.id)} {...iconCard}>
                <NoteIcon slot="icon" />
            </IconCard>
        {/each}
    </div>
</ScrolledContent>
<style>
    .navbar {
        height: 10vh;
    }
    .larger {
        height: 90vh;

    }
</style>
