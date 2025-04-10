<script lang="ts">
    import { base } from '$app/paths';
    import '$lib/app.css';
    import CollectionSelector from '$lib/components/CollectionSelector.svelte';
    import FontSelector from '$lib/components/FontSelector.svelte';
    import NoteDialog from '$lib/components/NoteDialog.svelte';
    import Sidebar from '$lib/components/Sidebar.svelte';
    import TextAppearanceSelector from '$lib/components/TextAppearanceSelector.svelte';
    import catalog from '$lib/data/catalogData';
    import config from '$lib/data/config';
    import {
        analytics,
        direction,
        modal,
        MODAL_COLLECTION,
        MODAL_FONT,
        MODAL_NOTE,
        MODAL_STOP_PLAN,
        MODAL_TEXT_APPEARANCE,
        NAVBAR_HEIGHT,
        refs,
        s,
        theme
    } from '$lib/data/stores';
    import '$lib/app.css';
    import PlanStopDialog from '$lib/components/PlanStopDialog.svelte';

    const isSAB = config.programType == 'SAB';

    if (isSAB && !$refs.initialized) {
        catalog.setFetch(fetch);
        // When this async function completes, $refs.intialized will be true.
        refs.init();
    }

    if (!$analytics.initialized) {
        analytics.init();
    }

    $: showPage = !isSAB || $refs.initialized;
    $: $modal, showModal();

    function showModal() {
        if ($modal.length > 0) {
            $modal.forEach(({ modalType, data }) => {
                switch (modalType) {
                    case MODAL_COLLECTION:
                        collectionSelector.showModal();
                        break;
                    case MODAL_NOTE:
                        noteDialog.note = data;
                        noteDialog.showModal();
                        break;
                    case MODAL_TEXT_APPEARANCE:
                        textAppearanceSelector.options = data;
                        textAppearanceSelector.showModal();
                        break;
                    case MODAL_FONT:
                        fontSelector.showModal();
                        break;
                    case MODAL_STOP_PLAN:
                        planStopDialog.planId = data;
                        planStopDialog.showModal();
                        break;
                }
            });
            modal.clear();
        }
    }

    let textAppearanceSelector;
    let collectionSelector;
    let fontSelector;
    let noteDialog;
    let planStopDialog;
</script>

<svelte:head>
    <meta name="theme-color" content={$s['ui.bar.action']?.['background-color']} />
    <link rel="stylesheet" href="{base}/styles/{config.programType.toLowerCase()}-app.css" />
    {#if isSAB}
        {#if $refs.initialized}
            <link rel="stylesheet" href="{base}/styles/sab-bc-{$refs.collection}.css" />
        {/if}
        <link rel="stylesheet" href="{base}/override-sab.css" />
    {/if}
</svelte:head>

{#if showPage}
    <div>
        <!--Div containing the popup modals triggered by the navBar buttons and SideBar entries -->

        {#if isSAB}
            <!-- Add Note Menu -->
            <NoteDialog bind:this={noteDialog} />

            <!-- Collection Selector Menu -->
            <CollectionSelector bind:this={collectionSelector} vertOffset={NAVBAR_HEIGHT} />
        {/if}

        <!-- Text Appearance Options Menu -->
        <TextAppearanceSelector bind:this={textAppearanceSelector} vertOffset={NAVBAR_HEIGHT} />

        <FontSelector bind:this={fontSelector} />

        <PlanStopDialog bind:this={planStopDialog} vertOffset={NAVBAR_HEIGHT} />
    </div>

    <Sidebar on:showModal={showModal}>
        <div
            id="container"
            data-color-theme={$theme}
            style="height:100vh;height:100dvh;margin:0;"
            style:direction={$direction}
        >
            <slot />
        </div>
    </Sidebar>
{/if}
