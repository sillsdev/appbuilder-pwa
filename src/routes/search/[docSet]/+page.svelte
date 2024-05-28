<script lang="ts">
    import config from '$lib/data/config';
    import { search, type SearchResult } from '$lib/scripts/search';
    import { getReference } from '$lib/data/stores/scripture';
    import { t, bodyFontSize, currentFont } from '$lib/data/stores';
    import { SearchIcon } from '$lib/icons';
    import Navbar from '$lib/components/Navbar.svelte';
    import { initProskomma, loadDocSetIfNotLoaded } from '$lib/data/scripture.js';
    import { tick } from 'svelte';

    export let data;

    let searchText = '';
    let matchWholeWords = true;
    let searchPromise: Promise<SearchResult[]>;
    let showResults = false;

    const specialCharacters = config.mainFeatures['input-buttons']
        .split(' ')
        .filter((x) => x !== '');

    // function submit() {
    //     console.log('starting the search');
    //     const start = performance.now();
    //     searchPromise = initProskomma({ fetch })
    //         .then((pk) => loadDocSetIfNotLoaded(pk, data.docSet, fetch))
    //         .then(() => search(searchText, matchWholeWords, data.docSet))
    //         .then((results) => {
    //             const end = performance.now();
    //             console.log(`search finished in ${end - start} ms`);
    //             return results;
    //         });
    // }

    function submit() {
        showResults = true;
        searchPromise = doSearch();
    }

    async function doSearch(): Promise<SearchResult[]> {
        console.log('starting the search');
        const start = performance.now();

        // Hack to get spinner to show while waiting for search.
        await new Promise((resolve) => setTimeout(resolve, 15));

        // Debugging spinner issue.
        //for (let j = 0; j < 1000; j++) {
        //    await new Promise((resolve) => {
        //        for (let i = 0; i < 2000000; i++) {}
        //        resolve(0);
        //    });
        //    console.log('done with busy loop ', j);
        //    await tick();
        //}

        const pk = await initProskomma({ fetch });
        await loadDocSetIfNotLoaded(pk, data.docSet, fetch);
        const results = await search(searchText, matchWholeWords, data.docSet);
        const end = performance.now();
        console.log(`search finished in ${end - start} ms`);
        return results;
    }

    function referenceString(result: SearchResult): string {
        return getReference({
            collection: data.collection,
            book: result.reference.bookCode,
            chapter: result.reference.chapter,
            verse: result.reference.verses
        });
    }

    function waitingText(): string {
        console.log('waiting for search');
        return 'please wait...';
    }
</script>

<div class="grid grid-rows-[auto,1fr] h-full">
    <div class="navbar">
        <Navbar>
            <!-- <div slot="left-buttons" /> -->
            <label for="sidebar" slot="center">
                <div class="btn btn-ghost normal-case text-xl">{$t['Search']}</div>
            </label>
            <!-- <div slot="right-buttons" /> -->
        </Navbar>
    </div>
    <div class="flex justify-center bg-gray-100">
        <form class="w-full max-w-md p-4">
            <div class="dy-form-control mb-4">
                <label class="dy-input-group w-full flex">
                    <!-- svelte-ignore a11y-autofocus -->
                    <input
                        autofocus
                        type="text"
                        placeholder={$t['Search']}
                        class="flex-grow px-4 py-2 mx-2 dy-input min-w-0 dy-input-bordered"
                        style="min-width: 0"
                        size="1"
                        bind:value={searchText}
                    />
                    <button
                        on:click|preventDefault={submit}
                        class="dy-btn mx-2 flex-none bg-gray-200"
                    >
                        <SearchIcon />
                    </button>
                </label>
            </div>
            <div class="dy-form-control max-w-xs m-4">
                <label class="dy-label cursor-pointer">
                    <span class="dy-label-text">{$t['Search_Match_Whole_Words']}</span>
                    <input type="checkbox" class="dy-toggle" bind:checked={matchWholeWords} />
                </label>
            </div>
            {#if config.mainFeatures['search-input-buttons'] && specialCharacters.length > 0}
                <div class="dy-form-control">
                    <div class="cursor-pointer">
                        <div class="">Special characters</div>
                        <div class="special-characters">
                            {#each specialCharacters as character}
                                <!-- svelte-ignore a11y-click-events-have-key-events -->
                                <!-- svelte-ignore a11y-no-static-element-interactions -->
                                <div
                                    class="special-character bg-primary"
                                    on:click={() => (searchText += character)}
                                >
                                    {character}
                                </div>
                            {/each}
                        </div>
                    </div>
                </div>
            {/if}
            <hr />
            {#if showResults}
                <div class="overflow-y-auto">
                    {#await searchPromise}
                        <p>{waitingText()}</p>
                        <span class="spin" />
                    {:then results}
                        {#if results?.length}
                            {#each results.slice(0, 20) as result}
                                <div class="py-8">
                                    <h1 style:font-weight="bold" style:font-family={$currentFont}>
                                        {referenceString(result)}
                                    </h1>
                                    <p
                                        style:font-family={$currentFont}
                                        style:font-size="{$bodyFontSize}px"
                                    >
                                        {#each result.chunks as chunk}
                                            <span
                                                style:font-weight={chunk.matchesQuery
                                                    ? 'bold'
                                                    : 'normal'}>{chunk.content}</span
                                            >
                                        {/each}
                                    </p>
                                </div>
                            {/each}
                        {:else}
                            <div class="py-4 flex justify-center">
                                <p
                                    style:font-family={$currentFont}
                                    style:font-size="{$bodyFontSize}px"
                                >
                                    {$t['Search_No_Matches_Found']}
                                </p>
                            </div>
                        {/if}
                    {/await}
                </div>
            {/if}
        </form>
    </div>
</div>

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
</style>
