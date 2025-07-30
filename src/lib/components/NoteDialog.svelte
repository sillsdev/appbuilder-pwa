<script lang="ts">
    import { bodyFontSize, currentFont } from '$lib/data/stores';
    import { EditIcon } from '$lib/icons';
    import { gotoRoute } from '$lib/navigate';
    import Modal from './Modal.svelte';

    let id = $state('note');
    let modal: Modal = $state();
    let note: { date: string; text: string; reference: string } | undefined = $state(undefined);

    const heading = $derived(note?.reference ?? '');
    const text = $derived(note?.text ?? '');

    export function showModal(showNote: { date: string; text: string; reference: string }) {
        note = showNote;
        modal.showModal();
    }

    function reset() {
        note = undefined;
    }

    function onEditNote() {
        if (note !== undefined) {
            gotoRoute(`/notes/edit/${note.date}`);
        }
    }
</script>

<Modal bind:this={modal} {id} onclose={reset}>
    <div class="flex flex-col justify-evenly">
        <div class="w-full flex justify-between items-center">
            <div class="w-full pb-3" style:font-weight="bold">
                <p style:font-family={$currentFont} style:font-size="{$bodyFontSize}px">
                    {heading}
                </p>
            </div>

            <button class="dy-btn dy-btn-ghost dy-btn-circle" onclick={onEditNote}>
                <EditIcon />
            </button>
        </div>

        <div style:word-wrap="break-word" class="mt-2">
            {#each text.split(/\r?\n/) as line}
                {#if line}
                    <p style:font-family={$currentFont} style:font-size="{$bodyFontSize}px">
                        {line}
                    </p>
                {:else}
                    <br />
                {/if}
            {/each}
        </div>
    </div>
</Modal>
