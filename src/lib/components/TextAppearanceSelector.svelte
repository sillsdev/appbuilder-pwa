<!--
@component
The navbar component.
-->
<script>
    import { TextAppearanceIcon } from '$lib/icons';
    import { language, languages, theme, themes } from '$lib/data/stores';
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

    const rotate = (items, current) => {
        let mod = [...items];
        while (mod[0] != current) {
            mod = arrayRotate(mod);
        }
        return mod[1];
    };

    const handleClick = (event) => {
        console.log(event);
        if (event.shiftKey) {
            rotateLanguages();
        } else {
            rotateThemes();
        }
    };
    const rotateLanguages = () => {
        $language = rotate(languages, $language);
    };

    const rotateThemes = () => {
        $theme = rotate(themes, $theme);
    };
</script>

<!-- TextAppearanceSelector -->
{#if showTextAppearence}
    <button class="dy-btn dy-btn-ghost dy-btn-circle" on:click={handleClick}>
        <TextAppearanceIcon color="white" />
        <!-- TODO: implement text appearance options -->
    </button>
{/if}
