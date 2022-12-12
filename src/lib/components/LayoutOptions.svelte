<!--
@component
Displays the three different layout options.  
TODO:
- functionality...
-->
<script lang="ts">
    import { onDestroy, createEventDispatcher } from 'svelte';
    import { catalog } from '$lib/data/catalog';
    import config from '$lib/data/config';
    import { refs, themeColors, s, t, convertStyle } from '$lib/data/stores';

    export let layoutOption = '';
    const dispatch = createEventDispatcher();

    let nextDocSet;

    const docSetList = catalog.map((ds) => ds.id);

    const removeKey = refs.subscribe((v) => {
        nextDocSet = v.docSet;
    }, 'next');
    onDestroy(removeKey);

    function handleClick(opt) {
        refs.set({ docSet: opt }, 'next');
        nextDocSet = opt;
        dispatch('menuaction', {
            text: opt
        });
    }
</script>

<div class="w-60 p-2">
    <!-- Single Pane -->
    {#if layoutOption === 'Single Pane'}
        <p style:color={$themeColors['LayoutTitleColor']}>
            <strong>{$t['Layout_Single_Pane']}</strong>
        </p>
        <ul class="dy-menu mx-auto">
            {#each docSetList as d}
                <!-- svelte-ignore a11y-missing-attribute -->
                <li>
                    <!-- svelte-ignore a11y-click-events-have-key-events -->
                    <a
                        on:click={() => handleClick(d)}
                        class={nextDocSet === d ? 'dy-active' : ''}
                        style={convertStyle($s['ui.layouts.selector'])}
                        style:background-color={nextDocSet === d
                            ? $themeColors['LayoutItemSelectedBackgroundColor']
                            : $themeColors['LayoutBackgroundColor']}
                        >{config.bookCollections.find(
                            (x) => x.id === catalog.find((x) => x.id === d).selectors.abbr
                        ).collectionName}
                    </a>
                </li>
            {/each}
        </ul>
        <!-- Side by Side -->
    {:else if layoutOption === 'Side By Side'}
        <p style:color={$themeColors['LayoutTitleColor']}>
            <strong>{$t['Layout_Two_Pane']}</strong>
        </p>
        <ul class="dy-menu mx-auto">
            {#each docSetList as d}
                <!-- svelte-ignore a11y-missing-attribute -->
                <li>
                    <!-- svelte-ignore a11y-click-events-have-key-events -->
                    <a
                        on:click={() => handleClick(d)}
                        class={nextDocSet === d ? 'dy-active' : ''}
                        style={convertStyle($s['ui.layouts.selector'])}
                        style:background-color={nextDocSet === d
                            ? $themeColors['LayoutItemSelectedBackgroundColor']
                            : $themeColors['LayoutBackgroundColor']}
                        >{config.bookCollections.find(
                            (x) => x.id === catalog.find((x) => x.id === d).selectors.abbr
                        ).collectionName}
                    </a>
                </li>
            {/each}
        </ul>
        <!-- Verse By Verse -->
    {:else if layoutOption === 'Verse By Verse'}
        <p style:color={$themeColors['LayoutTitleColor']}>
            <strong>{$t['Layout_Interlinear']}</strong>
        </p>
        <ul class="dy-menu mx-auto">
            {#each docSetList as d}
                <!-- svelte-ignore a11y-missing-attribute -->
                <li>
                    <!-- svelte-ignore a11y-click-events-have-key-events -->
                    <a
                        on:click={() => handleClick(d)}
                        class={nextDocSet === d ? 'dy-active' : ''}
                        style={convertStyle($s['ui.layouts.selector'])}
                        style:background-color={nextDocSet === d
                            ? $themeColors['LayoutItemSelectedBackgroundColor']
                            : $themeColors['LayoutBackgroundColor']}
                        >{config.bookCollections.find(
                            (x) => x.id === catalog.find((x) => x.id === d).selectors.abbr
                        ).collectionName}
                    </a>
                </li>
            {/each}
        </ul>
    {/if}
</div>
