<!--
@component
The navbar component.
-->
<script>
    import Dropdown from './Dropdown.svelte';
    import { TextAppearanceIcon } from '$lib/icons';
    import { globalConfig } from '$lib/data/stores';

    const countThemes = $globalConfig.themes.filter((x) => x.enabled).length;

    const showTextAppearence =
        $globalConfig.mainFeatures['text-font-size-slider'] ||
        $globalConfig.mainFeatures['text-line-height-slider'] ||
        countThemes > 1;
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
