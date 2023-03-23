<!--
@component
A component to display menu options in a grid.
-->
<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import { s, refs, themeBookColors, convertStyle } from '$lib/data/stores';
    import config from '$lib/data/config';
    export let options: App.GridGroup[] = [];
    export let cols = 6;

    const dispatch = createEventDispatcher();

    $: bookCollectionColor = (id: string) => {
        const section = config.bookCollections
            .find((x) => x.id === $refs.collection)
            .books.find((x) => x.id === id)?.section;
        let color = Object.keys($themeBookColors).includes(section)
            ? $themeBookColors[section]
            : $s['ui.button.book-grid']['background-color'];
        return color;
    };

    function handleClick(opt: string) {
        dispatch('menuaction', {
            text: opt
        });
    }
</script>

<!--
  ri - row index
  ci - column index
  see https://svelte.dev/tutorial/each-blocks
-->

{#each options as group}
    {#if group.header}
        <div style={convertStyle($s['ui.text.book-group-title'])}>{group.header}</div>
    {/if}
    <table>
        {#each Array(Math.ceil(group.cells.length / cols)) as _, ri}
            <tr>
                {#each Array(cols) as _, ci}
                    {#if ri * cols + ci < group.cells.length}
                        <td>
                            <!-- svelte-ignore a11y-click-events-have-key-events -->
                            <span
                                on:click={() => handleClick(group.cells[ri * cols + ci].id)}
                                class="dy-btn dy-btn-square dy-btn-ghost p-0 normal-case truncate text-clip"
                                style={convertStyle(
                                    Object.fromEntries(
                                        Object.entries($s['ui.button.book-grid']).filter(
                                            ([key]) => key != 'background-color'
                                        )
                                    )
                                )}
                                style:background-color={bookCollectionColor(
                                    group.cells[ri * cols + ci].id
                                )}
                            >
                                {group.cells[ri * cols + ci].label}
                            </span></td
                        >
                    {/if}
                {/each}
            </tr>
        {/each}
    </table>
{/each}

<style>
    div {
        padding: 5px;
    }
    table {
        width: 100%;
        margin-left: auto;
        margin-right: auto;
        padding: 0px;
        border-collapse: unset;
        border-spacing: 5px;
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
        border: none;
        border-radius: 0px;
    }
    span {
        text-overflow: ''; /* Works on Firefox only */
        overflow: hidden;
        display: inline-block;
        border-radius: 0px;
        padding: 1.2em 0;
        vertical-align: middle;
    }
</style>
