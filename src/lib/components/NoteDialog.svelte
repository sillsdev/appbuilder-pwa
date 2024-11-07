<svelte:options accessors={true} />

<script lang="ts">
    import Modal from './Modal.svelte';
    import { EditIcon } from '$lib/icons';
    import { t, selectedVerses, bodyFontSize, currentFont } from '$lib/data/stores';
    import { editNote, addNote } from '$lib/data/notes';

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
</script>

<Modal bind:this={modal} {id} on:close={reset} useLabel={false}>
    <svelte:fragment slot="content">
        <div id="container" class="flex flex-col justify-evenly">
            <div class="w-full flex justify-between">
                <div
                    class="annotation-item-title w-full pb-3"
                    style:font-weight={editing ? 'normal' : 'bold'}
                >
                    {heading}
                </div>
                {#if !editing}
                    <button
                        on:click={() => {
                            editing = true;
                        }}
                    >
                        <EditIcon />
                    </button>
                {/if}
            </div>
            <div style:word-wrap="break-word">
                {#if editing}
                    <textarea bind:value={text} class="dy-textarea w-full" />
                {:else if text !== undefined}
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
            {#if editing}
                <div class="w-full flex mt-4 justify-between">
                    <button class="dy-btn dy-btn-sm dy-btn-ghost">{$t['Button_Cancel']}</button>
                    <button on:click={modifyNote} class="dy-btn dy-btn-sm dy-btn-ghost"
                        >{$t['Button_OK']}</button
                    >
                </div>
            {/if}
        </div>
    </svelte:fragment>
</Modal>
