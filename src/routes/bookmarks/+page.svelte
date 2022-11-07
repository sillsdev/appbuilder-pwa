<script lang="ts">
    import IconCard from '$lib/components/IconCard.svelte';
    import { BookmarkIcon } from '$lib/icons';
    import '../../tailwind.css';
    import Navbar from '$lib/components/Navbar.svelte';
    import { HamburgerIcon } from '$lib/icons';
    import { viewMode } from '$lib/data/stores';
    import ScrolledContent from '$lib/components/ScrolledContent.svelte';
    let drawerName = 'sidebar';
    let bookmarks = [
        {
            id: '1',
            reference: 'John 1:5',
            text: "The light shines in the darkness and the darkness hasn't overcome it.",
            date: '22 May 2022',
            actions: ['View', 'Share', 'Delete']
        },
        {
            id: '0',
            reference: 'John 1:1',
            text: 'In the beginning was the Word, and the Word was with God, and the Word was God.',
            date: '21 May 2022',
            actions: ['View', 'Share', 'Delete']
        },
        {
            id: '2',
            reference: 'John 1:5',
            text: "The light shines in the darkness and the darkness hasn't overcome it.",
            date: '22 May 2022',
            actions: ['View', 'Share', 'Delete']
        },
        {
            id: '3',
            reference: 'John 1:1',
            text: 'In the beginning was the Word, and the Word was with God, and the Word was God.',
            date: '21 May 2022',
            actions: ['View', 'Share', 'Delete']
        },
        {
            id: '4',
            reference: 'John 1:5',
            text: "The light shines in the darkness and the darkness hasn't overcome it.",
            date: '22 May 2022',
            actions: ['View', 'Share', 'Delete']
        },
        {
            id: '5',
            reference: 'John 1:1',
            text: 'In the beginning was the Word, and the Word was with God, and the Word was God.',
            date: '21 May 2022',
            actions: ['View', 'Share', 'Delete']
        },
        {
            id: '6',
            reference: 'John 1:5',
            text: "The light shines in the darkness and the darkness hasn't overcome it.",
            date: '22 May 2022',
            actions: ['View', 'Share', 'Delete']
        },
        {
            id: '7',
            reference: 'John 1:1',
            text: 'In the beginning was the Word, and the Word was with God, and the Word was God.',
            date: '21 May 2022',
            actions: ['View', 'Share', 'Delete']
        },
        {
            id: '8',
            reference: 'John 1:5',
            text: "The light shines in the darkness and the darkness hasn't overcome it.",
            date: '22 May 2022',
            actions: ['View', 'Share', 'Delete']
        },
        {
            id: '9',
            reference: 'John 1:1',
            text: 'In the beginning was the Word, and the Word was with God, and the Word was God.',
            date: '21 May 2022',
            actions: ['View', 'Share', 'Delete']
        },
        {
            id: '10',
            reference: 'John 1:5',
            text: "The light shines in the darkness and the darkness hasn't overcome it.",
            date: '22 May 2022',
            actions: ['View', 'Share', 'Delete']
        },
        {
            id: '11',
            reference: 'John 1:1',
            text: 'In the beginning was the Word, and the Word was with God, and the Word was God.',
            date: '21 May 2022',
            actions: ['View', 'Share', 'Delete']
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
        <label for={drawerName} slot="left-buttons" />
        <label for={drawerName} slot="center">
            <div class="btn btn-ghost normal-case text-xl">Bookmarks</div>
        </label>
        <label for={drawerName} slot="right-buttons" />
    </Navbar>
</div>

<ScrolledContent>
    <div class="larger" slot="scrolled-content">
        {#each bookmarks as b}
            {@const iconCard = {
                reference: b.reference,
                text: b.text,
                date: b.date,
                actions: b.actions
            }}
            <IconCard on:menuaction={(e) => handleMenuaction(e, b.id)} {...iconCard}>
                <BookmarkIcon slot="icon" _class="fill-red-700" />
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
