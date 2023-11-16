<script lang="ts">
    import { mainScroll } from '$lib/data/stores';
    import { onMount } from 'svelte';
    let main: HTMLElement;
    function inViewport() {
        if (!main) return 0;

        const elH = main.offsetHeight;
        const H = window.innerHeight;
        const r = main.getBoundingClientRect();
        const t = r.top;
        const b = r.bottom;
        return [-t, Math.max(0, t > 0 ? Math.min(elH, H - t) : Math.min(b, H))];
    }
    export var updated = false;
    export const updateScroll = (() => {
        let updateTimer: NodeJS.Timeout;
        return () => {
            clearTimeout(updateTimer);
            updateTimer = setTimeout(() => {
                // let viewVal = inViewport();
                // console.log("ViewVal: " + viewVal);
                // console.log("View main: %d %d", main.scrollTop, main.clientHeight);
                // $mainScroll = { top: viewVal[0], height: viewVal[1] };
            }, 50);
        };
    })();

    onMount(updateScroll);
</script>

<div class="p-2 w-full" bind:this={main} on:scroll={updateScroll} >
    <main>
        <slot name="scrolled-content" />
    </main>
</div>
