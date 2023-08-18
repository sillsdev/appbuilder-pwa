<!--
@component
A simple dropdown menu from DaisyUI.
-->
<script lang="ts">
    import { s, convertStyle } from '$lib/data/stores';
    import { createEventDispatcher } from 'svelte';
    export let cols = 6;
    export let direction = 'bottom';
    const dispatch = createEventDispatcher();
</script>

<div class="dy-dropdown dy-dropdown-{direction}">
    <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
    <label
        tabindex="0"
        class="dy-btn dy-btn-ghost p-0.5 no-animation flex-nowrap"
        style:font-size="unset"
    >
        <slot name="label" />
    </label>
    <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
    <div
        tabindex="0"
        class="dy-dropdown-content z-[1] dy-menu drop-shadow-lg mx-2.5 bg-base-100"
        class:min-w-[21rem]={cols == 6}
        class:min-w-[17.25rem]={cols == 5}
        style={convertStyle($s['ui.background'])}
        on:blur={() => dispatch('nav-end')}
    >
        <slot name="content" />
    </div>
</div>
