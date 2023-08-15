<!--
@component
The verse on image component.
-->
<script>
    import { onMount } from 'svelte';
    import Slider from './Slider.svelte';
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
        s
    } from '$lib/data/stores';
    import { shareImage } from '$lib/data/share';
    import { base } from '$app/paths';
    import config from '$lib/data/config';
    import { toPng } from 'html-to-image';
    import ImagesIcon from '$lib/icons/image/ImagesIcon.svelte';

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
    let voi_fontSize = 13;
    $: voi_font = voi_fontSize + 'px Comic Sans MS';
    let voi_fontColor = $s['ui.text-on-image']['color'];
    let voi_bold = $s['ui.text-on-image']['font-weight'] == 'bold';
    let voi_italic = $s['ui.text-on-image']['font-style'] == 'italic';
    let voi_letterSpacing = 0;
    let voi_lineHeight_x100 = 0;
    $: voi_lineHeight = 1 + voi_lineHeight_x100 / 100;
    let voi_txtPadding = '0px';
    let voi_textAlign = 'center';
    let voi_textBoxWidth;
    $: voi_textBox_maxHeight = voi_height - voi_textPosY;

    $: render(voi_imgSrc);

    function render(imgSrc) {
        if (!cnv) return;
        cnv_background = new Image();
        cnv_background.src = base + '/backgrounds/' + imgSrc;
        // Make sure the image is loaded first otherwise nothing will draw.
        cnv_background.onload = function () {
            const context = cnv.getContext('2d');
            context.drawImage(cnv_background, 0, 0, cnv.width, cnv.height);
        };
    }

    onMount(async () => {
        verses = await selectedVerses.getCompositeText();

        voi_imgSrc = config.backgroundImages[0].filename;

        /*DEBUG*/ voi_textBoxWidth = voi_parentDiv.clientWidth * 0.75;

        centerButton(0);
    });

    export function shareCanvas() {
        // // DEFAULT
        // cnv.toBlob((blob) => {
        //     const file = new File([blob], reference + '.png', { type: 'image/png' });
        //     shareImage(reference, verses, reference + '.png', file);
        // });

        // USING html-to-image
        var node = document.getElementById('verseOnImgPreview');

        toPng(node)
            .then(function (dataUrl) {
                fetch(dataUrl)
                    .then((response) => response.blob())
                    .then((blob) => {
                        // Now you have the Blob and can use it as needed
                        /*DEBUG*/ console.log(blob);
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

    function getLines(ctx, text, maxWidth) {
        var words = text.split(' ');
        var lines = [];
        var currentLine = words[0];

        for (var i = 1; i < words.length; i++) {
            var word = words[i];
            var width = ctx.measureText(currentLine + ' ' + word).width;
            if (width < maxWidth) {
                currentLine += ' ' + word;
            } else {
                lines.push(currentLine);
                currentLine = word;
            }
        }
        lines.push(currentLine);
        return lines;
    }

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
            style="border: 0px solid cyan; width:{voi_width}px; height:{voi_height}px;"
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
                border: 1px solid lightgreen;
                position: absolute;
                z-index: 2;
                width: {voi_textBoxWidth}px;
                height: auto;
                max-width: {voi_width}px;
                max-height: {voi_textBox_maxHeight};
                color: {voi_fontColor};
                font: {voi_font};
                font-size: {voi_fontSize}pt;
                {voi_bold ? 'font-weight: bold;' : ''}
                {voi_italic ? 'font-style: italic;' : ''}
                letter-spacing: {voi_letterSpacing / 100}em;
                line-height: {voi_lineHeight};
                padding: {voi_txtPadding};
                text-align: {voi_textAlign};
                overflow: hidden;
                user-drag: none;
                transform: translate({voi_textPosX}px, {voi_textPosY}px);
            "
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
            </p>
        </div>
    </div>

    <!-- Editor Tabs -->
    <div
        id="editorTabs"
        class="flex flex-row flex-nowrap"
        style="
            overflow-x: scroll;
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
            <TextAppearanceIcon
                color={active_editor_index == 1 ? progressColor : unselectedColor}
            />
        </button>
        <button
            class="dy-btn-sm dy-btn-ghost"
            on:click={() => centerButton(2)}
            class:activeButton={active_editor_index == 2}
        >
            <ImageIcon.FormatAlignCenter
                color={active_editor_index == 2 ? progressColor : unselectedColor}
            />
        </button>
        <button
            class="dy-btn-sm dy-btn-ghost"
            on:click={() => centerButton(3)}
            class:activeButton={active_editor_index == 3}
        >
            <ImageIcon.FormatColorFill
                color={active_editor_index == 3 ? progressColor : unselectedColor}
            />
        </button>
        <button
            class="dy-btn-sm dy-btn-ghost"
            on:click={() => centerButton(4)}
            class:activeButton={active_editor_index == 4}
        >
            <ImageIcon.TextShadow
                color={active_editor_index == 4 ? progressColor : unselectedColor}
            />
        </button>
        <button
            class="dy-btn-sm dy-btn-ghost"
            on:click={() => centerButton(5)}
            class:activeButton={active_editor_index == 5}
        >
            <ImageIcon.Brightness
                color={active_editor_index == 5 ? progressColor : unselectedColor}
            />
        </button>
        <button
            class="dy-btn-sm dy-btn-ghost"
            on:click={() => centerButton(6)}
            class:activeButton={active_editor_index == 6}
        >
            <ImageIcon.Blur color={active_editor_index == 6 ? progressColor : unselectedColor} />
        </button>
        <button
            class="dy-btn-sm dy-btn-ghost"
            on:click={() => centerButton(7)}
            class:activeButton={active_editor_index == 7}
        >
            <ImageIcon.TextWidth
                color={active_editor_index == 7 ? progressColor : unselectedColor}
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
            touch-action: none;
        "
    >
        <div
            id="image_selector_pane"
            class="dy-carousel-item editor_pane flex-wrap"
            style="width:100%; --imgWidth: {voi_width / 4}px;"
        >
            <!-- Camera roll button -->
            <div class="flex items-center justify-center" style="height: {this.width};">
                <button
                    class="dy-btn-sm dy-btn-ghost"
                    on:click={() => console.log('Open camera roll')}
                >
                    <ImagesIcon color={$monoIconColor} />
                </button>
            </div>
            {#each config.backgroundImages as imgObj}
                <img
                    src={base + '/backgrounds/' + imgObj.filename}
                    on:click={() => {
                        voi_imgSrc = imgObj.filename;
                    }}
                />
            {/each}
        </div>

        <div class="dy-carousel-item editorPane items-center">
            <div class="flex flex-row items-center">
                <!-- Bold button -->
                <button
                    class="dy-btn-sm dy-btn-ghost editorPane_button"
                    on:click={() => {
                        voi_bold = !voi_bold;
                    }}
                >
                    <ImageIcon.FormatBold color={voi_bold ? progressColor : unselectedColor} />
                </button>

                <!-- Italic button -->
                <button
                    class="dy-btn-sm dy-btn-ghost editorPane_button"
                    on:click={() => {
                        voi_italic = !voi_italic;
                    }}
                >
                    <ImageIcon.FormatItalic color={voi_italic ? progressColor : unselectedColor} />
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
                        min="10"
                        max="250"
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

        <div class="dy-carousel-item items-center editorPane">
            <div class="flex flex-row items-center">
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
                        bind:value={voi_textBoxWidth}
                        {barColor}
                        {progressColor}
                        min="1"
                        max={voi_width}
                    />
                </div>
            </div>
        </div>

        <div class="dy-carousel-item items-center editorPane">
            <h1 style="width:100%;">Editor Content 3</h1>
        </div>

        <div class="dy-carousel-item items-center editorPane">
            <h1 style="width:100%;">Editor Content 4</h1>
        </div>

        <div class="dy-carousel-item items-center editorPane">
            <h1 style="width:100%;">Editor Content 5</h1>
        </div>

        <div class="dy-carousel-item items-center editorPane">
            <h1 style="width:100%;">Editor Content 6</h1>
        </div>

        <div class="dy-carousel-item items-center editorPane">
            <h1 style="width:100%;">Editor Content 7</h1>
        </div>

        <div class="dy-carousel-item items-center editorPane">
            <h1 style="width:100%;">Editor Content 8</h1>
        </div>

        <div class="dy-carousel-item items-center editorPane">
            <h1 style="width:100%;">Editor Content 9</h1>
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

    #image_selector_pane > * {
        width: 25%;
        height: var(--imgWidth);
        padding: 0.125rem;
    }
</style>
