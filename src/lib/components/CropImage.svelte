<svelte:options accessors={true} />

<!--
@component
The navbar component. We have sliders that update reactively to both font size and line height.
3 buttons to change the style from normal, sepia and dark.
-->
<script>
    import Modal from './Modal.svelte';
    import { modal, MODAL_FONT, s, t } from '$lib/data/stores';
    import { onMount } from 'svelte';
    import config from '$lib/data/config';

    let modalId = 'imageCropper';
    let modalThis;
    export function showModal() {
        modalThis.showModal();
    }

    export let data = {
        applyCrop: undefined,
        cnv: undefined,
        selectedSrc: undefined
    };
    $: applyCrop = data.applyCrop;
    $: main_canvas = data.cnv;
    $: src = data.selectedSrc;

    $: showD8ta(data);

    function showD8ta(d8ta) {
        console.log('D8=', d8ta);
    }

    let temp_img;
    let temp_canvas;
    let ctx;

    // export let sourceX;
    // export let sourceY;
    // export let sourceWidth;
    // export let sourceHeight;
    // export let destX;
    // export let destY;
    // export let destWidth;
    // export let destHeight;

    $: render(src);

    function render(i_src) {
        /*DEBUG*/ console.log('Crop render called.');
        if (!temp_canvas) return;
        /*DEBUG*/ console.log('Crop temp_canvas == true.');
        temp_img = new Image();
        temp_img.src = i_src;
        // Make sure the image is loaded first otherwise nothing will draw.
        temp_img.onload = function () {
            ctx = temp_canvas.getContext('2d');

            ctx.drawImage(temp_img, 0, 0, main_canvas.width, temp_img.height); //TODO: make width canvas.width and height auto
            /*DEBUG*/ console.log('Crop ctx=', ctx);
            /*DEBUG*/ console.log('Crop w&h=', main_canvas.width, main_canvas.height);
            /*DEBUG*/ console.log('Crop img=', temp_img);
        };
    }

    //Chat-GPT:

    let isDragging = false;
    let dragStartX, dragStartY;
    export let cropTop = 0;
    export let cropLeft = 0;
    export let cropWidth = 100; // Initial width of the square
    export let cropHeight = 100; // Initial height of the square

    function startDragging(event) {
        isDragging = true;
        const touch = event.touches[0];
        dragStartX = touch.clientX;
        dragStartY = touch.clientY;
    }

    function drag(event) {
        if (isDragging) {
            const touch = event.touches[0];
            const deltaX = touch.clientX - dragStartX;
            const deltaY = touch.clientY - dragStartY;

            cropLeft += deltaX;
            cropTop += deltaY;

            dragStartX = touch.clientX;
            dragStartY = touch.clientY;
        }
    }

    function stopDragging() {
        isDragging = false;
    }

    function pinch(event) {
        if (event.touches.length >= 2) {
            const touch1 = event.touches[0];
            const touch2 = event.touches[1];

            const distance = Math.sqrt(
                (touch2.clientX - touch1.clientX) ** 2 + (touch2.clientY - touch1.clientY) ** 2
            );

            cropWidth = cropHeight = distance;
        }
    }

    function cropImage() {
        /*DBEUG*/ console.log('Crop triggered');
        const ctx = temp_canvas.getContext('2d');
        ctx.clearRect(0, 0, main_canvas.width, main_canvas.height);
        ctx.drawImage(
            temp_img,
            cropLeft,
            cropTop,
            cropWidth,
            cropHeight,
            0,
            0,
            main_canvas.width,
            main_canvas.height
        );
        const cropped_image = ctx.getImageData(0, 0, main_canvas.width, main_canvas.height);
        /*DEBUG*/ console.log('Crop result = ', cropped_image);
        createImageBitmap(cropped_image).then((croppedBitmap) => applyCrop(croppedBitmap));
    }
</script>

<!-- Image Cropper -->
<Modal
    bind:this={modalThis}
    id={modalId}
    useLabel={false}
    addCSS="width: 100vw; padding: 0px;"
    on:close={() => {
        console.log('Crop modal closed.');
    }}
    ><!--addCSS is a prop for injecting CSS into the modal-->
    <svelte:fragment slot="content">
        <div
            id="crop_temp_canvas_container"
            style="width: 100vw; height: 80vh; border: 5px soild green; background-color: yellow;"
        >
            <canvas
                bind:this={temp_canvas}
                width={main_canvas ? main_canvas.width : undefined}
                height={main_canvas ? main_canvas.height : undefined}
                style="background-color: grey;"
            />

            <div
                class="crop-box"
                style="
                    position: absolute;
                    top: {cropTop}px;
                    left: {cropLeft}px;
                    width: {cropWidth}px;
                    height: {cropHeight}px;
                    border: 5px solid white;
                "
                on:touchstart={startDragging}
                on:touchmove={isDragging ? drag : pinch}
                on:touchend={stopDragging}
            />
        </div>
        <div class="w-full flex mt-4 justify-between">
            <button
                on:click={() => {
                    console.log('Crop cancel clicked.');
                }}
                class="dy-btn dy-btn-sm dy-btn-ghost">{$t['Button_Cancel']}</button
            >
            <button on:click={cropImage} class="dy-btn dy-btn-sm dy-btn-ghost"
                >{$t['Button_OK']}</button
            >
        </div>
    </svelte:fragment>
</Modal>

<style>
</style>
