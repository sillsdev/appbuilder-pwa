<script>
    import Navbar from '$lib/components/Navbar.svelte';
    import { editNote, removeNote } from '$lib/data/notes';
    import { t } from '$lib/data/stores';
    import { CheckIcon, DeleteIcon } from '$lib/icons';

    export let data;
    let note = data.note;
    let text = note.text;
    let ref = note?.reference ?? '';
    const title = 'Annotation_Note_Edit';

    function goBack() {
        history.back();
    }

    function onBackNavigate(event) {
        event.preventDefault();
        goBack();
    }

    async function deleteNote() {
        await removeNote(note.date);
        goBack();
    }

    async function modifyNote() {
        if (note !== undefined) {
            await editNote({
                note: note,
                newText: text
            });
        }
        goBack();
    }
</script>

<div class="fullscreen-editor">
    <Navbar on:backNavigation={onBackNavigate}>
        {#snippet center()}
            <label for="sidebar">
                <div class="flex w-full">
                    <div class="grid h-10 grow place-items-center">{$t[title]}</div>
                    <div
                        class="dy-divider dy-divider-horizontal after:bg-white before:bg-white"
                    ></div>
                    <div class="grid h-10 grow place-items-center">{ref}</div>
                </div>
            </label>
        {/snippet}

        {#snippet end()}
            <div>
                <button on:click={deleteNote} class="dy-btn dy-btn-ghost dy-btn-circle"
                    ><DeleteIcon color="white" /></button
                >
                <button on:click={modifyNote} class="dy-btn dy-btn-ghost p-1"
                    ><CheckIcon color="white" /></button
                >
            </div>
        {/snippet}
    </Navbar>

    <div class="flex justify-center mt-7 h-full max-w-screen-md mx-auto">
        <textarea
            bind:value={text}
            class="dy-textarea dy-textarea-bordered w-full h-5/6 shadow-md"
        />
    </div>
</div>

<style>
    .fullscreen-editor {
        width: 100%;
        height: 100%;
        position: fixed;
    }
</style>
