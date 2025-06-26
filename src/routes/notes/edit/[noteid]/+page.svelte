<script>
    import Navbar from '$lib/components/Navbar.svelte';
    import { addNote, editNote, removeNote } from '$lib/data/notes';
    import { selectedVerses, t } from '$lib/data/stores';
    import { CheckIcon, DeleteIcon } from '$lib/icons';

    export let data;

    let note = data.note;
    let isNew = note ? false : true;
    let text = note?.text ?? '';
    let reference = note?.reference ?? $selectedVerses[0]?.reference;
    const title = isNew ? 'Annotation_Note_Add' : 'Annotation_Note_Edit';

    function goBack() {
        history.back();
    }

    function onBackNavigate(event) {
        event.preventDefault();
        goBack();
    }

    async function deleteNote() {
        if (!isNew) {
            await removeNote(note.date);
        }
        goBack();
    }

    async function modifyNote() {
        if (note !== undefined) {
            await editNote({
                note: note,
                newText: text
            });
        } else {
            await createNote();
        }
        goBack();
    }

    async function createNote() {
        await addNote({
            docSet: $selectedVerses[0].docSet,
            collection: $selectedVerses[0].collection,
            book: $selectedVerses[0].book,
            chapter: $selectedVerses[0].chapter,
            verse: $selectedVerses[0].verse,
            text,
            reference
        });
        goBack();
    }

    let action = isNew ? createNote : modifyNote;
</script>

<div class="fullscreen-editor">
    <Navbar on:backNavigation={onBackNavigate}>
        {#snippet center()}
            <div class="flex dy-join">
                <div class="grid h-10 place-items-center dy-join-item">
                    {$t[title]}
                </div>
                <div
                    class="hidden grid sm:flex dy-divider dy-divider-horizontal after:bg-white before:bg-white dy-join-item"
                ></div>
                <div class="hidden grid sm:flex h-10 place-items-center dy-join-item">
                    {reference}
                </div>
            </div>
        {/snippet}

        {#snippet end()}
            <div class="dy-join">
                <button on:click={deleteNote} class="dy-join-item dy-btn dy-btn-ghost dy-btn-circle"
                    ><DeleteIcon color="white" /></button
                >
                <button on:click={action} class="dy-join-item dy-btn dy-btn-ghost p-1"
                    ><CheckIcon color="white" /></button
                >
            </div>
        {/snippet}
    </Navbar>

    <div class="flex justify-center mt-7 h-full max-w-screen-md mx-auto">
        <textarea bind:value={text} class="dy-textarea dy-textarea-bordered w-full h-5/6 shadow-md">
        </textarea>
    </div>
</div>

<style>
    .fullscreen-editor {
        width: 100%;
        height: 100%;
        position: fixed;
    }
</style>
