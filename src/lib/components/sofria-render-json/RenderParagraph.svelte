<script lang="ts">
    import {
        isListBlock,
        isOrderedListBlock,
        isUsfmParagraph,
        usfmClass
    } from './schema/paragraphs';
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
{:else if isListBlock(paragraph)}
    <ul>
        <RenderContent content={paragraph.content} />
    </ul>
{:else if isOrderedListBlock(paragraph)}
    <ol start={parseInt(paragraph.atts.start)}>
        <RenderContent content={paragraph.content} />
    </ol>
{:else}
    {(onInvalidParagraph(), '')}
{/if}
