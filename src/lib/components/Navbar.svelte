<!--
@component
The navbar component.
-->
<script>
    import { HamburgerIcon, ArrowBackIcon, ArrowForwardIcon } from '$lib/icons';
    import {
        layout,
        LAYOUT_TWO,
        convertStyle,
        s,
        showDesktopSidebar,
        direction,
        NAVBAR_HEIGHT
    } from '$lib/data/stores';
    import { page } from '$app/stores';
    import { base } from '$app/paths';

    $: actionBarColor = $s['ui.bar.action']['background-color'];
</script>

<!--
  see Dynamic values in https://v2.tailwindcss.com/docs/just-in-time-mode#arbitrary-value-support
-->
<div class="dy-navbar" style:height={NAVBAR_HEIGHT} style:background-color={actionBarColor}>
    <div class="dy-navbar-start">
        {#if $page.route.id === '/'}
            <label
                for="sidebar"
                class="dy-btn dy-btn-ghost dy-btn-circle p-1 dy-drawer-button"
                class:lg:hidden={$showDesktopSidebar && $layout.mode !== LAYOUT_TWO}
            >
                <HamburgerIcon color="white" />
            </label>
        {:else}
            <a href="{base}/" class="dy-btn dy-btn-ghost dy-btn-circle">
                {#if $direction === 'ltr'}
                    <ArrowBackIcon color="white" />
                {:else}
                    <ArrowForwardIcon color="white" />
                {/if}
            </a>
        {/if}
        <slot name="left-buttons" />
    </div>
    <div class="dy-navbar-center" style={convertStyle($s['ui.screen-title'])}>
        <slot name="center" />
    </div>
    <div class="dy-navbar-end fill-base-content">
        <slot name="right-buttons" />
    </div>
</div>
