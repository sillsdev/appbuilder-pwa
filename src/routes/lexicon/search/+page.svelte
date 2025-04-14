<script lang="ts">
    import config from '$lib/data/config';
    import Navbar from '$lib/components/Navbar.svelte';
    import { SearchIcon } from '$lib/icons';
    import { goto } from '$app/navigation';
    import { getRoute } from '$lib/navigate';
    import SearchForm from '$lib/components/SearchForm.svelte';
    import SearchResultList from '$lib/components/SearchResultList.svelte';
    import type { SearchResult } from '$lib/search/domain/entities';
    import type {
        SearchPresenter,
        UserSearchOptions
    } from '$lib/search/domain/interfaces/presentation-interfaces';
    import { makeSearchSession } from '$lib/search/factories';
    import { t, themeColors } from '$lib/data/stores';

    export let data;

    let results: SearchResult[] = [];
    let queryId = 0;
    let queryDone = true;
    let restoreResults = false; // Whether saved results are currently being loaded

    let phrase: string;
    let wholeWords: boolean;
    let matchAccents: boolean;
    //let results: { id: number, weight: number }[] = [];
    
    let scrollDiv;

    // Function to handle search in the service worker
    async function search(event: Event) {
        event.preventDefault();

        const options = {
            wholeWords,
            matchAccents,
        };

        const message = {
            type: 'search',
            phrase: phrase,
            options
        };

        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage(message);
        }
    }

    // Handling results from the service worker
    if (navigator.serviceWorker) {
        navigator.serviceWorker.onmessage = (event) => {
            const message = event.data;
            if (message.type === 'searchResults') {
                results = message.results;
            }
        };
    }
</script>

<!-- <div class="flex flex-col min-h-screen max-h-screen bg-base-100">
    <Navbar>
        {#snippet start()}
            <label for="sidebar" class="navbar">
                <div class="btn btn-ghost normal-case text-xl text-white font-bold pl-1">
                    Search
                </div>
            </label>
        {/snippet}
        {#snippet end()}
                <div class="flex flex-nowrap">
                    <div id="extraButtons">
                        <button
                            class="dy-btn dy-btn-ghost dy-btn-circle"
                            on:click={() => goto(getRoute(`/lexicon/search/`))}
                        >
                            <SearchIcon color="white" />
                        </button>
                    </div>
                </div>
            {/snippet}
    </Navbar>

<div class="search-container">
    <h1>Search Lexicon</h1>
    
    <form on:submit|preventDefault={search}>
        <input 
            type="text" 
            placeholder="Search" 
            bind:value={searchPhrase} 
            required
        />
        <div>
            <label>
                <input type="checkbox" bind:checked={wholeWords} /> Match Whole Words
            </label>
            <label>
                <input type="checkbox" bind:checked={accentsAndTones} /> Match Accents and Tones
            </label>
        </div>
        <button type="submit">Search</button>
    </form>
  
    {#if results.length > 0}
        <ul>
            {#each results as result}
                <li>Id: {result.id} - Weight: {result.weight}</li>
            {/each}
        </ul>
    {:else}
        <p>No results found.</p>
    {/if}
</div>
</div> -->

<div class="grid grid-rows-[auto,1fr,auto]" style="height:100vh;height:100dvh;">
    <Navbar>
        {#snippet start()}
        <label for="sidebar" class="navbar">
            <div class="btn btn-ghost normal-case text-xl text-white font-bold pl-1">
                Search
            </div>
        </label>
    {/snippet}
    {#snippet end()}
            <div class="flex flex-nowrap">
                <div id="extraButtons">
                    <button
                        class="dy-btn dy-btn-ghost dy-btn-circle"
                        on:click={() => goto(getRoute(`/lexicon/search/`))}
                    >
                        <SearchIcon color="white" />
                    </button>
                </div>
            </div>
        {/snippet}
    </Navbar>
    <div class="h-full">

    <div class="flex w-full" style="background-color: var(--TitleBackgroundColor);">
        <div class="py-2 px-6 font-bold text-black text-center relative text-sm flex items-center justify-center w-full h-full">
            Search
        </div>
    </div>


    <div class="overflow-auto" bind:this={scrollDiv}>
        <div class="flex justify-center">
            <SearchForm bind:phrase bind:wholeWords bind:matchAccents />
        </div>

        <div class="flex justify-center px-4">
            <hr class="max-w-screen-md w-full" style:border-color={$themeColors.DividerColor} />
        </div>

        <div class="flex justify-center">
            <SearchResultList
                collection={'test'}
                {results}
                {queryId}
                {queryDone}
                restore={restoreResults}
            />
        </div>
    </div>
</div>
</div>
