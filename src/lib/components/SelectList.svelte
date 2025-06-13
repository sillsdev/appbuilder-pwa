<!--
@component
A component to display menu options in a list.
-->
<script lang="ts">
    import { convertStyle, s, theme, themeColors } from '$lib/data/stores';

    let { options = [], menuaction }: { options: App.GridGroup[]; menuaction } = $props();

    function handleClick(opt: any) {
        const text = opt.id;
        const url = opt?.url;
        menuaction({
            text,
            url
        });
    }

    let hovered = $state(null);
    const hoverColor = $derived(
        $theme === 'Dark' ? '#444444' : $themeColors['ButtonSelectedColor']
    );
    const backgroundColor = $derived($s['ui.button.book-list']['background-color']);

    // Function to handle span touch
    function handleHover(event) {
        console.log('hovered:', event.target.id);
        hovered = event.target.id;
    }

    // Function to handle span touch end
    function handleHoverEnd() {
        hovered = null;
    }

    const rowStyle = $derived(convertStyle($s['ui.button.book-list']));
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
{#each options as group}
    {#if group.header}
        <div class="flex items-center" style={convertStyle($s['ui.text.book-group-title'])}>
            {group.header}
        </div>
    {/if}
    <!-- svelte-ignore a11y_mouse_events_have_key_events -->
    <div class="flex flex-wrap" onmouseover={handleHover} onmouseout={handleHoverEnd}>
        {#each group.cells as cell}
            <!-- svelte-ignore a11y_interactive_supports_focus -->
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <div
                onclick={() => handleClick(cell)}
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
