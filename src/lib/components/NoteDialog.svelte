<svelte:options accessors={true} />

<script lang="ts">
    import Modal from './Modal.svelte';
    import { EditIcon } from '$lib/icons';
    import { t, selectedVerses, bodyFontSize, currentFont } from '$lib/data/stores';
    import { addNote } from '$lib/data/notes';
    import { goto } from '$app/navigation';
    import { base } from '$app/paths';

    export let note = undefined;
    export let editing = false;

    let id = 'note';
    let modal;
    let title: string;
    let text: string;

    $: heading = editing ? $t[title] ?? '' : note?.reference ?? '';

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

<Modal bind:this={modal} {id} on:close={reset} useLabel={false}>
    <svelte:fragment slot="content">
        <div id="container" class="flex flex-col justify-evenly">
            <div class="w-full flex justify-between items-center">
                <div
                    class="annotation-item-title w-full pb-3 font-bold"
                >
                    {heading}
                </div>
                    <button class="dy-btn dy-btn-ghost dy-btn-circle"
                        on:click={onEditNote}
                    >
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
    </svelte:fragment>
</Modal>

 