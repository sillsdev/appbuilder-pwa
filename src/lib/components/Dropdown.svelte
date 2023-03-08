<!--
@component
A simple dropdown menu from DaisyUI.
-->
<script>
    import { s, convertStyle } from '$lib/data/stores';
    import { createEventDispatcher } from 'svelte';

    const dispatch = createEventDispatcher();
</script>

<div class="dy-dropdown ">
    <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
    <label tabindex="0" class="dy-btn dy-btn-ghost p-0.5 dy-no-animation">
        <slot name="label" />
    </label>
    <!-- svelte-ignore a11y-no-noninteractive-tabindex -->
    <div
        tabindex="0"
        class="dy-dropdown-content dy-menu drop-shadow-lg mt-2.5 bg-base-100 min-w-[21rem]"
        style={convertStyle($s['ui.background'])}
        on:blur={() => dispatch('nav-end')}
    >
        <slot name="content" />
    </div>
</div>
