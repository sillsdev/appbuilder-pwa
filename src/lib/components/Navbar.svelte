<!--
@component
The navbar component.
-->
<script>
    import { globalConfig } from '$lib/data/stores';

    $: actionBarColor = $globalConfig.themes
        .find((x) => x.name === 'Normal') // TODO: change to fetch the current theme
        .colorSets.find((x) => x.type === 'main').colors['PrimaryColor'];
</script>

<!--
  see Dynamic values in https://v2.tailwindcss.com/docs/just-in-time-mode#arbitrary-value-support
-->
<div class="dy-navbar text-white fill-white stroke-white" style:background-color={actionBarColor}>
    <div class="dy-navbar-start">
        <slot name="drawer-button" />
        <slot name="left-buttons" />
    </div>
    <div class="dy-navbar-center">
        <slot name="center" />
    </div>
    <div class="dy-navbar-end fill-base-content">
        <slot name="right-buttons" />
    </div>
</div>
