<!--
@component
Shows the one-time "you may lose your data..." popup after a user's first
bookmark, note, or highlight. Rendered outside TextSelectionToolbar (and outside
the note editor route) so it stays visible regardless of which of those unmounts.
-->
<script lang="ts">
    import { t } from '$lib/data/stores';
    import { annotationHint } from '$lib/data/stores/annotation';
    import { buildAnnotationHintText } from '$lib/scripts/safariUtils';

    const hintText = $derived(
        $annotationHint.kind ? buildAnnotationHintText($t, $annotationHint.kind) : ''
    );
</script>

{#if $annotationHint.visible}
    <div
        class="absolute flex flex-row justify-center -top-12 p-2 w-full left-1/2 -translate-x-1/2 max-w-breakpoint-md shadow-md bg-amber-100 text-amber-900 text-sm rounded"
    >
        {hintText}
    </div>
{/if}
