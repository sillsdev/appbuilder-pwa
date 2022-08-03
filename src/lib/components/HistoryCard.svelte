<!--
@component
A card for annotations in the history page.  
TODO:
- handle the book and collection specific styles
-->
<script lang="ts">
    export let collection = '';
    export let book = '';
    export let reference = '';
    export let date = '';
</script>

<div class="history-item-block">
    <div class="history-item-book-collection">{collection}</div>
    <div
        class="history-item-reference {/*history-item-reference-bcC01 history-item-reference-bcC01-bkGEN*/ ''}"
    >
        {book}
        {reference}
    </div>
    <div class="history-item-date history-align-right">
        {date}
    </div>
</div>
