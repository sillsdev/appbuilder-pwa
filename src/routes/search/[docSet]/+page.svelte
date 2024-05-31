<script lang="ts">
    import config from '$lib/data/config';
    import { Search, type SearchResult } from '$lib/scripts/search';
    import { bodyFontSize, convertStyle, currentFont, s, t, themeColors } from '$lib/data/stores';
    import { SearchIcon } from '$lib/icons';
    import Navbar from '$lib/components/Navbar.svelte';
    import { initProskomma, loadDocSetIfNotLoaded } from '$lib/data/scripture.js';
    import SearchResultCard from '$lib/components/SearchResultCard.svelte';
    import SearchForm from '$lib/components/SearchForm.svelte';
    import TestButton from '$lib/components/TestButton.svelte';
    import TestButtonContainer from '$lib/components/TestButtonContainer.svelte';

    export let data;
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
    <div class="flex justify-center" style:background-color={$themeColors.BackgroundColor}>
        <SearchForm docSet={data.docSet} collection={data.collection} />
    </div>
</div>
