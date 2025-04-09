<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import config from '$lib/data/config';

    let searchPhrase = '';
    let wholeWords = false;
    let accentsAndTones = false;
    let results: { id: number, weight: number }[] = [];


    function getRoute(path: string): string {
        return path;
    }

    async function goToSearch() {
        if (config.programType === 'DAB') {
            await (getRoute('/search/lexicon'));
        } else {
            await (getRoute(`/search/${searchPhrase}`));
        }
    }

    // On mount
    onMount(async () => {
        if (config.programType === 'DAB') {
            await (getRoute('/lexicon'));
            return;
        }
    });

    // Function to handle search in the service worker
    async function search(event: Event) {
        event.preventDefault();
        await goToSearch();

        const options = {
            wholeWords,
            accentsAndTones,
        };

        const message = {
            type: 'search',
            phrase: searchPhrase,
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
