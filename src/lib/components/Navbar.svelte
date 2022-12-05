<!--
@component
The navbar component.
-->
<script>
    import { HamburgerIcon } from '$lib/icons';
    import { viewMode, themeColors } from '$lib/data/stores';
    $: actionBarColor = $themeColors['ActionBarColor'];
</script>

<!--
  see Dynamic values in https://v2.tailwindcss.com/docs/just-in-time-mode#arbitrary-value-support
-->
<div class="dy-navbar text-white" style:background-color={actionBarColor}>
    <div class="dy-navbar-start">
        <label
            for="sidebar"
            class="dy-btn dy-btn-ghost dy-btn-circle p-1 dy-drawer-button {$viewMode ===
            'Side By Side'
                ? ''
                : 'lg:hidden'}"
        >
            <HamburgerIcon color="white" />
        </label>
        <slot name="left-buttons" />
    </div>
    <div class="dy-navbar-center">
        <slot name="center" />
    </div>
    <div class="dy-navbar-end fill-base-content">
        <slot name="right-buttons" />
    </div>
</div>
