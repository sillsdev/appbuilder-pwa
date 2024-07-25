<svelte:options accessors={true} />

<script lang="ts">
    import { addNote, editNote } from '$lib/data/notes';
    import { bodyFontSize, currentFont, selectedVerses, t } from '$lib/data/stores';
    import { EditIcon } from '$lib/icons';
    import Modal from './Modal.svelte';
    import { t, selectedVerses, bodyFontSize, currentFont, noteEditing } from '$lib/data/stores';
    import { addNote } from '$lib/data/notes';
    import { goto } from '$app/navigation';
    import { base } from '$app/paths';

    export let note = undefined;
    export let editing = false;
    $: noteEditing.set(editing);

    let id = 'note';
    let modal;
    let title: string;
    let text: string;

    // $: heading = editingProp ? $t[title] ?? '' : note?.reference ?? '';
    $: heading = editing ? note?.reference ?? '' : $t[title] ?? '';

    export async function showModal() {
        if (note !== undefined) {
            text = note.text;
            editing = true;
            title = 'Annotation_Note_Edit';
            modal.showModal();
        } else {
            // editingProp = true;
            editing = false;
            await createNote();
            goto(`${base}/notes/edit/${note.date}`);
        }
    }

    function reset() {
        text = '';
        // editingProp = false;
        selectedVerses.reset();
    }

    async function createNote() {
         const newNote = await addNote({
                docSet: $selectedVerses[0].docSet,
                collection: $selectedVerses[0].collection,
                book: $selectedVerses[0].book,
                chapter: $selectedVerses[0].chapter,
                verse: $selectedVerses[0].verse,
                text,
                reference: $selectedVerses[0].reference
            });
        note = newNote;
    }

    async function onEditNote(){
        if (note === undefined) {
            await createNote();
        }
        goto(`${base}/notes/edit/${note.date}`);
    }

</script>

<Modal bind:this={modal} {id} onclose={reset}>
    <svelte:fragment slot="content">
        <div class="flex flex-col justify-evenly">
            <div class="w-full flex justify-between">
                <div class="w-full pb-3" style:font-weight={editing ? 'normal' : 'bold'}>
                    {heading}
                </div>
                    <button class="dy-btn dy-btn-ghost dy-btn-circle"
                        onclick={onEditNote}
                    >
                        <EditIcon />
                    </button>
            </div>
           
            <div style:word-wrap="break-word" class="mt-2">
            <!-- TODO Check if this first if-statement is still necessary -->
                {#if editing}
                    <textarea bind:value={text} class="dy-textarea w-full"></textarea>
                {:else text !== undefined}
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
            {#if editing}
                <div class="w-full flex mt-4 justify-between">
                    <button class="dy-btn dy-btn-sm dy-btn-ghost">{$t['Button_Cancel']}</button>
                    <button on:click={modifyNote} class="dy-btn dy-btn-sm dy-btn-ghost"
                        >{$t['Button_OK']}</button
                    >
                </div>
            {/if} -->
        </div>
</Modal>
