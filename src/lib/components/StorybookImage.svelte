<script lang="ts">
    import { base } from '$app/paths';
    import config from '$lib/data/config';
    import type { ReferenceStore } from '$lib/data/stores/reference';

    export let references: ReferenceStore;

    function getImage(ref: ReferenceStore) {
        const filename = config.bookCollections
            .find((bc) => bc.id === ref.collection)
            .books.find((bk) => bk.id === ref.book)
            ?.storybookImages.find((image) => image.page === ref.chapter)?.filename;
        return filename ? `${base}/illustrations/${filename}` : null;
    }

    $: image = getImage(references);
</script>

{#if image}
    <img src={image} />
{/if}
