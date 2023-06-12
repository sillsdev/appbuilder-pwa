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
    $: console.log($s);

    $: cellStyle = convertStyle(
        Object.fromEntries(
            Object.entries($s['ui.button.book-grid']).filter(([key]) => key != 'background-color')
        )
    );
    $: rowStyle = convertStyle(
        Object.fromEntries(
            Object.entries($s['ui.button.chapter-intro']).filter(
                ([key]) => key != 'background-color'
            )
        )
    );
    $: headerStyle = convertStyle($s['ui.text.book-group-title']);
    const dispatch = createEventDispatcher();

    $: bookCollectionColor = (id: string, category: string) => {
        const section = config.bookCollections
            .find((x) => x.id === $refs.collection)
            .books.find((x) => x.id === id)?.section;
        let color = Object.keys($themeBookColors).includes(section)
            ? $themeBookColors[section]
            : $s[category]['background-color'];
        return color;
    };

    function handleClick(opt: string) {
        dispatch('menuaction', {
            text: opt
        });
    }
</script>

{#each options as group}
    {#if group.header}
        <div class="mx-2" style={headerStyle}>{group.header}</div>
    {/if}
    <div
        class="grid grid-cols-{cols} gap-1 m-2"
        class:grid-cols-5={cols == 5}
        class:grid-cols-6={cols == 6}
    >
        {#if group.rows}
            {#each group.rows as row}
                <!-- svelte-ignore a11y-click-events-have-key-events -->
                <span
                    on:click={() => handleClick(row.id)}
                    class="dy-btn dy-btn-ghost normal-case truncate text-clip col-start-1 hover:brightness-50"
                    class:col-span-5={cols == 5}
                    class:col-span-6={cols == 6}
                    style={rowStyle}
                    style:background-color={bookCollectionColor(row.id, 'ui.button.chapter-intro')}
                >
                    {row.label}
                </span>
            {/each}
        {/if}
        {#each group.cells as cell}
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <span
                on:click={() => handleClick(cell.id)}
                class="dy-btn dy-btn-square dy-btn-ghost normal-case truncate text-clip hover:brightness-50"
                style={cellStyle}
                style:background-color={bookCollectionColor(cell.id, 'ui.button.book-grid')}
            >
                {cell.label}
            </span>
        {/each}
    </div>
{/each}

<style>
    span {
        text-overflow: ''; /* Works on Firefox only */
        overflow: hidden;
        display: inline-block;
        border-radius: 0px;
        padding: 1.2em 0;
        vertical-align: middle;
    }
</style>
