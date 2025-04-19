<script lang="ts">
    import { goto } from '$app/navigation';
    import Navbar from '$lib/components/Navbar.svelte';
    import SearchForm from '$lib/components/SearchForm.svelte';
    import SearchResultList from '$lib/components/SearchResultList.svelte';
    import config from '$lib/data/config';
    import { t, themeColors } from '$lib/data/stores';
    import { SearchIcon } from '$lib/icons';
    import { getRoute } from '$lib/navigate';
    import type { SearchResult } from '$lib/search/domain/entities';
    import type {
        SearchPresenter,
        UserSearchOptions
    } from '$lib/search/domain/interfaces/presentation-interfaces';
    import { makeSearchSession } from '$lib/search/factories';
    import { onMount } from 'svelte';

    export let data;

    let results: SearchResult[] = [];
    let queryId = 0;
    let queryDone = true;
    let restoreResults = false; // Whether saved results are currently being loaded

    let phrase: string = '';
    let wholeWords: boolean = false;
    let matchAccents: boolean = false;

    let scrollDiv;
    let serviceWorkerRegistered = false;

    // Register and setup the service worker
    onMount(async () => {
        if ('serviceWorker' in navigator) {
            try {
                // Register the dictionary search service worker
                const registration =
                    await navigator.serviceWorker.register('/dab-search-worker.js');
                console.log('Service worker registered:', registration);
                serviceWorkerRegistered = true;

                // Wait for the service worker to be active
                if (registration.installing) {
                    registration.installing.addEventListener('statechange', (e) => {
                        // Fix: properly type the event target as ServiceWorker
                        const serviceWorker = e.target as ServiceWorker;
                        if (serviceWorker.state === 'activated') {
                            console.log('Service worker activated');
                        }
                    });
                }

                // Check for existing controller
                if (!navigator.serviceWorker.controller) {
                    console.log('No active service worker controller yet. Waiting...');
                    // This page will be controlled by the service worker after reload
                }

                // Set up message handler for results
                navigator.serviceWorker.addEventListener('message', (event) => {
                    const message = event.data;
                    if (message.type === 'searchResults') {
                        results = message.results;
                        queryDone = true;
                    } else if (message.type === 'searchError') {
                        console.error('Search error:', message.error);
                        queryDone = true;
                    }
                });

                // Try to restore previous search if it exists
                const savedPhrase = localStorage.getItem('search-phrase');
                if (savedPhrase) {
                    phrase = savedPhrase;
                    wholeWords = localStorage.getItem('search-whole-words') === 'true';
                    matchAccents = localStorage.getItem('search-match-accents') === 'true';
                    // Will perform search after service worker is ready
                    restoreResults = true;
                }
            } catch (error) {
                console.error('Service worker registration failed:', error);
            }
        } else {
            console.warn('Service workers not supported in this browser');
        }
    });

    function performSearch() {
        queryDone = false;
        queryId++;
        results = [];

        // Save search parameters
        localStorage.setItem('search-phrase', phrase);
        localStorage.setItem('search-whole-words', wholeWords.toString());
        localStorage.setItem('search-match-accents', matchAccents.toString());

        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            // Send search request to service worker
            navigator.serviceWorker.controller.postMessage({
                type: 'search',
                phrase: phrase,
                options: {
                    wholeWords,
                    matchAccents
                }
            });
        } else {
            console.error('Service worker not available or not controlling the page');
            queryDone = true;
        }
    }

    // Handle form submission from SearchForm component
    function handleSearchSubmit(event) {
        const {
            phrase: newPhrase,
            wholeWords: newWholeWords,
            matchAccents: newMatchAccents
        } = event.detail;
        phrase = newPhrase;
        wholeWords = newWholeWords;
        matchAccents = newMatchAccents;
        performSearch();
    }
</script>

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
                        on:click={() => goto(getRoute(`/lexicon/`))}
                    >
                        <SearchIcon color="white" />
                    </button>
                </div>
            </div>
        {/snippet}
    </Navbar>
    <div class="h-full">
        <div class="flex w-full" style="background-color: var(--TitleBackgroundColor);">
            <div
                class="py-2 px-6 font-bold text-black text-center relative text-sm flex items-center justify-center w-full h-full"
            >
                Search Dictionary
            </div>
        </div>

        <div class="overflow-auto" bind:this={scrollDiv}>
            <div class="flex justify-center">
                <SearchForm
                    bind:phrase
                    bind:wholeWords
                    bind:matchAccents
                    on:submit={handleSearchSubmit}
                />
            </div>

            <div class="flex justify-center px-4">
                <hr class="max-w-screen-md w-full" style:border-color={$themeColors.DividerColor} />
            </div>

            <div class="flex justify-center">
                <SearchResultList
                    collection={'lexicon'}
                    {results}
                    {queryId}
                    {queryDone}
                    restore={restoreResults}
                />
            </div>
        </div>
    </div>
</div>
