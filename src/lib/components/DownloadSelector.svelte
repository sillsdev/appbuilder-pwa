<!--
@component
A component for verse-on-image providing a dropdown where you can choose to download an image or a video
-->

<script lang="ts">
    import { getPositioningCSS, t, themeColors } from '$lib/data/stores';
    import { ImageIcon, VideoIcon } from '$lib/icons';
    import Modal from './Modal.svelte';

    let { vertOffset = '1rem', downloadImage = () => {}, downloadVideo = () => {} } = $props();

    let modalId = 'downloadSelector';
    let modalThis: Modal;
    export function showModal() {
        modalThis.showModal();
    }
    const positioningCSS = $derived(getPositioningCSS(vertOffset, 'top'));
</script>

<!-- svelte-ignore a11y_consider_explicit_label -->
<Modal
    bind:this={modalThis}
    id={modalId}
    styling="padding:0; background-color:{$themeColors[
        'PopupBackgroundColor'
    ]}; width:auto; {positioningCSS}"
>
    <div class="grid gap-2 m-2">
        <button
            class="dy-btn dy-btn-sm flex border-none"
            onclick={() => downloadImage()}
            style="background-color:{$themeColors['PopupBackgroundColor']}; color:{$themeColors[
                'TextColor'
            ]}"
        >
            <ImageIcon.Image color={$themeColors['TextColor']} />
            {$t['Text_On_Image_Save_Image']}
        </button>
        <button
            class="dy-btn dy-btn-sm flex border-none"
            style="background-color:{$themeColors['PopupBackgroundColor']}; color:{$themeColors[
                'TextColor'
            ]}"
            onclick={() => downloadVideo()}
        >
            <VideoIcon color={$themeColors['TextColor']} />
            {$t['Text_On_Image_Save_Video']}
        </button>
    </div>
</Modal>
