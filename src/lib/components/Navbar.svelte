<!--
@component
The navbar component.
-->
<script>
    import { HamburgerIcon } from '$lib/icons';
    import { viewMode, convertStyle, s, showDesktopSidebar } from '$lib/data/stores';
    $: actionBarColor = $s['ui.bar.action']['background-color'];
</script>

<!--
  see Dynamic values in https://v2.tailwindcss.com/docs/just-in-time-mode#arbitrary-value-support
-->
<div class="dy-navbar" style:background-color={actionBarColor}>
    <div class="dy-navbar-start">
        <label
            for="sidebar"
            class="dy-btn dy-btn-ghost dy-btn-circle p-1 dy-drawer-button"
            class:lg:hidden={$showDesktopSidebar && $viewMode !== 'Side By Side'}
        >
            <HamburgerIcon color="white" />
        </label>
        <slot name="left-buttons" />
    </div>
    <div class="dy-navbar-center" style={convertStyle($s['ui.screen-title'])}>
        <slot name="center" />
    </div>
    <div class="dy-navbar-end fill-base-content">
        <slot name="right-buttons" />
    </div>
</div>
