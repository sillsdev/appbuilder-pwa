<!--
@component
Font list component.
-->
<svelte:options accessors />

<script>
    import { createEventDispatcher } from 'svelte';
    import config from '$lib/data/config';
    import { fontChoices, monoIconColor, themeColors } from '$lib/data/stores';

    const dispatch = createEventDispatcher();
    export let selectedFont;

    function handleClick(font) {
        selectedFont = font;
        dispatch('menuaction', {
            font: font
        });
    }
</script>

<ul class="dy-menu">
    {#each $fontChoices as font}
        <!-- svelte-ignore a11y-missing-attribute -->
        <li style:font-family={font} style:font-size="large">
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <!-- svelte-ignore a11y-interactive-supports-focus -->
            <a
                on:click={() => handleClick(font)}
                style:background-color={font === selectedFont
                    ? $themeColors['ButtonSelectedColor']
                    : ''}
                style:color={$monoIconColor}
                style:font-famly={font}
                role="button"
            >
                {config.fonts.find((x) => x.family === font).name}
            </a>
        </li>
    {/each}
</ul>
