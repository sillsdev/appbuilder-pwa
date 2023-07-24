<!--
@component
The verse on image component.
-->
<script>
    import { onMount } from 'svelte';
    import Slider from './Slider.svelte';
    import { TextAppearanceIcon, ImageIcon } from '$lib/icons';
    import {
        language,
        languages,
        theme,
        monoIconColor,
        themes,
        themeColors,
        selectedVerses
    } from '$lib/data/stores';
    import { base } from '$app/paths';
    import config from '$lib/data/config';

    $: barColor = $themeColors['SliderBarColor'];
    $: progressColor = $themeColors['SliderProgressColor'];

    $: reference = selectedVerses.getCompositeReference();
    $: verses = $selectedVerses.reduce((text, v) => (text += v.text), '');
    let cnv;

    let cnv_text = $selectedVerses.reduce((text, v) => (text += v.text), '');
    let cnv_font = '30px Comic Sans MS';
    let cnv_color = 'red';
    // $: cnv_font_w = cnv.width / 2;
    // $: cnv_font_h = cnv.height / 2;

    onMount(() => {
        const context = cnv.getContext('2d');

        // /*DEBUG*/ context.fillStyle = 'yellow';
        // /*DEBUG*/ context.fillRect(0, 0, cnv.width, cnv.height);

        var background = new Image();
        background.src = base + '/backgrounds/aaron-burden-6jYoil2GhVk-unsplash-1080.jpg';

        // Make sure the image is loaded first otherwise nothing will draw.
        background.onload = function () {
            context.drawImage(background, 0, 0, cnv.width, cnv.height);
            context.font = cnv_font;
            context.fillStyle = cnv_color;
            context.textAlign = 'center';
            context.fillText(cnv_text, cnv.width / 2, cnv.height / 2);
        };
    });

    function shareCanvas() {
        cnv.toBlob((blob) => {
            const file = new File([blob], reference + '.png', { type: 'image/png' });

            if (navigator.share) {
                navigator
                    .share({
                        title: reference,
                        text: verses,
                        files: [file]
                    })
                    .then(() => {
                        console.log('Successfully shared');
                    })
                    .catch((error) => {
                        console.error('Error sharing:', error);
                    });
            } else {
                // Handle browser that does not support Web Share API
                console.log('Web Share API is not supported in this browser');
            }
        });
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

            carousel.scrollTo({ left: scrollDistance, behavior: 'smooth' }); // Scroll the carousel to the desired position
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

<div class="flex flex-col flex-nowrap" style="">
    <div id="verseOnImgPreview" style="border: 2px solid red; width:full;">
        <!-- Preview display of the image and text -->
        <canvas bind:this={cnv} width="300" height="full" style="border: 2px solid green;" />
        <button on:click={shareCanvas}>Export Canvas</button>
    </div>

    <div
        id="editorTabs"
        class="flex flex-row flex-nowrap"
        style="border: 2px solid teal; overflow-x:scroll;"
    >
        <!-- NavBar of tab buttons to bring up the different editor panes -->
        <button
            class="dy-btn-sm dy-btn-ghost"
            on:click={() => centerButton(0)}
            class:activeButton={active_editor_index == 0}
        >
            <TextAppearanceIcon color="black" />
        </button>
        <button
            class="dy-btn-sm dy-btn-ghost"
            on:click={() => centerButton(1)}
            class:activeButton={active_editor_index == 1}
        >
            <TextAppearanceIcon color="red" />
        </button>
        <button
            class="dy-btn-sm dy-btn-ghost"
            on:click={() => centerButton(2)}
            class:activeButton={active_editor_index == 2}
        >
            <TextAppearanceIcon color="black" />
        </button>
        <button
            class="dy-btn-sm dy-btn-ghost"
            on:click={() => centerButton(3)}
            class:activeButton={active_editor_index == 3}
        >
            <TextAppearanceIcon color="orange" />
        </button>
        <button
            class="dy-btn-sm dy-btn-ghost"
            on:click={() => centerButton(4)}
            class:activeButton={active_editor_index == 4}
        >
            <TextAppearanceIcon color="black" />
        </button>
        <button
            class="dy-btn-sm dy-btn-ghost"
            on:click={() => centerButton(5)}
            class:activeButton={active_editor_index == 5}
        >
            <TextAppearanceIcon color="yellow" />
        </button>
        <button
            class="dy-btn-sm dy-btn-ghost"
            on:click={() => centerButton(6)}
            class:activeButton={active_editor_index == 6}
        >
            <TextAppearanceIcon color="black" />
        </button>
        <button
            class="dy-btn-sm dy-btn-ghost"
            on:click={() => centerButton(7)}
            class:activeButton={active_editor_index == 7}
        >
            <TextAppearanceIcon color="green" />
        </button>
        <button
            class="dy-btn-sm dy-btn-ghost"
            on:click={() => centerButton(8)}
            class:activeButton={active_editor_index == 8}
        >
            <TextAppearanceIcon color="black" />
        </button>
        <button
            class="dy-btn-sm dy-btn-ghost"
            on:click={() => centerButton(9)}
            class:activeButton={active_editor_index == 9}
        >
            <TextAppearanceIcon color="blue" />
        </button>
    </div>

    <!-- Pane for the current editor -->
    <div
        id="editorsPane"
        class="dy-w-64 dy-carousel dy-rounded-box"
        style="border: 2px solid orange;"
    >
        <div class="dy-carousel-item" style="width:100%;">
            <h1 style="height:300px; width:100%;">Editor Content 0</h1>
        </div>

        <div class="dy-carousel-item" style="width:100%;">
            <h1 style="height:300px; width:100%;">Editor Content 1</h1>
        </div>

        <div class="dy-carousel-item" style="width:100%;">
            <h1 style="height:300px; width:100%;">Editor Content 2</h1>
        </div>

        <div class="dy-carousel-item" style="width:100%;">
            <h1 style="height:300px; width:100%;">Editor Content 3</h1>
        </div>

        <div class="dy-carousel-item" style="width:100%;">
            <h1 style="height:300px; width:100%;">Editor Content 4</h1>
        </div>

        <div class="dy-carousel-item" style="width:100%;">
            <h1 style="height:300px; width:100%;">Editor Content 5</h1>
        </div>

        <div class="dy-carousel-item" style="width:100%;">
            <h1 style="height:300px; width:100%;">Editor Content 6</h1>
        </div>

        <div class="dy-carousel-item" style="width:100%;">
            <h1 style="height:300px; width:100%;">Editor Content 7</h1>
        </div>

        <div class="dy-carousel-item" style="width:100%;">
            <h1 style="height:300px; width:100%;">Editor Content 8</h1>
        </div>

        <div class="dy-carousel-item" style="width:100%;">
            <h1 style="height:300px; width:100%;">Editor Content 9</h1>
        </div>
    </div>
</div>

<style>
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

    #editorTabs button.activeButton {
        border-bottom: 2px solid black;
    }
</style>
