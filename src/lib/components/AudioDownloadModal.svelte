<!--
@component
Plan Stop Modal Dialog component.
-->

<script lang="ts">
    import { t } from '$lib/data/stores';
    import { CheckboxIcon, CheckboxOutlineIcon } from '$lib/icons';
    import Modal from './Modal.svelte';

    let { planId = $bindable(undefined) } = $props();

    const modalId = 'planStopDialog';
    let modal: Modal | undefined = $state(undefined);
    let downloadAutomatically: boolean = $state(false);

    export function showModal() {
        modal?.showModal();
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
                onclick={() => (downloadAutomatically = !downloadAutomatically)}
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

        <div class="left-0 dy-modal-action message-footer">
            <div class="message-buttons">
                <button class="dy-btn message-button" id="no">
                    {$t['Button_No']}
                </button>
                <button class="dy-btn message-button" id="yes">
                    {$t['Button_Yes']}
                </button>
            </div>
        </div>
    </div>
</Modal>
