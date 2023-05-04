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
    console.log($s);

    const allowSinglePane = config.bookCollections.map((bc) => ({
        docSet: bc.languageCode + '_' + bc.id,
        name: bc.collectionName,
        singlePane: bc.features['bc-allow-single-pane'],
        description: bc?.collectionDescription
    }));

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
            {#each allowSinglePane.filter((x) => x.singlePane === true) as d}
                <!-- svelte-ignore a11y-missing-attribute -->
                <li>
                    <!-- svelte-ignore a11y-click-events-have-key-events -->
                    <a
                        on:click={() => handleClick(d.docSet)}
                        class={nextDocSet === d.docSet ? 'dy-active' : ''}
                        style={convertStyle($s['ui.layouts.selector'])}
                        style:background-color={nextDocSet === d.docSet
                            ? $themeColors['LayoutItemSelectedBackgroundColor']
                            : $themeColors['LayoutBackgroundColor']}
                    >
                        <div class="dy-relative">
                            <div class={convertStyle($s['ui.layouts.title'])}>
                                {d.name}
                            </div>
                            {#if d.description}
                                <div class="text-sm">{d.description}</div>
                            {/if}
                        </div>
                    </a>
                </li>
            {/each}
        </ul>
        <!-- Side by Side -->
    {:else if layoutOption === 'Side By Side'}
        <p style:color={$themeColors['LayoutTitleColor']}>
            <strong>{$t['Layout_Two_Pane']}</strong>
        </p>
        <ul class="dy-menu mx-auto" />
        <!-- Verse By Verse -->
    {:else if layoutOption === 'Verse By Verse'}
        <p style:color={$themeColors['LayoutTitleColor']}>
            <strong>{$t['Layout_Interlinear']}</strong>
        </p>
        <ul class="dy-menu mx-auto" />
    {/if}
</div>

<style>
    a {
        display: flex;
        justify-content: space-between;
    }
</style>
