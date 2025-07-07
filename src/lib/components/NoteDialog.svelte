<svelte:options accessors={true} />

<script lang="ts">
    import { bodyFontSize, currentFont, selectedVerses, t } from '$lib/data/stores';
    import { EditIcon } from '$lib/icons';
    import { gotoRoute } from '$lib/navigate';
    import Modal from './Modal.svelte';

    export let note = undefined;

    let id = 'note';
    let modal;
    let text: string;

    $: heading = note?.reference ?? '';

    export function showModal() {
        if (note !== undefined) {
            text = note.text;
            modal.showModal();
        } else {
            console.log('No note available!');
        }
    }

    function reset() {
        text = '';
        selectedVerses.reset();
    }

    function onEditNote() {
        if (note !== undefined) gotoRoute(`/notes/edit/${note.date}`);
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
            {#if text !== undefined}
                {#each text.split(/\r?\n/) as line}
                    {#if line}
                        <p style:font-family={$currentFont} style:font-size="{$bodyFontSize}px">
                            {line}
                        </p>
                    {:else}
                        <br />
                    {/if}
                {/each}
            {/if}
        </div>
    </div>
</Modal>
