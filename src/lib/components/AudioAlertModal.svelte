<!--
@component
No Connection Modal Dialog component.
-->

<script lang="ts">
    import { t } from '$lib/data/stores';
    import Modal from './Modal.svelte';

    const modalId = 'audioAlertModal';
    let modal: Modal | undefined = $state(undefined);

    let messageKey = $state('');

    export function showModal(_messageKey: string) {
        messageKey = _messageKey;
        modal?.showModal();
    }
</script>

<Modal bind:this={modal} id={modalId}>
    <div id="container" class="message">
        <div class="message-body" id="message-body">
            <div class="message-header"></div>
            <div class="message-text">
                {$t[messageKey]}
            </div>
        </div>

        <div class="static! min-h-4! left-0 dy-modal-action message-footer pointer-events-none">
            <div class="message-buttons">
                <button class="dy-btn message-button pointer-events-auto" id="yes">
                    {$t['Button_OK']}
                </button>
            </div>
        </div>
    </div>
</Modal>
