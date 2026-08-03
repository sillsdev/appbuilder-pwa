<!--
@component
Plan Stop Modal Dialog component.
-->

<script lang="ts">
    import { goto } from '$app/navigation';
    import { deleteAllProgressItemsForPlan } from '$lib/data/planProgressItems';
    import { addPlanState } from '$lib/data/planStates';
    import { t } from '$lib/data/stores';
    import { resolve } from '$lib/utils/paths';
    import Modal from './Modal.svelte';

    let { planId = $bindable(undefined) } = $props();

    const modalId = 'planStopDialog';
    let modal: Modal | undefined = $state(undefined);

    export function showModal() {
        modal?.showModal();
    }
    async function stopPlan() {
        await addPlanState({
            id: planId,
            state: 'stopped'
        });
        await deleteAllProgressItemsForPlan(planId);
    }
    function handleYes() {
        stopPlan().then(() => {
            goto(resolve(`/plans`));
        });
    }
</script>

<Modal bind:this={modal} id={modalId}>
    <div id="container" class="message">
        <div class="message-body" id="message-body">
            <div class="message-header"></div>
            <div class="message-title">
                {$t['Plans_Stop_Plan_Confirm_Title']}
            </div>
            <div class="message-text">
                {$t['Plans_Stop_Plan_Confirm_Message']}
            </div>
        </div>

        <div class="flex w-full justify-between dy-modal-action">
            <div class="message-buttons">
                <button class="dy-btn message-button" id="no">
                    {$t['Button_No']}
                </button>
                <button class="dy-btn message-button" id="yes" onclick={() => handleYes()}>
                    {$t['Button_Yes']}
                </button>
            </div>
        </div>
    </div>
</Modal>
