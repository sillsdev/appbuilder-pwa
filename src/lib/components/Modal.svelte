<!--
@component
A simple modal component from DaisyUI. Closes when clicked outside of.

See https://daisyui.com/components/modal/#modal-that-closes-when-clicked-outside
-->
<script>
    import { direction, s, convertStyle } from '$lib/data/stores';
    export let id;
    let dialog;
    export let useLabel = true; //If this is set to false, there will be no button/label with this modal to open it, and the modal may be initialized without filling the label slot.
    export function showModal() {
        //This exported function allows buttons/labels in other divs to trigger the modal popup (see handleTextAppearanceSelector() and handleCollectionSelector() in +page.svelte).
        dialog.showModal();
    }
    export let addCSS = ''; //Here addCSS is a prop for injecting CSS into the modal contents div/form below.
</script>

{#if useLabel}
    <label for={id} class="dy-btn dy-btn-ghost p-0.5 dy-no-animation" onclick="{id}.showModal()">
        <slot
            name="label"
        /><!--Anything passed into this slot will trigger the modal popup when clicked-->
    </label>
{/if}

<dialog
    bind:this={dialog}
    {id}
    on:close
    class="dy-modal cursor-pointer"
    style:direction={$direction}
>
    <form
        method="dialog"
        style={convertStyle($s['ui.dialog']) + addCSS}
        class="dy-modal-box overflow-y-visible relative"
    >
        <slot name="content" /><!--This is the slot for the popup's actual contents-->
    </form>
    <form method="dialog" class="dy-modal-backdrop">
        <!--This allows the modal to be closed when the user taps outside of the contents div/form-->
        <button>close</button>
    </form>
</dialog>
