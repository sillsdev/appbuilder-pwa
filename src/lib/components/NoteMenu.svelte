<script>
    import Modal from './Modal.svelte';
    let id = 'note';
    let modal;
    export function showModal() {
        modal.showModal();
    }
</script>

<Modal bind:this={modal} {id} useLabel={false}>
    <svelte:fragment slot="content">
        <div>test</div>
    </svelte:fragment>
</Modal>
