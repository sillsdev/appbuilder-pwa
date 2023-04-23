<!--
@component
A card for annotations in the history page.  
TODO:
- handle the book and collection specific styles
-->
<script lang="ts">
    import { direction } from '$lib/data/stores';
    export let collection = '';
    export let book = '';
    export let reference = '';
    export let date = '';
</script>

<div
    class="history-item-block dy-card w-100 bg-base-100 shadow-lg my-4"
    style:direction={$direction}
>
    <div class="history-card grid grid-cols-1 grid-rows-2">
        <div>
            <span class="history-item-book-collection">{collection}</span>
            <span class="history-item-reference justify-self-start">{book} {reference}</span>
        </div>
        <div class="history-item-date justify-self-start">{date}</div>
    </div>
</div>
