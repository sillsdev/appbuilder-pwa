<script lang="ts">
    //TODO: Implement video download
    import DownloadSelector from '$lib/components/DownloadSelector.svelte';
    import Navbar from '$lib/components/Navbar.svelte';
    import VerseOnImage from '$lib/components/VerseOnImage.svelte';
    import { modal, ModalType, NAVBAR_HEIGHT, t } from '$lib/data/stores';
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
        console.log('Download video (Not yet implemented)');
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
    let downloadSelector: DownloadSelector;
</script>

<div class="grid grid-rows-[auto,1fr]" style="height:100vh;height:100dvh;">
    <div class="navbar h-16">
        <Navbar>
            <!-- <div slot="left-buttons" /> -->
            {#snippet center()}
                <label for="sidebar">
                    <div class="btn btn-ghost normal-case text-xl">{$t['Text_On_Image_Title']}</div>
                </label>
            {/snippet}
            {#snippet end()}
                <div>
                    <button class="dy-btn-sm dy-btn-ghost" onclick={share}>
                        <ShareIcon color="white" />
                    </button>
                </div>
                <button
                    class="dy-btn-sm dy-btn-ghost"
                    onclick={() => modal.open(ModalType.Download)}
                >
                    <DownloadIcon color="white" />
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

    <div class="overflow-y-auto" style="border:0px solid orange;">
        <VerseOnImage bind:this={verseOnImage_Component} />
    </div>
</div>
