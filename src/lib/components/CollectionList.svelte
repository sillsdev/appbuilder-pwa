<!--
@component
Custom list of collections for the LayoutOptions menu
-->
<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import CollectionListItem from './CollectionListItem.svelte';
    // array of all selectable docsets
    export let docSets: App.CollectionEntry[] = [];
    // selected docset to highlight
    export let selectedLayout: App.CollectionEntry;

    const dispatch = createEventDispatcher();

    function handleClick(opt: App.CollectionEntry) {
        dispatch('menuaction', {
            collection: opt
        });
    }
</script>

<div>
    {#each docSets as collection}
        <!-- svelte-ignore a11y-missing-attribute -->
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <div on:click={() => handleClick(collection)}>
            <CollectionListItem {collection} selected={selectedLayout.id === collection.id} />
        </div>
    {/each}
</div>
