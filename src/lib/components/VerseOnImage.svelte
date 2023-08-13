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
        monoIconColor,
        themes,
        themeColors,
        selectedVerses,
        windowSize,
        direction
    } from '$lib/data/stores';
    import { shareImage } from '$lib/data/share';
    import { base } from '$app/paths';
    import config from '$lib/data/config';
    import { toPng } from 'html-to-image';

    $: barColor = $themeColors['SliderBarColor'];
    $: progressColor = $themeColors['SliderProgressColor'];

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
    let voi_parentDiv;
    $: voi_width = cnvFullScreen ? '100vw' : '50vh';
    $: voi_height = cnvFullScreen ? '100vw' : '50vh';
    $: cnvFullScreen = $windowSize.width < 450;
    let cnv;

    let cnv_background;
    let voi_textBox;
    $: txtFormatted = verses;
    let voi_fontSize = 20;
    $: voi_font = voi_fontSize + 'px Comic Sans MS';
    let voi_fontColor = 'white';
    let voi_txtPadding = '0px';
    let voi_textAlign = 'center';
    let voi_textBoxWidth;
    $: voi_textBox_maxHeight = voi_height - voi_textPosY;

    $: render(cnv_background);

    function render(canvas_background) {
        if (!cnv || !canvas_background) return;
        const context = cnv.getContext('2d');
        context.drawImage(canvas_background, 0, 0, cnv.width, cnv.height);
    }

    onMount(async () => {
        verses = await selectedVerses.getCompositeText();

        var background = new Image();
        background.src = base + '/backgrounds/aaron-burden-6jYoil2GhVk-unsplash-1080.jpg';

        // Make sure the image is loaded first otherwise nothing will draw.
        background.onload = function () {
            cnv_background = background;
        };
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

    function handleMouseMove(event) {
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

    function handleMouseDown(event) {
        dragging = true;
        offsetX = event.clientX - voi_textPosX; // Update offsetX
        offsetY = event.clientY - voi_textPosY; // Update offsetY

        function handleMouseUp() {
            dragging = false;
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        }

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    }
</script>

<div
    id="verseOnImageContainer"
    class="flex flex-col flex-nowrap max-w-screen-sm mx-auto"
    style="border: 0px solid yellow;"
    style:direction={$direction}
>
    <div class="flex flex-col items-center">
        <div
            id="verseOnImgPreview"
            bind:this={voi_parentDiv}
            class="flex flex-col"
            style="border: 0px solid cyan; width:{voi_width}; height:{voi_height};"
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
                max-width: {voi_width};
                max-height: {voi_textBox_maxHeight};
                color: {voi_fontColor};
                font: {voi_font};
                font-size: {voi_fontSize};
                padding: {voi_txtPadding};
                text-align: {voi_textAlign};
                overflow: hidden;
                user-drag: none;
                transform: translate({voi_textPosX}px, {voi_textPosY}px);
            "
                bind:this={voi_textBox}
                on:mousedown={handleMouseDown}
                on:touchstart={(event) => handleMouseDown(event.touches[0])}
                on:touchmove={(event) => {
                    event.preventDefault();
                    handleMouseMove(event.touches[0]);
                }}
                on:touchend={() => {
                    dragging = false;
                }}
            >
                {txtFormatted}
            </p>
        </div>
    </div>
    <div id="editorTabs" class="flex flex-row flex-nowrap" style="overflow-x:scroll;">
        <!-- NavBar of tab buttons to bring up the different editor panes -->
        <button
            class="dy-btn-sm dy-btn-ghost"
            on:click={() => centerButton(0)}
            class:activeButton={active_editor_index == 0}
        >
            <ImageIcon.Image color={active_editor_index == 0 ? progressColor : 'grey'} />
        </button>
        <button
            class="dy-btn-sm dy-btn-ghost"
            on:click={() => centerButton(1)}
            class:activeButton={active_editor_index == 1}
        >
            <TextAppearanceIcon color={active_editor_index == 1 ? progressColor : 'grey'} />
        </button>
        <button
            class="dy-btn-sm dy-btn-ghost"
            on:click={() => centerButton(2)}
            class:activeButton={active_editor_index == 2}
        >
            <ImageIcon.FormatAlignCenter
                color={active_editor_index == 2 ? progressColor : 'grey'}
            />
        </button>
        <button
            class="dy-btn-sm dy-btn-ghost"
            on:click={() => centerButton(3)}
            class:activeButton={active_editor_index == 3}
        >
            <ImageIcon.FormatColorFill color={active_editor_index == 3 ? progressColor : 'grey'} />
        </button>
        <button
            class="dy-btn-sm dy-btn-ghost"
            on:click={() => centerButton(4)}
            class:activeButton={active_editor_index == 4}
        >
            <ImageIcon.TextShadow color={active_editor_index == 4 ? progressColor : 'grey'} />
        </button>
        <button
            class="dy-btn-sm dy-btn-ghost"
            on:click={() => centerButton(5)}
            class:activeButton={active_editor_index == 5}
        >
            <ImageIcon.Brightness color={active_editor_index == 5 ? progressColor : 'grey'} />
        </button>
        <button
            class="dy-btn-sm dy-btn-ghost"
            on:click={() => centerButton(6)}
            class:activeButton={active_editor_index == 6}
        >
            <ImageIcon.Blur color={active_editor_index == 6 ? progressColor : 'grey'} />
        </button>
        <button
            class="dy-btn-sm dy-btn-ghost"
            on:click={() => centerButton(7)}
            class:activeButton={active_editor_index == 7}
        >
            <ImageIcon.TextWidth color={active_editor_index == 7 ? progressColor : 'grey'} />
        </button>
    </div>

    <!-- Pane for the current editor -->
    <div
        id="editorsPane"
        class="dy-w-64 dy-carousel dy-rounded-box"
        style="background-color:lightgray;"
    >
        <div class="dy-carousel-item" style="width:100%;">
            <h1 style="width:100%;">Editor Content 0</h1>
        </div>

        <div class="dy-carousel-item" style="width:100%;">
            <div class="grid gap-4 items-center range-row m-2">
                <ImageIcon.FormatLineSpacing color={$monoIconColor} size="1.5rem" />
                <Slider bind:value={voi_fontSize} {barColor} {progressColor} min="10" max="250" />
            </div>
            <h1 style="width:100%;">Editor Content 1</h1>
        </div>

        <div class="dy-carousel-item" style="width:100%;">
            <h1 style="width:100%;">Editor Content 2</h1>
        </div>

        <div class="dy-carousel-item" style="width:100%;">
            <h1 style="width:100%;">Editor Content 3</h1>
        </div>

        <div class="dy-carousel-item" style="width:100%;">
            <h1 style="width:100%;">Editor Content 4</h1>
        </div>

        <div class="dy-carousel-item" style="width:100%;">
            <h1 style="width:100%;">Editor Content 5</h1>
        </div>

        <div class="dy-carousel-item" style="width:100%;">
            <h1 style="width:100%;">Editor Content 6</h1>
        </div>

        <div class="dy-carousel-item" style="width:100%;">
            <h1 style="width:100%;">Editor Content 7</h1>
        </div>

        <div class="dy-carousel-item" style="width:100%;">
            <h1 style="width:100%;">Editor Content 8</h1>
        </div>

        <div class="dy-carousel-item" style="width:100%;">
            <h1 style="width:100%;">Editor Content 9</h1>
        </div>
    </div>
</div>

<style>
    .cnv_Mobile {
        width: 100vw;
        height: 100vw;
    }

    .cnv_Md {
        width: 50vh;
        height: 50vh;
    }

    #editorTabs::-webkit-scrollbar {
        display: none;
        /* width: 0 !important */
    }

    .editorTabs {
        -ms-overflow-style: none;
    }

    #editorTabs {
        scrollbar-width: none;
    }

    #editorTabs button {
        border: 0px solid cyan;
        height: 2.7rem;
        min-width: 20vw;
        display: flex;
        justify-content: center;
        align-items: center;
        overflow-x: visible;
    }

    #editorTabs .activeButton {
        border-bottom: 4px solid var(--SliderProgressColor);
    }
</style>
