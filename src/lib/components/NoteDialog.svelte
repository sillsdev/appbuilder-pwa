<svelte:options accessors={true} />

<script>
    import Modal from './Modal.svelte';
    import { t, selectedVerses } from '$lib/data/stores';
    import { editNote, addNote } from '$lib/data/notes';

    export let note = undefined;
    let id = 'note';
    let modal;
    let title;
    let textArea;

    export function showModal() {
        if (note !== undefined) {
            textArea.value = note.text;
            title = 'Annotation_Note_Edit';
        } else {
            title = 'Annotation_Note_Add';
        }
        modal.showModal();
    }

    function reset() {
        textArea.value = '';
        selectedVerses.reset();
    }

    async function modifyNote() {
        if (note !== undefined) {
            await editNote({
                note: note,
                newText: textArea.value
            });
        } else {
            await addNote({
                docSet: $selectedVerses[0].docSet,
                collection: $selectedVerses[0].collection,
                book: $selectedVerses[0].book,
                chapter: $selectedVerses[0].chapter,
                verse: $selectedVerses[0].verse,
                text: textArea.value,
                reference: $selectedVerses[0].reference
            });
        }
        reset();
    }
</script>

<Modal bind:this={modal} {id} useLabel={false}>
    <svelte:fragment slot="content">
        <div id="container" class="flex flex-col justify-evenly">
            <div class="annotation-item-title w-full pb-3">{$t[title]}</div>
            <div>
                <textarea bind:this={textArea} class="dy-textarea w-full" />
            </div>
            <div class="w-full flex mt-4 justify-between">
                <button on:click={reset} class="dy-btn dy-btn-sm dy-btn-ghost"
                    >{$t['Button_Cancel']}</button
                >
                <button on:click={modifyNote} class="dy-btn dy-btn-sm dy-btn-ghost"
                    >{$t['Button_OK']}</button
                >
            </div>
        </div>
    </svelte:fragment>
</Modal>
