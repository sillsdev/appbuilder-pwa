<!--
@component
A component to display menu options in a grid.
-->
<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import { globalConfig } from '$lib/data/stores';
    export let options = [''];
    export let cols = 5;

    const dispatch = createEventDispatcher();
    $: rows = Math.ceil(options.length / cols);

    // TODO: Change handling for chapters/verses
    function bookCollectionColor(bookAbbr: string) {
        let color = $globalConfig.themes
            .find((x) => x.name === 'Normal')
            .colorSets.find((x) => x.type === 'books').colors[
            $globalConfig.bookCollections
                .find((x) => x.id === 'C01')
                .books.find((x) => x.id === 'GEN').section
        ];
        return color;
    }

    function handleClick(opt: string) {
        dispatch('menuaction', {
            text: opt
        });
    }
</script>

<table class="bg-base-200">
    {#each Array(rows) as _, ri}
        <tr>
            {#each Array(cols) as _, ci}
                {#if ri * cols + ci < options.length}
                    <td class="border-base-200 bg-base-100">
                        <!-- svelte-ignore a11y-click-events-have-key-events -->
                        <span
                            on:click={() => handleClick(options[ri * cols + ci])}
                            class="dy-btn dy-btn-square dy-btn-ghost p-0 m-0"
                            style:background-color={bookCollectionColor(options[ri * cols + ci])}
                            >{options[ri * cols + ci]}</span
                        ></td
                    >
                {/if}
            {/each}
        </tr>
    {/each}
</table>

<style>
    table {
        width: 100%;
        margin-left: auto;
        margin-right: auto;
        padding: 0px;
        border-collapse: unset;
    }
    tr {
        width: 100%;
        margin: 0px;
        padding: 0px;
    }
    td {
        text-align: center;
        overflow: hidden;
        margin: 0px;
        padding: 0px;
        position: relative;
        border: 1px solid;
        border-radius: 5px;
    }
    span {
        text-overflow: ''; /* Works on Firefox only */
        overflow: hidden;
        display: inline-block;
        padding: 1.2em 0;
        vertical-align: middle;
    }
</style>
