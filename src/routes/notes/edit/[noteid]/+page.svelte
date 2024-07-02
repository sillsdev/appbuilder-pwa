<script>
    import Navbar from '$lib/components/Navbar.svelte';
    import { t } from '$lib/data/stores';
    import { ArrowBackIcon, DeleteIcon, CheckIcon } from '$lib/icons';
    import { selectedVerses } from '$lib/data/stores';
    import { editNote,addNote,removeNote } from '$lib/data/notes';
    import { goto } from '$app/navigation';
    import { base } from '$app/paths';

    export let data;
    let note = data.note;
    let text = note.text;

    function goToAllNotes() {
        goto(`${base}/notes`);
    }

    async function deleteNote() {
        await removeNote(note.date);
        goToAllNotes();
    }
    async function modifyNote() {
        if (note !== undefined) {
            await editNote({
                note: note,
                newText:text
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
        goToAllNotes();
    }

    function onBackNavigate(event) {
        event.preventDefault();
        goToAllNotes();
    }
</script>


<!--create a close button for this editor that closes on a button when clicked -->
<div class="fullscreen-editor">
    <Navbar on:backNavigation={onBackNavigate}>
        <label for="sidebar" slot="center" >
            <div class="btn btn-ghost normal-case text-xl" >{$t['Annotation_Note_Edit']}</div>
        </label>

        <div slot="right-buttons" style="">
            <button on:click={deleteNote} class="dy-btn dy-btn-ghost dy-btn-circle"><DeleteIcon color="white" /></button>
            <button on:click={modifyNote} class="dy-btn dy-btn-ghost p-1"><CheckIcon color="white" /></button>
        </div>

    </Navbar>
    <!-- <button on:click={closeEditor} class="close-button"><ArrowBackIcon color="black" /></button> -->
        
    <!-- <p>{note.text}</p> -->

    <div class="flex justify-center mt-7 h-full max-w-screen-md mx-auto">
        <textarea bind:value={text} class="dy-textarea dy-textarea-bordered w-full h-5/6 shadow-md" />
    </div>
    
    <!-- flex justify-center box-border mt-7 h-full -->
    <!-- dy-textarea dy-textarea-bordered w-11/12 h-5/6 shadow-md -->
    <!-- to save the data, save it to the store -->
</div>


<style>
    .fullscreen-editor{
        width: 100%;
        height: 100%;
        position: fixed;
    }
</style>