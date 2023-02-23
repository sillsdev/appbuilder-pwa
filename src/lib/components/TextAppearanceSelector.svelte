<!--
@component
The navbar component.
TODO
- Add functionality to sliders
- Add icons to sliders as well and a font size on the end.
-->
<script>
    import Dropdown from './Dropdown.svelte';
    import { TextAppearanceIcon, ImageIcon } from '$lib/icons';
    import {
        language,
        languages,
        theme,
        themes,
        bodyFontSize,
        bodyLineHeight
    } from '$lib/data/stores';
    import config from '$lib/data/config';
    import ImagesIcon from '$lib/icons/image/ImagesIcon.svelte';

    const showFontSize = config.mainFeatures['text-font-size-slider'];
    const showLineHeight = config.mainFeatures['text-line-height-slider'];
    const showThemes = themes.length > 1;
    const showTextAppearence = showFontSize || showLineHeight || showThemes;

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

    const buttonBackground = (theme) => {
        const backgroundColor = config.styles.find((x) => x.name === 'ui.background').properties[
            'background-color'
        ];
        if (backgroundColor.startsWith('#')) {
            return backgroundColor;
        }
        return config.themes.find((x) => x.name === theme).colorSets.find((c) => c.type === 'main')
            .colors[backgroundColor];
    };

    const buttonBorder = (theme, currentTheme) => {
        return (
            (theme === currentTheme ? '3px' : '1px') +
            ' solid ' +
            (theme === 'Dark' ? '#FFFFFF' : '#888888')
        );
    };

    const formatLineHeight = (lineHeight) => {
        const displayValue = (lineHeight / 100).toLocaleString(undefined, {
            minimumFractionDigits: 2
        });
        return displayValue;
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
                {#if showFontSize}
                    <div class="grid gap-4 items-center range-row m-2 ">
                        <TextAppearanceIcon
                            color={$theme === 'Dark' ? 'white' : 'black'}
                            size="1rem"
                        />
                        <input
                            type="range"
                            min={config.mainFeatures['text-size-min']}
                            max={config.mainFeatures['text-size-max']}
                            bind:value={$bodyFontSize}
                            class="dy-range dy-range-xs"
                        />
                        <div class="text-sm place-self-end">{$bodyFontSize}</div>
                    </div>
                {/if}
                {#if showLineHeight}
                    <div class="grid gap-4 items-center range-row m-2 ">
                        <ImageIcon.FormatLineSpacing
                            color={$theme === 'Dark' ? 'white' : 'black'}
                            size="1rem"
                        />
                        <input
                            type="range"
                            min="100"
                            max="250"
                            bind:value={$bodyLineHeight}
                            class="dy-range dy-range-xs"
                        />
                        <div class="text-sm place-self-end ">
                            {formatLineHeight($bodyLineHeight)}
                        </div>
                    </div>
                {/if}
                <!-- Theme Selction buttons-->
                {#if showThemes}
                    <div
                        class="grid gap-2 m-2"
                        class:grid-cols-2={themes.length === 2}
                        class:grid-cols-3={themes.length === 3}
                    >
                        {#if themes.includes('Normal')}
                            <button
                                class="dy-btn-sm"
                                style:background-color={buttonBackground('Normal')}
                                style:border={buttonBorder('Normal', $theme)}
                                on:click={() => ($theme = 'Normal')}
                            />
                        {/if}
                        <button
                            class="dy-btn-sm"
                            style:background-color={buttonBackground('Sepia')}
                            style:border={buttonBorder('Sepia', $theme)}
                            on:click={() => ($theme = 'Sepia')}
                        />
                        <button
                            class="dy-btn-sm"
                            style:background-color={buttonBackground('Dark')}
                            style:border={buttonBorder('Dark', $theme)}
                            on:click={() => ($theme = 'Dark')}
                        />
                    </div>
                {/if}
            </svelte:fragment>
        </Dropdown>
    </div>
{/if}

<style>
    .range-row {
        grid-template-columns: 1rem auto 1rem;
    }
</style>
