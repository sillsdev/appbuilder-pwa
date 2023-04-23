<!--
@component
A card for annotations in the highlights page.  
TODO:
- handle the book and collection specific styles
-->
<script lang="ts">
    import { direction } from '$lib/data/stores';

    import CardMenu from './CardMenu.svelte';
    export let reference = '';
    export let text = '';
    export let date = '';
    export let actions = [''];
    export let penColor = '1';
</script>

<div
    class="annotation-item-block dy-card w-100 bg-base-100 shadow-lg my-4"
    style:direction={$direction}
>
    <div class="color-card">
        <div class="annotation-item-color {'hlp' + penColor} self-center" />
        <div class="annotation-item-reference justify-self-start self-center">{reference}</div>
        <div class="self-center justify-self-end"><CardMenu on:menuaction {actions} /></div>
        <div class="annotation-item-text col-span-3">{text}</div>
        <div class="annotation-item-date col-span-3 justify-self-end">{date}</div>
    </div>
</div>

<!-- <div class="annotation-item-block">
    <div class="annotation-item-color {'hlp' + penColor} annotation-float-left" />
    
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
    <div class="annotation-item-date annotation-align-right">{date}</div>
</div> -->
<style>
    .color-card {
        display: grid;
        gap: 0.25rem;
        grid-auto-columns: 2rem auto 2rem;
        grid-column: 3;
        grid-row: 2;
        margin: 0.5rem;
    }
</style>
