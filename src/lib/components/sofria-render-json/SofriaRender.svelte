<script lang="ts">
    import { sequence } from '@sveltejs/kit/hooks';
    import RenderSequence from './RenderSequence.svelte';
    import { Document, isFlatDocument, isNestedDocument, Sequence } from './schema/sofria-schema';

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
