<script lang="ts">
    import RenderSequence from './RenderSequence.svelte';
    import RenderWrapper from './RenderWrapper.svelte';
    import {
        type Content,
        type ContentModifier,
        contentIsGraft,
        isWrapper
    } from './schema/sofria-schema';

    export let content: Content;

    function onInvalidContent(element: ContentModifier) {
        console.error(`Unsupported content type: ${element.type}`);
    }
</script>

{#each content as element}
    {#if typeof element === 'string'}
        {element}
    {:else if contentIsGraft(element)}
        <RenderSequence sequence={element.sequence} />
    {:else if isWrapper(element)}
        <RenderWrapper wrapper={element} />
    {:else}
        {(onInvalidContent(element), '')}
    {/if}
{/each}
