<script lang="ts">
    import RenderParagraph from './RenderParagraph.svelte';
    import RenderSequence from './RenderSequence.svelte';
    import { type Block, blockIsGraft, isParagraph } from './schema/sofria-schema';

    export let blocks: Block[];

    function onInvalidBlockType(block: Block) {
        console.error(`Unsupported block type: ${block.type}`);
    }
</script>

{#each blocks as block}
    {#if isParagraph(block)}
        <RenderParagraph paragraph={block} />
    {:else if blockIsGraft(block)}
        <RenderSequence sequence={block.sequence} />
    {:else}
        {(onInvalidBlockType(block), '')}
    {/if}
{/each}
