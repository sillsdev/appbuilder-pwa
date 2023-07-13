<!--
@component
A card for annotations in the notes and bookmarks pages.  
TODO:
- handle the book and collection specific styles
-->
<script lang="ts">
    import config from '$lib/data/config';
    import { direction } from '$lib/data/stores';
    import CardMenu from './CardMenu.svelte';
    export let collection = '';
    export let reference = '';
    export let text = '';
    export let date = '';
    export let actions = [''];
    export let src = '';
    export let alt = '';

    const bc = config.bookCollections.find((x) => x.id === collection);
    const textDirection = bc.style.textDirection;
    $: justifyEnd = textDirection.toLowerCase() === 'rtl' && $direction === 'ltr';
</script>

<div class="annotation-item-block dy-card">
    <div class="icon-card">
        <div class="self-center">
            {#if src !== '' && alt !== ''}
                <span><img {src} {alt} /></span>
            {:else}
                <slot name="icon" />
            {/if}
        </div>
        <div
            class="annotation-item-reference justify-self-start self-center"
            class:justify-self-end={justifyEnd}
        >
            {reference}
        </div>
        <div class="self-center justify-self-end"><CardMenu on:menuaction {actions} /></div>
        <div
            class="annotation-item-text col-span-3 justify-self-start"
            class:justify-self-end={justifyEnd}
        >
            {text}
        </div>
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
