<svelte:options accessors={true} />

<script lang="ts">
    import Modal from './Modal.svelte';
    import { EditIcon } from '$lib/icons';
    import { selectedVerses, bodyFontSize, currentFont } from '$lib/data/stores';
    import { goto } from '$app/navigation';
    import { base } from '$app/paths';

    export let note = undefined;

    let id = 'note';
    let modal;
    let text: string;

    $: heading = note?.reference ?? '';

    export async function showModal() {
        if (note !== undefined) {
            text = note.text;
            modal.showModal();
        } else {
            console.log('No note available!')
        }
    }

    function reset() {
        text = '';
        selectedVerses.reset();
    }

    async function onEditNote(){
        if (note !== undefined) goto(`${base}/notes/edit/${note.date}`);
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

 