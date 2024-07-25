<script>
    import Navbar from '$lib/components/Navbar.svelte';
    import { noteEditing, t } from '$lib/data/stores';
    import { DeleteIcon, CheckIcon } from '$lib/icons';
    import { editNote,removeNote } from '$lib/data/notes';

    export let data;
    let note = data.note;
    let text = note.text;
    let editing;
    noteEditing.subscribe((value) => {
        editing = value;
    });
    
    $: title = editing ? 'Annotation_Note_Edit' : 'Annotation_Note_Add';

    function goBack() {
        history.back();
    }

    async function deleteNote() {
        await removeNote(note.date);
        goBack();
    }

    async function modifyNote() {
        if (note !== undefined) {
            await editNote({
                note: note,
                newText:text
            });
        }
        goBack();
    }

    function onBackNavigate(event) {
        event.preventDefault();
        goBack();
    }
</script>

<div class="fullscreen-editor">
    <Navbar on:backNavigation={onBackNavigate}>
        <label for="sidebar" slot="center" >
            <div class="btn btn-ghost normal-case text-xl" >{$t[title]}</div>
        </label>

        <div slot="right-buttons">
            <button on:click={deleteNote} class="dy-btn dy-btn-ghost dy-btn-circle"><DeleteIcon color="white" /></button>
            <button on:click={modifyNote} class="dy-btn dy-btn-ghost p-1"><CheckIcon color="white" /></button>
        </div>
    </Navbar>

    <div class="flex justify-center mt-7 h-full max-w-screen-md mx-auto">
        <textarea bind:value={text} class="dy-textarea dy-textarea-bordered w-full h-5/6 shadow-md" />
    </div>
</div>

<style>
    .fullscreen-editor{
        width: 100%;
        height: 100%;
        position: fixed;
    }
</style>