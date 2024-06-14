<!--
@component
A clickable verse card representing a single search result.
-->
<script lang="ts">
    import { goto } from '$app/navigation';
    import { base } from '$app/paths';
    import config from '$lib/data/config';
    import { addHistory } from '$lib/data/history';
    import { convertStyle, refs, s } from '$lib/data/stores';
    import type { SearchResult } from '$lib/scripts/search/entities';

    export let docSet: string;
    export let collection: string;
    export let result: SearchResult;

    function referenceString(result: SearchResult): string {
        const separator = config.bookCollections.find((x) => x.id === collection).features[
            'ref-chapter-verse-separator'
        ];
        let reference = bookName(result.reference.bookCode);
        if (result.reference.chapter) {
            reference += ' ' + result.reference.chapter;
            if (result.reference.verses) {
                reference += separator + result.reference.verses;
            }
        }
        return reference;
    }

    function bookName(bookCode: string): string {
        let collectionData = config.bookCollections.filter((bc) => bc.id === collection)[0];
        let bookData = collectionData.books.filter((bk) => bk.id === bookCode)[0];
        return bookData.name;
    }

    function onClick() {
        refs.set({
            docSet,
            book: result.reference.bookCode,
            chapter: result.reference.chapter,
            verse: result.reference.verses
        });
        addHistory({
            collection,
            book: result.reference.bookCode,
            chapter: result.reference.chapter,
            verse: result.reference.verses
        });
        goto(`${base}/`);
    }
</script>

<div class="search-result-block transition-shadow duration-300 hover:shadow-lg cursor-pointer">
    <button class="text-left" on:click|preventDefault={onClick}>
        <div class="search-result-reference">
            <h1>
                {referenceString(result)}
            </h1>
        </div>
        <div class="search-result-context">
            <p>
                {#each result.chunks as chunk}
                    <span
                        style:font-weight={chunk.matchesQuery ? 'bold' : 'normal'}
                        style:text-decoration={chunk.matchesQuery ? 'underline' : 'none'}
                        >{chunk.content}</span
                    >
                {/each}
            </p>
        </div>
    </button>
</div>
