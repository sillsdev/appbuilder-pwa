<script>
    import Modal from './Modal.svelte';
    import { t } from '$lib/data/stores';
    let id = 'note';
    let modal;
    export function showModal() {
        modal.showModal();
    }

    let noteText;
</script>

<Modal bind:this={modal} {id} useLabel={false}>
    <svelte:fragment slot="content">
        <div id="container" class="flex flex-col justify-evenly">
            <div class="annotation-item-title w-full pb-3">{$t['Annotation_Note_Add']}</div>
            <div>
                <textarea bind:this={noteText} class="dy-textarea w-full" />
            </div>
            <div class="w-full flex justify-end mt-4">
                <button class="dy-btn dy-btn-sm dy-btn-ghost">delete</button>
                <button class="dy-btn dy-btn-sm dy-btn-ghost">save</button>
            </div>
        </div>
    </svelte:fragment>
</Modal>
