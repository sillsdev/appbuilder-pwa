<!--
@component
The navbar component.
-->
<script>
    import { TextAppearanceIcon } from '$lib/icons';
    import { language, languages } from '$lib/data/stores';
    import config from '$lib/data/config';

    const countThemes = config.themes.filter((x) => x.enabled).length;

    const showTextAppearence =
        config.mainFeatures['text-font-size-slider'] ||
        config.mainFeatures['text-line-height-slider'] ||
        countThemes > 1;

    // TEMP: Use TextAppearance button to rotate through languages to test i18n
    const arrayRotate = (arr) => {
        arr.push(arr.shift());
        return arr;
    };

    const rotateLanguages = () => {
        let langs = [...languages];
        while (langs[0] != $language) {
            langs = arrayRotate(langs);
            console.log(`LANGUAGE: {$language}, LANGS:`, langs);
        }
        $language = langs[1];
    };
</script>

<!-- TextAppearanceSelector -->
{#if showTextAppearence}
    <button class="dy-btn dy-btn-ghost dy-btn-circle" on:click={rotateLanguages}>
        <TextAppearanceIcon _class="fill-white" />
        <!-- TODO: implement text appearance options -->
    </button>
{/if}
