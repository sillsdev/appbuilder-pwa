<script lang="ts">
    import config from '$lib/data/config';
    import {
        bodyFontSize,
        convertStyle,
        currentFont,
        language,
        s,
        t,
        themeColors
    } from '$lib/data/stores';
    import { SearchIcon } from '$lib/icons';
    import SearchResultCard from './SearchResultCard.svelte';
    import { get } from 'svelte/store';
    import type { SearchResult } from '$lib/search/domain/entities';
    import type { UserSearchRequest } from '$lib/search/domain/interfaces/presentation-interfaces';
    import SearchWorker from '$lib/search/search-worker?worker';

    export let collection: string;

    let searchText = '';
    let wholeWords = config.mainFeatures['search-whole-words-default'] ?? false;

    let results: SearchResult[] = [];
    let noResults = false;
    let waiting = false;

    const worker = new SearchWorker();

    worker.onmessage = function (e: MessageEvent) {
        const message = e.data;
        if (e.data.type === 'results') {
            waiting = false;
            results = results.concat(e.data.value);
            noResults = results.length === 0;
        } else if (e.data.type === 'newQuery') {
            results = [];
            noResults = false;
            waiting = true;
        }
    };

    async function submit() {
        const message: UserSearchRequest = {
            phrase: searchText,
            options: {
                collection,
                wholeWords,
                matchAccents: false,
                locale: get(language)
            }
        };
        worker.postMessage(message);
    }
</script>

<form class="w-full max-w-screen-md p-4">
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
    <div id="container" class="search-result py-2">
        {#if noResults && !waiting}
            <div class="py-4 flex justify-center">
                <p style:font-family={$currentFont} style:font-size="{$bodyFontSize}px">
                    {$t['Search_No_Matches_Found']}
                </p>
            </div>
        {:else}
            {#each results as result}
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
            {#if results.length === 0}
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
