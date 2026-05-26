<!--
@component
Font list component.
-->

<script lang="ts">
    import config from '$assets/config';
    import { fontChoices, monoIconColor, themeColors } from '$lib/data/stores';

    interface Props {
        selectedFont?: string;
    }

    let { selectedFont = $bindable() }: Props = $props();
</script>

<ul class="dy-menu">
    {#each $fontChoices as font}
        <li style:font-family={font} style:font-size="large">
            <button
                onclick={() => (selectedFont = font)}
                style:background-color={font === selectedFont
                    ? $themeColors['ButtonSelectedColor']
                    : ''}
                style:color={$monoIconColor}
                style:font-family={font}
                type="button"
            >
                {config.fonts?.find((x) => x.family === font)?.name}
            </button>
        </li>
    {/each}
</ul>
