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
        MODAL_PLAYBACK_SPEED,
        MODAL_STOP_PLAN,
        MODAL_TEXT_APPEARANCE,
        NAVBAR_HEIGHT,
        refs,
        s,
        theme
    } from '$lib/data/stores';
    import '$lib/app.css';
    import AudioPlaybackSpeed from '$lib/components/AudioPlaybackSpeed.svelte';
    import PlanStopDialog from '$lib/components/PlanStopDialog.svelte';
    import { onMount } from 'svelte';
    import { fromStore } from 'svelte/store';

    let { children } = $props();

    const isSAB = config.programType == 'SAB';

    if (isSAB && !$refs.initialized) {
        catalog.setFetch(fetch);
        // When this async function completes, $refs.intialized will be true.
        refs.init();
    }

    if (!$analytics.initialized) {
        analytics.init();
    }

    const showPage = $derived(!isSAB || $refs.initialized);
    const stateModal = fromStore<any[]>(modal);
    $effect(() => {
        if (stateModal.current.length > 0) {
            showModal();
        }
    });

    function showModal() {
        if ($modal.length > 0) {
            $modal.forEach(({ modalType, data }) => {
                switch (modalType) {
                    case MODAL_COLLECTION:
                        collectionSelector.showModal();
                        break;
                    case MODAL_NOTE:
                        noteDialog.showModal(data);
                        break;
                    case MODAL_TEXT_APPEARANCE:
                        textAppearanceSelector.options = data;
                        textAppearanceSelector.showModal();
                        break;
                    case MODAL_FONT:
                        fontSelector.showModal();
                        break;
                    case MODAL_STOP_PLAN:
                        planStopId = data;
                        planStopDialog.showModal();
                        break;
                    case MODAL_PLAYBACK_SPEED:
                        audioPlaybackSpeed.showModal();
                        break;
                }
            });
            modal.clear();
        }
    }

    onMount(() => {
        const spinner = document.getElementById('loading-spinner');
        if (spinner) {
            spinner.classList.add('fade-out');
            setTimeout(() => {
                spinner.remove();
            }, 500);
        }
    });

    let textAppearanceSelector: TextAppearanceSelector = $state();
    let collectionSelector: CollectionSelector = $state();
    let fontSelector: FontSelector = $state();
    let noteDialog: NoteDialog = $state();
    let planStopDialog: PlanStopDialog;
    let planStopId: string;
    let audioPlaybackSpeed: AudioPlaybackSpeed = $state();
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

        <PlanStopDialog
            bind:this={planStopDialog}
            bind:planId={planStopId}
            vertOffset={NAVBAR_HEIGHT}
        />

        <AudioPlaybackSpeed bind:this={audioPlaybackSpeed} />
    </div>

    <Sidebar>
        <div
            id="container"
            data-color-theme={$theme}
            style="height:100vh;height:100dvh;margin:0;"
            style:direction={$direction}
        >
            {@render children()}
        </div>
    </Sidebar>
{/if}
