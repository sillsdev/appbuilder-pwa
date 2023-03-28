<script lang="ts">
    import config from '$lib/data/config';
    import { refs, t } from '$lib/data/stores';
    import { query } from '$lib/scripts/query';
    import { postQueries, queries } from 'proskomma-tools';
    import { SearchIcon } from '$lib/icons';
    import Navbar from '$lib/components/Navbar.svelte';

    let searchText = '';
    //TODO: make match whole words setting do something
    let matchWholeWords = true;
    const specialCharacters = config.mainFeatures['input-buttons']
        .split(' ')
        .filter((x) => x !== '');
    function submit() {
        searching = true;
        console.log('search: ' + searchText + '\nmatch whole words: ' + matchWholeWords);
    }

    let searching = false;
    let passages: any[] = [];
    $: promise = search(searching);
    async function search(s = false) {
        if (!s) return;
        if (searchText === '') {
            searching = false;
            return;
        }
        // searches for books in the current collection that match the search text
        const books = postQueries.searchForBookCodesFilter({
            data: (
                await query(
                    queries.searchForBookCodesQuery({
                        text: searchText,
                        docSetId: $refs.docSet
                    })
                )
            ).data
        });

        passages = [];

        //loops through the list of books to find passages that match the search text
        for (const book of books) {
            passages = passages.concat(
                postQueries.searchForVersesFilter({
                    data: (
                        await query(
                            queries.searchForPassagesQuery({
                                text: searchText,
                                docSetId: $refs.docSet,
                                bookCode: book
                            })
                        )
                    ).data
                })
            );
        }
        console.log(passages.length);
        searching = false;
    }
</script>

<div class="navbar">
    <Navbar>
        <!-- <div slot="left-buttons" /> -->
        <label for="sidebar" slot="center">
            <div class="btn btn-ghost normal-case text-xl">{$t['Search']}</div>
        </label>
        <!-- <div slot="right-buttons" /> -->
    </Navbar>
</div>
<form>
    <div class="dy-form-control m-4">
        <label class="dy-input-group">
            <!-- svelte-ignore a11y-autofocus -->
            <input
                autofocus
                type="text"
                placeholder={$t['Search']}
                class="dy-input dy-input-bordered"
                bind:value={searchText}
            />
            <button on:click|preventDefault={submit} class="dy-btn">
                <SearchIcon />
            </button>
        </label>
    </div>
    <div class="dy-form-control w-full max-w-xs m-4">
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
</form>
{#await promise}
    searching . . .
{:then results}
    {#each passages as p}
        <h2>{p.reference} <i>{p.docSetId}</i></h2>
        <p>{p.text}</p>
    {/each}
{/await}

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
    .navbar {
        height: 4rem;
    }
</style>
