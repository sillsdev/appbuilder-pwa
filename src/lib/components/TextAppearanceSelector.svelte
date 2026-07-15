<!--
@component
The navbar component. We have sliders that update reactively to both font size and line height.
3 buttons to change the style from normal, sepia and dark.
-->

<script module lang="ts">
    export function showFonts(choices: unknown[], contentsMode = false) {
        return !contentsMode && choices.length > 1;
    }
    export function showFontSize() {
        return config.mainFeatures['text-font-size-slider'];
    }
    export function showLineHeight(contentsMode = false) {
        return !contentsMode && config.mainFeatures['text-line-height-slider'];
    }
    export function showThemes() {
        return themes.length > 1;
    }
    export function showTextAppearance(choices: unknown[] = [], contentsMode = false) {
        return (
            showFontSize() ||
            showLineHeight(contentsMode) ||
            showThemes() ||
            showFonts(choices, contentsMode)
        );
    }
</script>

<script lang="ts">
    import config from '$assets/config';
    import {
        bodyFontSize,
        bodyLineHeight,
        contentsFontSize,
        currentFont,
        fontChoices,
        getPositioningCSS,
        language,
        languages,
        modal,
        ModalType,
        monoIconColor,
        theme,
        themeColors,
        themeIsDark,
        themes
    } from '$lib/data/stores';
    import { ImageIcon, TextAppearanceIcon } from '$lib/icons';
    import Modal from './Modal.svelte';
    import Slider from './Slider.svelte';

    let modalId = 'textAppearanceSelector';
    let modalThis: HTMLDialogElement | undefined = $state();
    export function showModal() {
        modalThis?.showModal();
    }

    export function setOptions(val: Props['options']) {
        options = val;
    }

    interface Props {
        options?: { contentsMode?: boolean } & Record<string, unknown>;
        vertOffset?: string; //Prop that will have the navbar's height (in rem) passed in
    }

    let { options, vertOffset = '1rem' }: Props = $props();

    const contentsMode = $derived(options?.contentsMode ?? false);
    //The positioningCSS positions the modal 1rem below the navbar and 1rem from the right edge of the screen (on mobile it will be centered)
    const positioningCSS = $derived(getPositioningCSS(vertOffset, 'top'));
    const barColor = $derived($themeColors['SliderBarColor']);
    const progressColor = $derived($themeColors['SliderProgressColor']);
    const _showFontSize = showFontSize();
    const _showFonts = $derived(showFonts($fontChoices ?? [], contentsMode));
    const _showThemes = showThemes();
    const _showLineHeight = $derived(showLineHeight(contentsMode));

    const _showTextAppearance = $derived(showTextAppearance($fontChoices ?? [], contentsMode));

    // TEMP: Use TextAppearance button to rotate through languages to test i18n
    function arrayRotate<T>(arr: T[]) {
        if (arr.length) {
            arr.push(arr.shift()!);
        }
        return arr;
    }

    function rotate<T>(items: T[], current: T) {
        let mod = [...items];
        while (mod[0] !== current) {
            mod = arrayRotate(mod);
        }
        return mod[1];
    }

    const handleClick = (event: KeyboardEvent) => {
        console.log(event);
        if (event.shiftKey) {
            rotateLanguages();
        }
    };

    const rotateLanguages = () => {
        $language = rotate(languages, $language);
    };

    const buttonBackground = (theme: string) => {
        const backgroundColor = config.styles?.find((x) => x.name === 'ui.background')?.properties[
            'background-color'
        ];
        if (backgroundColor?.startsWith('#')) {
            return backgroundColor;
        }
        return config.themes
            ?.find((x) => x.name === theme)
            ?.colorSets.find((c) => c.type === 'main')?.colors[backgroundColor ?? ''];
    };

    const buttonBorder = (theme: string, currentTheme: string) => {
        return (
            (theme === currentTheme ? '3px' : '1px') +
            ' solid ' +
            (themeIsDark(theme) ? '#FFFFFF' : '#888888')
        );
    };

    const formatLineHeight = (lineHeight: number) => {
        const displayValue = (lineHeight / 100).toLocaleString(undefined, {
            minimumFractionDigits: 2
        });
        return displayValue;
    };
</script>

<!-- TextAppearanceSelector -->
{#if _showTextAppearance}
    <!-- svelte-ignore a11y_consider_explicit_label -->
    <Modal
        bind:dialog={modalThis}
        id={modalId}
        styling="background-color:{$themeColors['PopupBackgroundColor']}; {positioningCSS}"
    >
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
                            min={config.mainFeatures['text-size-min'] as number}
                            max={config.mainFeatures['text-size-max'] as number}
                        />
                    {:else}
                        <Slider
                            bind:value={$bodyFontSize}
                            {barColor}
                            {progressColor}
                            min={config.mainFeatures['text-size-min'] as number}
                            max={config.mainFeatures['text-size-max'] as number}
                        />
                    {/if}
                    <div class="text-base text-{$monoIconColor} place-self-end">
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
                        min={100}
                        max={250}
                    />
                    <div class="text-base text-{$monoIconColor} place-self-end">
                        {formatLineHeight($bodyLineHeight)}
                    </div>
                </div>
            {/if}
            {#if _showFonts}
                <div class="grid gap-4 items-center range-row m-2">
                    <ImageIcon.FontChoice color={$monoIconColor} />
                    <button
                        class="dy-btn-sm col-span-2 rounded-sm"
                        style:border="1px dotted"
                        style:font-family={$currentFont}
                        style:font-size="large"
                        style:color={$monoIconColor}
                        onclick={() => modal.open(ModalType.Font)}
                    >
                        {config.fonts?.find((x) => x.family === $currentFont)?.name}
                    </button>
                </div>
            {/if}
            <!-- Theme Selction buttons-->
            {#if _showThemes}
                <div class="grid grid-cols-{themes.length} gap-2 m-2">
                    {#each themes as t}
                        <button
                            class="dy-btn-sm"
                            style:background-color={buttonBackground(t)}
                            style:border={buttonBorder(t, $theme)}
                            onclick={() => ($theme = t)}
                        ></button>
                    {/each}
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
