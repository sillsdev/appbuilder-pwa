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

    $: reference = selectedVerses.getCompositeReference();
    let verses;
    $: cnvFullScreen = $windowSize.width < 450;
    let cnv;

    let cnv_background;
    let cnv_text;
    let cnv_font_size = 30;
    $: cnv_font = cnv_font_size + 'px Comic Sans MS';
    let cnv_color = 'white';

    $: render(cnv_background, cnv_text, cnv_font, cnv_color);

    function render(canvas_background, canvas_text, canvas_font, canvas_color) {
        if (!cnv || !canvas_background) return;
        const context = cnv.getContext('2d');
        context.drawImage(canvas_background, 0, 0, cnv.width, cnv.height);
        context.font = canvas_font;
        context.fillStyle = canvas_color;
        context.textAlign = 'center';

        const lines = getLines(context, canvas_text, cnv.width);
        /*DEBUG*/ console.log(lines);
        let textHeight = cnv_font_size * lines.length;
        /*DEBUG*/ console.log('th=', textHeight);
        for (const lineIndex in lines) {
            let line = lines[lineIndex];
            let lineX = cnv.width / 2;
            let lineY =
                cnv_font_size + (cnv.height - textHeight) / 2 + Number(lineIndex) * cnv_font_size;
            context.fillText(line, lineX, lineY);
        }
    }

    onMount(async () => {
        verses = await selectedVerses.getCompositeText();
        cnv_text = verses;
        /*DEBUG*/ console.log('v=' + verses);

        var background = new Image();
        background.src = base + '/backgrounds/aaron-burden-6jYoil2GhVk-unsplash-1080.jpg';

        // Make sure the image is loaded first otherwise nothing will draw.
        background.onload = function () {
            cnv_background = background;
            /*DEBUG*/ console.log('W&H=', cnv.width, cnv.height);
        };

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
</script>

<div
    class="flex flex-col flex-nowrap max-w-screen-sm mx-auto"
    style="border:0px solid green;"
    style:direction={$direction}
>
    <div id="verseOnImgPreview" class="flex flex-col items-center" style="border: 2px solid green;">
        <!-- Preview display of the image and text -->
        <canvas
            bind:this={cnv}
            width={cnvFullScreen ? '300px' : '50vh'}
            height={cnvFullScreen ? '300px' : '50vh'}
            class="cnv_Mobile"
            md:class="cnv_Md"
        />
        <p>PIE</p>
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
