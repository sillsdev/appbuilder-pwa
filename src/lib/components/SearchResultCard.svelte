<!--
@component
A clickable verse card representing a single search result.
-->
<script lang="ts">
    import config from '$lib/data/config';
    import type { Reference, SearchResult } from '$lib/search/domain/entities';
    import * as numerals from '$lib/scripts/numeralSystem';
    import { navigateToText } from '$lib/navigate';

    export let docSet: string;
    export let collection: string;
    export let result: SearchResult;

    interface ReferenceDisplay {
        book: string;
        chapter: string;
        verses: string;
    }

    const direction = config.bookCollections
        .find((x) => x.id === collection)
        .style.textDirection.toLowerCase();

    function referenceString(result: SearchResult): string {
        const parts = formatReferenceParts(result.reference);
        const separator = config.bookCollections.find((x) => x.id === collection).features[
            'ref-chapter-verse-separator'
        ];
        let reference = parts.book;
        if (parts.chapter) {
            reference += ' ' + parts.chapter;
            if (parts.verses) {
                reference += separator + parts.verses;
            }
        }
        return reference;
    }

    function formatReferenceParts(reference: Reference): ReferenceDisplay {
        const numeralSystem = numerals.systemForBook(
            config,
            reference.collection,
            reference.bookCode
        );
        return {
            book: bookName(reference.bookCode),
            chapter: numerals.formatNumber(numeralSystem, reference.chapter),
            verses: numerals.formatNumber(numeralSystem, reference.verses)
        };
    }

    function bookName(bookCode: string): string {
        let collectionData = config.bookCollections.filter((bc) => bc.id === collection)[0];
        let bookData = collectionData.books.filter((bk) => bk.id === bookCode)[0];
        return bookData.name;
    }

    function onClick() {
        navigateToText({
            docSet,
            collection,
            book: result.reference.bookCode,
            chapter: result.reference.chapter,
            verse: result.reference.verses
        });
    }
</script>

<div
    class="search-result-block w-full transition-shadow duration-300 hover:shadow-lg cursor-pointer"
>
    <button class="text-start" on:click|preventDefault={onClick}>
        <div class="search-result-reference flex">
            <h1>
                {referenceString(result)}
            </h1>
        </div>
        <div class="search-result-context flex">
            <p class="text-start">
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
