<!--
@component
A card for annotations in the history page.  
TODO:
- handle the book and collection specific styles
-->
<script lang="ts">
    import type { HistoryItem } from '$lib/data/history';
    import { refs } from '$lib/data/stores';
    import { formatDateAndTime } from '$lib/scripts/dateUtils';
    import { base } from '$app/paths';
    import config from '$lib/data/config';
    export let history: HistoryItem;

    $: bc = config.bookCollections.find((x) => x.id === history.collection);
    $: docSet = bc.languageCode + '_' + bc.id;
    $: bcName = config.bookCollections.length == 1 ? null : bc.collectionName;
    $: bookName = bc.books.find((x) => x.id === history.book)?.name;
    $: chapterVerseSeparator = bc.features['ref-chapter-verse-separator'];
    $: reference = history.verse
        ? history.chapter + chapterVerseSeparator + history.verse
        : history.chapter;
    $: dateFormat = formatDateAndTime(new Date(history.date));
    $: textDirection = bc.style.textDirection;
</script>

<div class="history-item-block dy-card w-100 bg-base-100 shadow-lg my-4" style:direction="ltr">
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <a
        style="text-decoration:none;"
        href="{base}/"
        on:click={() => refs.set({ docSet, book: history.book, chapter: history.chapter })}
    >
        <div
            class="history-card grid grid-cols-1"
            class:grid-rows-2={!bcName}
            class:grid-rows-3={bcName}
        >
            {#if bcName}
                <div class="history-item-book-collection">{bcName}</div>
            {/if}
            <div
                class="history-item-reference justify-self-start"
                class:justify-self-end={textDirection.toLowerCase() === 'rtl'}
            >
                {bookName}
                {reference}
            </div>
            <div class="history-item-date justify-self-start">{dateFormat}</div>
        </div>
    </a>
</div>
