<!--
@component
The navbar component.
-->
<script>
    import Dropdown from './Dropdown.svelte';
    import { TextAppearanceIcon } from '$lib/icons';
    import { language, languages, theme, themes } from '$lib/data/stores';
    import config from '$lib/data/config';
    import TabsMenu from './TabsMenu.svelte';

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

    // <button class="dy-btn dy-btn-ghost dy-btn-circle">
</script>

<!-- TextAppearanceSelector -->
{#if showTextAppearence}
<div class="dy-dropdown dy-dropdown-end">
    <Dropdown>
        <svelte:fragment slot="label">
            <TextAppearanceIcon color="white" />
        </svelte:fragment>
        <svelte:fragment slot="content">
            <!-- Sliders for when text appearence text size is implemented place holder no functionality-->
            <input type="range" min="0" max="100" value="60" class="dy-range dy-range-xs" />
            <input type="range" min="0" max="100" value="60" class="dy-range dy-range-xs" />
            <!-- Theme Selction buttons-->
        </svelte:fragment>
    </Dropdown>
</div>
{/if}
