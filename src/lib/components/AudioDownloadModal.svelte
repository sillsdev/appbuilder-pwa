<!--
@component
Audio Download Modal Dialog component.
-->

<script lang="ts">
    import { updateAudioPlayer } from '$lib/data/audio';
    import { addAudioFile } from '$lib/data/audioFilesDB';
    import {
        ensureWritableMusicDirHandle,
        getStoredMusicDirHandle,
        isFileSystemAccessSupported,
        pickMusicDirectory,
        STORAGE_CHOICE_KEY
    } from '$lib/data/audioFileSystem';
    import { modal as alert, ModalType, refs, t, userSettings } from '$lib/data/stores';
    import { CheckboxIcon, CheckboxOutlineIcon } from '$lib/icons';
    import { tick } from 'svelte';
    import Modal from './Modal.svelte';

    const modalId = 'audioDownloadModal';
    let modal: Modal | undefined = $state(undefined);
    let modalStep: 'confirm' | 'storage-offer' = $state('confirm');
    let downloadAutomatically: boolean = $state(false);
    let audioUrl: string = '';
    let afterDownload: ((success: boolean) => void) | undefined;

    export function showModal(
        url: string,
        options?: { afterDownload?: (success: boolean) => void }
    ) {
        audioUrl = url;
        afterDownload = options?.afterDownload;
        modalStep = 'confirm';
        modal?.showModal();
    }

    async function shouldOfferFilesystemStorage(): Promise<boolean> {
        if (!isFileSystemAccessSupported() || localStorage.getItem(STORAGE_CHOICE_KEY)) {
            return false;
        }
        return !(await getStoredMusicDirHandle());
    }

    async function onConfirmYes() {
        if (await shouldOfferFilesystemStorage()) {
            modalStep = 'storage-offer';
            return;
        }
        modal?.close();
        await proceedWithDownload();
    }

    async function onStorageOfferChoice(saveToFilesystem: boolean) {
        modal?.close();
        modalStep = 'confirm';
        const handle = saveToFilesystem ? await pickMusicDirectory() : undefined;
        localStorage.setItem(STORAGE_CHOICE_KEY, handle ? 'enabled' : 'declined');
        await proceedWithDownload();
    }
    export async function downloadAudio(
        url: string,
        item: { docSet: string; collection: string; book: string; chapter: string },
        options?: {
            noAutoplay?: boolean;
            hideBar?: boolean;
            afterDownload?: (success: boolean) => void;
        }
    ): ReturnType<typeof addAudioFile> {
        try {
            if (downloadAutomatically) {
                $userSettings['audio-auto-download'] = 'auto';
            }
            if (!options?.hideBar) {
                downloadProgress = 1;
            }
            abortController = new AbortController();
            // Resolve (and if needed, request) filesystem permission here, right
            // at the top of the call, so it happens as close as possible to the
            // user gesture that triggered the download - the fetch below can take
            // a while, and by the time it finishes the click's transient
            // activation needed for a permission prompt is likely gone.
            const musicDirHandle = await ensureWritableMusicDirHandle();
            console.debug('[audio-fs] downloadAudio: musicDirHandle resolved', {
                hasHandle: !!musicDirHandle
            });
            const addedAudioFile = await addAudioFile(
                {
                    docSet: item.docSet,
                    collection: item.collection,
                    book: item.book,
                    chapter: item.chapter
                },
                url,
                abortController,
                (percent) => {
                    if (!options?.hideBar) {
                        tick().then(() => (downloadProgress = percent));
                    }
                },
                musicDirHandle
            );
            if (!options?.hideBar) {
                downloadProgress = 0;
            }

            if (!addedAudioFile.success) {
                options?.afterDownload?.(false);
                return addedAudioFile;
            }
            updateAudioPlayer(item, { autoplay: !options?.noAutoplay });
            options?.afterDownload?.(true);
            return addedAudioFile;
        } catch (err) {
            options?.afterDownload?.(false);
            console.error('Error downloading audio: ', err);
            return { success: false, error: err instanceof Error ? err.message : String(err) };
        }
    }
    async function proceedWithDownload() {
        const addedAudioFile = await downloadAudio(audioUrl, $refs, { afterDownload });
        if (!addedAudioFile.success && !abortController?.signal.aborted) {
            modal?.close();
            alert.open(ModalType.AudioAlert, {
                messageKey: 'Audio_Download_Error',
                details: addedAudioFile.error
            });
            return false;
        }
    }
    let downloadProgress = $state(0);
    let abortController: AbortController | undefined = undefined;
    let audioDownloadingMessage = $derived(
        $t['Audio_Downloading']
            .replace('%book', $refs.name || $refs.book)
            .replace('%chapter', $refs.chapter)
    );
