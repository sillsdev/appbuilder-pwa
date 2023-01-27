<!--
@component
A component to display menu options in a list.
-->
<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import { s, convertStyle } from '$lib/data/stores.js';
    import config from '$lib/data/config';
    export let options: App.GridGroup[] = [];

    const dispatch = createEventDispatcher();
    $: rows = Math.ceil(options.length);
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

    // class=" menu p-0 cursor-pointer hover:bg-base-100 min-w-[16rem]"
</script>

{#each options as group}
    {#if group.header}
        <div style={convertStyle($s['ui.text.book-group-title'])}>{group.header}</div>
    {/if}
    <table>
        {#each Array(rows) as _, ri}
            <tr>
                {#each Array(rows) as _, ci}
                    {#if ri * rows + ci < group.cells.length}
                        <td style:background-color={tableColor}>
                            <!-- svelte-ignore a11y-click-events-have-key-events -->
                            <span
                                on:click={() => handleClick(group.cells[ri * rows + ci].id)}
                                class=" menu p-0 cursor-pointer hover:bg-base-100 min-w-[16rem]"
                                style:color={textColor}
                                >{group.cells[ri * rows + ci].id}
                            </span></td
                        >
                    {/if}
                {/each}
            </tr>
        {/each}
    </table>
{/each}

<style>
    table {
        width: 100%;
        margin-left: auto;
        margin-right: auto;
        padding: 0px;
        border-collapse: unset;
    }
    tr {
        width: 80%;
        margin: 0px;
        padding: 0px;
    }
    td {
        margin: 0px;
        position: relative;
        border-radius: 2px;
    }
    span {
        text-overflow: ''; /* Works on Firefox only */
        overflow: hidden;
        display: inline-block;
        vertical-align: middle;
        padding: 0.5em 0;
    }
</style>
