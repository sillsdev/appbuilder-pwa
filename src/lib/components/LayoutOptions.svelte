<!--
@component
Displays the three different layout options.  
TODO:
- functionality...
-->
<script lang="ts">
    import { onDestroy, createEventDispatcher } from 'svelte';
    import { catalog } from '$lib/data/catalog';
    import { refs, themeColors, s } from '$lib/data/stores';

    export let layoutOption = '';
    console.log($s);

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

<!-- Identical for now -->
<div class="w-60 p-2">
    {#if layoutOption === 'Side By Side'}
        <p><strong>Side By Side</strong></p>
        <ul class="dy-menu mx-auto">
            {#each docSetList as d}
                <!-- svelte-ignore a11y-missing-attribute -->
                <li>
                    <!-- svelte-ignore a11y-click-events-have-key-events -->
                    <a
                        on:click={() => handleClick(d)}
                        class={nextDocSet === d ? 'dy-active' : ''}
                        style:color={$themeColors['LayoutNameColor']}
                        style:background-color={nextDocSet === d
                            ? $themeColors['LayoutItemSelectedBackgroundColor']
                            : ''}
                        >{d}
                    </a>
                </li>
            {/each}
        </ul>
    {:else if layoutOption === 'Verse By Verse'}
        <p><strong>Verse By Verse</strong></p>
        <ul class="dy-menu mx-auto">
            {#each docSetList as d}
                <!-- svelte-ignore a11y-missing-attribute -->
                <li>
                    <!-- svelte-ignore a11y-click-events-have-key-events -->
                    <a
                        on:click={() => handleClick(d)}
                        class={nextDocSet === d ? 'dy-active' : ''}
                        style:color={$themeColors['LayoutNameColor']}
                        style:background-color={nextDocSet === d
                            ? $themeColors['LayoutItemSelectedBackgroundColor']
                            : $themeColors['LayoutBackgroundColor']}
                        >{d}
                    </a>
                </li>
            {/each}
        </ul>
    {:else if layoutOption === 'Single Pane'}
        <p style:color={$themeColors['LayoutTitleColor']}><strong>Single Pane</strong></p>
        <ul class="dy-menu mx-auto">
            {#each docSetList as d}
                <!-- svelte-ignore a11y-missing-attribute -->
                <li>
                    <!-- svelte-ignore a11y-click-events-have-key-events -->
                    <a
                        on:click={() => handleClick(d)}
                        class={nextDocSet === d ? 'dy-active' : ''}
                        style:color={$themeColors['LayoutNameColor']}
                        style:background-color={nextDocSet === d
                            ? $themeColors['LayoutItemSelectedBackgroundColor']
                            : $themeColors['LayoutBackgroundColor']}
                        >{d}
                    </a>
                </li>
            {/each}
        </ul>
    {/if}
</div>
