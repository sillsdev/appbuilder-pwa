<script lang="ts">
    import HistoryCard from '$lib/components/HistoryCard.svelte';
    import ScrolledContent from '$lib/components/ScrolledContent.svelte';
    import '../../tailwind.css';
    import Navbar from '$lib/components/Navbar.svelte';
    import { HamburgerIcon } from '$lib/icons';
    import { viewMode } from '$lib/data/stores';
    let drawerName = 'sidebar';
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
            <div class="btn btn-ghost normal-case text-xl">History</div>
        </label>
        <label for={drawerName} slot="right-buttons" />
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
        height: 10vh;
    }
    .larger {
        height: 90vh;
    }
</style>
