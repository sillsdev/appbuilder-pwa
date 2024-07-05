<script lang="ts">
    import { bodyFontSize, convertStyle, currentFont, s, t, themeColors } from '$lib/data/stores';
    import SearchResultCard from './SearchResultCard.svelte';
    import type { SearchResult } from '$lib/search/domain/entities';
    import { onMount } from 'svelte';

    export let collection: string;
    export let results: SearchResult[];
    export let queryDone: boolean;

    // Changes to signal when to clear results
    export let queryId: number;

    // Initially, the results list is blank
    let blankScreen = true;

    $: showSpinner = !blankScreen && !queryDone && results.length === 0;

    let displayQueryId = queryId;
    let resultsShown: SearchResult[] = [];

    $: clearResults(queryId);
    $: results, ensureScreenFilled();

    function clearResults(query: number) {
        blankScreen = false;
        if (query !== displayQueryId) {
            displayQueryId = query;
            resultsShown = [];
        }
    }

    function loadMore() {
        resultsShown = results.slice(0, resultsShown.length + 20);
    }

    function onScrollToLast(entries) {
        if (entries[0].isIntersecting && !showSpinner) {
            loadMore();
            ensureScreenFilled();
        }
    }

    function ensureScreenFilled() {
        if (results.length === 0 || results.length === resultsShown.length) {
            return;
        }
        const sentinel = document.querySelector('#sentinel');
        const sentinelObserver = new IntersectionObserver(
            (entries) => {
                if (!entries[0].isIntersecting) {
                    sentinelObserver.disconnect();
                } else {
                    loadMore();
                    ensureScreenFilled();
                }
            },
            {
                root: null,
                rootMargin: '0px',
                threshold: 0.1
            }
        );

        sentinelObserver.observe(sentinel);
    }

    // Load more results when the user scrolls to the bottom of the list;
    onMount(() => {
        const observer = new IntersectionObserver(onScrollToLast, {
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

<div id="container" class="search-result py-2 max-w-screen-md">
    {#if queryDone && results.length === 0}
        <div class="py-4 flex justify-center">
            <p style:font-family={$currentFont} style:font-size="{$bodyFontSize}px">
                {$t['Search_No_Matches_Found']}
            </p>
        </div>
    {:else if showSpinner}
        <p style={convertStyle($s['ui.search.progress-label'])} style:text-align="center">
            {$t['Search_Searching']}
        </p>
        {#if resultsShown.length === 0}
            <span class="spin" />
        {/if}
    {:else}
        {#each resultsShown as result}
            <SearchResultCard {result} {collection} docSet={result.reference.docSet} />
        {/each}
        <div class="py-4" />
    {/if}
    <div id="sentinel" style="height: 1px;"></div>
</div>

{#if results.length}
    <div
        class="fixed bottom-0 w-full max-w-screen-md flex justify-between shadow-lg"
        style="box-shadow: 0 -4px 6px -1px rgba(0, 0, 0, 0.1), 0 -2px 4px -2px rgba(0, 0, 0, 0.1);"
        style:background-color={$themeColors.BackgroundColor}
    >
        <span class="mx-4">
            {#if !queryDone}
                Searching...
            {/if}
        </span>
        <span class="mx-4">
            Found: {results.length}
        </span>
    </div>
{/if}

<style>
    /*
    .special-characters {
        justify-content: start;
        /* For a scrolling view instead of rows */
    /* overflow-x: scroll;
    white-space: nowrap;
    height: 2.5em; */
    /*
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
    */

    .spin::before {
        position: fixed;
    }
</style>
