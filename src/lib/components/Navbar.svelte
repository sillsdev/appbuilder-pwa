<!--
@component
The navbar component.
-->
<script lang="ts">
    import { page } from '$app/state';
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
    import { gotoRoute } from '$lib/navigate';

    interface Props {
        showBackButton?: boolean;
        start?: () => any;
        center?: () => any;
        end?: () => any;
        backNavigation?: (routeId: string) => void;
    }

    let { showBackButton = true, start, center, end, backNavigation }: Props = $props();

    function handleBackNavigation() {
        if (backNavigation) {
            backNavigation(page.route.id);
        } else {
            gotoRoute(`/`);
        }
    }

    let actionBarColor = $derived($s['ui.bar.action']['background-color']);
</script>

<!--
  see Dynamic values in https://v2.tailwindcss.com/docs/just-in-time-mode#arbitrary-value-support
-->
<div class="dy-navbar" style:height={NAVBAR_HEIGHT} style:background-color={actionBarColor}>
    <div class="dy-navbar-start">
        {#if !showBackButton}
            <label
                for="sidebar"
                data-testid="hamburger-icon"
                class="dy-btn dy-btn-ghost dy-btn-circle p-1 dy-drawer-button"
                class:lg:hidden={$showDesktopSidebar && $layout.mode !== LAYOUT_TWO}
            >
                <HamburgerIcon color="white" />
            </label>
        {:else}
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <button
                onclick={handleBackNavigation}
                class="dy-btn dy-btn-ghost dy-btn-circle"
                data-testid="back-icon"
            >
                {#if $direction === 'ltr'}
                    <ArrowBackIcon color="white" />
                {:else}
                    <ArrowForwardIcon color="white" />
                {/if}
            </button>
        {/if}
        {@render start?.()}
    </div>
    <div class="dy-navbar-center" style={convertStyle($s['ui.screen-title'])}>
        {@render center?.()}
    </div>
    <div class="dy-navbar-end fill-base-content">
        {@render end?.()}
    </div>
</div>
