<script lang="ts">
    import RenderBlocks from './RenderBlocks.svelte';
    import { isListSequence, isOrderedListSequence } from './schema/sequences';
    import type { Sequence } from './schema/sofria-schema';

    export let sequence: Sequence;
</script>

{#if isListSequence(sequence)}
    <ul class="list-disc mx-10">
        <RenderBlocks blocks={sequence.blocks} />
    </ul>
{:else if isOrderedListSequence(sequence)}
    <ol class="list-decimal mx-10" start={parseInt(sequence.start)}>
        <RenderBlocks blocks={sequence.blocks} />
    </ol>
{:else}
    <RenderBlocks blocks={sequence.blocks} />
{/if}
