<!--
@component
The navbar component.
TODO
- Add functionality to sliders
- Add icons to sliders as well and a font size on the end.
-->
<script>
    import Dropdown from './Dropdown.svelte';
    import { TextAppearanceIcon } from '$lib/icons';
    import { language, languages, theme, themes, s, convertStyle } from '$lib/data/stores';
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
        }
    };

    const rotateLanguages = () => {
        $language = rotate(languages, $language);
    };

    const handleNormalClick = () => {
        $theme = themes[0];
    };

    const handleSepiaClick = () => {
        $theme = themes[1];
    };

    const handleDarkClick = () => {
        $theme = themes[2];
    };
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
                <div class="wrapper">
                    <button
                        class="dy-btn "
                        style={convertStyle($s['ui.primarycolor'])}
                        on:click={handleNormalClick}
                    />
                    <button
                        class="dy-btn "
                        style={convertStyle($s['ui.'])}
                        on:click={handleSepiaClick}
                    />
                    <button
                        class="dy-btn "
                        style={convertStyle($s['ui.'])}
                        on:click={handleDarkClick}
                    />
                </div>
            </svelte:fragment>
        </Dropdown>
    </div>
{/if}

<style>
    div.wrapper {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 8px;
        padding: 0.5em 0;
        margin-left: 8px;
        margin-right: 8px;
    }
</style>
