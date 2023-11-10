<!--
@component
A simple dropdown menu from DaisyUI.
-->
<script lang="ts">
    import { s, convertStyle } from '$lib/data/stores';
    import { createEventDispatcher } from 'svelte';
    export let cols = 6;
    const dispatch = createEventDispatcher();
</script>

<!-- https://github.com/saadeghi/daisyui/discussions/2469 
     how to make dropdown align with screen instead of label -->
<div class="dy-dropdown max-sm:[position:unset]">
    <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
    <label tabindex="0" class="dy-btn dy-btn-ghost p-0.5 no-animation flex-nowrap">
        <slot name="label" />
    </label>
    <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
    <div
        tabindex="0"
        class="dy-dropdown-content dy-menu drop-shadow-lg mt-2.5 bg-base-100 z-10 max-sm:absolute max-sm:start-1.5"
        class:min-w-[21rem]={cols == 6}
        class:min-w-[17.25rem]={cols == 5}
        style={convertStyle($s['ui.background'])}
        on:blur={() => dispatch('nav-end')}
    >
        <slot name="content" />
    </div>
</div>
