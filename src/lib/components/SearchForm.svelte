<script lang="ts">
    import config from '$lib/data/config';
    import { bodyFontSize, convertStyle, currentFont, s, t, themeColors } from '$lib/data/stores';
    import { SearchIcon } from '$lib/icons';
    import SearchResultCard from './SearchResultCard.svelte';
    import type { SearchResult } from '$lib/search/domain/entities';
    import type { SearchPresenter } from '$lib/search/domain/interfaces/presentation-interfaces';
    import { makeSearchConfigManager, makeSearchSession } from '$lib/search/factories';
    import { onMount } from 'svelte';
    export let collection: string;

    let searchText = '';
    let wholeWords = config.mainFeatures['search-whole-words-default'] ?? false;

    let results: SearchResult[] = [];
    let resultsShown: SearchResult[] = [];
    let noResults = false;
    let waiting = false;
    let dismissSearchBar = false;

    const presenter: SearchPresenter = {
        onResults: function (newResults: SearchResult[]): void {
            waiting = false;
            results = results.concat(newResults);
            noResults = results.length === 0;
            ensureScreenFilled();
        },
        onNewQuery: function (): void {
            results = [];
            resultsShown = [];
            noResults = false;
            waiting = true;
        }
    };

    const configManager = makeSearchConfigManager();
    const session = makeSearchSession(presenter);

    async function submit() {
        const options = configManager.configureOptions({
            collection,
            wholeWords,
            matchAccents: false
        });
        session.submit(searchText, options);

        // Dismiss the search bar by disabling it.
        // Then re-enable the search bar to allow the user to modify the query.
        dismissSearchBar = true;
        setTimeout(() => {
            dismissSearchBar = false;
        }, 50);
    }

    function loadMore() {
        resultsShown = results.slice(0, resultsShown.length + 4);
    }

    function onScrollToLast(entries) {
        if (entries[0].isIntersecting && !waiting) {
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

<form class="w-full max-w-screen-md p-4">
    <div class="dy-form-control mb-4">
        <label class="dy-input-group w-full flex">
            <input
                id="searchbar"
                readonly={dismissSearchBar}
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
    <div id="container" class="search-result py-2">
        {#if noResults && !waiting}
            <div class="py-4 flex justify-center">
                <p style:font-family={$currentFont} style:font-size="{$bodyFontSize}px">
                    {$t['Search_No_Matches_Found']}
                </p>
            </div>
        {:else}
            {#each resultsShown as result}
                <SearchResultCard {result} {collection} docSet={result.reference.docSet} />
            {/each}
        {/if}
        {#if waiting}
            <p
                class="m-4"
                style={convertStyle($s['ui.search.progress-label'])}
                style:text-align="center"
            >
                {$t['Search_Searching']}
            </p>
            {#if resultsShown.length === 0}
                <span class="spin" />
            {/if}
        {/if}
        <div id="sentinel" style="height: 1px;"></div>
    </div>
</form>

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
