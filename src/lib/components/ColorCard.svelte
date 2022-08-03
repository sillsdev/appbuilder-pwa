<!--
@component
A card for annotations in the highlights page.  
TODO:
- handle the book and collection specific styles
-->
<script lang="ts">
    import CardMenu from './CardMenu.svelte';
    export let reference = '';
    export let text = '';
    export let date = '';
    export let actions = [''];
    export let highlight_color = '1';
</script>

<div class="annotation-item-block">
    <div class="annotation-item-color {'hlp' + highlight_color} annotation-float-left" />
    <!--Menu-->
    <CardMenu on:menuaction {actions} />
    <!--Content-->
    <div class="annotation-item-content-block">
        <div
            class="annotation-item-reference {/*annotation-item-reference-bcC01 annotation-item-reference-bcC01-bkJHN*/ ''}"
        >
            {reference}
        </div>
        <div
            class="annotation-item-text {/*annotation-item-text-bcC01 annotation-item-text-bcC01-bkJHN*/ ''}"
        >
            {text}
        </div>
    </div>
    <!--Date-->
    <div class="annotation-item-date annotation-align-right">{date}</div>
</div>
