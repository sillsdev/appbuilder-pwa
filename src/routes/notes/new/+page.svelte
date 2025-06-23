<script>
    import Navbar from '$lib/components/Navbar.svelte';
    import { addNote } from '$lib/data/notes';
    import { selectedVerses, t } from '$lib/data/stores';
    import { CheckIcon, DeleteIcon } from '$lib/icons';
    import { onMount } from 'svelte';

    let ref = $selectedVerses[0].reference;
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
                <button on:click={createNote} class="dy-btn dy-btn-ghost p-1"
                    ><CheckIcon color="white" /></button
                >
            </div>
        {/snippet}
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
