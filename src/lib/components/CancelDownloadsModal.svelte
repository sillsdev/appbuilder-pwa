<!--
@component
Cancel Downloads Modal Dialog component.
-->

<script lang="ts">
    import { t } from '$lib/data/stores';
    import { getWorker } from '$lib/download-worker/workerSingleton';
    import Modal from './Modal.svelte';

    const modalId = 'cancelDownloadsModal';
    let modal: Modal | undefined = $state(undefined);

    export function showModal() {
        modal?.showModal();
    }
    const downloadWorker = getWorker();
    function onConfirmYes() {
        downloadWorker.postMessage({
            type: 'CANCEL_ALL_DOWNLOADS'
        });

        modal?.close();
    }
</script>

<Modal bind:this={modal} id={modalId}>
    <div id="container" class="message">
        <div class="message-body" id="message-body">
            <div class="message-header"></div>
            <div class="message-title">
                {$t['Download_Cancel_Downloads']}
            </div>
            <div class="message-text">
                {$t['Download_Cancel_Downloads_Confirm']}
            </div>
        </div>

        <div class="left-0 dy-modal-action message-footer pointer-events-none">
            <div class="message-buttons">
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
            </div>
        </div>
    </div>
</Modal>
