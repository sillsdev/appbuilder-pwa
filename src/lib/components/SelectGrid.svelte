<!--
@component
A component to display menu options in a grid.
-->
<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import { s, refs, themeBookColors, themeColors, convertStyle } from '$lib/data/stores';
    import { isNotBlank } from '$lib/scripts/stringUtils';
    import config from '$lib/data/config';
    export let options: App.GridGroup[] = [];
    export let cols = 6;

    let hovered = null;
    $: hoverColor = $themeColors['ButtonSelectedColor'];

    // Function to handle span touch
    function handleHover(event) {
        hovered = event.target.id;
    }

    // Function to handle span touch end
    function handleHoverEnd() {
        hovered = null;
    }

    function handleTouchMove(event) {
        const touch = event.touches[0];
        const element = document.elementFromPoint(touch.clientX, touch.clientY);
        const rect = element.getBoundingClientRect();
        if (
            touch.clientX >= rect.left &&
            touch.clientX <= rect.right &&
            touch.clientY >= rect.top &&
            touch.clientY <= rect.bottom
        ) {
            hovered = element.id;
        } else {
            hovered = null;
        }
    }

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

    function handleClick(opt: any) {
        const text = opt.id;
        const url = opt?.url;
        dispatch('menuaction', {
            text,
            url
        });
    }
</script>

{#each options as group}
    {#if group.header}
        <div class="mx-2"
        class:my-2={isNotBlank(group.header)} 
        style={headerStyle}>{group.header}</div>
    {/if}
    <!-- svelte-ignore a11y-mouse-events-have-key-events -->
    <!-- svelte-ignore a11y-interactive-supports-focus -->
    <div
        on:touchstart={handleHover}
        on:touchmove={handleTouchMove}
        on:touchend={handleHoverEnd}
        on:mouseover={handleHover}
        on:mouseout={handleHoverEnd}
        class="grid grid-cols-{cols} gap-1"
        class:grid-cols-5={cols == 5}
        class:grid-cols-6={cols == 6}
        role="menu"
    >
        {#if group.rows}
            {#each group.rows as row}
                <!-- svelte-ignore a11y-click-events-have-key-events -->
                <!-- svelte-ignore a11y-interactive-supports-focus -->
                <span
                    on:click={() => handleClick(row.id)}
                    id={row.id}
                    class="dy-btn dy-btn-ghost normal-case truncate text-clip col-start-1"
                    class:col-span-5={cols == 5}
                    class:col-span-6={cols == 6}
                    style={rowStyle}
                    style:background-color={hovered === row.id
                        ? hoverColor
                        : bookCollectionColor(row.id, 'ui.button.chapter-intro')}
                    role="button"
                >
                    {row.label}
                </span>
            {/each}
        {/if}
        {#each group.cells as cell}
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <!-- svelte-ignore a11y-no-static-element-interactions -->
            <span
                on:click={() => handleClick(cell)}
                id={cell.id}
                class="dy-btn dy-btn-square dy-btn-ghost normal-case truncate text-clip"
                style={cellStyle}
                style:background-color={hovered === cell.id
                    ? hoverColor
                    : bookCollectionColor(cell.id, 'ui.button.chapter-intro')}
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
        transition: background-color 0.05s ease;
    }
</style>
