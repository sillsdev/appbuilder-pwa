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
    <button class="dy-btn dy-btn-ghost dy-btn-circle">
        <TextAppearanceIcon _class="fill-white" />
        <!-- TODO: implement text appearance options -->
    </button>
{/if}
