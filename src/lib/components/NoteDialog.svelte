<svelte:options accessors={true} />

<script lang="ts">
    import { addNote, editNote } from '$lib/data/notes';
    import { bodyFontSize, currentFont, selectedVerses, t } from '$lib/data/stores';
    import { EditIcon } from '$lib/icons';
    import Modal from './Modal.svelte';
    import { t, selectedVerses, bodyFontSize, currentFont } from '$lib/data/stores';
    import { editNote, addNote } from '$lib/data/notes';
    import { goto } from '$app/navigation';
    import { base } from '$app/paths';
    import { stringify } from 'querystring';

    export let note = undefined;
    export let editing = false;

    let id = 'note';
    let modal;
    let title: string;
    let text: string;

    $: heading = editing ? ($t[title] ?? '') : (note?.reference ?? '');

    export function showModal() {
        if (note !== undefined) {
            text = note.text;
            title = 'Annotation_Note_Edit';
            
        } else {
            editing = true;
            title = 'Annotation_Note_Add';
        }
        modal.showModal();
    }

    function reset() {
        text = '';
        editing = false;
        selectedVerses.reset();
    }

    async function createNote() {

        console.log('Im here as well! selectedVerses: ', $selectedVerses[0].reference);

        // const verses = $selectedVerses[0]; //TEST ------------------------------------------------------------------

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
        console.log('Im here! note: ', note);
        // console.log('Im here! selectedVerses: ', verses);
        // console.log('Im here!', note);
        goto(`${base}/notes/edit/${note.date}`);
    }

    async function modifyNote() {
        if (note !== undefined) {
            await editNote({
                note: note,
                newText: text
            });
        } else {
            await addNote({
                docSet: $selectedVerses[0].docSet,
                collection: $selectedVerses[0].collection,
                book: $selectedVerses[0].book,
                chapter: $selectedVerses[0].chapter,
                verse: $selectedVerses[0].verse,
                text,
                reference: $selectedVerses[0].reference
            });
        }
    }
    async function onEditNote(){
        if (note !== undefined) {
            console.log('Im here also! note: ', note);
            goto(`${base}/notes/edit/${note.date}`);
        } else {
            createNote();
        }
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
