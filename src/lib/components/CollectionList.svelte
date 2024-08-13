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

<ul class="dy-menu dy-menu-compact">
    {#each docSets as d}
        <!-- svelte-ignore a11y-missing-attribute -->
        <li>
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <!-- svelte-ignore a11y-interactive-supports-focus -->
            <a
                on:click={() => handleClick(d)}
                style:background-color={selectedLayouts.id === d.id
                    ? $themeColors['LayoutItemSelectedBackgroundColor']
                    : ''}
                class="flex justify-between"
                role="button"
            >
                <div class="layout-item-block" >
                    {#if d.image}
                        <div class="layout-image-block" style="width:15%">
                            <img class="layout-image" src="illustrations/{d.image}"/>
                        </div>
                    {/if}
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
            </a>
        </li>
    {/each}
</ul>
