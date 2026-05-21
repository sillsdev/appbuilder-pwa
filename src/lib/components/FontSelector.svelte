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
    let fontList: FontList;

    export function showModal() {
        if ($currentFont) {
            fontList.selectedFont = $currentFont;
        }
        modal.showModal();
    }

    function handleOk() {
        currentFonts.update((fonts) => {
            fonts[$refs.collection] = fontList.selectedFont;
            return fonts;
        });
    }
</script>

<Modal bind:this={modal} id={modalId}>
    <FontList bind:this={fontList} selectedFont={$currentFont ?? ''} />
    <div class="flex w-full justify-between dy-modal-action">
        <button
            style={convertStyle($s?.['ui.dialog.button'])}
            class="dy-btn dy-btn-sm dy-btn-ghost no-animation">{$t['Button_Cancel']}</button
        >
        <button
            style={convertStyle($s?.['ui.dialog.button'])}
            class="dy-btn dy-btn-sm dy-btn-ghost no-animation"
            on:click={() => handleOk()}>{$t['Button_OK']}</button
        >
    </div>
</Modal>
