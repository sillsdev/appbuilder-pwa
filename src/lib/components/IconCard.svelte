<!--
@component
A card for annotations in the notes and bookmarks pages.  
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
    export let src = '';
    export let alt = '';
</script>

<div
    class="annotation-item-block dy-card w-100 bg-base-100 shadow-lg my-4"
    style:direction={$direction}
>
    <div class="icon-card">
        <div class="self-center">
            {#if src !== '' && alt !== ''}
                <span><img {src} {alt} /></span>
            {:else}
                <slot name="icon" />
            {/if}
        </div>
        <div class="annotation-item-reference justify-self-start self-center">{reference}</div>
        <div class="self-center justify-self-end"><CardMenu on:menuaction {actions} /></div>
        <div class="annotation-item-text col-span-3">{text}</div>
        <div class="annotation-item-date col-span-3 justify-self-end">{date}</div>
    </div>
</div>

<style>
    .icon-card {
        display: grid;
        gap: 0.25rem;
        grid-auto-columns: 2rem auto 2rem;
        grid-column: 3;
        grid-row: 2;
        margin-inline-start: 0.5rem;
        margin-inline-end: 0.5rem;
    }
</style>
