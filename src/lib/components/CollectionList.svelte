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

<div class="hover:bg-base-20">
    {#each docSets as d}
        <!-- svelte-ignore a11y-missing-attribute -->
<<<<<<< HEAD
        <li>
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <a
                on:click={() => handleClick(d)}
                style:background-color={selectedLayouts.id === d.id
                    ? $themeColors['LayoutItemSelectedBackgroundColor']
                    : ''}
                class="flex justify-between"
            >
                <div style={$s['ui.layouts.selector']}>
                    <div style={convertStyle($s['ui.layouts.title'])}>
                        {d.name}
                    </div>
                    {#if d.description}
                        <div class="text-sm" style={convertStyle($s['ui.layouts.selector'])}>
                            {d.description}
                        </div>
                    {/if}
=======
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <div
            on:click={() => handleClick(d)}
            class="layout-item-block {nextDocSet.id === d.id ? 'layout-item-selected' : ''}"
        >
            <div class="layout-text-block">
                <div class="layout-item-name">
                    {d.name}
>>>>>>> ee6c953 (Converted styles to use sab-app.css styles)
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
