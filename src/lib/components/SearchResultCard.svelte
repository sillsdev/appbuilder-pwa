<!--
@component
A clickable result card representing a single search result (Scripture or Dictionary).
-->
<script lang="ts">
    import { goto } from '$app/navigation';
    import config from '$lib/data/config';
    import { bodyFontSize, currentFont, themeColors } from '$lib/data/stores';
    import { navigateToText } from '$lib/navigate';
    import * as numerals from '$lib/scripts/numeralSystem';
    import type { Reference, SearchResult } from '$lib/search/domain/entities';

    // Props for the component
    export let result: SearchResult | any; // Accept both Scripture and Dictionary result types
    export let collection: string;
    export let docSet: string = null;

    // Check if this is a dictionary result (no reference property, but has id property)
    const isDictionaryResult = !result.reference && result.id !== undefined;

    // Dictionary result handler
    function handleDictionaryClick() {
        goto(`/lexicon/?entry=${result.id}`);
    }

    // Scripture result handler
    function handleScriptureClick() {
        navigateToText({
            docSet,
            collection,
            book: result.reference.bookCode,
            chapter: result.reference.chapter,
            verse: result.reference.verses
        });
    }

    // Format Scripture reference
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

    function formatReferenceParts(reference: Reference): any {
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
</script>

<div
    class="search-result-block w-full p-3 mb-3 transition-shadow duration-300 hover:shadow-lg cursor-pointer"
    style:background-color={$themeColors.CardBackgroundColor}
    style:border="1px solid"
    style:border-color={$themeColors.DividerColor}
    style:border-radius="4px"
>
    {#if isDictionaryResult}
        <!-- Dictionary Result Display -->
        <button class="text-start w-full" on:click|preventDefault={handleDictionaryClick}>
            <div class="search-result-word flex">
                <h2
                    style:font-family={$currentFont}
                    style:font-size="{parseInt($bodyFontSize) + 4}px"
                    style:font-weight="bold"
                >
                    {result.name || `Entry #${result.id}`}
                    {#if result.homonym_index > 0}<sub>{result.homonym_index}</sub>{/if}
                </h2>
            </div>
        </button>
    {:else}
        <!-- Scripture Result Display -->
        <button class="text-start" on:click|preventDefault={handleScriptureClick}>
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
    {/if}
</div>
