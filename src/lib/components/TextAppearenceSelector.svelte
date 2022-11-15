<!--
@component
The navbar component.
-->
<script>
    import Dropdown from './Dropdown.svelte';
    import { TextAppearanceIcon } from '$lib/icons';
    import { globalConfig } from '$lib/data/stores';

    /** Checks if normal is enabled*/
    $: countThemesNormal = $globalConfig.themes.find((x) => x.name === 'Normal').enabled;

    /** Checks if sepia is enabled*/
    $: countThemesSepia = $globalConfig.themes.find((x) => x.name === 'Sepia').enabled;

    /** Checks if dark is enabled*/
    $: countThemesDark = $globalConfig.themes.find((x) => x.name === 'Dark').enabled;

    let showTextAppearence =
        $globalConfig.mainFeatures['text-font-size-slider'] ||
        $globalConfig.mainFeatures['text-line-height-slider'] ||
        countThemesDark ||
        countThemesNormal ||
        countThemesSepia;
</script>

<!-- TextAppearanceSelector -->
{#if showTextAppearence}
    <Dropdown>
        <svelte:fragment slot="label">
            <TextAppearanceIcon />
        </svelte:fragment>
        <!-- TODO: implement text appearance options -->
    </Dropdown>
{/if}
