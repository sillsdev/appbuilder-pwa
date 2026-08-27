<script lang="ts">
    import DownloadSelector from '$lib/components/DownloadSelector.svelte';
    import Navbar from '$lib/components/Navbar.svelte';
    import VerseOnImage from '$lib/components/VerseOnImage.svelte';
    import { actionBarColor, modal, ModalType, NAVBAR_HEIGHT, refs, t } from '$lib/data/stores';
    import { DownloadIcon, ShareIcon } from '$lib/icons';
    import { fromStore } from 'svelte/store';

    let verseOnImage_Component: VerseOnImage;
    function share() {
        if (verseOnImage_Component) {
            verseOnImage_Component.shareCanvas(); // Call the exported function from the VerseOnImage component
        }
    }
    function downloadImage() {
        if (verseOnImage_Component) {
            verseOnImage_Component.downloadCanvas(); // Call the exported function from the VerseOnImage component
        }
    }
    function downloadVideo() {
        if (verseOnImage_Component) {
            verseOnImage_Component.downloadVideo(); // Call the exported function from the VerseOnImage component
        }
    }
    const stateModal = fromStore<any[]>(modal);
    $effect(() => {
        if (stateModal.current.length > 0) {
            showModal();
        }
    });

    function showModal() {
        if ($modal.length > 0) {
            $modal.forEach(({ modalType, data }) => {
                switch (modalType) {
                    case ModalType.Download:
                        downloadSelector.showModal();
                        break;
                }
            });
            modal.clear();
        }
    }
    function downloadClicked() {
        if ($refs.hasAudio?.timingFile) {
            modal.open(ModalType.Download);
        } else {
            downloadImage();
        }
    }
    let downloadSelector: DownloadSelector;
</script>

<div class="grid grid-rows-[auto_1fr]" style="height:100vh;height:100dvh;">
    <div class="navbar h-16">
        <Navbar>
            <!-- <div slot="left-buttons" /> -->
            {#snippet center()}
                <label for="sidebar">
                    <div class="dy-btn dy-btn-ghost normal-case text-xl">
                        {$t['Text_On_Image_Title']}
                    </div>
                </label>
            {/snippet}
            {#snippet end()}
                <div>
                    <button class="dy-btn-sm dy-btn-ghost" onclick={share}>
                        <ShareIcon color={$actionBarColor} />
                    </button>
                </div>
                <button class="dy-btn-sm dy-btn-ghost" onclick={downloadClicked}>
                    <DownloadIcon color={$actionBarColor} />
                </button>
            {/snippet}
        </Navbar>
    </div>
    <DownloadSelector
        bind:this={downloadSelector}
        vertOffset={NAVBAR_HEIGHT}
        {downloadImage}
        {downloadVideo}
    />

    <div class="overflow-y-auto">
        <VerseOnImage bind:this={verseOnImage_Component} />
    </div>
</div>
