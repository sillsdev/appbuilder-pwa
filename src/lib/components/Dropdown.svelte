<!--
@component
A simple dropdown menu from DaisyUI.
-->
<script lang="ts">
    import { s, convertStyle } from '$lib/data/stores';
    import { createEventDispatcher, onDestroy } from 'svelte';
    export let cols = 6;
    const dispatch = createEventDispatcher();

    let details: HTMLDetailsElement;
    let container: HTMLDivElement;
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
            dispatch('nav-end');
        }
    }

    onDestroy(() => {
        document.removeEventListener('click', clickOutside);
    });
</script>

<!-- https://github.com/saadeghi/daisyui/discussions/2469 
     how to make dropdown align with screen instead of label -->
<details bind:this={details} class="dy-dropdown max-sm:[position:unset]" on:toggle={onToggle}>
    <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
    <summary class="dy-btn dy-btn-ghost p-0.5 no-animation flex-nowrap">
        <slot name="label" />
    </summary>
    <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
    <div
        bind:this={container}
        class="dy-dropdown-content dy-menu drop-shadow-lg mt-2.5 bg-base-100 z-10 max-sm:absolute max-sm:start-1.5"
        class:min-w-[22rem]={cols == 6}
        class:min-w-[18rem]={cols == 5}
        style={convertStyle($s['ui.background'])}
        on:blur={() => dispatch('nav-end')}
    >
        <slot name="content" />
    </div>
</details>
