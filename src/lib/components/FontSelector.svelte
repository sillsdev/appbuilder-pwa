<!--
@component
Font Selector component.
-->
<script>
    import Modal from './Modal.svelte';
    import FontList from './FontList.svelte';
    import { convertStyle, currentFont, s, t } from '$lib/data/stores';

    const modalId = 'fontSelector';
    let modal;
    let fontList;

    export function showModal() {
        fontList.selectedFont = $currentFont;
        modal.showModal();
    }

    function handleOk() {
        $currentFont = fontList.selectedFont;
    }
</script>

<Modal bind:this={modal} id={modalId} useLabel={false}>
    <svelte:fragment slot="content">
        <FontList bind:this={fontList} selectedFont={$currentFont} />
        <div class="flex w-full justify-between dy-modal-action">
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <button
                style={convertStyle($s['ui.dialog.button'])}
                class="dy-btn dy-btn-sm dy-btn-ghost no-animation">{$t['Button_Cancel']}</button
            >
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <button
                style={convertStyle($s['ui.dialog.button'])}
                class="dy-btn dy-btn-sm dy-btn-ghost no-animation"
                on:click={() => handleOk()}>{$t['Button_OK']}</button
            >
        </div>
    </svelte:fragment>
</Modal>
