<!--
@component
A simple dropdown menu from DaisyUI.
-->
<script lang="ts">
    import { s, convertStyle } from '$lib/data/stores';
    import { createEventDispatcher } from 'svelte';
    export let cols = 6;
    export let useCustomBtn = false;
    export let direction = 'bottom';
    let directionClass = `dy-dropdown-${direction}`;
    const dispatch = createEventDispatcher();
</script>

<div class="dy-dropdown dy-dropdown-right">
    <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
    <label
        tabindex="0"
        class="{useCustomBtn ? 'custom-btn' : 'dy-btn dy-btn-ghost'} p-0.5 no-animation flex-nowrap"
    >
        <slot name="label" />
    </label>
    <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
    <div
        tabindex="0"
        class="dy-dropdown-content dy-menu drop-shadow-lg mt-2.5 bg-base-100 z-10"
        class:min-w-[21rem]={cols == 6}
        class:min-w-[17.25rem]={cols == 5}
        style={convertStyle($s['ui.background'])}
        style:font-size="revert"
        on:blur={() => dispatch('nav-end')}
    >
        <slot name="content" />
    </div>
</div>

<style>
    .custom-btn {
        display: inline-flex;
        cursor: pointer;
        user-select: none;
        align-items: center;
        justify-content: center;
        text-align: center;
        transition-property: color, background-color, border-color, text-decoration-color, fill,
            stroke, opacity, box-shadow, transform, filter, backdrop-filter, -webkit-backdrop-filter;
        transition-duration: 200ms;
        transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
        border-radius: var(--rounded-btn, 0.5rem);
        height: 3rem;
        line-height: 1em;
        min-height: 3rem;
        border-width: 1px;
        border-color: transparent;
        background-color: transparent;
        color: currentColor;
        --tw-shadow: 0 0 #0000;
        --tw-shadow-colored: 0 0 #0000;
        box-shadow: var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000),
            var(--tw-shadow);
    }
</style>
