<!--
@component
A simple modal component from DaisyUI. Closes when clicked outside of.

See https://daisyui.com/components/modal/#modal-that-closes-when-clicked-outside
-->
<script>
    export let id;
</script>

<!-- The button to open modal -->
<label for={id} class="dy-btn dy-btn-ghost p-0.5 dy-no-animation"><slot name="label" /></label>

<!-- Put this part before </body> tag -->
<input type="checkbox" id={id} class="dy-modal-toggle" />
<label for={id} class="dy-modal cursor-pointer">
    <label class="dy-modal-box relative" for="">
        <slot name="content" />
    </label>
</label>
