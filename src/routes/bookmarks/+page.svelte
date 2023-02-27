<script lang="ts">
    import IconCard from '$lib/components/IconCard.svelte';
    import { BookmarkIcon } from '$lib/icons';
    import Navbar from '$lib/components/Navbar.svelte';
    import ScrolledContent from '$lib/components/ScrolledContent.svelte';
    import { t, bookmarks } from '$lib/data/stores';
    let staticbookmarks = [
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
        <!-- <div slot="left-buttons" /> -->
        <label for="sidebar" slot="center">
            <div class="btn btn-ghost normal-case text-xl">{$t['Annotation_Bookmarks']}</div>
        </label>
        <!-- <div slot="right-buttons" /> -->
    </Navbar>
</div>

<ScrolledContent>
    <div class="larger" slot="scrolled-content">
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

<style>
    .navbar {
        height: 10vh;
    }
    .larger {
        height: 90vh;
    }
</style>
