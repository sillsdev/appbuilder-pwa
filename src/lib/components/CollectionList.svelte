<!--
@component
Custom list of collections for the LayoutOptions menu
-->
<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import { themeColors, convertStyle, s } from '$lib/data/stores';
    // array of all selectable docsets
    export let docSets: App.CollectionEntry[] = [];
    // selected docset to highlight
    export let selectedLayouts: App.CollectionEntry;

    const dispatch = createEventDispatcher();

    function handleClick(opt: App.CollectionEntry) {
        dispatch('menuaction', {
            collection: opt
        });
    }
</script>

<div>
    {#each docSets as d}
        <!-- svelte-ignore a11y-missing-attribute -->
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <div
            on:click={() => handleClick(d)}
            class="layout-item-block {nextDocSet.id === d.id ? 'layout-item-selected' : ''}"
        >
            <div class="layout-text-block">
                <div class="layout-item-name">
                    {d.name}
                </div>
                {#if d.description}
                    <div class="layout-item-description">
                        {d.description}
                    </div>
                {/if}
            </div>
        </div>
    {/each}
</div>
