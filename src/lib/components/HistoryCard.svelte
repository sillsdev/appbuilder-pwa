<!--
@component
A card for annotations in the history page.  
TODO:
- handle the book and collection specific styles
-->
<script lang="ts">
    import { goto } from '$app/navigation';
    import { resolve } from '$lib/utils/paths';
    import { scriptureConfig } from '$assets/config';
    import type { HistoryItem } from '$lib/data/history';
    import { refs } from '$lib/data/stores';
    import { formatDateAndTime } from '$lib/scripts/dateUtils';

    interface Props {
        history: HistoryItem;
    }

    let { history }: Props = $props();

    const bc = $derived(scriptureConfig.bookCollections?.find((x) => x.id === history.collection));
    const docSet = $derived(bc && bc.languageCode + '_' + bc.id);
    const bcName = $derived(
        scriptureConfig.bookCollections?.length == 1 ? null : bc?.collectionName
    );
    const bookName = $derived(bc?.books.find((x) => x.id === history.book)?.name);
    const chapterVerseSeparator = $derived(bc?.features['ref-chapter-verse-separator']);
    const reference = $derived(
        history.verse ? history.chapter + chapterVerseSeparator + history.verse : history.chapter
    );
    const dateFormat = $derived(formatDateAndTime(new Date(history.date)));
    const textDirection = $derived(bc?.style?.textDirection);

    function onHistoryClick() {
        if (history.url) {
            // the url should have the full path??
            // eslint-disable-next-line svelte/no-navigation-without-resolve
            goto(history.url);
        } else if (docSet) {
            refs.set({
                docSet,
                book: history.book,
                chapter: history.chapter,
                verse: history.verse
            });
            goto(resolve(`/`));
        }
    }
</script>

<!-- history cards are alway LTR with the reference following the text direction -->
<div class="history-item-block dy-card w-100 bg-base-100 shadow-lg my-4" style:direction="ltr">
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="text-decoration:none;" onclick={onHistoryClick}>
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
                class:justify-self-end={textDirection?.toLowerCase() === 'rtl'}
            >
                {bookName}
                {reference}
            </div>
            <div class="history-item-date justify-self-start">{dateFormat}</div>
        </div>
    </div>
</div>