</script>

<Modal bind:this={modal} id={modalId}>
    <div id="container" class="message">
        <div class="message-body" id="message-body">
            <div class="message-header"></div>
            {#if modalStep === 'confirm'}
                <div class="message-title">
                    {$t['Audio_Download_Title']}
                </div>
                <div class="message-text">
                    {$t['Audio_Download_Confirm']}
                </div>
                <div class="message-checkbox flex w-full">
                    <label class="flex w-full cursor-pointer items-center">
                        <input
                            type="checkbox"
                            class="sr-only"
                            bind:checked={downloadAutomatically}
                        />
                        <div class="message-checkbox-left" aria-hidden="true">
                            {#if downloadAutomatically}
                                <CheckboxIcon></CheckboxIcon>
                            {:else}
                                <CheckboxOutlineIcon></CheckboxOutlineIcon>
                            {/if}
                        </div>
                        <div class="message-checkbox-caption">{$t['Audio_Download_Auto']}</div>
                    </label>
                </div>
            {:else}
                <div class="message-title">
                    {$t['Audio_Download_Title']}
                </div>
                <div class="message-text">
                    {$t['Audio_Storage_Offer']}
                </div>
            {/if}
        </div>

        <div class="left-0 dy-modal-action message-footer pointer-events-none">
            <div class="message-buttons">
                {#if modalStep === 'confirm'}
                    <button
                        class="dy-btn message-button pointer-events-auto"
                        id="no"
                        type="button"
                        onclick={() => modal?.close()}
                    >
                        {$t['Button_No']}
                    </button>
                    <button
                        class="dy-btn message-button pointer-events-auto"
                        id="yes"
                        type="button"
                        onclick={() => onConfirmYes()}
                    >
                        {$t['Button_Yes']}
                    </button>
                {:else}
                    <button
                        class="dy-btn message-button pointer-events-auto"
                        id="no"
                        type="button"
                        onclick={() => onStorageOfferChoice(false)}
                    >
                        {$t['Button_No']}
                    </button>
                    <button
                        class="dy-btn message-button pointer-events-auto"
                        id="yes"
                        type="button"
                        onclick={() => onStorageOfferChoice(true)}
                    >
                        {$t['Button_Yes']}
                    </button>
                {/if}
            </div>
        </div>
    </div>
</Modal>
{#if downloadProgress > 0}
    <div class="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50">
        <div class="message" id="container">
            <div class="w-70 md:w-100 message-body">
                <div class="message-header h-5"></div>
                <div class="message-title">{$t['Audio_Download_Title']}</div>
                <div class="message-text">{audioDownloadingMessage}</div>

                <div
                    class="message-progress"
                    style="padding-left: 20px; padding-right: 20px; padding-top: 20px; padding-bottom: 20px;"
                >
                    <div class="w-full h-1 dy-progress bg-[#e4e4e4]">
                        <div class="h-full bg-black" style="width: {downloadProgress}%"></div>
                    </div>
                </div>
            </div>
            <div class="flex justify-end">
                <button
                    class="dy-btn dy-btn-sm message-button"
                    onclick={() => {
                        downloadProgress = 0;
                        abortController?.abort();
                    }}>{$t['Button_Cancel']}</button
                >
            </div>
        </div>
    </div>
{/if}
