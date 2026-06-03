<script lang="ts">
    import { goto } from '$app/navigation';
    import { resolve } from '$app/paths';
    import config from '$assets/config';
    import BookSelector from '$lib/components/BookSelector.svelte';
    import ChapterSelector from '$lib/components/ChapterSelector.svelte';
    import Navbar from '$lib/components/Navbar.svelte';
    import { bodyFontSize, nextRef, refs } from '$lib/data/stores';
    import { SearchIcon } from '$lib/icons';
    import type { PageData } from './$types.js';

    console.log($refs);
    console.log($nextRef);

    interface Props {
        data: PageData;
    }
    let { data }: Props = $props();

    let { displayLabel } = $derived(data);
    const showSearch = !!config.mainFeatures['search'];
</script>

<div class="grid grid-rows-[auto,1fr] h-screen overflow-y-auto" style:font-size="{$bodyFontSize}px">
    <div class="navbar">
        <Navbar>
            {#snippet start()}
                <BookSelector {displayLabel} />
                <ChapterSelector />
            {/snippet}
            {#snippet end()}
                <div class="flex items-center">
                    {#if showSearch}
                        <button
                            class="dy-btn dy-btn-ghost dy-btn-circle"
                            onclick={() => goto(resolve(`/search/${$refs.collection}`))}
                        >
                            <SearchIcon color="white" />
                        </button>
                    {/if}
                </div>
            {/snippet}
        </Navbar>
    </div>
</div>
