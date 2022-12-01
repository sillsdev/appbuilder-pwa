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

<div class="p-2 w-full overflow-y-auto ">
    <main bind:this={main} on:scroll={updateScroll}>
        <slot name="scrolled-content" />
    </main>
</div>
