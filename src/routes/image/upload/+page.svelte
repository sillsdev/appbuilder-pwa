<script lang="ts">
    import { goto } from '$app/navigation';
    import Navbar from '$lib/components/Navbar.svelte';
    import { actionBarColor, t, voiCustomImage } from '$lib/data/stores';
    import { CheckIcon } from '$lib/icons';
    import { resolve } from '$lib/utils/paths';
    import { onDestroy, onMount } from 'svelte';

    let image: HTMLImageElement;
    let container: HTMLDivElement;

    let cropTop = $state(0);
    let cropLeft = $state(0);
    let cropSize = $state(100);

    let dragging = false;
    let dragStartX = 0;
    let dragStartY = 0;
    let resizing = false;
    let imageRect = $state({
        left: 0,
        top: 0,
        right: 0,
        bottom: 0,
        width: 0,
        height: 0
    });

    let resizeStartSize = $state(0);
    let resizeStartDistance = $state(0); //These are variables for the 2-finger resize

    onMount(() => {
        if (!image || !$voiCustomImage.original) {
            goto(resolve('/image'));
            return;
        }
        if (image.complete) {
            initCropBox();
        } else {
            image.addEventListener('load', initCropBox, { once: true });
            return () => image.removeEventListener('load', initCropBox);
        }
    });
    function initCropBox() {
        imageRect = getImageRect(image);
        cropSize = Math.max(20, Math.min(100, imageRect.width, imageRect.height));
        cropLeft = imageRect.left;
        cropTop = imageRect.top;
    }
    function getImageRect(img: HTMLImageElement) {
        const containerRect = container.getBoundingClientRect();
        const naturalRatio = img.naturalWidth / img.naturalHeight;
        const containerRatio = containerRect.width / containerRect.height;

        let width, height;

        if (naturalRatio > containerRatio) {
            width = containerRect.width;
            height = width / naturalRatio;
        } else {
            height = containerRect.height;
            width = height * naturalRatio;
        }
        const left = (containerRect.width - width) / 2;
        const top = (containerRect.height - height) / 2;

        return {
            left,
            top,
            right: left + width,
            bottom: top + height,
            width,
            height
        };
    }
    function getDistance(t1: Touch, t2: Touch) {
        const dx = t2.clientX - t1.clientX;
        const dy = t2.clientY - t1.clientY;
        return Math.sqrt(dx * dx + dy * dy);
    }

    function onTouchStart(e: TouchEvent) {
        if (e.touches.length === 2) {
            const [t1, t2] = e.touches;
            resizeStartDistance = getDistance(t1, t2);
            resizeStartSize = cropSize;
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
            const rect = getImageRect(image);

            const scale = currentDistance / resizeStartDistance;
            let newSize = resizeStartSize * scale;
            const maxSizeX = rect.right - cropLeft;
            const maxSizeY = rect.bottom - cropTop;
            newSize = Math.max(20, Math.min(newSize, maxSizeX, maxSizeY));

            const sizeDifference = -(newSize - cropSize);
            cropLeft = Math.min(
                Math.max(cropLeft + sizeDifference / 2, rect.left),
                rect.right - newSize
            );
            cropTop = Math.min(
                Math.max(cropTop + sizeDifference / 2, rect.top),
                rect.bottom - newSize
            );
            cropSize = newSize;
        }
    } //2-finger resize

    function startDrag(e: PointerEvent) {
        dragging = true;
        dragStartX = e.clientX - cropLeft;
        dragStartY = e.clientY - cropTop;

        window.addEventListener('pointermove', drag);
        window.addEventListener('pointerup', stopDrag);
    }

    function drag(e: PointerEvent) {
        if (!dragging) {
            return;
        }
        if (resizing) {
            return;
        }

        const rect = getImageRect(image);

        cropLeft = Math.min(Math.max(e.clientX - dragStartX, rect.left), rect.right - cropSize);

        cropTop = Math.min(Math.max(e.clientY - dragStartY, rect.top), rect.bottom - cropSize);
    }

    function stopDrag() {
        dragging = false;
        window.removeEventListener('pointermove', drag);
        window.removeEventListener('pointerup', stopDrag);
    }
    function startResize(e: PointerEvent) {
        e.preventDefault();
        resizing = true;
        dragStartX = e.clientX;
        dragStartY = e.clientY;

        window.addEventListener('pointermove', resize);
        window.addEventListener('pointerup', stopResize);
    }
    function resize(e: PointerEvent) {
        if (!resizing) {
            return;
        }
        if (dragging) {
            stopDrag();
        }
        const rect = getImageRect(image);

        const containerRect = container.getBoundingClientRect();
        const pointerX = e.clientX - containerRect.left;
        const pointerY = e.clientY - containerRect.top;
        let newSize = Math.max(pointerX - cropLeft, pointerY - cropTop);

        const maxSizeX = rect.right - cropLeft;
        const maxSizeY = rect.bottom - cropTop;
        newSize = Math.min(newSize, maxSizeX, maxSizeY);

        cropSize = Math.max(20, newSize);
    }

    function stopResize() {
        resizing = false;
        window.removeEventListener('pointermove', resize);
        window.removeEventListener('pointerup', stopResize);
    }
    function getCroppedImage() {
        const imgRect = getImageRect(image);

        const scaleX = image.naturalWidth / imgRect.width;
        const scaleY = image.naturalHeight / imgRect.height;

        const cropX = (cropLeft - imgRect.left) * scaleX;
        const cropY = (cropTop - imgRect.top) * scaleY;
        const cropImgSize = cropSize * scaleX;

        const canvas = document.createElement('canvas');
        canvas.width = cropImgSize;
        canvas.height = cropImgSize;

        const ctx = canvas.getContext('2d');
        ctx?.drawImage(
            image,
            cropX,
            cropY,
            cropImgSize,
            cropImgSize,
            0,
            0,
            canvas.width,
            canvas.height
        );

        return canvas.toDataURL('image/png');
    }
    function cropImage() {
        if (!image?.complete) {
            return;
        }
        let croppedImgURL = getCroppedImage();
        voiCustomImage.update((v) => ({
            ...v,
            cropped: croppedImgURL
        }));
        goto(resolve('/image'));
    }
    function backNavigation() {
        goto(resolve('/image'));
    }
    onDestroy(() => {
        window.removeEventListener('pointermove', drag);
        window.removeEventListener('pointerup', stopDrag);
        window.removeEventListener('pointermove', resize);
        window.removeEventListener('pointerup', stopResize);
    });
