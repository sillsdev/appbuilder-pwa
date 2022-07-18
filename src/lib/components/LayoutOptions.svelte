<script>
    import { onDestroy } from 'svelte';
    import { catalog } from '$lib/data/constants';
    import { refs, viewMode } from '$lib/data/stores';

    export let layoutOption = '';

    let docSetList = catalog.map((ds) => ds.id);
    const removeKey = refs.addKey('next');
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
                    <a
                        on:click={() => ($refs['next'].docSet = d)}
                        class={$refs['next'].docSet === d ? 'dy-active' : ''}
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
                    <a
                        on:click={() => ($refs['next'].docSet = d)}
                        class={$refs['next'].docSet === d ? 'dy-active' : ''}
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
                    <a
                        on:click={() => ($refs['next'].docSet = d)}
                        class={$refs['next'].docSet === d ? 'dy-active' : ''}
                        >{d}
                    </a>
                </li>
            {/each}
        </ul>
    {/if}
</div>
