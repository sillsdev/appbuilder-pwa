<svelte:options accessors={true} />

<script lang="ts">
    import { addNote, editNote } from '$lib/data/notes';
    import { EditIcon } from '$lib/icons';
    import Modal from './Modal.svelte';
    import { t, selectedVerses, bodyFontSize, currentFont } from '$lib/data/stores';
    import { goto } from '$app/navigation';
    import { base } from '$app/paths';

    export let note = undefined;
    export let editing = false;


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
        if (note !== undefined) goto(`${base}/notes/edit/${note.date}`);
    }
</script>

<Modal bind:this={modal} {id} onclose={reset}>
        <div class="flex flex-col justify-evenly">
            <div class="w-full flex justify-between items-center">
                <div class="w-full pb-3" style:font-weight={editing ? 'normal' : 'bold'}>
                    {heading}
                </div>
                    <button class="dy-btn dy-btn-ghost dy-btn-circle" onclick={onEditNote}>
                        <EditIcon />
                    </button>
            </div>

            <div style:word-wrap="break-word" class="mt-2">
            <!-- TODO Check if this first if-statement is still necessary -->
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

            <!--  </div> -->
<!--            {#if editing}
                <div class="w-full flex mt-4 justify-between">
                    <button class="dy-btn dy-btn-sm dy-btn-ghost">{$t['Button_Cancel']}</button>
                    <button onclick={modifyNote} class="dy-btn dy-btn-sm dy-btn-ghost"
                        >{$t['Button_OK']}</button
                    >
                </div>
            {/if}-->
        </div>
</Modal>
