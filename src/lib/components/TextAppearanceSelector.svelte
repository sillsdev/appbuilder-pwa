<!--
@component
The navbar component.
-->
<script>
    import Dropdown from './Dropdown.svelte';
    import { TextAppearanceIcon } from '$lib/icons';
    import config from '$lib/data/config';

    const countThemes = config.themes.filter((x) => x.enabled).length;

    const showTextAppearence =
        config.mainFeatures['text-font-size-slider'] ||
        config.mainFeatures['text-line-height-slider'] ||
        countThemes > 1;
</script>

<!-- TextAppearanceSelector -->
{#if showTextAppearence}
    <Dropdown>
        <svelte:fragment slot="label">
            <TextAppearanceIcon _class="fill-white" />
        </svelte:fragment>
        <!-- TODO: implement text appearance options -->
    </Dropdown>
{/if}
