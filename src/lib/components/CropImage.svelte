<svelte:options accessors={true} />

<!--
@component
The navbar component. We have sliders that update reactively to both font size and line height.
3 buttons to change the style from normal, sepia and dark.
-->
<script>
    import Modal from './Modal.svelte';
    import { modal, MODAL_FONT } from '$lib/data/stores';
    import { onMount } from 'svelte';
    import config from '$lib/data/config';

    let modalId = 'imageCropper';
    let modalThis;
    export function showModal() {
        modalThis.showModal();
    }

    export let imgSrc;
    let crop_image;
    let canvas;
    let ctx;

    export let triggerCrop;

    // export let sourceX;
    // export let sourceY;
    // export let sourceWidth;
    // export let sourceHeight;
    // export let destX;
    // export let destY;
    // export let destWidth;
    // export let destHeight;

    $: render(imgSrc);

    function render(i_src) {
        if (!canvas) return;
        crop_image = new Image();
        crop_image.src = i_src;
        // Make sure the image is loaded first otherwise nothing will draw.
        crop_image.onload = function () {
            ctx = canvas.getContext('2d');
            ctx.drawImage(crop_image, 0, 0, canvas.width, canvas.height);
        };
    }

    //Chat-GPT:

    onMount(() => {
        // Draw the selected image onto the canvas
        // Use ctx.drawImage() here
        render(imgSrc);
    });

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
</script>

<!-- Image Cropper -->
<Modal
    bind:this={modalThis}
    id={modalId}
    useLabel={false}
    addCSS={''}
    on:close={() => {
        triggerCrop = true;
    }}
    ><!--addCSS is a prop for injecting CSS into the modal-->
    <svelte:fragment slot="content">
        <div style="width: 100vw; height: 80vh; border: 5px soild yellow;">
            <canvas bind:this={canvas} />

            <div
                class="crop-box"
                style="
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
    </svelte:fragment>
</Modal>

<style>
</style>
