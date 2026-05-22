<!--
@component
Font Selector component.
-->
<script lang="ts">
    import { convertStyle, currentFont, currentFonts, refs, s, t } from '$lib/data/stores';
    import FontList from './FontList.svelte';
    import Modal from './Modal.svelte';

    const modalId = 'fontSelector';
    let modal: Modal;

    export function showModal() {
        modal.showModal();
    }

    function handleOk() {
        currentFonts.update((fonts) => {
            if (selectedFont) {
                fonts[$refs.collection] = selectedFont;
            }
            return fonts;
        });
    }

    let selectedFont = $state($currentFont);
</script>

<Modal bind:this={modal} id={modalId}>
    <FontList bind:selectedFont />
    <div class="flex w-full justify-between dy-modal-action">
        <button
            style={convertStyle($s?.['ui.dialog.button'])}
            class="dy-btn dy-btn-sm dy-btn-ghost no-animation">{$t['Button_Cancel']}</button
        >
        <button
            style={convertStyle($s?.['ui.dialog.button'])}
            class="dy-btn dy-btn-sm dy-btn-ghost no-animation"
            onclick={() => handleOk()}>{$t['Button_OK']}</button
        >
    </div>
</Modal>
