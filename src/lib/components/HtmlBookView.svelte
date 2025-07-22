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

    let htmlBody: string = $state();
    let fontSize = $derived(bodyFontSize + 'px');
    let lineHeight = $derived(bodyLineHeight + '%');

    $effect(() => {
        loadHtml(references.collection, references.book);
    });

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
    <!-- eslint-disable-next-line svelte/no-at-html-tags -->
    {@html htmlBody}
</div>
