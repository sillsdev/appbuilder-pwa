<!--
@component
A simple modal component from DaisyUI. Closes when clicked outside of.

See https://daisyui.com/components/modal/#modal-that-closes-when-clicked-outside
@prop { String }   id      - ID for the modal.
@prop { Function } content - Snippet containing the content of the modal.
@prop { String }   addCSS  - CSS to inject into the model contents div/form.
@prop { Function } onclose - Function to run when Modal closes.
-->
<script>
    import { convertStyle, direction, s } from '$lib/data/stores';

    let { id, addCSS = '', content, onclose = null } = $props();

    let dialog;

    /**
     * This exported function allows buttons/labels
     * in other divs to trigger the modal popup
     */
    export function showModal() {
        dialog.showModal();
    }
</script>

<dialog
    bind:this={dialog}
    {id}
    {onclose}
    class="dy-modal cursor-pointer"
    style:direction={$direction}
>
    <form
        method="dialog"
        style={convertStyle($s['ui.dialog']) + addCSS}
        class="dy-modal-box overflow-y-visible relative"
    >
        {@render content?.()}
        <!--This is the snippet for the popup's actual contents-->
    </form>
    <form method="dialog" class="dy-modal-backdrop">
        <!--This allows the modal to be closed when the user taps outside of the contents div/form-->
        <button>close</button>
    </form>
</dialog>
