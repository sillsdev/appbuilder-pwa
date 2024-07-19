<script lang="ts">
    import RenderParagraph from './RenderParagraph.svelte';
    import { Block, isParagraph, Sequence } from './schema/sofria-schema';

    export let sequence: Sequence;

    function onInvalidBlockType(block: Block) {
        console.error(`Unsupported block type: ${block.type}`);
    }
</script>

{#each sequence.blocks as block}
    {#if isParagraph(block)}
        <RenderParagraph paragraph={block} />
    {:else}
        {(onInvalidBlockType(block), '')}
    {/if}
{/each}
