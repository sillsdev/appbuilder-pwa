<!--
@component
Font Selector component.
-->
<script>
    import Modal from './Modal.svelte';
    import config from '$lib/data/config';
    import {
        convertStyle,
        currentFont,
        fontChoices,
        monoIconColor,
        s,
        t,
        themeColors
    } from '$lib/data/stores';

    const modalId = 'fontSelector';
    let modal;
    let selectedFont = $currentFont;

    export function showModal() {
        modal.showModal();
    }
    function handleClick(font) {
        selectedFont = font;
    }
    function handleCancel() {}
    function handleOk() {
        $currentFont = selectedFont;
    }
</script>

<Modal bind:this={modal} id={modalId} useLabel={false}>
    <svelte:fragment slot="content">
        <ul class="dy-menu">
            {#each $fontChoices as font}
                <!-- svelte-ignore a11y-missing-attribute -->
                <li style:font-family={font} style:font-size="large">
                    <!-- svelte-ignore a11y-click-events-have-key-events -->
                    <a
                        on:click={() => handleClick(font)}
                        class:dy-active={font === selectedFont}
                        style:background-color={font === selectedFont
                            ? $themeColors['ButtonSelectedColor']
                            : ''}
                        style:color={$monoIconColor}
                        style:font-famly={font}
                    >
                        {config.fonts.find((x) => x.family === font).name}
                    </a>
                </li>
            {/each}
        </ul>
        <div class="flex w-full justify-between dy-modal-action">
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <button
                style={convertStyle($s['ui.dialog.button'])}
                class="dy-btn dy-btn-sm dy-btn-ghost no-animation"
                on:click={() => handleCancel()}>{$t['Button_Cancel']}</button
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
