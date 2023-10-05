<!--
@component
The verse on image component.
-->
<script>
    import { onMount } from 'svelte';
    import Slider from './Slider.svelte';
    import CropImage from './CropImage.svelte';
    import { TextAppearanceIcon } from '$lib/icons';
    import { ImageIcon } from '$lib/icons/image';
    import {
        language,
        languages,
        theme,
        themes,
        monoIconColor,
        themeColors,
        selectedVerses,
        windowSize,
        direction,
        fontChoices,
        currentFont,
        modal,
        MODAL_CROP,
        s
    } from '$lib/data/stores';
    import { shareImage } from '$lib/data/share';
    import { base } from '$app/paths';
    import config from '$lib/data/config';
    import { toPng } from 'html-to-image';
    import ImagesIcon from '$lib/icons/image/ImagesIcon.svelte';
    import FontList from '$lib/components/FontList.svelte';
    import ColorPicker from 'svelte-awesome-color-picker';

    $: barColor = $themeColors['SliderBarColor'];
    $: progressColor = $themeColors['SliderProgressColor'];
    $: unselectedColor = 'grey';

    $: viewportWidth_in_px = Math.max(
        document.documentElement.clientWidth || 0,
        window.innerWidth || 0
    );
    $: viewportHeight_in_px = Math.max(
        document.documentElement.clientHeight || 0,
        window.innerHeight || 0
    );

    $: reference = selectedVerses.getCompositeReference();
    let verses;
    let voi_imgSrc;
    let voi_parentDiv;
    $: voi_width = cnvFullScreen ? viewportWidth_in_px : viewportHeight_in_px / 2;
    $: voi_height = voi_width;
    $: cnvFullScreen = $windowSize.width < 450;
    let cnv;

    let cnv_background;
    let voi_textBox;
    $: txtFormatted = verses;
    let voi_verseBold = $s['ui.text-on-image']['font-weight'] == 'bold';
    let voi_verseItalic = $s['ui.text-on-image']['font-style'] == 'italic';
    let voi_fontSize = 13;
    let voi_fontSizeMin = 10;
    let voi_fontSizeMax = 60;
    let voi_font = $currentFont;
    let voi_refBold = '';
    let voi_refItalic = $s['ui.text-on-image']['font-style'] == 'italic';
    let voi_refFontPercent = 80;
    let voi_fontColor = standardize_color(String($s['ui.text-on-image']['color']));
    let voi_letterSpacing = 0;
    let voi_lineHeight_x100 = 0;
    $: voi_lineHeight = 1 + voi_lineHeight_x100 / 100;
    let voi_txtPadding = '0px';
    let voi_textAlign = 'center';
    let voi_textBoxWidthPercent = 84;
    $: voi_textBoxWidth = (voi_width * voi_textBoxWidthPercent) / 100;
    let voi_textBoxHeight;
    $: voi_textBox_maxHeight = voi_height - voi_textPosY;
    let voi_textShadow_mode = 'glow';
    let voi_textShadow_value = 15;
    $: voi_textShadow =
        voi_textShadow_mode == 'none'
            ? ''
            : (voi_textShadow_mode == 'shadow'
                  ? (voi_fontSize * voi_textShadow_value) / 100 +
                    'px ' +
                    (voi_fontSize * voi_textShadow_value) / 100 +
                    'px ' +
                    (voi_fontSize * voi_textShadow_value) / 100
                  : '0 0 ' + ((voi_fontSize * voi_textShadow_value) / 100) * 2) + 'px black';
    let voi_imageBrightness = 100;
    let voi_imageContrast = 100;
    let voi_imageSaturation = 100;
    let voi_imageBlur = 0;

    export let crop_sourceX,
        crop_sourceY,
        crop_sourceWidth,
        crop_sourceHeight,
        crop_destX,
        crop_destY,
        crop_destWidth,
        crop_destHeight;

    function applyCrop(img) {
        /*DEBUG*/ console.log('ApplyCrop triggered.');
        cnv_background = img;
        /*DEBUG*/ console.log('newImg result = ', img);
    }

    $: update_voi_textBoxHeight(
        txtFormatted,
        voi_fontSize,
        voi_font,
        voi_verseBold,
        voi_verseItalic,
        voi_letterSpacing,
        voi_lineHeight_x100,
        voi_lineHeight,
        voi_txtPadding,
        voi_textAlign,
        voi_textBoxWidth
    );

    function update_voi_textBoxHeight(
        txtFormatted = '',
        voi_fontSize = '',
        voi_font = '',
        voi_bold = '',
        voi_italic = '',
        voi_letterSpacing = '',
        voi_lineHeight_x100 = '',
        voi_lineHeight = '',
        voi_txtPadding = '',
        voi_textAlign = '',
        voi_textBoxWidth = ''
    ) {
        voi_textBoxHeight = voi_textBox ? voi_textBox.clientHeight : '[voi_textBox = false]';
    }

    function standardize_color(str) {
        var ctx = document.createElement('canvas').getContext('2d');
        ctx.fillStyle = str;
        return ctx.fillStyle;
    }

    $: render(
        cnv_background,
        voi_imageBrightness,
        voi_imageContrast,
        voi_imageSaturation,
        voi_imageBlur
    );

    function render(background, imgBrightness, imgContrast, imgSaturation, imgBlur) {
        if (!cnv) return;
        const context = cnv.getContext('2d');
        context.filter = `brightness(${imgBrightness}%) contrast(${imgContrast}%) saturate(${imgSaturation}%) blur(${imgBlur}px)`;
        context.drawImage(background, 0, 0, cnv.width, cnv.height);
    }

    $: updateImgSrc(voi_imgSrc);

    function updateImgSrc(imgSrc) {
        const img = new Image();
        img.src = imgSrc;
        // Make sure the image is loaded first otherwise nothing will draw.
        img.onload = function () {
            cnv_background = img;
        };
        /*DBEUG*/ console.log('src= ', imgSrc);
    }

    /**
     * 1. Start with the inital size of the text being 7% of the height of the image.
     * 2. For larger passages of text, change the initial size until the height of the
     * text is < 80% of the height.
     * 3. Change the size until you get to 90% of the height and use that as the max size.
     *
     * This is an approximation and it is possible for the text to grow larger than the image
     * due to different text properties.  It is okay.
     *
     * The text has to re-render in order to get the text height at the different sizes so we
     * need to use the `ResizeObserver` and there are three passes through the `ResizeObserver`.
     * 1. decrease the percentage by 1/2% until we get to 80%. We will already be there with shorter text. (fontSize = undefined)
     * 2. increate the percentage by 2% until we get to 90%. (fontSize defined, fontSizeMax = undefined)
     * 3. reset back to the initial text size we figured out in #1 so that we can center the text. (fontsize and fontSizeMax define)
     */
    function initFontSizesAndCenterText() {
        const textOverlay = document.getElementById('verseOnImageTextDiv');
        const textDisplay = textOverlay.style.display;
        let fontSize;
        let fontSizeMax;
        textOverlay.style.display = 'none'; // hide until done calculating sizes

        const getFontSize = (percent, height) => {
            const px2pt = (px) => (px * 72) / 96;
            return px2pt((percent * height) / 100);
        };

        let fontSizePercent = 7;
        voi_fontSize = getFontSize(fontSizePercent, voi_height);

        const adjustFontSize = () => {
            if (!fontSize) {
                if (textOverlay.offsetHeight > 0.8 * voi_height && fontSizePercent > 0.5) {
                    fontSizePercent -= 0.5;
                    voi_fontSize = getFontSize(fontSizePercent, voi_height);
                } else {
                    fontSize = voi_fontSize;
                    fontSizePercent += 2.0;
                    voi_fontSize = getFontSize(fontSizePercent, voi_height);
                }
            } else if (!fontSizeMax) {
                if (textOverlay.offsetHeight < 0.9 * voi_height) {
                    fontSizePercent += 2.0;
                    voi_fontSize = getFontSize(fontSizePercent, voi_height);
                } else {
                    fontSizeMax = voi_fontSize;
                    voi_fontSizeMax = fontSizeMax;
                    voi_fontSize = fontSize;
                }
            } else {
                voi_textPosX = (voi_width - textOverlay.offsetWidth) / 2;
                voi_textPosY = (voi_height - textOverlay.offsetHeight) / 2;
                resizeObserver.unobserve(textOverlay);
                textOverlay.style.display = textDisplay;
            }
        };
        const resizeObserver = new ResizeObserver(adjustFontSize);
        resizeObserver.observe(textOverlay);
    }

    onMount(async () => {
        verses = await selectedVerses.getCompositeText();

        voi_imgSrc = base + '/backgrounds/' + config.backgroundImages[0].filename;
        initFontSizesAndCenterText();

        centerButton(0);
    });

    function handleFontChange(f) {
        voi_font = f;
    }

    // Share button feature:
    export function shareCanvas() {
        var node = document.getElementById('verseOnImgPreview');
        toPng(node)
            .then(function (dataUrl) {
                fetch(dataUrl)
                    .then((response) => response.blob())
                    .then((blob) => {
                        shareImage(reference, verses, reference + '.png', blob);
                    })
                    .catch((error) => {
                        console.error('Error fetching data:', error);
                    });
            })
            .catch(function (error) {
                console.error('oops, something went wrong!', error);
            });
    }

    // EditorTabs centering feature:

    let active_editor_index = -1;

    function centerButton(n) {
        const container = document.getElementById('editorTabs');
        const containerRect = container.getBoundingClientRect();
        const buttons = document.querySelectorAll('#editorTabs button');
        const button = n >= 0 && n < buttons.length ? buttons[n] : null;
        const buttonRect = button.getBoundingClientRect();

        const scrollOffset =
            buttonRect.left - containerRect.left - containerRect.width / 2 + buttonRect.width / 2;

        container.scrollBy({ left: scrollOffset, behavior: 'smooth' });

        let carousel = document.getElementById('editorsPane');
        const editors = carousel.children; // document.querySelectorAll('#editorsPane div');// Get the carousel's children.
        if (n < editors.length) {
            const itemWidth = editors[0].offsetWidth; // Calculate the width of each carousel item

            const scrollDistance = n * itemWidth; // Calculate the total scroll distance to reach the nth child

            carousel.scrollTo({ left: scrollDistance, behavior: 'auto' }); // Scroll the carousel to the desired position
        } else {
            console.error('Invalid child index');
        }

        // Remove the activeButton class from all buttons
        buttons.forEach((btn) => {
            btn.classList.remove('activeButton');
        });

        // Set the clicked button as the activeButton
        active_editor_index = n;
        button.classList.add('activeButton');
    }

    // voi_textBox Dragability:

    let voi_textPosX = 0;
    let voi_textPosY = 0;
    let dragging = false;
    let offsetX, offsetY;

    function voiTextBox_handleMouseMove(event) {
        if (dragging) {
            voi_textPosX = event.clientX - offsetX;
            voi_textPosY = event.clientY - offsetY;
            const newX = event.clientX - offsetX;
            const newY = event.clientY - offsetY;

            // Prevent child div from going outside the parent borders
            const parentRect = voi_parentDiv.getBoundingClientRect();
            const childRect = voi_textBox.getBoundingClientRect();
            voi_textPosX = Math.max(0, Math.min(newX, parentRect.width - childRect.width));
            voi_textPosY = Math.max(0, Math.min(newY, parentRect.height - childRect.height));
        }
    }

    function voiTextBox_handleMouseDown(event) {
        dragging = true;
        offsetX = event.clientX - voi_textPosX; // Update offsetX
        offsetY = event.clientY - voi_textPosY; // Update offsetY

        function handleMouseUp() {
            dragging = false;
            window.removeEventListener('mousemove', voiTextBox_handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        }

        window.addEventListener('mousemove', voiTextBox_handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    }
</script>

<div
    id="verseOnImageContainer"
    class="flex flex-col flex-nowrap max-w-screen-sm mx-auto"
    style="height: 100%; max-width: {voi_width}px;"
    style:direction={$direction}
>
    <!-- verseOnImgPreview -->
    <div id="verseOnImgPreviewContainer" class="flex flex-col items-center">
        <div
            id="verseOnImgPreview"
            bind:this={voi_parentDiv}
            class="flex flex-col"
            style="width:{voi_width}px; height:{voi_height}px;"
        >
            <!-- Preview display of the image and text -->

            <canvas
                bind:this={cnv}
                width={cnvFullScreen ? viewportWidth_in_px + 'px' : viewportHeight_in_px / 2 + 'px'}
                height={cnvFullScreen
                    ? viewportWidth_in_px + 'px'
                    : viewportHeight_in_px / 2 + 'px'}
                style="position: relative; z-index: 1;"
            />

            <p
                id="verseOnImageTextDiv"
                style="
                    position: absolute;
                    z-index: 2;
                    width: {voi_textBoxWidth}px;
                    height: auto;
                    max-width: {voi_width}px;
                    max-height: {voi_textBox_maxHeight};
                    color: {voi_fontColor};
                    font-family: {voi_font};
                    font-size: {voi_fontSize}pt;
                    {voi_verseBold ? 'font-weight: bold;' : ''}
                    {voi_verseItalic ? 'font-style: italic;' : ''}
                    letter-spacing: {voi_letterSpacing / 100}em;
                    line-height: {voi_lineHeight};
                    padding: {voi_txtPadding};
                    text-align: {voi_textAlign};
                    text-shadow: {voi_textShadow};
                    overflow: hidden;
                    user-drag: none;
                    transform: translate({voi_textPosX}px, {voi_textPosY}px);
                    border: 3px solid lightgreen;
                "
                class="flex flex-col"
                bind:this={voi_textBox}
                on:mousedown={voiTextBox_handleMouseDown}
                on:touchstart={(event) => voiTextBox_handleMouseDown(event.touches[0])}
                on:touchmove={(event) => {
                    event.preventDefault();
                    voiTextBox_handleMouseMove(event.touches[0]);
                }}
                on:touchend={() => {
                    dragging = false;
                }}
            >
                {txtFormatted}
                <span
                    id="verseOnImageRefDiv"
                    class="flex flex-col justify-center items-center"
                    style="height: {voi_fontSize * 1.5}pt;"
                >
                    <span
                        class="flex flex-col justify-center items-center"
                        style="
                            font-size: {(voi_fontSize * voi_refFontPercent) / 100}pt;
                            {voi_refBold ? 'font-weight: bold;' : 'font-weight: normal;'}
                            {voi_refItalic ? 'font-style: italic;' : 'font-style: normal;'}
                            height: {voi_fontSize}pt;
                            width: {voi_textBoxWidth}px;
                            position: absolute;
                            bottom: 0;
                        "
                    >
                        {reference}
                    </span>
                </span>
            </p>
        </div>
    </div>

    <!-- Editor Tabs -->
    <div
        id="editorTabs"
        class="flex flex-row flex-nowrap"
        style="
            overflow-x: scroll;
            overflow-y: visible;
            min-height: 2.7rem;
            z-index: 3;
            --tabWidth: {voi_width / 5}px; 
            background-color: {$themeColors['ImageTabsBackgroundColor']};
        "
    >
        <!-- NavBar of tab buttons to bring up the different editor panes -->
        <button
            class="dy-btn-sm dy-btn-ghost"
            on:click={() => centerButton(0)}
            class:activeButton={active_editor_index == 0}
        >
            <ImageIcon.Image color={active_editor_index == 0 ? progressColor : unselectedColor} />
        </button>
        <button
            class="dy-btn-sm dy-btn-ghost"
            on:click={() => centerButton(1)}
            class:activeButton={active_editor_index == 1}
        >
            <ImageIcon.FontChoice
                color={active_editor_index == 1 ? progressColor : unselectedColor}
            />
        </button>
        <button
            class="dy-btn-sm dy-btn-ghost"
            on:click={() => centerButton(2)}
            class:activeButton={active_editor_index == 2}
        >
            <TextAppearanceIcon
                color={active_editor_index == 2 ? progressColor : unselectedColor}
            />
        </button>
        <button
            class="dy-btn-sm dy-btn-ghost"
            on:click={() => centerButton(3)}
            class:activeButton={active_editor_index == 3}
        >
            <ImageIcon.FormatAlignCenter
                color={active_editor_index == 3 ? progressColor : unselectedColor}
            />
        </button>
        <button
            class="dy-btn-sm dy-btn-ghost"
            on:click={() => centerButton(4)}
            class:activeButton={active_editor_index == 4}
        >
            <ImageIcon.FormatColorFill
                color={active_editor_index == 4 ? progressColor : unselectedColor}
            />
        </button>
        <button
            class="dy-btn-sm dy-btn-ghost"
            on:click={() => centerButton(5)}
            class:activeButton={active_editor_index == 5}
        >
            <ImageIcon.TextShadow
                color={active_editor_index == 5 ? progressColor : unselectedColor}
            />
        </button>
        <button
            class="dy-btn-sm dy-btn-ghost"
            on:click={() => centerButton(6)}
            class:activeButton={active_editor_index == 6}
        >
            <ImageIcon.Brightness
                color={active_editor_index == 6 ? progressColor : unselectedColor}
            />
        </button>
        <button
            class="dy-btn-sm dy-btn-ghost"
            on:click={() => centerButton(7)}
            class:activeButton={active_editor_index == 7}
        >
            <ImageIcon.Blur color={active_editor_index == 7 ? progressColor : unselectedColor} />
        </button>
        <button
            class="dy-btn-sm dy-btn-ghost"
            on:click={() => centerButton(8)}
            class:activeButton={active_editor_index == 8}
        >
            <ImageIcon.Reference
                color={active_editor_index == 8 ? progressColor : unselectedColor}
            />
        </button>
    </div>

    <!-- Pane for the current editor -->
    <div
        id="editorsPane"
        class="dy-w-64 dy-carousel dy-rounded-box"
        style="
            background-color: {$themeColors['DialogBackgroundColor']}; 
            z-index: 3;
            overflow-x: hidden; 
            overflow-y: auto;
            touch-action: none;
        "
    >
        <!-- Image Selector -->
        <div
            id="image_selector_pane"
            class="dy-carousel-item editor_pane"
            style="
                width:100%;
                height: auto;
                --imgWidth: {voi_width / 4}px; 
                overflow-y: auto;
            "
        >
            <div id="image_selector_grid" class="grid grid-cols-4" style="height: fit-content;">
                <!-- Camera roll button -->
                <div
                    class="flex items-center justify-center image_selector_pane_box"
                    style="height: {this.width};"
                >
                    <button
                        class="dy-btn-sm dy-btn-ghost"
                        style="cursor: pointer;"
                        on:click={() => {
                            document.getElementById('fileInput').click();
                            /*DEBUG*/ console.log('Open camera roll');
                        }}
                    >
                        <ImagesIcon color={$monoIconColor} />
                    </button>
                    <input
                        type="file"
                        accept="image/*"
                        id="fileInput"
                        style="display: none; visibility: none;"
                        on:change={(event) => {
                            const selectedFile = event.target.files[0];
                            if (selectedFile) {
                                // newImg.onload = function () {
                                //     //DEBUG WORKHEREFIRST: this is not getting triggered when the modal is closed.
                                //     cnv_background = newImg;
                                //     /*DEBUG*/ console.log('newImg result = ', newImg);
                                // };
                                /*DEBUG*/ console.log('Open Crop Modal');
                                let selectedSrc = URL.createObjectURL(selectedFile);
                                modal.open(MODAL_CROP, { selectedSrc, applyCrop, cnv }); // must not be actually binding the modal-internal references to the {} params being passed in, because $: applyCrop(newImg); is not seeing any change to newImg...
                            }
                        }}
                    />
                </div>
                {#each config.backgroundImages as imgObj}
                    <img
                        src={base + '/backgrounds/' + imgObj.filename}
                        class="image_selector_pane_box"
                        on:click={(event) => {
                            voi_imgSrc = base + '/backgrounds/' + imgObj.filename;
                        }}
                    />
                {/each}
            </div>
        </div>

        <!-- Font Selector Pane -->
        <div class="dy-carousel-item items-center editorPane">
            <FontList
                bind:selectedFont={voi_font}
                on:menuaction={(font) => {
                    handleFontChange(font.detail.font);
                }}
            />
        </div>

        <!-- Font Editor Pane -->
        <div class="dy-carousel-item editorPane items-center">
            <div class="flex flex-row items-center">
                <!-- Bold button -->
                <button
                    class="dy-btn-sm dy-btn-ghost editorPane_button"
                    on:click={() => {
                        voi_verseBold = !voi_verseBold;
                    }}
                >
                    <ImageIcon.FormatBold color={voi_verseBold ? progressColor : unselectedColor} />
                </button>

                <!-- Italic button -->
                <button
                    class="dy-btn-sm dy-btn-ghost editorPane_button"
                    on:click={() => {
                        voi_verseItalic = !voi_verseItalic;
                    }}
                >
                    <ImageIcon.FormatItalic
                        color={voi_verseItalic ? progressColor : unselectedColor}
                    />
                </button>
            </div>

            <!-- Font size slider -->
            <div class="flex flex-row flex-nowrap items-center editorPane_slider">
                <div style="margin-right: 1rem;">
                    <TextAppearanceIcon color={$monoIconColor} size="1.5rem" />
                </div>
                <div class="grid grid-cols-1" style="width: 100%;">
                    <Slider
                        bind:value={voi_fontSize}
                        {barColor}
                        {progressColor}
                        min={voi_fontSizeMin}
                        max={voi_fontSizeMax}
                    />
                </div>
            </div>

            <!-- Letter spacing? slider -->
            <div class="flex flex-row flex-nowrap items-center editorPane_slider">
                <div style="margin-right: 1rem;">
                    <ImageIcon.LetterSpacing color={$monoIconColor} size="1.5rem" />
                </div>
                <div class="grid grid-cols-1" style="width: 100%;">
                    <Slider
                        bind:value={voi_letterSpacing}
                        {barColor}
                        {progressColor}
                        min="0"
                        max="20"
                    />
                </div>
            </div>
        </div>

        <!-- Text Alignemnt and Width and Line Height Pane -->
        <div class="dy-carousel-item items-center editorPane">
            <div class="flex flex-row items-center">
                <!-- Left align button -->
                <button
                    class="dy-btn-sm dy-btn-ghost editorPane_button"
                    on:click={() => {
                        voi_textAlign = 'left';
                    }}
                >
                    <ImageIcon.FormatAlignLeft
                        color={voi_textAlign == 'left' ? progressColor : unselectedColor}
                    />
                </button>

                <!-- Center align button -->
                <button
                    class="dy-btn-sm dy-btn-ghost editorPane_button"
                    on:click={() => {
                        voi_textAlign = 'center';
                    }}
                >
                    <ImageIcon.FormatAlignCenter
                        color={voi_textAlign == 'center' ? progressColor : unselectedColor}
                    />
                </button>

                <!-- Right align button -->
                <button
                    class="dy-btn-sm dy-btn-ghost editorPane_button"
                    on:click={() => {
                        voi_textAlign = 'right';
                    }}
                >
                    <ImageIcon.FormatAlignRight
                        color={voi_textAlign == 'right' ? progressColor : unselectedColor}
                    />
                </button>
            </div>

            <!-- Line height slider -->
            <div class="flex flex-row flex-nowrap items-center editorPane_slider">
                <div style="margin-right: 1rem;">
                    <ImageIcon.FormatLineSpacing color={$monoIconColor} size="1.5rem" />
                </div>
                <div class="grid grid-cols-1" style="width: 100%;">
                    <Slider
                        bind:value={voi_lineHeight_x100}
                        {barColor}
                        {progressColor}
                        min="-20"
                        max="100"
                    />
                </div>
            </div>

            <!-- Width slider -->
            <div class="flex flex-row flex-nowrap items-center editorPane_slider">
                <div style="margin-right: 1rem;">
                    <ImageIcon.TextWidth color={$monoIconColor} size="1.5rem" />
                </div>
                <div class="grid grid-cols-1" style="width: 100%;">
                    <Slider
                        bind:value={voi_textBoxWidthPercent}
                        {barColor}
                        {progressColor}
                        min="20"
                        max={100}
                    />
                </div>
            </div>
        </div>

        <!-- Font Color Pane -->
        <div class="dy-carousel-item editorPane" style="padding-top: 1rem;">
            <!-- Color Picker -->
            <ColorPicker
                toRight={false}
                label="Test Label For Now"
                isInput={false}
                bind:hex={voi_fontColor}
            />
        </div>

        <!-- Text Shadow/Glow Pane -->
        <div class="dy-carousel-item items-center editorPane">
            <div class="flex flex-row items-center">
                <!-- Text Shadow None Toggle -->
                <button
                    class="dy-btn-sm dy-btn-ghost editorPane_button"
                    on:click={() => {
                        voi_textShadow_mode = 'none';
                    }}
                >
                    <ImageIcon.TextShadowNone
                        color={voi_textShadow_mode == 'none' ? progressColor : unselectedColor}
                    />
                </button>

                <!-- Text shadow toggle -->
                <button
                    class="dy-btn-sm dy-btn-ghost editorPane_button"
                    on:click={() => {
                        voi_textShadow_mode = 'shadow';
                    }}
                >
                    <ImageIcon.TextShadow
                        color={voi_textShadow_mode == 'shadow' ? progressColor : unselectedColor}
                    />
                </button>

                <!-- Text glow toggle -->
                <button
                    class="dy-btn-sm dy-btn-ghost editorPane_button"
                    on:click={() => {
                        voi_textShadow_mode = 'glow';
                    }}
                >
                    <ImageIcon.TextGlow
                        color={voi_textShadow_mode == 'glow' ? progressColor : unselectedColor}
                    />
                </button>
            </div>

            <!-- Shadow slider -->
            <div class="flex flex-row flex-nowrap items-center editorPane_slider">
                <div style="margin-right: 1rem;">
                    <ImageIcon.ResizeArrows color={$monoIconColor} size="1.5rem" />
                </div>
                <div class="grid grid-cols-1" style="width: 100%;">
                    <Slider
                        bind:value={voi_textShadow_value}
                        {barColor}
                        {progressColor}
                        min="0"
                        max="20"
                    />
                </div>
            </div>
        </div>

        <!-- Image Editor Pane -->
        <div class="dy-carousel-item items-center editorPane">
            <!-- Image brightness slider -->
            <div class="flex flex-row flex-nowrap items-center editorPane_slider">
                <div style="margin-right: 1rem;">
                    <ImageIcon.Brightness color={$monoIconColor} size="1.5rem" />
                </div>
                <div class="grid grid-cols-1" style="width: 100%;">
                    <Slider
                        bind:value={voi_imageBrightness}
                        {barColor}
                        {progressColor}
                        min="20"
                        max="180"
                    />
                </div>
            </div>

            <!-- Image contrast slider -->
            <div class="flex flex-row flex-nowrap items-center editorPane_slider">
                <div style="margin-right: 1rem;">
                    <ImageIcon.Contrast color={$monoIconColor} size="1.5rem" />
                </div>
                <div class="grid grid-cols-1" style="width: 100%;">
                    <Slider
                        bind:value={voi_imageContrast}
                        {barColor}
                        {progressColor}
                        min="10"
                        max="190"
                    />
                </div>
            </div>

            <!-- Image saturation slider -->
            <div class="flex flex-row flex-nowrap items-center editorPane_slider">
                <div style="margin-right: 1rem;">
                    <ImageIcon.Saturation color={$monoIconColor} size="1.5rem" />
                </div>
                <div class="grid grid-cols-1" style="width: 100%;">
                    <Slider
                        bind:value={voi_imageSaturation}
                        {barColor}
                        {progressColor}
                        min="0"
                        max="200"
                    />
                </div>
            </div>
        </div>

        <!-- Image Blur Pane -->
        <div class="dy-carousel-item items-center editorPane">
            <!-- Image blur slider -->
            <div class="flex flex-row flex-nowrap items-center editorPane_slider">
                <div style="margin-right: 1rem;">
                    <ImageIcon.Blur color={$monoIconColor} size="1.5rem" />
                </div>
                <div class="grid grid-cols-1" style="width: 100%;">
                    <Slider
                        bind:value={voi_imageBlur}
                        {barColor}
                        {progressColor}
                        min="0"
                        max="15"
                    />
                </div>
            </div>
        </div>

        <!-- Refrence Formatting Pane -->
        <div class="dy-carousel-item items-center editorPane">
            <div class="flex flex-row items-center">
                <!-- Ref bold button -->
                <button
                    class="dy-btn-sm dy-btn-ghost editorPane_button"
                    on:click={() => {
                        voi_refBold = !voi_refBold;
                    }}
                >
                    <ImageIcon.FormatBold color={voi_refBold ? progressColor : unselectedColor} />
                </button>

                <!-- Ref italic button -->
                <button
                    class="dy-btn-sm dy-btn-ghost editorPane_button"
                    on:click={() => {
                        voi_refItalic = !voi_refItalic;
                    }}
                >
                    <ImageIcon.FormatItalic
                        color={voi_refItalic ? progressColor : unselectedColor}
                    />
                </button>
            </div>

            <!-- Refrence font size slider -->
            <div class="flex flex-row flex-nowrap items-center editorPane_slider">
                <div style="margin-right: 1rem;">
                    <TextAppearanceIcon color={$monoIconColor} size="1.5rem" />
                </div>
                <div class="grid grid-cols-1" style="width: 100%;">
                    <Slider
                        bind:value={voi_refFontPercent}
                        {barColor}
                        {progressColor}
                        min="50"
                        max="100"
                    />
                </div>
            </div>
        </div>
    </div>

    <div
        style="background-color: {$themeColors[
            'DialogBackgroundColor'
        ]}; flex: 1 1 auto; z-index: 3;"
    />
</div>

<style>
    #editorTabs::-webkit-scrollbar {
        display: none;
    }

    #editorTabs {
        scrollbar-width: none;
    }

    #editorTabs button {
        height: 2.7rem;
        min-width: var(--tabWidth);
        display: flex;
        justify-content: center;
        align-items: center;
        overflow-x: visible;
    }

    #editorTabs .activeButton {
        border-bottom: 4px solid var(--SliderProgressColor);
    }

    .editorPane {
        flex-direction: column;
        width: 100%;
    }

    .editorPane_button {
        background-color: var(--SliderBarColor);
        border-radius: 3px;
        width: fit-content;
        margin: 1rem 0.25rem 0rem 0.25rem;
    }

    .editorPane_slider {
        width: 100%;
        padding: 1rem 1rem 0rem 1rem;
    }

    #image_selector_grid img {
        width: 100%;
        height: var(--imgWidth);
        padding: 0.125rem;
    }
</style>
