<!--
@component
Display an HTML Book.
-->
<script lang="ts">
    import { base } from '$app/paths';
    import config from '$lib/data/config';

    interface Props {
        references: {
            collection: string;
            book: string;
        };
        bodyLineHeight: number;
        bodyFontSize: number;
        fetch: any;
    }

    let { references, bodyLineHeight, bodyFontSize, fetch }: Props = $props();

    let htmlHead: string = $state();
    let htmlBody: string = $state();

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
    let fontSize = $derived(bodyFontSize + 'px');
    let lineHeight = $derived(bodyLineHeight + '%');
    $effect(() => {
        loadHtml(references.collection, references.book);
    });
</script>

<svelte:head>
    {@html htmlHead}
</svelte:head>

<div style="line-height: {lineHeight}; font-size: {fontSize};">
    {@html htmlBody}
</div>
