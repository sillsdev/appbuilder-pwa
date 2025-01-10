<!--
@component
A component to display menu options in a list.
-->
<script lang="ts">
    import { convertStyle, s, theme, themeColors } from '$lib/data/stores';
    import { createEventDispatcher } from 'svelte';

    export let options: App.GridGroup[] = [];

    const dispatch = createEventDispatcher();

    function handleClick(opt: any) {
        const text = opt.id;
        const url = opt?.url;
        dispatch('menuaction', {
            text,
            url
        });
    }

    let hovered = null;
    $: hoverColor = $theme === 'Dark' ? '#444444' : $themeColors['ButtonSelectedColor'];
    $: backgroundColor = $s['ui.button.book-list']['background-color'];

    // Function to handle span touch
    function handleHover(event) {
        console.log('hovered:', event.target.id);
        hovered = event.target.id;
    }

    // Function to handle span touch end
    function handleHoverEnd() {
        hovered = null;
    }

    $: rowStyle = convertStyle($s['ui.button.book-list']);
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
{#each options as group}
    {#if group.header}
        <div class="flex items-center" style={convertStyle($s['ui.text.book-group-title'])}>
            {group.header}
        </div>
    {/if}
    <!-- svelte-ignore a11y-mouse-events-have-key-events -->
    <div class="flex flex-wrap" on:mouseover={handleHover} on:mouseout={handleHoverEnd}>
        {#each group.cells as cell}
            <!-- svelte-ignore a11y-interactive-supports-focus -->
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <div
                on:click={() => handleClick(cell)}
                id={cell.id}
                class="menu ps-2 cursor-pointer min-w-[16rem] flex-grow flex items-center"
                style={rowStyle}
                style:background-color={hovered == cell.id ? hoverColor : backgroundColor}
                role="button"
            >
                {cell.label}
            </div>
        {/each}
    </div>
{/each}
