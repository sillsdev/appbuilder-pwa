<script lang="ts">
    import { SearchIcon } from '$lib/icons';
    import { globalConfig } from '$lib/data/stores';
    let searchText = '';
    let matchWholeWords = true;
    $: specialCharacters = $globalConfig.mainFeatures['input-buttons']
        .split(' ')
        .filter((x) => x !== '');
    function submit() {
        console.log('search: ' + searchText + '\nmatch whole words: ' + matchWholeWords);
    }
</script>

<h1>Search</h1>
<form>
    <div class="dy-form-control">
        <label class="dy-input-group">
            <!-- svelte-ignore a11y-autofocus -->
            <input
                autofocus
                type="text"
                placeholder="Search"
                class="dy-input dy-input-bordered"
                bind:value={searchText}
            />
            <button on:click|preventDefault={submit} class="dy-btn">
                <SearchIcon />
            </button>
        </label>
    </div>
    <div class="dy-form-control w-full max-w-xs">
        <label class="dy-label cursor-pointer">
            <span class="dy-label-text">Match whole words</span>
            <input type="checkbox" class="dy-toggle" bind:checked={matchWholeWords} />
        </label>
    </div>
    {#if $globalConfig.mainFeatures['search-input-buttons'] && specialCharacters.length > 0}
        <div class="dy-form-control">
            <div class="cursor-pointer">
                <div class="">Special characters</div>
                <div class="special-characters">
                    {#each specialCharacters as character}
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
