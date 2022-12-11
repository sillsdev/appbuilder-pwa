<!--
@component
A component to display menu options in a grid.
-->
<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import config from '$lib/data/config';
    export let options = [''];
    export let cols = 6;

    const dispatch = createEventDispatcher();
    $: rows = Math.ceil(options.length / cols);
    const colors = (type: string, key: string) =>
        config.themes.find((x) => x.name === 'Normal').colorSets.find((x) => x.type === type)
            ?.colors[key];
    const textColor = colors('main', 'ChapterButtonTextColor');
    let tableColor = colors('main', 'BackgroundColor');

    function handleClick(opt: string) {
        dispatch('menuaction', {
            text: opt
        });
    }
</script>

<table style:background-color={tableColor} style:border-spacing="5px">
    {#each Array(rows) as _, ri}
        <tr>
            {#each Array(cols) as _, ci}
                {#if ri * cols + ci < options.length}
                    <tr
                        style:background-color={tableColor}
                        style:border="none"
                        style:border-radius="0px"
                    >
                        <!-- svelte-ignore a11y-click-events-have-key-events -->
                        <span
                            on:click={() => handleClick(options[ri * cols + ci])}
                            class="dy-btn dy-btn-ghost p-0"
                            style:color={textColor}>{options[ri * cols + ci]}</span
                        ></tr
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
