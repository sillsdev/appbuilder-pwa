<script lang="ts">
    import config from '$lib/data/config';
    import { convertStyle, s, t, themeColors } from '$lib/data/stores';
    import { SearchIcon } from '$lib/icons';
    import { createEventDispatcher } from 'svelte';

    let phrase = '';
    let wholeWords = config.mainFeatures['search-whole-words-default'] ?? false;

    let dismissSearchBar = false;

    const dispatch = createEventDispatcher();

    function submit() {
        if (!phrase) return;
        // Dismiss the search bar by disabling it.
        // Then re-enable the search bar to allow the user to modify the query.
        dismissSearchBar = true;
        setTimeout(() => {
            dismissSearchBar = false;
        }, 50);
        dispatch('submit', { phrase, wholeWords });
    }
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
                bind:value={phrase}
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
        <div class="dy-form-control max-w-xs px-4 my-2">
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
</style>
