<script lang="ts">
    import type { Snippet } from 'svelte';
    import type { LayoutData } from './$types';

    interface Props {
        children?: Snippet;
        data: LayoutData;
    }

    let { children }: Props = $props();
</script>

<div
    class="flex flex-col fixed bg-base-100 h-screen w-screen"
    style="background-color: var(--BackgroundColor);"
>
    {@render children?.()}
</div>
