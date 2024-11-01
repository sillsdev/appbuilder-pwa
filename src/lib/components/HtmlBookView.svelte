<!--
@component
Display an HTML Book.
-->
<script lang="ts">
    import config from '$lib/data/config';
    import { base } from '$app/paths';

    export let references: any;
    export let bodyLineHeight: any;
    export let bodyFontSize: any;
    export let fetch: any;

    $: fontSize = bodyFontSize + 'px';
    $: lineHeight = bodyLineHeight + '%';

    let htmlHead: string;
    let htmlBody: string;

    $: loadHtml(references.collection, references.book);

    async function loadHtml(collectionId: string, bookId: string) {
        console.log(`loadHtml: ${collectionId}, ${bookId}`);
        const book = config.bookCollections
            .find((x) => x.id === collectionId)
            ?.books.find((x) => x.id === bookId);

        if (book) {
            const result = await fetch(`${base}/collections/${references.collection}/${book.file}`);

            if (result.ok) {
                const fullHtml = await result.text();

                // Extract content within <head> and <body>
                htmlHead = fullHtml.match(/<head[^>]*>([\s\S]*?)<\/head>/i)?.[1] || '';
                htmlBody = fullHtml.match(/<body[^>]*>([\s\S]*?)<\/body>/i)?.[1] || '';
            }
        }
    }
</script>

<svelte:head>
    {@html htmlHead}
</svelte:head>

<div style="line-height: {lineHeight}; font-size: {fontSize};">
    {@html htmlBody}
</div>
