<script lang="ts">
    import RenderContent from './RenderContent.svelte';
    import type { Wrapper } from './schema/sofria-schema';
    import { isListItem } from './schema/wrappers';

    export let wrapper: Wrapper;

    function onInvalidWrapper() {
        console.warn(`Unsupported wrapper type: ${wrapper.type}`);
    }
</script>

{#if isListItem(wrapper)}
    <li class={wrapper.atts.htmlClass}>
        isListItem
        <RenderContent content={wrapper.content} />
    </li>
{:else}
    {(onInvalidWrapper(), '')}
{/if}
