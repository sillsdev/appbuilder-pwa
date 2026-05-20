<!--
@component
The navbar component. We have sliders that update reactively to both font size and line height.
3 buttons to change the style from normal, sepia and dark.
-->
<svelte:options accessors={true} />

<script module>
    export function showFonts(
        /** @type {unknown[]} */ choices,
        /** @type {boolean} */ contentsMode = false
    ) {
        return !contentsMode && choices.length > 1;
    }
    export function showFontSize() {
        return config.mainFeatures['text-font-size-slider'];
    }
    export function showLineHeight(/** @type {boolean} */ contentsMode = false) {
        return !contentsMode && config.mainFeatures['text-line-height-slider'];
    }
    export function showThemes() {
        return themes.length > 1;
    }
    export function showTextAppearance(
        /** @type {unknown[]} */ choices,
        /** @type {boolean} */ contentsMode = false
    ) {
        return (
            showFontSize() ||
            showLineHeight(contentsMode) ||
            showThemes() ||
            showFonts(choices, contentsMode)
        );
    }
</script>

<script>
    import config from '$assets/config';
    import {
        bodyFontSize,
        bodyLineHeight,
        contentsFontSize,
        currentFont,
        fontChoices,
        language,
        languages,
        modal,
        ModalType,
        monoIconColor,
        theme,
        themeColors,
        themes
    } from '$lib/data/stores';
    import { ImageIcon, TextAppearanceIcon } from '$lib/icons';
    import Modal from './Modal.svelte';
    import Slider from './Slider.svelte';

    let modalId = 'textAppearanceSelector';
    let modalThis;
    export function showModal() {
        modalThis.showModal();
    }

    export let options = {};
    $: contentsMode = options?.contentsMode ?? false;
    export let vertOffset = '1rem'; //Prop that will have the navbar's height (in rem) passed in
    //The positioningCSS positions the modal 1rem below the navbar and 1rem from the right edge of the screen (on mobile it will be centered)
    $: positioningCSS =
        'position:absolute; top:' +
        (Number(vertOffset.replace('rem', '')) + 1) +
        'rem; inset-inline-end:1rem;';
    $: barColor = $themeColors['SliderBarColor'];
    $: progressColor = $themeColors['SliderProgressColor'];
    const _showFontSize = showFontSize();
    $: _showFonts = showFonts($fontChoices, contentsMode);
    const _showThemes = showThemes();
    $: _showLineHeight = showLineHeight(contentsMode);

    $: _showTextAppearance = showTextAppearance($fontChoices, contentsMode);

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
{#if _showTextAppearance}
    <!-- svelte-ignore a11y_consider_explicit_label -->
    <Modal bind:this={modalThis} id={modalId} addCSS={positioningCSS}>
        <div class="grid gap-4">
            <!-- Sliders for when text appearence text size is implemented place holder no functionality-->
            {#if _showFontSize}
                <div class="grid gap-4 items-center range-row m-2">
                    <TextAppearanceIcon color={$monoIconColor} />
                    {#if contentsMode}
                        <Slider
                            bind:value={$contentsFontSize}
                            {barColor}
                            {progressColor}
                            min={config.mainFeatures['text-size-min']}
                            max={config.mainFeatures['text-size-max']}
                        />
                    {:else}
                        <Slider
                            bind:value={$bodyFontSize}
                            {barColor}
                            {progressColor}
                            min={config.mainFeatures['text-size-min']}
                            max={config.mainFeatures['text-size-max']}
                        />
                    {/if}
                    <div class="text-md text-{$monoIconColor} place-self-end">
                        {contentsMode ? $contentsFontSize : $bodyFontSize}
                    </div>
                </div>
            {/if}
            {#if _showLineHeight}
                <div class="grid gap-4 items-center range-row m-2">
                    <ImageIcon.FormatLineSpacing color={$monoIconColor} />
                    <Slider
                        bind:value={$bodyLineHeight}
                        {barColor}
                        {progressColor}
                        min="100"
                        max="250"
                    />
                    <div class="text-md text-{$monoIconColor} place-self-end">
                        {formatLineHeight($bodyLineHeight)}
                    </div>
                </div>
            {/if}
            {#if _showFonts}
                <div class="grid gap-4 items-center range-row m-2">
                    <ImageIcon.FontChoice color={$monoIconColor} />
                    <button
                        class="dy-btn-sm col-span-2 rounded"
                        style:border="1px dotted"
                        style:font-family={$currentFont}
                        style:font-size="large"
                        style:color={$monoIconColor}
                        on:click={() => modal.open(ModalType.Font)}
                        >{config.fonts.find((x) => x.family === $currentFont)?.name}</button
                    >
                </div>
            {/if}
            <!-- Theme Selction buttons-->
            {#if _showThemes}
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
                        ></button>
                    {/if}
                    {#if themes.includes('Sepia')}
                        <button
                            class="dy-btn-sm"
                            style:background-color={buttonBackground('Sepia')}
                            style:border={buttonBorder('Sepia', $theme)}
                            on:click={() => ($theme = 'Sepia')}
                        ></button>
                    {/if}
                    {#if themes.includes('Dark')}
                        <button
                            class="dy-btn-sm"
                            style:background-color={buttonBackground('Dark')}
                            style:border={buttonBorder('Dark', $theme)}
                            on:click={() => ($theme = 'Dark')}
                        ></button>
                    {/if}
                </div>
            {/if}
        </div>
    </Modal>
{/if}

<style>
    .range-row {
        grid-template-columns: 1.5rem auto 1.5rem;
    }
</style>
