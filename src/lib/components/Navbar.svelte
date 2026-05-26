<!--
@component
The navbar component.
-->
<script lang="ts">
    import { goto } from '$app/navigation';
    import { resolve } from '$app/paths';
    import { page } from '$app/state';
    import {
        convertStyle,
        direction,
        layout,
        Layout,
        NAVBAR_HEIGHT,
        s,
        showDesktopSidebar
    } from '$lib/data/stores';
    import { ArrowBackIcon, ArrowForwardIcon, HamburgerIcon } from '$lib/icons';
    import type { Snippet } from 'svelte';

    interface Props {
        showBackButton?: boolean;
        start?: Snippet;
        center?: Snippet;
        end?: Snippet;
        backNavigation?: (e: Event, routeId: string) => void;
    }

    let { showBackButton = true, start, center, end, backNavigation }: Props = $props();

    function handleBackNavigation(e: Event) {
        if (backNavigation && page.route.id) {
            backNavigation(e, page.route.id);
        } else {
            goto(resolve(`/`));
        }
    }

    let actionBarColor = $derived($s?.['ui.bar.action']['background-color']);
</script>

<!--
  see Dynamic values in https://v2.tailwindcss.com/docs/just-in-time-mode#arbitrary-value-support
-->
<div class="dy-navbar" style:height={NAVBAR_HEIGHT} style:background-color={actionBarColor}>
    <div class="justify-start grow">
        {#if !showBackButton}
            <label
                for="sidebar"
                class="dy-btn dy-btn-ghost dy-btn-circle p-1 dy-drawer-button"
                class:lg:hidden={$showDesktopSidebar && $layout.mode !== Layout.Two}
            >
                <HamburgerIcon color="white" />
            </label>
        {:else}
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <button onclick={handleBackNavigation} class="dy-btn dy-btn-ghost dy-btn-circle">
                {#if $direction === 'ltr'}
                    <ArrowBackIcon color="white" />
                {:else}
                    <ArrowForwardIcon color="white" />
                {/if}
            </button>
        {/if}
        {@render start?.()}
    </div>
    <div class="dy-navbar-center grow" style={convertStyle($s?.['ui.screen-title'])}>
        {@render center?.()}
    </div>
    <div class="justify-end fill-base-content">
        {@render end?.()}
    </div>
</div>
