<script lang="ts">
    import {
        bodyFontSize,
        convertStyle,
        currentFont,
        language,
        s,
        t,
        themeColors
    } from '$lib/data/stores';
    import SearchResultCard from './SearchResultCard.svelte';
    import type { SearchResult } from '$lib/search/domain/entities';
    import { onMount } from 'svelte';

    export let collection: string;
    export let results: SearchResult[];
    export let queryDone: boolean;
    export let restore: boolean;

    // Changes to signal when to clear results
    export let queryId: number;

    $: showSpinner = !queryDone && results.length === 0;

    let displayQueryId = queryId;
    let resultsShown: SearchResult[] = [];

    $: clearResults(queryId);
    $: results, onResults();
    $: resultCountText = formatResultCount(results.length);

    function onResults() {
        if (restore) {
            restore = false;
            const resultsLength = localStorage.getItem('search-result-display-length');
            loadMore(parseInt(resultsLength, 10));
        }
        ensureScreenFilled();
    }

    function clearResults(query: number) {
        if (query !== displayQueryId) {
            displayQueryId = query;
            resultsShown = [];
        }
    }

    function formatResultCount(count: number): string {
        const format: string = $t['Search_Number_Found'];
        const numberSpecPattern = /%,?d/;
        const spec = format.match(numberSpecPattern);
        if (!spec) {
            return format;
        }
        let numberFound: string;
        if (spec[0].includes(',')) {
            numberFound = Intl.NumberFormat($language).format(count);
        } else {
            numberFound = count.toString();
        }
        return format.replace(numberSpecPattern, numberFound);
    }

    function loadMore(amount: number = 20) {
        resultsShown = results.slice(0, resultsShown.length + amount);
        localStorage.setItem('search-result-display-length', resultsShown.length.toString());
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

<div id="container" class="search-result p-2 max-w-screen-md w-full">
    {#if queryDone && results.length === 0}
        <div class="py-4 flex justify-center">
            <p style:font-family={$currentFont} style:font-size="{$bodyFontSize}px">
                {$t['Search_No_Matches_Found']}
            </p>
        </div>
    {:else if showSpinner}
        <p style={convertStyle($s['ui.search.progress-label'])} style:text-align="center">
            <bdi>{$t['Search_Searching']}</bdi>
        </p>
        <span class="spin" />
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
                <bdi>{$t['Search_Searching']}</bdi>
            {/if}
        </span>
        <span class="mx-4">
            {resultCountText}
        </span>
    </div>
{/if}

<style>
    .spin::before {
        top: 65%;
    }
</style>
