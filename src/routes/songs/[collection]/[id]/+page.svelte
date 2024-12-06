<script>
    import { page } from '$app/stores';
    import Navbar from '$lib/components/Navbar.svelte';
    import SongCard from '$lib/components/SongCard.svelte';
    import { s, t, convertStyle } from '$lib/data/stores';

    const { collection, book, songs } = $page.data;

    let selectedTab = 'number';
</script>

<div class="grid grid-rows-[auto,1fr]" style="height:100vh;height:100dvh;">
    <div class="navbar">
        <Navbar>
            <!-- <div slot="left-buttons" /> -->
            <!-- <label for="sidebar" slot="center">
                <div class="btn btn-ghost normal-case text-xl">{$t['Menu_Plans']}</div>
            </label> -->
            <!-- <div slot="right-buttons" class="flex items-center"> -->
        </Navbar>
    </div>

    <div class="overflow-y-auto mx-auto max-w-screen-md w-full">
        <div
            role="tablist"
            class="dy-tabs dy-tabs-bordered"
            style={convertStyle($s['ui.song.tabs'])}
        >
            <input
                type="radio"
                name="songs"
                role="tab"
                class="dy-tab dy-tab-bordered {selectedTab === 'number' ? 'dy-tab-active' : ''}"
                on:click={() => (selectedTab = 'number')}
                aria-label={$t['Song_List_By_Number']}
                style={convertStyle($s['ui.song.number'])}
            />
            <input
                type="radio"
                name="songs"
                role="tab"
                class="dy-tab dy-tab-bordered {selectedTab === 'title' ? 'dy-tab-active' : ''}"
                on:click={() => (selectedTab = 'title')}
                aria-label={$t['Song_List_By_Title']}
                style={convertStyle($s['ui.song.title'])}
            />
        </div>

        <div id="container" class="song-list">
            {#if selectedTab === 'number'}
                {#each songs.byNumber as song}
                    <SongCard id={song.id} title={song.title} />
                {/each}
            {:else if selectedTab === 'title'}
                {#each songs.byTitle as song}
                    <SongCard id={song.id} title={song.title} />
                {/each}
            {/if}
        </div>
    </div>
</div>
