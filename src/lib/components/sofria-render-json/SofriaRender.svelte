<script lang="ts">
    import RenderSequence from './RenderSequence.svelte';
    import {
        type Document,
        isFlatDocument,
        isNestedDocument,
        type Sequence
    } from './schema/sofria-schema';

    export let document: Document;

    let mainSequence: Sequence;

    if (isFlatDocument(document)) {
        mainSequence = document.sequences[document.main_sequence_id];
    } else if (isNestedDocument(document)) {
        mainSequence = document.sequence;
    } else {
        throw new Error(`Unsupported document structure: ${document.schema.structure}`);
    }
</script>

<RenderSequence sequence={mainSequence} />
