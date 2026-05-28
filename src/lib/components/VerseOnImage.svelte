<!--
@component
The verse on image component.
-->
<script lang="ts">
    import { goto } from '$app/navigation';
    import { resolve } from '$app/paths';
    import scriptureConfig from '$assets/config';
    import FontList from '$lib/components/FontList.svelte';
    import { shareImage } from '$lib/data/share';
    import {
        currentFont,
        direction,
        monoIconColor,
        s,
        selectedVerses,
        themeColors,
        voiCustomImage,
        windowSize
    } from '$lib/data/stores';
    import { TextAppearanceIcon } from '$lib/icons';
    import { ImageIcon } from '$lib/icons/image';
    import ImagesIcon from '$lib/icons/image/ImagesIcon.svelte';
    import { toPng } from 'html-to-image';
    import { onMount } from 'svelte';
    import ColorPicker from 'svelte-awesome-color-picker';
    import Slider from './Slider.svelte';

    const backgroundURLs: Record<string, string> = import.meta.glob('./*', {
        eager: true,
        import: 'default',
        query: '?url',
        base: '/src/gen-assets/backgrounds'
    });
    const barColor = $derived($themeColors['SliderBarColor']);
    const progressColor = $derived($themeColors['SliderProgressColor']);
    const unselectedColor = $derived('grey');

    const viewportWidth_in_px = $derived(
        Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0)
    );
    const viewportHeight_in_px = $derived(
        Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0)
    );

    const reference = $derived(selectedVerses.getCompositeReference());
    let verses: string = $state('');
    let imgSrc: string = $state('');
    let parentDiv: HTMLDivElement;
    const cnvFullScreen = $derived($windowSize.width < 450);
    const imageWidth = $derived(cnvFullScreen ? viewportWidth_in_px : viewportHeight_in_px / 2);
    const imageHeight = $derived(imageWidth);
    let cnv: HTMLCanvasElement;

    let cnv_background: HTMLImageElement | undefined = $state();
    let textbox: HTMLParagraphElement;
    const txtFormatted: string = $derived(verses);
    let verseBold = $state($s['ui.text-on-image']['font-weight'] == 'bold');
    let verseItalic = $state($s['ui.text-on-image']['font-style'] == 'italic');
    let textFontSize = $state(13);
    let textFontSizeMin = $state(10);
    let textFontSizeMax = $state(60);
    let textFont = $state($currentFont);
    let refBold = $state(false);
    let refItalic = $state($s['ui.text-on-image']['font-style'] == 'italic');
    let refFontPercent = $state(80);
    let fontColor: string = $state(standardize_color(String($s['ui.text-on-image']['color'])));
    let letterSpacing = $state(0);
    let lineHeightPercent = $state(0);
    const lineHeight = $derived(1 + lineHeightPercent / 100);
    let txtPadding = $state('0px');
    let textAlign = $state('center');
    let textboxWidthPercent = $state(84);
    let textboxWidth = $derived((imageWidth * textboxWidthPercent) / 100);
    let textShadowMode = $state('glow');
    let textShadowValue = $state(15);
    const textShadow = $derived(
        textShadowMode == 'none'
            ? ''
            : (textShadowMode == 'shadow'
                  ? (textFontSize * textShadowValue) / 100 +
                    'px ' +
                    (textFontSize * textShadowValue) / 100 +
                    'px ' +
                    (textFontSize * textShadowValue) / 100
                  : '0 0 ' + ((textFontSize * textShadowValue) / 100) * 2) + 'px black'
    );
    let imageBrightness = $state(100);
    let imageContrast = $state(100);
    let imageSaturation = $state(100);
    let imageBlur = $state(0);

    function standardize_color(str: string) {
        var ctx = document.createElement('canvas').getContext('2d');
        ctx.fillStyle = str;
        return ctx.fillStyle;
    }

    $effect(() => {
        render(cnv_background, imageBrightness, imageContrast, imageSaturation, imageBlur);
    });

    function render(
        background: HTMLImageElement | undefined,
        imgBrightness: number,
        imgContrast: number,
        imgSaturation: number,
        imgBlur: number
    ) {
        if (!cnv) {
            return;
        }
        if (!background) {
            return;
        }
        const context = cnv.getContext('2d');
        context.filter = `brightness(${imgBrightness}%) contrast(${imgContrast}%) saturate(${imgSaturation}%) blur(${imgBlur}px)`;
        context.drawImage(background, 0, 0, cnv.width, cnv.height);
    }

    $effect(() => {
        updateImgSrc(imgSrc);
    });

    function updateImgSrc(imgSrc: string) {
        const img = new Image();
        img.src = imgSrc;
        // Make sure the image is loaded first otherwise nothing will draw.
        img.onload = function () {
            cnv_background = img;
        };
    }

    let resizeStartSize = 0;
    let resizeStartDistance = 0; //These are variables for the 2-finger resize

    function getDistance(t1: Touch, t2: Touch) {
        const dx = t2.clientX - t1.clientX;
        const dy = t2.clientY - t1.clientY;
        return Math.sqrt(dx * dx + dy * dy);
    }
    function onTouchStart(e: TouchEvent) {
        if (e.touches.length === 2) {
            const [t1, t2] = e.touches;
            resizeStartDistance = getDistance(t1, t2);
            resizeStartSize = textboxWidth;
        }
    } //2-finger resize

    function onTouchMove(e: TouchEvent) {
        if (e.touches.length === 2) {
            e.preventDefault();
            if (dragging) {
                stopDrag();
            }
            const [t1, t2] = e.touches;
            const currentDistance = getDistance(t1, t2);
            const rect = parentDiv.getBoundingClientRect();

            const scale = currentDistance / resizeStartDistance;
            let newWidth = resizeStartSize * scale;
            const maxSizeX = rect.right - textX;
            if (newWidth > maxSizeX) {
                textX = Math.max(rect.right - newWidth, rect.left);
                textboxWidth = Math.min(newWidth, rect.right - textX);
            } else {
                newWidth = Math.min(Math.max(50, newWidth), maxSizeX);

                const sizeDifference = textboxWidth - newWidth;
                textX = Math.max(textX + sizeDifference / 2, rect.left);
                textboxWidth = newWidth;
            }

            const childRect = textbox.getBoundingClientRect();
            textY = Math.min(textY, Math.max(rect.height - childRect.height, rect.top));
        }
    } //2-finger resize

    let resizing = false;
    let resizeStartX: number, resizeStartWidth: number;
    function startResize(e: PointerEvent) {
        e.stopPropagation();
        e.preventDefault();
        resizing = true;
        resizeStartX = e.clientX;
        resizeStartWidth = textboxWidth;

        window.addEventListener('pointermove', resize);
        window.addEventListener('pointerup', stopResize);
    } //This is for resizing the textbox
    function resize(e: PointerEvent) {
        if (!resizing) {
            return;
        }
        const newWidth = resizeStartWidth + e.clientX - resizeStartX;
        const rect = parentDiv.getBoundingClientRect();
        const maxSizeX = rect.right - textX;
        textboxWidth = Math.min(Math.max(50, newWidth), maxSizeX);
    }
    function stopResize() {
        resizing = false;
        window.removeEventListener('pointermove', resize);
        window.removeEventListener('pointerup', stopResize);
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
     * 2. increase the percentage by 2% until we get to 90%. (fontSize defined, fontSizeMax = undefined)
     * 3. reset back to the initial text size we figured out in #1 so that we can center the text. (fontsize and fontSizeMax define)
     */
    function initFontSizesAndCenterText() {
        const textOverlay = document.getElementById('verseOnImageTextDiv');
        const textDisplay = textOverlay.style.display;
        let fontSize: number;
        let fontSizeMax: number;
        textOverlay.style.display = 'none'; // hide until done calculating sizes

        const getFontSize = (percent: number, height: number) => {
            const px2pt = (px: number) => (px * 72) / 96;
            return px2pt((percent * height) / 100);
        };

        let fontSizePercent = 7;
        textFontSize = getFontSize(fontSizePercent, imageHeight);

        const adjustFontSize = () => {
            if (!fontSize) {
                if (textOverlay.offsetHeight > 0.8 * imageHeight && fontSizePercent > 0.5) {
                    fontSizePercent -= 0.5;
                    textFontSize = getFontSize(fontSizePercent, imageHeight);
                } else {
                    fontSize = textFontSize;
                    fontSizePercent += 2.0;
                    textFontSize = getFontSize(fontSizePercent, imageHeight);
                }
            } else if (!fontSizeMax) {
                if (textOverlay.offsetHeight < 0.9 * imageHeight) {
                    fontSizePercent += 2.0;
                    textFontSize = getFontSize(fontSizePercent, imageHeight);
                } else {
                    fontSizeMax = textFontSize;
                    textFontSizeMax = fontSizeMax;
                    textFontSize = fontSize;
                }
            } else {
                const parentRect = parentDiv.getBoundingClientRect();
                const childRect = textbox.getBoundingClientRect();
                textX = parentRect.left + (parentRect.width - childRect.width) / 2;
                textY = parentRect.top + (parentRect.height - childRect.height) / 2;

                resizeObserver.unobserve(textOverlay);
                textOverlay.style.display = textDisplay;
            }
        };
        const resizeObserver = new ResizeObserver(adjustFontSize);
        resizeObserver.observe(textOverlay);
    }

    onMount(async () => {
        verses = await selectedVerses.getCompositeText();
        if ($voiCustomImage.cropped) {
            imgSrc = $voiCustomImage.cropped;
        } else {
            imgSrc = backgroundURLs[`./${scriptureConfig.backgroundImages[0].filename}`];
        }
        initFontSizesAndCenterText();

        centerButton(0);
        const parentRect = parentDiv.getBoundingClientRect();
        const childRect = textbox.getBoundingClientRect();
        textX = parentRect.left + (parentRect.width - childRect.width) / 2;
        textY = parentRect.top + (parentRect.height - childRect.height) / 2;
    });

    function handleFontChange(f: string) {
        textFont = f;
    }

    // Share button feature:
    export function shareCanvas() {
        const original = document.getElementById('verseOnImgPreview');

        const clone = original.cloneNode(true) as HTMLElement; //Clone the verse on image so we can make adjustments to it for the export without affecting the preview.

        const origCanvas = original.querySelector('canvas');
        const cloneCanvas = clone.querySelector('canvas');
        cloneCanvas.width = origCanvas.width;
        cloneCanvas.height = origCanvas.height;
        const ctx = cloneCanvas.getContext('2d');
        ctx.drawImage(origCanvas, 0, 0); //Copy the canvas bitmap.

        clone.style.position = 'absolute';
        clone.style.left = '0px';
        clone.style.top = '0px';
        clone.style.zIndex = '-9999'; //Make sure the clone isn't visible

        var cloneParagraph = clone.querySelector('p');
        const parentRect = parentDiv.getBoundingClientRect();
        cloneParagraph.style.left = textX - parentRect.left + 'px';
        cloneParagraph.style.top = textY - parentRect.top + 'px'; //Adjust the textbox so it shows up in the correct place

        document.body.appendChild(clone);
        toPng(clone)
            .then(function (dataUrl) {
                document.body.removeChild(clone); //Get rid of the clone once we're done
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
    export function downloadCanvas() {
        const original = document.getElementById('verseOnImgPreview');

        const clone = original.cloneNode(true) as HTMLElement; //Clone the verse on image so we can make adjustments to it for the export without affecting the preview.

        const origCanvas = original.querySelector('canvas');
        const cloneCanvas = clone.querySelector('canvas');
        cloneCanvas.width = origCanvas.width;
        cloneCanvas.height = origCanvas.height;
        const ctx = cloneCanvas.getContext('2d');
        ctx.drawImage(origCanvas, 0, 0); //Copy the canvas bitmap.

        clone.style.position = 'absolute';
        clone.style.left = '0px';
        clone.style.top = '0px';
        clone.style.zIndex = '-9999'; //Make sure the clone isn't visible

        var cloneParagraph = clone.querySelector('p');
        const parentRect = parentDiv.getBoundingClientRect();
        cloneParagraph.style.left = textX - parentRect.left + 'px';
        cloneParagraph.style.top = textY - parentRect.top + 'px'; //Adjust the textbox so it shows up in the correct place

        document.body.appendChild(clone);
        toPng(clone)
            .then(function (dataUrl) {
                document.body.removeChild(clone); //Get rid of the clone once we're done
                fetch(dataUrl)
                    .then((response) => response.blob())
                    .then((blob) => {
                        const filename = reference + '.png';
                        const file = new File([blob], filename, { type: 'image/png' });
                        const url = URL.createObjectURL(file);

                        const anchor = document.createElement('a');
                        anchor.href = url;
                        anchor.download = filename;
                        anchor.click();

                        URL.revokeObjectURL(url);
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

    let active_editor_index = $state(-1);

    function centerButton(n: number) {
        const container = document.getElementById('editorTabs');
        const containerRect = container.getBoundingClientRect();
        const buttons = document.querySelectorAll('#editorTabs button');
        const button = n >= 0 && n < buttons.length ? buttons[n] : null;
        const buttonRect = button.getBoundingClientRect();

        const scrollOffset =
            buttonRect.left - containerRect.left - containerRect.width / 2 + buttonRect.width / 2;

        container.scrollBy({ left: scrollOffset, behavior: 'smooth' });

        let carousel = document.getElementById('editorsPane') as HTMLDivElement;
        const editors = carousel.children as HTMLCollectionOf<HTMLElement>; // document.querySelectorAll('#editorsPane div');// Get the carousel's children.
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

    // textbox Draggability:

    let textX = $state(0);
    let textY = $state(0);
    let dragging = false;
    let offsetX: number, offsetY: number;
    const textboxMaxHeight = $derived(imageHeight - textY);

    function drag(event: PointerEvent) {
        if (dragging) {
            // Prevent child div from going outside the parent borders
            const parentRect = parentDiv.getBoundingClientRect();
            const childRect = textbox.getBoundingClientRect();
            textX = event.clientX - offsetX;
            textY = event.clientY - offsetY;
            const newX = event.clientX - offsetX - parentRect.left;
            const newY = event.clientY - offsetY - parentRect.top;

            textX = Math.max(
                0 + parentRect.left,
                Math.min(newX, parentRect.width - childRect.width) + parentRect.left
            );
            textY = Math.max(
                0 + parentRect.top,
                Math.min(newY, parentRect.height - childRect.height) + parentRect.top
            );
        }
    }

    function stopDrag() {
        dragging = false;
        window.removeEventListener('pointermove', drag);
        window.removeEventListener('pointerup', stopDrag);
    }
    function startDrag(event: PointerEvent) {
        dragging = true;
        offsetX = event.clientX - textX;
        offsetY = event.clientY - textY;

        window.addEventListener('pointermove', drag);
        window.addEventListener('pointerup', stopDrag);
    }
</script>

<div
    id="verseOnImageContainer"
    class="flex flex-col flex-nowrap max-w-screen-sm mx-auto"
    style="height: 100%; max-width: {imageWidth}px;"
    style:direction={$direction}
>
    <!-- verseOnImgPreview -->
    <div id="verseOnImgPreviewContainer" class="flex flex-col items-center">
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div
            id="verseOnImgPreview"
            bind:this={parentDiv}
            class="flex flex-col touch-none"
            style="width:{imageWidth}px; height:{imageHeight}px;"
            ontouchstart={onTouchStart}
            ontouchmove={onTouchMove}
        >
            <!-- Preview display of the image and text -->

            <canvas
                bind:this={cnv}
                width={cnvFullScreen ? viewportWidth_in_px + 'px' : viewportHeight_in_px / 2 + 'px'}
                height={cnvFullScreen
                    ? viewportWidth_in_px + 'px'
                    : viewportHeight_in_px / 2 + 'px'}
                style="position: relative; z-index: 1;"
            ></canvas>

            <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
            <p
                id="verseOnImageTextDiv"
                style="
                    position: absolute;
                    z-index: 2;
                    width: {textboxWidth}px;
                    height: auto;
                    max-width: {imageWidth}px;
                    max-height: {textboxMaxHeight};
                    color: {fontColor};
                    font-family: {textFont};
                    font-size: {textFontSize}pt;
                    {verseBold ? 'font-weight: bold;' : ''}
                    {verseItalic ? 'font-style: italic;' : ''}
                    letter-spacing: {letterSpacing / 100}em;
                    line-height: {lineHeight};
                    padding: {txtPadding};
                    text-align: {textAlign};
                    text-shadow: {textShadow};
                    user-drag: none;
                    border: none;
                    left: {textX}px;
                    top: {textY}px;
                "
                //class="flex flex-col"
                bind:this={textbox}
                onpointerdown={startDrag}
            >
                <!-- svelte-ignore a11y_no_static_element_interactions -->
                <span
                    class="absolute top-0 right-0 w-3 h-full bg-transparent cursor-e-resize z-50 pointer-events-auto"
                    onpointerdown={startResize}
                ></span>
                {txtFormatted}
                <span
                    id="verseOnImageRefDiv"
                    class="flex flex-col justify-center items-center"
                    style="height: {textFontSize * 1.5}pt;"
                >
                    <span
                        class="flex flex-col justify-center items-center"
                        style="
                            font-size: {(textFontSize * refFontPercent) / 100}pt;
                            {refBold ? 'font-weight: bold;' : 'font-weight: normal;'}
                            {refItalic ? 'font-style: italic;' : 'font-style: normal;'}
                            height: {textFontSize}pt;
                            width: {textboxWidth}px;
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
            --tabWidth: {imageWidth / 5}px; 
            background-color: {$themeColors['ImageTabsBackgroundColor']};
        "
    >
        <!-- NavBar of tab buttons to bring up the different editor panes -->
        <button
            class="dy-btn-sm dy-btn-ghost"
            onclick={() => centerButton(0)}
            class:activeButton={active_editor_index == 0}
        >
            <ImageIcon.Image color={active_editor_index == 0 ? progressColor : unselectedColor} />
        </button>
        <button
            class="dy-btn-sm dy-btn-ghost"
            onclick={() => centerButton(1)}
            class:activeButton={active_editor_index == 1}
        >
            <ImageIcon.FontChoice
                color={active_editor_index == 1 ? progressColor : unselectedColor}
            />
        </button>
        <button
            class="dy-btn-sm dy-btn-ghost"
            onclick={() => centerButton(2)}
            class:activeButton={active_editor_index == 2}
        >
            <TextAppearanceIcon
                color={active_editor_index == 2 ? progressColor : unselectedColor}
            />
        </button>
        <button
            class="dy-btn-sm dy-btn-ghost"
            onclick={() => centerButton(3)}
            class:activeButton={active_editor_index == 3}
        >
            <ImageIcon.FormatAlignCenter
                color={active_editor_index == 3 ? progressColor : unselectedColor}
            />
        </button>
        <button
            class="dy-btn-sm dy-btn-ghost"
            onclick={() => centerButton(4)}
            class:activeButton={active_editor_index == 4}
        >
            <ImageIcon.FormatColorFill
                color={active_editor_index == 4 ? progressColor : unselectedColor}
            />
        </button>
        <button
            class="dy-btn-sm dy-btn-ghost"
            onclick={() => centerButton(5)}
            class:activeButton={active_editor_index == 5}
        >
            <ImageIcon.TextShadow
                color={active_editor_index == 5 ? progressColor : unselectedColor}
            />
        </button>
        <button
            class="dy-btn-sm dy-btn-ghost"
            onclick={() => centerButton(6)}
            class:activeButton={active_editor_index == 6}
        >
            <ImageIcon.Brightness
                color={active_editor_index == 6 ? progressColor : unselectedColor}
            />
        </button>
        <button
            class="dy-btn-sm dy-btn-ghost"
            onclick={() => centerButton(7)}
            class:activeButton={active_editor_index == 7}
        >
            <ImageIcon.Blur color={active_editor_index == 7 ? progressColor : unselectedColor} />
        </button>
        <button
            class="dy-btn-sm dy-btn-ghost"
            onclick={() => centerButton(8)}
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
                --imgWidth: {imageWidth / 4}px; 
                overflow-y: auto;
            "
        >
            <div id="image_selector_grid" class="grid grid-cols-4" style="height: fit-content;">
                <!-- Camera roll button -->
                <div
                    class="flex items-center justify-center image_selector_pane_box"
                    //style="height: {this.width};"
                >
                    <button
                        class="dy-btn-sm dy-btn-ghost"
                        style="cursor: pointer;"
                        onclick={() => {
                            document.getElementById('fileInput')?.click();
                        }}
                    >
                        <ImagesIcon color={$monoIconColor} />
                    </button>
                    <input
                        type="file"
                        accept="image/*"
                        id="fileInput"
                        style="display: none; visibility: none;"
                        onchange={(event) => {
                            const input = event.target as HTMLInputElement;
                            const selectedFile = input?.files[0];
                            if (selectedFile) {
                                let selectedSrc = URL.createObjectURL(selectedFile);
                                voiCustomImage.update((v) => ({
                                    ...v,
                                    original: selectedSrc
                                }));
                                goto(resolve('/crop'));
                            }
                        }}
                    />
                </div>
                {#each scriptureConfig.backgroundImages as imgObj}
                    <!-- svelte-ignore a11y_click_events_have_key_events -->
                    <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
                    <!-- svelte-ignore a11y_missing_attribute -->
                    <img
                        src={backgroundURLs[`./${imgObj.filename}`]}
                        class="image_selector_pane_box"
                        onclick={(event) => {
                            imgSrc = backgroundURLs[`./${imgObj.filename}`];
                        }}
                    />
                {/each}
            </div>
        </div>

        <!-- Font Selector Pane -->
        <div class="dy-carousel-item items-center editorPane">
            <FontList bind:selectedFont={textFont} />
        </div>

        <!-- Font Editor Pane -->
        <div class="dy-carousel-item editorPane items-center">
            <div class="flex flex-row items-center">
                <!-- Bold button -->
                <button
                    class="dy-btn-sm dy-btn-ghost editorPane_button"
                    onclick={() => {
                        verseBold = !verseBold;
                    }}
                >
                    <ImageIcon.FormatBold color={verseBold ? progressColor : unselectedColor} />
                </button>

                <!-- Italic button -->
                <button
                    class="dy-btn-sm dy-btn-ghost editorPane_button"
                    onclick={() => {
                        verseItalic = !verseItalic;
                    }}
                >
                    <ImageIcon.FormatItalic color={verseItalic ? progressColor : unselectedColor} />
                </button>
            </div>

            <!-- Font size slider -->
            <div class="flex flex-row flex-nowrap items-center editorPane_slider">
                <div style="margin-right: 1rem;">
                    <TextAppearanceIcon color={$monoIconColor} size="1.5rem" />
                </div>
                <div class="grid grid-cols-1" style="width: 100%;">
                    <Slider
                        bind:value={textFontSize}
                        {barColor}
                        {progressColor}
                        min={textFontSizeMin}
                        max={textFontSizeMax}
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
                        bind:value={letterSpacing}
                        {barColor}
                        {progressColor}
                        min={0}
                        max={20}
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
                    onclick={() => {
                        textAlign = 'left';
                    }}
                >
                    <ImageIcon.FormatAlignLeft
                        color={textAlign == 'left' ? progressColor : unselectedColor}
                    />
                </button>

                <!-- Center align button -->
                <button
                    class="dy-btn-sm dy-btn-ghost editorPane_button"
                    onclick={() => {
                        textAlign = 'center';
                    }}
                >
                    <ImageIcon.FormatAlignCenter
                        color={textAlign == 'center' ? progressColor : unselectedColor}
                    />
                </button>

                <!-- Right align button -->
                <button
                    class="dy-btn-sm dy-btn-ghost editorPane_button"
                    onclick={() => {
                        textAlign = 'right';
                    }}
                >
                    <ImageIcon.FormatAlignRight
                        color={textAlign == 'right' ? progressColor : unselectedColor}
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
                        bind:value={lineHeightPercent}
                        {barColor}
                        {progressColor}
                        min={-20}
                        max={100}
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
                        bind:value={textboxWidthPercent}
                        {barColor}
                        {progressColor}
                        min={20}
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
                bind:hex={fontColor}
            />
        </div>

        <!-- Text Shadow/Glow Pane -->
        <div class="dy-carousel-item items-center editorPane">
            <div class="flex flex-row items-center">
                <!-- Text Shadow None Toggle -->
                <button
                    class="dy-btn-sm dy-btn-ghost editorPane_button"
                    onclick={() => {
                        textShadowMode = 'none';
                    }}
                >
                    <ImageIcon.TextShadowNone
                        color={textShadowMode == 'none' ? progressColor : unselectedColor}
                    />
                </button>

                <!-- Text shadow toggle -->
                <button
                    class="dy-btn-sm dy-btn-ghost editorPane_button"
                    onclick={() => {
                        textShadowMode = 'shadow';
                    }}
                >
                    <ImageIcon.TextShadow
                        color={textShadowMode == 'shadow' ? progressColor : unselectedColor}
                    />
                </button>

                <!-- Text glow toggle -->
                <button
                    class="dy-btn-sm dy-btn-ghost editorPane_button"
                    onclick={() => {
                        textShadowMode = 'glow';
                    }}
                >
                    <ImageIcon.TextGlow
                        color={textShadowMode == 'glow' ? progressColor : unselectedColor}
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
                        bind:value={textShadowValue}
                        {barColor}
                        {progressColor}
                        min={0}
                        max={20}
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
                        bind:value={imageBrightness}
                        {barColor}
                        {progressColor}
                        min={20}
                        max={180}
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
                        bind:value={imageContrast}
                        {barColor}
                        {progressColor}
                        min={10}
                        max={190}
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
                        bind:value={imageSaturation}
                        {barColor}
                        {progressColor}
                        min={0}
                        max={200}
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
                    <Slider bind:value={imageBlur} {barColor} {progressColor} min={0} max={15} />
                </div>
            </div>
        </div>

        <!-- Refrence Formatting Pane -->
        <div class="dy-carousel-item items-center editorPane">
            <div class="flex flex-row items-center">
                <!-- Ref bold button -->
                <button
                    class="dy-btn-sm dy-btn-ghost editorPane_button"
                    onclick={() => {
                        refBold = !refBold;
                    }}
                >
                    <ImageIcon.FormatBold color={refBold ? progressColor : unselectedColor} />
                </button>

                <!-- Ref italic button -->
                <button
                    class="dy-btn-sm dy-btn-ghost editorPane_button"
                    onclick={() => {
                        refItalic = !refItalic;
                    }}
                >
                    <ImageIcon.FormatItalic color={refItalic ? progressColor : unselectedColor} />
                </button>
            </div>

            <!-- Reference font size slider -->
            <div class="flex flex-row flex-nowrap items-center editorPane_slider">
                <div style="margin-right: 1rem;">
                    <TextAppearanceIcon color={$monoIconColor} size="1.5rem" />
                </div>
                <div class="grid grid-cols-1" style="width: 100%;">
                    <Slider
                        bind:value={refFontPercent}
                        {barColor}
                        {progressColor}
                        min={50}
                        max={100}
                    />
                </div>
            </div>
        </div>
    </div>

    <div
        style="background-color: {$themeColors[
            'DialogBackgroundColor'
        ]}; flex: 1 1 auto; z-index: 3;"
    ></div>
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
