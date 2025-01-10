<!--
@component
The navbar component.
-->
<script>
    import { goto } from '$app/navigation';
    import { page } from '$app/stores';
    import {
        convertStyle,
        direction,
        layout,
        LAYOUT_TWO,
        NAVBAR_HEIGHT,
        s,
        showDesktopSidebar
    } from '$lib/data/stores';
    import { ArrowBackIcon, ArrowForwardIcon, HamburgerIcon } from '$lib/icons';
    import { getRoute } from '$lib/navigate';
    import { createEventDispatcher } from 'svelte';

    export let showBackButton = true;

    $: actionBarColor = $s['ui.bar.action']['background-color'];

    const dispatch = createEventDispatcher();
    function handleBackNavigation() {
        const shouldContinue = dispatch(
            'backNavigation',
            { detail: $page.route.id },
            { cancelable: true }
        );
        if (shouldContinue) {
            goto(getRoute(`/`));
        }
    }
</script>

<!--
  see Dynamic values in https://v2.tailwindcss.com/docs/just-in-time-mode#arbitrary-value-support
-->
<div class="dy-navbar" style:height={NAVBAR_HEIGHT} style:background-color={actionBarColor}>
    <div class="dy-navbar-start">
        {#if !showBackButton}
            <label
                for="sidebar"
                class="dy-btn dy-btn-ghost dy-btn-circle p-1 dy-drawer-button"
                class:lg:hidden={$showDesktopSidebar && $layout.mode !== LAYOUT_TWO}
            >
                <HamburgerIcon color="white" />
            </label>
        {:else}
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <!-- svelte-ignore a11y-no-static-element-interactions -->
            <div on:click={handleBackNavigation} class="dy-btn dy-btn-ghost dy-btn-circle">
                {#if $direction === 'ltr'}
                    <ArrowBackIcon color="white" />
                {:else}
                    <ArrowForwardIcon color="white" />
                {/if}
            </div>
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
