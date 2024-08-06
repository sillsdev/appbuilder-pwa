<script lang="ts">
    import { isListItem, isUsfmParagraph, usfmClass } from './schema/paragraphs';
    import RenderContent from './RenderContent.svelte';
    import type { Paragraph } from './schema/sofria-schema';

    export let paragraph: Paragraph;

    function onInvalidParagraph() {
        console.error(`Unsupported paragraph type: ${paragraph.subtype}`);
    }
</script>

{#if isUsfmParagraph(paragraph)}
    <div class={usfmClass(paragraph)}>
        <RenderContent content={paragraph.content} />
    </div>
{:else if isListItem(paragraph)}
    <li class={paragraph.atts.htmlClass}>
        <RenderContent content={paragraph.content} />
    </li>
{:else}
    {(onInvalidParagraph(), '')}
{/if}
