<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import { themeColors, convertStyle, s } from '$lib/data/stores';
    // array of all selectable docsets
    export let docSets: App.CollectionEntry[] = [];
    // selected docset to highlight
    export let nextDocSet: App.CollectionEntry;

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
            <a
                on:click={() => handleClick(d)}
                style:background-color={nextDocSet.id === d.id
                    ? $themeColors['LayoutItemSelectedBackgroundColor']
                    : ''}
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
                </div>
            </a>
        </li>
    {/each}
</ul>

<style>
    a {
        display: flex;
        justify-content: space-between;
    }
</style>
