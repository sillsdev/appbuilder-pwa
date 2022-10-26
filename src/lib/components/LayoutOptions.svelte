<!--
@component
Displays the three different layout options.  
TODO:
- functionality...
-->
<script>
    import { onDestroy } from 'svelte';
    import { catalog } from '$lib/data/catalog';
    import { refs, viewMode } from '$lib/data/stores';

    export let layoutOption = '';

    let nextDocSet;
    let docSetList = catalog.map((ds) => ds.id);
    const removeKey = refs.subscribe((v) => {
        nextDocSet = v.docSet;
    }, 'next');
    onDestroy(removeKey);
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
                        on:click={() => refs.set({ docSet: nextDocSet }, 'next')}
                        class={nextDocSet === d ? 'dy-active' : ''}
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
                        on:click={() => refs.set({ docSet: nextDocSet }, 'next')}
                        class={nextDocSet === d ? 'dy-active' : ''}
                        >{d}
                    </a>
                </li>
            {/each}
        </ul>
    {:else if layoutOption === 'Single Pane'}
        <p><strong>Single Pane</strong></p>
        <ul class="dy-menu mx-auto">
            {#each docSetList as d}
                <!-- svelte-ignore a11y-missing-attribute -->
                <li>
                    <!-- svelte-ignore a11y-click-events-have-key-events -->
                    <a
                        on:click={() => refs.set({ docSet: nextDocSet }, 'next')}
                        class={nextDocSet === d ? 'dy-active' : ''}
                        >{d}
                    </a>
                </li>
            {/each}
        </ul>
    {/if}
</div>
