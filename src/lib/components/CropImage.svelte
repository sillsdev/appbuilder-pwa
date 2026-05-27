<!--
@component
The navbar component. We have sliders that update reactively to both font size and line height.
3 buttons to change the style from normal, sepia and dark.
-->
<script>
    import { modal, MODAL_FONT, s, t } from '$lib/data/stores';
    import { onMount } from 'svelte';
    import Modal from './Modal.svelte';

    let modalId = $state('imageCropper');
    let modalThis = $state();
    export function showModal() {
        modalThis.showModal();
    }

    let {
        cropTop = 0,
        cropLeft = 0,
        cropWidth = 100,
        cropHeight = 100,
        data = {
            applyCrop: undefined,
            cnv: undefined,
            selectedSrc: undefined
        }
    } = $props();

    export { data };
    const applyCrop = $derived(data.applyCrop);
    const main_canvas = $derived(data.cnv);
    const src = $derived(data.selectedSrc);

    $effect(() => {
        showD8ta(data);
    });

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

    $effect(() => {
        render(src);
    });

    function render(i_src) {
        /*DEBUG*/ console.log('Crop render called.');
        if (!temp_canvas) return;
        /*DEBUG*/ console.log('Crop temp_canvas == true.');
        temp_img = new Image();
        temp_img.src = i_src;
        // Make sure the image is loaded first otherwise nothing will draw.
        temp_img.onload = function () {
            ctx = temp_canvas.getContext('2d');

            ctx.drawImage(
                temp_img,
                0,
                0,
                main_canvas.width,
                temp_img.height * (main_canvas.width / temp_img.width)
            );
            console.log('Crop ctx=', ctx);
            console.log('Crop w&h=', main_canvas.width, main_canvas.height);
            console.log('Crop img=', temp_img);
            console.log('temp w&h=', temp_canvas.width, temp_canvas.height);
            console.log('temp_img.height=', temp_img.height);
        };
    }

    //Chat-GPT:

    let isDragging = $state(false);
    let dragStartX, dragStartY;

    function startDragging(event) {
        console.log('startDragging called');
        isDragging = true;
        const touch = event.touches[0];
        dragStartX = touch.clientX;
        dragStartY = touch.clientY;
    }

    function drag(event) {
        console.log('drag called');
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
        console.log('stopDragging called');
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
    onclose={() => {
        console.log('Crop modal closed.');
    }}
    ><!--addCSS is a prop for injecting CSS into the modal-->
    <!--<svelte:fragment slot="content">-->
    <div
        id="crop_temp_canvas_container"
        style="width: 100vw; height: 80vh; border: 5px solid green; background-color: yellow;" //This styling, especially the width, should be changed.
    >
        <canvas
            bind:this={temp_canvas}
            width={main_canvas ? main_canvas.width : undefined}
            height={main_canvas ? main_canvas.height : undefined}
            style="background-color: grey;"
        ></canvas>

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
            ontouchstart={startDragging}
            ontouchmove={isDragging ? drag : pinch}
            ontouchend={stopDragging}
        ></div>
    </div>
    <div class="w-full flex mt-4 justify-between">
        <button
            onclick={() => {
                console.log('Crop cancel clicked.');
            }}
            class="dy-btn dy-btn-sm dy-btn-ghost">{$t['Button_Cancel']}</button
        >
        <button onclick={cropImage} class="dy-btn dy-btn-sm dy-btn-ghost">{$t['Button_OK']}</button>
    </div>
    <!--</svelte:fragment>-->
</Modal>

<style>
</style>
