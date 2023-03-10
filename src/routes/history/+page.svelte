<script lang="ts">
    import HistoryCard from '$lib/components/HistoryCard.svelte';
    import ScrolledContent from '$lib/components/ScrolledContent.svelte';
    import Navbar from '$lib/components/Navbar.svelte';
    import { t } from '$lib/data/stores';
    let history = [
        { book: 'World English Bible', reference: 'Genesis 1', date: 'Today | 14:49' },
        { book: 'World English Bible', reference: 'Genesis 1:1', date: 'Today | 14:48' },
        { book: 'World English Bible', reference: 'John 1', date: 'Today | 11:09' },
        { book: 'World English Bible', reference: 'John 1:7', date: 'Today | 10:03' },
        { book: 'World English Bible', reference: 'John 1', date: 'Today | 09:48' },
        { book: 'World English Bible', reference: 'John 1:5', date: 'Today | 09:48' },
        { book: 'World English Bible', reference: 'John 1:1', date: 'Today | 09:46' },
        { book: 'World English Bible', reference: 'John 1', date: 'Today | 09:45' },
        { book: 'World English Bible', reference: 'John 1:3', date: 'Today | 09:43' },
        { book: 'World English Bible', reference: 'John 1', date: 'Today | 09:43' },
        { book: 'World English Bible', reference: 'John 1:3', date: 'Today | 09:42' },
        { book: 'World English Bible', reference: 'John 1', date: 'Yesterday | 15:36' },
        { book: 'World English Bible', reference: 'John 1:3', date: 'Yesterday | 15:30' },
        { book: 'World English Bible', reference: 'John 1', date: '22 May 2022 | 13:48' },
        { book: 'World Messianic Bible', reference: 'Yochanan 1', date: '22 May 2022 | 13:42' },
        { book: 'World English Bible', reference: 'John 1', date: '22 May 2022 | 13:39' }
    ];
</script>

<div class="navbar">
    <Navbar>
        <!-- Button to close the drawer/sidebar -->
        <!-- <div slot="left-buttons" /> -->
        <label for="sidebar" slot="center">
            <div class="btn btn-ghost normal-case text-xl">{$t['Menu_History']}</div>
        </label>
        <!-- <div slot="right-buttons" /> -->
    </Navbar>
</div>

<ScrolledContent>
    <div class="larger" slot="scrolled-content">
        {#each history as h}
            <HistoryCard {...h} />
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
