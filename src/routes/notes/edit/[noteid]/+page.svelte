<script lang="ts">
    import Navbar from '$lib/components/Navbar.svelte';
    import { addNote, editNote, removeNote } from '$lib/data/notes';
    import { actionBarColor, selectedVerses, t } from '$lib/data/stores';
    import { CheckIcon, DeleteIcon } from '$lib/icons';
    import { onMount } from 'svelte';
    import type { PageData } from './$types';

    interface Props {
        data: PageData;
    }

    let { data }: Props = $props();

    let textarea: HTMLTextAreaElement | undefined = $state();
    const note = $derived(data.note);
    const isNew = $derived(note ? false : true);
    // svelte-ignore state_referenced_locally
    let text = $state(note?.text ?? '');
    const reference = $derived(note?.reference ?? $selectedVerses[0]?.reference);
    const title = $derived(isNew ? 'Annotation_Note_Add' : 'Annotation_Note_Edit');

    function goBack() {
        history.back();
    }

    function onBackNavigate(event: Event) {
        event.preventDefault();
        goBack();
    }

    async function deleteNote() {
        if (!isNew && note) {
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

    onMount(() => {
        if (textarea) {
            textarea.focus();
            textarea.selectionStart = text.length;
        }
    });

    const action = $derived(isNew ? createNote : modifyNote);
</script>

<div class="fullscreen-editor">
    <Navbar backNavigation={onBackNavigate}>
        {#snippet center()}
            <div class="flex dy-join">
                <div class="grid h-10 place-items-center dy-join-item">
                    {$t[title]}
                </div>

                <!-- CSS variable indirection: Tailwind JIT scans at build time and won't generate
                     classes for runtime-interpolated values like after:bg-[{$actionBarColor}].
                     Setting a CSS var in style= lets the browser resolve the color at runtime
                     while Tailwind sees the static string var(--divider-color) at build time. -->
                <div
                    style="--divider-color: {$actionBarColor}"
                    class="grid sm:flex dy-divider dy-divider-horizontal after:bg-[var(--divider-color)] before:bg-[var(--divider-color)] dy-join-item"
                ></div>
                <div class="grid sm:flex h-10 place-items-center dy-join-item">
                    {reference}
                </div>
            </div>
        {/snippet}

        {#snippet end()}
            <div class="dy-join">
                <button onclick={deleteNote} class="dy-join-item dy-btn dy-btn-ghost dy-btn-circle"
                    ><DeleteIcon color={$actionBarColor} /></button
                >
                <button onclick={action} class="dy-join-item dy-btn dy-btn-ghost p-1"
                    ><CheckIcon color={$actionBarColor} /></button
                >
            </div>
        {/snippet}
    </Navbar>

    <div class="flex justify-center mt-7 h-full max-w-screen-md mx-auto">
        <textarea
            bind:this={textarea}
            bind:value={text}
            class="dy-textarea dy-textarea-bordered w-full h-5/6 shadow-md"
        >
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
