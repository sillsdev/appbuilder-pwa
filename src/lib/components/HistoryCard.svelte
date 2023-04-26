<!--
@component
A card for annotations in the history page.  
TODO:
- handle the book and collection specific styles
-->
<script>
    import { direction, refs } from '$lib/data/stores';
    import { formatDateAndTime } from '$lib/scripts/dateUtils';
    import { base } from '$app/paths';
    import config from '$lib/data/config';
    export let collection = '';
    export let book = '';
    export let chapter = '';
    export let verse = '';
    export let date = '';

    $: bc = config.bookCollections.find((x) => x.id === collection);
    $: bcName = config.bookCollections.length == 1 ? null : bc.collectionName;
    $: bookName = bc.books.find((x) => x.id === book)?.name;
    $: chapterVerseSeparator = bc.features['ref-chapter-verse-separator'];
    $: reference = verse ? chapter + chapterVerseSeparator + verse : chapter;
    $: dateFormat = formatDateAndTime(new Date(date));
</script>

<div
    class="history-item-block dy-card w-100 bg-base-100 shadow-lg my-4"
    style:direction={$direction}
>
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <a
        style="text-decoration:none;"
        href="{base}/"
        on:click={() => ($refs = { book: book, chapter: chapter, verse: verse })}
    >
        <div
            class="history-card grid grid-cols-1"
            class:grid-rows-2={bcName == null}
            class:grid-rows-3={bcName !== null}
        >
            <div class="history-item-book-collection">{bcName}</div>
            <div class="history-item-reference justify-self-start">{bookName} {reference}</div>
            <div class="history-item-date justify-self-start">{dateFormat}</div>
        </div>
    </a>
</div>
