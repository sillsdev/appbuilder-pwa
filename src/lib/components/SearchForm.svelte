<script lang="ts">
    import config from '$lib/data/config';
    import { initProskomma, loadDocSetIfNotLoaded } from '$lib/data/scripture';
    import { bodyFontSize, convertStyle, currentFont, s, t, themeColors } from '$lib/data/stores';
    import { SearchIcon } from '$lib/icons';
    import { Search, type SearchResult } from '$lib/scripts/search';
    import SearchResultCard from './SearchResultCard.svelte';

    export let docSet: string;
    export let collection: string;

    let searchText = '';
    let matchWholeWords = config.mainFeatures['search-whole-words-default'] ?? false;
    let searchPromise: Promise<SearchResult[]>;
    let showResults = false;

    const specialCharacters = config.mainFeatures['input-buttons']
        .split(' ')
        .filter((x) => x !== '');

    function submit() {
        showResults = true;
        searchPromise = doSearch();
    }

    async function doSearch(): Promise<SearchResult[]> {
        console.log('starting the search');
        const start = performance.now();

        // Hack to get spinner to show while waiting for search.
        await new Promise((resolve) => setTimeout(resolve, 15));

        const pk = await initProskomma({ fetch });
        await loadDocSetIfNotLoaded(pk, docSet, fetch);

        const search = new Search(searchText, matchWholeWords, docSet, collection);
        const results = await search.makeQuery();

        const end = performance.now();
        console.log(`search finished in ${end - start} ms`);
        return results;
    }

    function waitingText(): string {
        console.log('waiting for search');
        return $t['Search_Searching'];
    }
</script>

<form class="w-full max-w-md p-4">
    <div class="dy-form-control mb-4">
        <label class="dy-input-group w-full flex">
            <!-- svelte-ignore a11y-autofocus -->
            <input
                autofocus
                type="text"
                placeholder={$t['Search']}
                class="flex-grow px-4 py-2 mx-2 dy-input min-w-0 dy-input-bordered"
                style:min-width="0"
                style={convertStyle($s['ui.search.entry-text'])}
                style:background-color={$themeColors.BackgroundColor}
                style:border-color={$themeColors.DividerColor}
                size="1"
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
                <input type="checkbox" class="dy-toggle" bind:checked={matchWholeWords} />
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
    {#if showResults}
        <div class="overflow-y-auto">
            {#await searchPromise}
                <p style={convertStyle($s['ui.search.progress-label'])}>{waitingText()}</p>
                <span class="spin" />
            {:then results}
                {#if results?.length}
                    {#each results as result}
                        <SearchResultCard {result} {collection} {docSet} />
                    {/each}
                {:else}
                    <div class="py-4 flex justify-center">
                        <p style:font-family={$currentFont} style:font-size="{$bodyFontSize}px">
                            {$t['Search_No_Matches_Found']}
                        </p>
                    </div>
                {/if}
            {/await}
        </div>
    {/if}
</form>

<!-- <style>
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
</style> -->
