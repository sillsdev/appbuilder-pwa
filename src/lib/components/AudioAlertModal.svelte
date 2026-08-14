<!--
@component
No Connection Modal Dialog component.
-->
<script lang="ts" module>
    export interface AudioAlertModalProps {
        messageKey: string;
        title?: string;
        details?: string;
    }
</script>

<script lang="ts">
    import { t } from '$lib/data/stores';
    import Modal from './Modal.svelte';

    const modalId = 'audioAlertModal';
    let modal: Modal | undefined = $state(undefined);

    let props: AudioAlertModalProps = $state({ messageKey: '' });

    export function showModal(_props: AudioAlertModalProps) {
        props = _props;
        modal?.showModal();
    }
</script>

<Modal bind:this={modal} id={modalId}>
    <div id="container" class="message">
        <div class="message-body" id="message-body">
            <div class="message-header"></div>
            {#if props.title}
                <div class="message-title">
                    {$t[props.title]}
                </div>
            {/if}
            <div class="message-text">
                {#if props.messageKey}
                    {$t[props.messageKey]}
                {/if}
                {#if props.details}
                    <br />{props.details}
                {/if}
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
