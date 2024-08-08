<script lang="ts">
    import RenderContent from './RenderContent.svelte';
    import type { Wrapper } from './schema/sofria-schema';
    import { makesBold, makesItalic } from './schema/wrappers';

    export let wrapper: Wrapper;

    const bold = makesBold(wrapper);
    const italic = makesItalic(wrapper);
</script>

{#if bold || italic}
    <span class:font-bold={bold} class:italic>
        <RenderContent content={wrapper.content} />
    </span>
{:else}
    <RenderContent content={wrapper.content} />
{/if}
