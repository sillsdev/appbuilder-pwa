<!--
@component
Audio Download Modal Dialog component.
-->

<script lang="ts">
    import { updateAudioPlayer } from '$lib/data/audio';
    import { addAudioClip } from '$lib/data/audioclipsDB';
    import { refs, t, userSettings } from '$lib/data/stores';
    import { CheckboxIcon, CheckboxOutlineIcon } from '$lib/icons';
    import { tick } from 'svelte';
    import Modal from './Modal.svelte';

    const modalId = 'audioDownloadModal';
    let modal: Modal | undefined = $state(undefined);
    let downloadAutomatically: boolean = $state(false);
    let audioUrl: string = '';
    let error = $state('');

    export function showModal(url: string) {
        audioUrl = url;
        modal?.showModal();
    }
    export async function downloadAudio(url: string) {
        try {
            if (downloadAutomatically) {
                $userSettings['audio-auto-download'] = 'auto';
            }
            downloadProgress = 1;
            abortController = new AbortController();
            let addedAudioClip = await addAudioClip(
                {
                    docSet: $refs.docSet,
                    collection: $refs.collection,
                    book: $refs.book,
                    chapter: $refs.chapter
                },
                url,
                abortController,
                (percent) => {
                    tick().then(() => (downloadProgress = percent));
                }
            );
            downloadProgress = 0;

            if (!addedAudioClip) {
                return false;
            }
            updateAudioPlayer($refs);
            return addedAudioClip;
        } catch (err) {
            console.error('Error downloading audio: ', err);
            return false;
        }
    }
    async function finishModal() {
        const addedAudioClip = await downloadAudio(audioUrl);
        if (!addedAudioClip && !abortController?.signal.aborted) {
            error = 'Audio clip could not be downloaded';
            setTimeout(() => {
                error = '';
            }, 2000);
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
            <div class="message-title">
                {$t['Audio_Download_Title']}
            </div>
            <div class="message-text">
                {$t['Audio_Download_Confirm']}
            </div>
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <div
                class="message-checkbox flex w-full"
                onclick={() => {
                    downloadAutomatically = !downloadAutomatically;
                }}
            >
                <div class="message-checkbox-left">
                    {#if downloadAutomatically}
                        <CheckboxIcon></CheckboxIcon>
                    {:else}
                        <CheckboxOutlineIcon></CheckboxOutlineIcon>
                    {/if}
                </div>
                <div class="message-checkbox-caption">{$t['Audio_Download_Auto']}</div>
            </div>
        </div>

        <div class="left-0 dy-modal-action message-footer pointer-events-none">
            <div class="message-buttons">
                <button class="dy-btn message-button pointer-events-auto" id="no">
                    {$t['Button_No']}
                </button>
                <button
                    class="dy-btn message-button pointer-events-auto"
                    id="yes"
                    onclick={() => finishModal()}
                >
                    {$t['Button_Yes']}
                </button>
            </div>
        </div>
    </div>
</Modal>
{#if error}
    <div class="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
        <div
            class="dy-modal-box overflow-y-visible relative opacity-100 text-red-500 text-center pointer-events-auto"
        >
            {error}
        </div>
    </div>
{/if}
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
