<script lang="ts">
    import { mainScroll } from '$lib/data/stores';
    import { onMount } from 'svelte';
    let main: HTMLElement;

    const updateScroll = (() => {
        let updateTimer: NodeJS.Timeout;
        return () => {
            clearTimeout(updateTimer);
            updateTimer = setTimeout(() => {
                $mainScroll = { top: main.scrollTop, height: main.clientHeight };
            }, 50);
        };
    })();

    onMount(updateScroll);
</script>

<!-- Make the top level element scrollable so that slots can be sticky relative to the direct parent -->
<main
    class="p-2 overflow-y-auto {$$restProps.class || ''}"
    bind:this={main}
    on:scroll={updateScroll}
>
    <slot />
</main>
