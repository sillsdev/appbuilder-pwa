<script lang="ts">
    import RenderContent from './RenderContent.svelte';
    import type { Wrapper } from './schema/sofria-schema';

    export let wrapper: Wrapper;
</script>

<RenderContent content={wrapper.content} />