</script>

<div class="flex flex-col h-screen">
    <div class="navbar h-16">
        <Navbar {backNavigation}>
            {#snippet center()}
                <label for="sidebar">
                    <div class="btn btn-ghost normal-case text-xl">{$t['Crop_Image_Title']}</div>
                </label>
            {/snippet}
            {#snippet end()}
                <div>
                    <button class="dy-btn-sm dy-btn-ghost" onclick={cropImage}>
                        <CheckIcon color={$actionBarColor} />
                    </button>
                </div>
            {/snippet}
        </Navbar>
    </div>

    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
        class="relative touch-none flex-1 overflow-hidden"
        bind:this={container}
        ontouchstart={onTouchStart}
        ontouchmove={onTouchMove}
    >
        {#if $voiCustomImage.original}
            <!-- svelte-ignore a11y_img_redundant_alt -->
            <img
                src={$voiCustomImage.original}
                bind:this={image}
                alt="Selected Image"
                class="w-full h-full object-contain select-none"
            />
        {:else}
            <div>Error: No image</div>
        {/if}
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div
            class="absolute border-4 border-white cursor-move"
            style="
                left: {cropLeft}px;
                top: {cropTop}px;
                width: {cropSize}px;
                height: {cropSize}px;
            "
            onpointerdown={startDrag}
        >
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <div
                class="absolute bottom-0 right-0 w-6 h-6 bg-white cursor-se-resize"
                onpointerdown={startResize}
            ></div>
        </div>
        <div
            class="absolute bg-black/50 pointer-events-none"
            style="
                left:{imageRect.left}px;
                top:{imageRect.top}px;
                width:{imageRect.width}px;
                height:{cropTop - imageRect.top}px;
            "
        ></div>

        <!-- BOTTOM overlay -->
        <div
            class="absolute bg-black/50 pointer-events-none"
            style="
                left:{imageRect.left}px;
                top:{cropTop + cropSize}px;
                width:{imageRect.width}px;
                height:{imageRect.bottom - (cropTop + cropSize)}px;
            "
        ></div>

        <!-- LEFT overlay -->
        <div
            class="absolute bg-black/50 pointer-events-none"
            style="
                left:{imageRect.left}px;
                top:{cropTop}px;
                width:{cropLeft - imageRect.left}px;
                height:{cropSize}px;
            "
        ></div>

        <!-- RIGHT overlay -->
        <div
            class="absolute bg-black/50 pointer-events-none"
            style="
                left:{cropLeft + cropSize}px;
                top:{cropTop}px;
                width:{imageRect.right - (cropLeft + cropSize)}px;
                height:{cropSize}px;
            "
        ></div>
    </div>
</div>
