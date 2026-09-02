<!--
@component
Shows the one-time "you may lose your data..." popup after a user's first
bookmark, note, or highlight. Mounted once in the root layout (not inside
TextSelectionToolbar or the /text route) so it has somewhere to render no
matter which route the user is on - e.g. the note editor, or wherever
history.back() lands, may not be the scripture text page.
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
    <div class="fixed inset-x-0 bottom-36 z-50 flex justify-center px-2">
        <div
            class="flex flex-row justify-center p-2 w-full max-w-breakpoint-md shadow-md bg-amber-100 text-amber-900 text-sm rounded"
        >
            {hintText}
        </div>
    </div>
{/if}
