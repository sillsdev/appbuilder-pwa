<!--
@component
Display an HTML Book.
-->
<script lang="ts">
    import { base } from '$app/paths';
    import config from '$lib/data/config';

    export let references: any;
    export let bodyLineHeight: any;
    export let bodyFontSize: any;
    export let fetch: any;

    $: fontSize = bodyFontSize + 'px';
    $: lineHeight = bodyLineHeight + '%';

    let htmlBody: string;

    $: loadHtml(references.collection, references.book);

    async function loadHtml(collectionId: string, bookId: string) {
        const book = config.bookCollections
            .find((x) => x.id === collectionId)
            ?.books.find((x) => x.id === bookId);

        if (book) {
            const result = await fetch(`${base}/collections/${references.collection}/${book.file}`);

            if (result.ok) {
                htmlBody = await result.text();
            }
        }
    }
</script>

<div class="prose" style="line-height: {lineHeight}; font-size: {fontSize};">
    {@html htmlBody}
</div>
