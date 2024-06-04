<script lang="ts">
    import config from '$lib/data/config';
    import { initProskomma, loadDocSetIfNotLoaded } from '$lib/data/scripture';
    import { bodyFontSize, convertStyle, currentFont, s, t, themeColors } from '$lib/data/stores';
    import { SearchIcon } from '$lib/icons';
    import type { SABProskomma } from '$lib/sab-proskomma';
    import { SearchQuery } from '$lib/scripts/search/adapters';
    import type { SearchResult } from '$lib/scripts/search/entities';
    import { onMount } from 'svelte';
    import SearchResultCard from './SearchResultCard.svelte';

    export let docSet: string;
    export let collection: string;

    let searchText = '';
    let wholeWords = config.mainFeatures['search-whole-words-default'] ?? false;

    let pk: SABProskomma;
    let query: SearchQuery;

    // The number of search results to fetch at a time.
    const batchSize = 10;

    let results: SearchResult[] = [];
    let noResults = false;
    let waiting = false;

    const specialCharacters = config.mainFeatures['input-buttons']
        .split(' ')
        .filter((x) => x !== '');

    async function ensureInitialized() {
        pk = await initProskomma({ fetch });
        await loadDocSetIfNotLoaded(pk, docSet, fetch);
    }

    async function submit() {
        results = [];
        waiting = true;
        await ensureInitialized();

        // Use setTimeout to yeild to the main thread.
        setTimeout(async () => {
            query = new SearchQuery(searchText, pk, docSet, collection, { wholeWords });
            results = await query.getResults(batchSize);
            noResults = results.length === 0;
            waiting = false;
        }, 0);
    }

    async function loadMore() {
        if (!query || query.isComplete) {
            return;
        }
        waiting = true;
        await ensureInitialized();

        // Use setTimeout to yeild to the main thread.
        setTimeout(async () => {
            const newResults = await query.getResults(batchSize);
            results = results.concat(newResults);
            waiting = false;
        }, 50); // Without this delay, waiting text did not show.
    }

    function waitingText(): string {
        console.log('waiting for search');
        return $t['Search_Searching'];
    }

    onMount(ensureInitialized);

    // Intersection Observer callback
    function handleIntersect(entries) {
        if (entries[0].isIntersecting && !waiting) {
            loadMore();
        }
    }

    // Load more results when the user scrolls to the bottom of the list;
    onMount(() => {
        const observer = new IntersectionObserver(handleIntersect, {
            root: null,
            rootMargin: '0px',
            threshold: 1.0
        });

        const sentinel = document.querySelector('#sentinel');
        if (sentinel) {
            observer.observe(sentinel);
        }

        return () => {
            if (sentinel) {
                observer.unobserve(sentinel);
            }
        };
    });
</script>

<form class="w-full max-w-md p-4">
    <div class="dy-form-control mb-4">
        <label class="dy-input-group w-full flex">
            <input
                id="searchbar"
                readonly={waiting}
                type="text"
                placeholder={$t['Search']}
                class="flex-grow px-4 py-2 mx-2 dy-input min-w-0 dy-input-bordered"
                style:min-width="0"
                style={convertStyle($s['ui.search.entry-text'])}
                style:background-color={$themeColors.BackgroundColor}
                style:border-color={$themeColors.DividerColor}
                size="1"
                inputmode="search"
                enterkeyhint="search"
                bind:value={searchText}
            />
            <button
                on:click|preventDefault={submit}
                class="dy-btn mx-2 flex-none bg-gray-200"
                style={convertStyle($s['ui.search.button'])}
                style:border-color={$themeColors.DividerColor}
            >
                <SearchIcon color={$themeColors.SearchButtonTextColor} />
            </button>
        </label>
    </div>
    {#if config.mainFeatures['search-whole-words-show']}
        <div class="dy-form-control max-w-xs m-4">
            <label class="dy-label cursor-pointer">
                <span class="dy-label-text" style={convertStyle($s['ui.search.checkbox'])}
                    >{$t['Search_Match_Whole_Words']}</span
                >
                <input type="checkbox" class="dy-toggle" bind:checked={wholeWords} />
            </label>
        </div>
    {/if}
    <!-- Not fully implemented -->
    <!-- {#if config.mainFeatures['search-input-buttons'] && specialCharacters.length > 0} -->
    <!--     <div class="dy-form-control"> -->
    <!--         <div class="cursor-pointer"> -->
    <!--             <div class="">Special characters</div> -->
    <!--             <div class="special-characters"> -->
    <!--                 {#each specialCharacters as character} -->
    <!--                     <div -->
    <!--                         class="special-character bg-primary" -->
    <!--                         on:click={() => (searchText += character)} -->
    <!--                     > -->
    <!--                         {character} -->
    <!--                     </div> -->
    <!--                 {/each} -->
    <!--             </div> -->
    <!--         </div> -->
    <!--     </div> -->
    <!-- {/if} -->
    <hr style:border-color={$themeColors.DividerColor} />
    <div class="container">
        {#if noResults}
            <div class="py-4 flex justify-center">
                <p style:font-family={$currentFont} style:font-size="{$bodyFontSize}px">
                    {$t['Search_No_Matches_Found']}
                </p>
            </div>
        {:else}
            {#each results as result}
                <SearchResultCard {result} {collection} {docSet} />
            {/each}
        {/if}
        {#if waiting}
            <p
                class="m-8"
                style={convertStyle($s['ui.search.progress-label'])}
                style:text-align="center"
            >
                {waitingText()}
            </p>
            {#if results.length === 0}
                <span class="spin" />
            {/if}
        {/if}
        <div id="sentinel" style="height: 1px;"></div>
    </div>
</form>

<style>
    .special-characters {
        justify-content: start;
        /* For a scrolling view instead of rows */
        /* overflow-x: scroll;
    white-space: nowrap;
    height: 2.5em; */
    }
    .special-character {
        width: 1.5em;
        height: 1.5em;
        text-align: center;
        margin: 5px;
        border-radius: 5px;
        display: inline-block;
        user-select: none;
    }

    .spin::before {
        position: fixed;
    }
</style>
