<!--
@component
A simple dropdown menu from DaisyUI.
-->
<script lang="ts">
    import { convertStyle, s } from '$lib/data/stores';
    import { onDestroy } from 'svelte';

    let { cols = 6, navEnd = function () {}, label, content } = $props();

    let details: HTMLDetailsElement = $state();
    let container: HTMLDivElement = $state();
    export function close() {
        details.removeAttribute('open');
    }

    function clickOutside(event: MouseEvent) {
        const path = event.composedPath();
        const isInside = path.includes(container);
        if (!isInside) {
            close();
        }
    }

    function onToggle() {
        if (details.open) {
            document.addEventListener('click', clickOutside);
        } else {
            document.removeEventListener('click', clickOutside);
            navEnd();
        }
    }

    onDestroy(() => {
        document.removeEventListener('click', clickOutside);
    });
</script>

<!-- https://github.com/saadeghi/daisyui/discussions/2469 
     how to make dropdown align with screen instead of label -->
<details bind:this={details} class="dy-dropdown max-sm:[position:unset]" ontoggle={onToggle}>
    <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
    <summary class="dy-btn dy-btn-ghost p-0.5 no-animation flex-nowrap">
        {@render label()}
    </summary>
    <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
    <div
        bind:this={container}
        class="dy-dropdown-content dy-menu drop-shadow-lg mt-2.5 bg-base-100 z-10 max-sm:absolute max-sm:start-1.5"
        class:min-w-[22rem]={cols == 6}
        class:min-w-[18rem]={cols == 5}
        style={convertStyle($s['ui.background'])}
        onblur={() => navEnd()}
    >
        {@render content()}
    </div>
</details>
