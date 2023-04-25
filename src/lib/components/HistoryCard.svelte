<!--
@component
A card for annotations in the history page.  
TODO:
- handle the book and collection specific styles
-->
<script lang="ts">
    import { direction } from '$lib/data/stores';
    import { getFeatureValueString } from '$lib/scripts/configUtils';
    export let collection = '';
    export let book = '';
    export let chapter = '';
    export let verse = '';
    export let date = '';

    const chapterVerseSeparator = () => {
        return getFeatureValueString('ref-chapter-verse-separator', collection, book);
    };

    const reference = () => {
        return verse ? chapter + chapterVerseSeparator() + verse : chapter;
    };
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
