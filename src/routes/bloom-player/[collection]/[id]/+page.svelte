<script lang="ts">
    import BloomPlayerElement from '$lib/components/BloomPlayerElement.svelte';
    import type { PageData } from './$types';

    interface Props {
        data: PageData;
    }

    let { data }: Props = $props();

    const book = $derived(data.book);

    let player;
    const bookUrl = $derived(
        encodeURI(
            `/collections/${data.collection}/${book?.hashedDir ?? data.id}/${book?.file.normalize('NFC')}`
        )
    );
    const lang = $derived(data.book?.resolvedLang ?? data.bookCollection?.languageCode ?? '');
</script>

<div class="h-screen">
    <BloomPlayerElement
        bind:this={player}
        playerUrl="/bloom-player/bloom-player/bloomplayer.htm"
        {bookUrl}
        {lang}
    />
</div>

<style>
    :global(bloom-player) {
        display: block;
        width: 100%;
        height: 100%;
    }
</style>
