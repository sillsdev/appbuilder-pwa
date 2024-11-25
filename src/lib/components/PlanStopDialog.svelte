<!--
@component
Plan Stop Modal Dialog component.
-->

<svelte:options accessors={true} />

<script>
    import Modal from './Modal.svelte';
    import { t } from '$lib/data/stores';
    import { addPlanState } from '$lib/data/planStates';
    import { deleteAllProgressItemsForPlan } from '$lib/data/planProgressItems';
    import { goto } from '$app/navigation';
    import { base } from '$app/paths';

    export let planId = undefined;

    const modalId = 'planStopDialog';
    let modal;

    export function showModal() {
        modal.showModal();
    }
    async function stopPlan() {
        await addPlanState({
            id: planId,
            state: 'stopped'
        });
        await deleteAllProgressItemsForPlan(planId);
    }
    function handleYes() {
        console.log('Yes', planId);
        stopPlan().then(() => {
            goto(`${base}/plans`);
        });
    }

    function handleNo() {
        console.log('No');
    }

    export let vertOffset = '1rem'; //Prop that will have the navbar's height (in rem) passed in
    //The positioningCSS positions the modal 1rem below the navbar and 1rem from the right edge of the screen (on mobile it will be centered)
    $: positioningCSS =
        'position:absolute; top:' +
        (Number(vertOffset.replace('rem', '')) + 1) +
        'rem; inset-inline-end:1rem;';
</script>

<!--addCSS is a prop for injecting CSS into the modal-->
<Modal bind:this={modal} id={modalId} useLabel={false}>
    <svelte:fragment slot="content">
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
                    <button class="dy-btn message-button" id="no" on:click={() => handleNo()}>
                        {$t['Button_No']}
                    </button>
                    <button class="dy-btn message-button" id="yes" on:click={() => handleYes()}>
                        {$t['Button_Yes']}
                    </button>
                </div>
            </div>
        </div>
    </svelte:fragment>
</Modal>
