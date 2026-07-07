<!--
@component
Plan Stop Modal Dialog component.
-->

<script lang="ts">
    import { addAudioClip } from '$lib/data/audio';
    import { refs, t, userSettings } from '$lib/data/stores';
    import { CheckboxIcon, CheckboxOutlineIcon } from '$lib/icons';
    import Modal from './Modal.svelte';

    let { planId = $bindable(undefined) } = $props();

    const modalId = 'planStopDialog';
    let modal: Modal | undefined = $state(undefined);
    let downloadAutomatically: boolean = $state(false);
    let audioUrl: string = '';
    let error = $state('');

    export function showModal(url: string) {
        audioUrl = url;
        modal?.showModal();
    }
    async function downloadAudio() {
        if (downloadAutomatically) {
            $userSettings['audio-auto-download'] = 'auto';
        }
        let addedAudioClip = await addAudioClip(
            {
                docSet: $refs.docSet,
                collection: $refs.collection,
                book: $refs.book,
                chapter: $refs.chapter
            },
            audioUrl
        );
        if (!addedAudioClip) {
            error = 'Audio clip could not be downloaded';
            setTimeout(() => {
                error = '';
            }, 2000);
        }
    }
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
                    console.log('HI');
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
                    onclick={() => downloadAudio()}
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
