<!--
@component
A card for annotations in the highlights page.  
TODO:
- handle the book and collection specific styles
-->
<script lang="ts">
    import { base } from '$app/paths';
    import { refs } from '$lib/data/stores';
    import CardMenu from './CardMenu.svelte';
    export let docSet = '';
    export let book = '';
    export let chapter = '';
    export let reference = '';
    export let text = '';
    export let date = '';
    export let verse = '';
    export let actions = [''];
    export let penColor = 1;
</script>

<div class="annotation-item-block dy-card">
    <div class="color-card">
        <div class="annotation-item-color {'hlp' + penColor.toString()} self-center" />
        <div class="annotation-item-reference justify-self-start self-center">
            <a
                style="text-decoration:none;"
                href="{base}/"
                on:click={() => refs.set({ docSet, book, chapter, verse })}
            >
                {reference}
            </a>
        </div>
        <div class="self-center justify-self-end"><CardMenu on:menuaction {actions} /></div>
        <div class="annotation-item-text col-start-2 col-end-3">
            <a
                style="text-decoration:none;"
                href="{base}/"
                on:click={() => refs.set({ docSet, book, chapter, verse })}
            >
                {text}
            </a>
        </div>
        <div class="annotation-item-date col-span-3 justify-self-end">{date}</div>
    </div>
</div>

<style>
    .color-card {
        display: grid;
        gap: 0.25rem;
        grid-auto-columns: 2rem auto 2rem;
        grid-column: 3;
        grid-row: 2;
        margin-inline-start: 0.5rem;
        margin-inline-end: 0.5rem;
    }
</style>
