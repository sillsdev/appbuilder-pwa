<script lang="ts">
    import { t, themeColors } from '$lib/data/stores';
    import Navbar from '$lib/components/Navbar.svelte';
    import SearchForm from '$lib/components/SearchForm.svelte';

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
