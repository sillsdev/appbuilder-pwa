<!--
@component
A simple modal component from DaisyUI. Closes when clicked outside of.

See https://daisyui.com/components/modal/#modal-that-closes-when-clicked-outside
-->
<script>
    import { s, convertStyle } from '$lib/data/stores';
    export let id;
    let dialog;
    export let useLabel = true;
    export function showModal() {
        dialog.showModal();
    }
    export let addCSS = 'position: absolute; top: 1rem;';
</script>

{#if useLabel}
    <label for={id} class="dy-btn dy-btn-ghost p-0.5 dy-no-animation" onclick="{id}.showModal()"
        ><slot name="label" /></label
    >
{/if}

<dialog bind:this={dialog} {id} class="dy-modal cursor-pointer">
    <form
        method="dialog"
        style={convertStyle($s['ui.dialog']) + addCSS}
        class="dy-modal-box relative"
    >
        <slot name="content" />
    </form>
    <form method="dialog" class="dy-modal-backdrop">
        <button>close</button>
    </form>
</dialog>
