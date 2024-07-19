<script lang="ts">
    import RenderWrapper from './RenderWrapper.svelte';
    import { type Content, type ContentElement, isWrapper } from './schema/sofria-schema';

    export let content: Content;

    function onInvalidContent(element: ContentElement) {
        console.error(`Unsupported content type: ${element.type}`);
    }
</script>

{#each content as element}
    {#if typeof element === 'string'}
        {element}
    {:else if isWrapper(element)}
        <RenderWrapper wrapper={element} />
    {:else}
        {(onInvalidContent(element), '')}
    {/if}
{/each}
