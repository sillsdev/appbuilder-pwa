<!--
@component
Font Selector component.
-->
<script>
    import { convertStyle, currentFont, currentFonts, refs, s, t } from '$lib/data/stores';
    import FontList from './FontList.svelte';
    import Modal from './Modal.svelte';

    const modalId = 'fontSelector';
    let modal = $state();
    let fontList = $state();

    export function showModal() {
        fontList.selectedFont = $currentFont;
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
    {#snippet content()}
        <FontList bind:this={fontList} selectedFont={$currentFont} />
        <div class="flex w-full justify-between dy-modal-action">
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <button
                style={convertStyle($s['ui.dialog.button'])}
                class="dy-btn dy-btn-sm dy-btn-ghost no-animation">{$t['Button_Cancel']}</button
            >
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <button
                style={convertStyle($s['ui.dialog.button'])}
                class="dy-btn dy-btn-sm dy-btn-ghost no-animation"
                onclick={() => handleOk()}>{$t['Button_OK']}</button
            >
        </div>
    {/snippet}
</Modal>
