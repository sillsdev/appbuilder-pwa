<script>
    import Navbar from '$lib/components/Navbar.svelte';
    import { t, selectedVerses } from '$lib/data/stores';
    import { DeleteIcon, CheckIcon } from '$lib/icons';
    import { addNote } from '$lib/data/notes';
    import { onMount } from 'svelte';

    let text = '';
    const title = 'Annotation_Note_Add';

    function goBack() {
        history.back();
    }

    function onBackNavigate(event) {
        event.preventDefault();
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
            reference: $selectedVerses[0].reference
        });
        goBack();
    }

    async function deleteNote() {
        goBack();
    }

    let textarea;
    onMount(() => {
        textarea.focus();
    });
</script>

<div class="fullscreen-editor">
    <Navbar on:backNavigation={onBackNavigate}>
        <label for="sidebar" slot="center">
            <div class="btn btn-ghost normal-case text-xl">{$t[title]}</div>
        </label>

        <div slot="right-buttons">
            <button on:click={deleteNote} class="dy-btn dy-btn-ghost dy-btn-circle"
                ><DeleteIcon color="white" /></button
            >
            <button on:click={createNote} class="dy-btn dy-btn-ghost p-1"
                ><CheckIcon color="white" /></button
            >
        </div>
    </Navbar>

    <div class="flex justify-center mt-7 h-full max-w-screen-md mx-auto">
        <textarea
            bind:value={text}
            bind:this={textarea}
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
