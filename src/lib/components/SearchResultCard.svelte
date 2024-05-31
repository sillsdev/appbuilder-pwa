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
    import type { SearchResult } from '$lib/scripts/search';

    export let docSet: string;
    export let collection: string;
    export let result: SearchResult;

    function referenceString(result: SearchResult): string {
        const separator = config.bookCollections.find((x) => x.id === collection).features[
            'ref-chapter-verse-separator'
        ];
        let reference = result.reference.bookName;
        if (result.reference.chapter) {
            reference += ' ' + result.reference.chapter;
            if (result.reference.verses) {
                reference += separator + result.reference.verses;
            }
        }
        return reference;
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

<div
    class="p-4 my-4 mx-2 shadow-none transition-shadow duration-300 hover:shadow-lg cursor-pointer"
>
    <button class="text-left" on:click|preventDefault={onClick}>
        <h1 style={convertStyle($s['ui.search.results-reference'])}>
            {referenceString(result)}
        </h1>
        <p style={convertStyle($s['ui.search.results-context'])}>
            {#each result.chunks as chunk}
                <span
                    style:font-weight={chunk.matchesQuery ? 'bold' : 'normal'}
                    style:text-decoration={chunk.matchesQuery ? 'underline' : 'none'}
                    >{chunk.content}</span
                >
            {/each}
        </p>
    </button>
</div>
