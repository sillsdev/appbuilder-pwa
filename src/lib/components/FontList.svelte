<!--
@component
Font list component.
-->
<svelte:options />

<script>
    import config from '$lib/data/config';
    import { fontChoices, monoIconColor, themeColors } from '$lib/data/stores';

    let { selectedFont = $bindable() } = $props();

    function handleClick(font) {
        selectedFont = font;
        console.log(`Selected font: ${selectedFont}`);
    }
</script>

<ul class="dy-menu">
    {#each $fontChoices as font}
        <!-- svelte-ignore a11y_missing_attribute -->
        <li style:font-family={font} style:font-size="large">
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <!-- svelte-ignore a11y_interactive_supports_focus -->
            <a
                onclick={() => handleClick(font)}
                style:background-color={font === selectedFont
                    ? $themeColors['ButtonSelectedColor']
                    : ''}
                style:color={$monoIconColor}
                style:font-family={font}
                role="button"
            >
                {config.fonts.find((x) => x.family === font).name}
            </a>
        </li>
    {/each}
</ul>
