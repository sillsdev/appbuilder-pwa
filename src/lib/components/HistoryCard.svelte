<script lang="ts">
    export let book = '';
    export let reference = '';
    export let date = '';
</script>

<div class="history-item-block">
    <div class="history-item-book-collection">{book}</div>
    <div
        class="history-item-reference history-item-reference-bcC01 history-item-reference-bcC01-bkGEN"
    >
        {reference}
    </div>
    <div class="history-item-date history-align-right">
        {date}
    </div>
</div>

<!--History static HTML-->
<!--<div id="15" class="history-item-block">
    <div class="history-item-book-collection">World English Bible</div>
    <div class="history-item-reference history-item-reference-bcC01 history-item-reference-bcC01-bkGEN">
        Genesis 1
    </div>
    <div class="history-item-date history-align-right">
        Today | 14:49
    </div>
</div>-->
