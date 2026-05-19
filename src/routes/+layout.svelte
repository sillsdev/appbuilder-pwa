<script lang="ts">
    import appleIconHref from '$assets/icons/apple-touch-icon.png';
    import faviconHref from '$assets/icons/favicon.png';
    import manifestHref from '$assets/manifestUrl.json';
    import '$lib/styles/app.css';
    import config from '$assets/config';
    import AudioPlaybackSpeed from '$lib/components/AudioPlaybackSpeed.svelte';
    import CollectionSelector from '$lib/components/CollectionSelector.svelte';
    import FontSelector from '$lib/components/FontSelector.svelte';
    import NoteDialog from '$lib/components/NoteDialog.svelte';
    import PlanStopDialog from '$lib/components/PlanStopDialog.svelte';
    import Sidebar from '$lib/components/Sidebar.svelte';
    import TextAppearanceSelector from '$lib/components/TextAppearanceSelector.svelte';
    import catalog from '$lib/data/catalogData';
    import {
        analytics,
        direction,
        modal,
        ModalType,
        NAVBAR_HEIGHT,
        refs,
        s,
        theme
    } from '$lib/data/stores';
    import { onMount } from 'svelte';
    import { fromStore } from 'svelte/store';

    const styles = import.meta.glob('./*', {
        import: 'default',
        eager: true,
        base: '/src/gen-assets/styles',
        query: '?url'
    }) as Record<string, string>;

    const overrideStyles = import.meta.glob('./override-*.css', {
        import: 'default',
        eager: true,
        base: '/src/lib/styles',
        query: '?url'
    }) as Record<string, string>;

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
                    case ModalType.Collection:
                        collectionSelector?.showModal();
                        break;
                    case ModalType.Note:
                        noteDialog?.showModal(
                            data as Parameters<(typeof noteDialog)['showModal']>[0]
                        );
                        break;
                    case ModalType.TextAppearance:
                        if (textAppearanceSelector) {
                            textAppearanceSelector.options = data;
                            textAppearanceSelector.showModal();
                        }
                        break;
                    case ModalType.Font:
                        fontSelector?.showModal();
                        break;
                    case ModalType.StopPlan:
                        planStopId = data as string;
                        planStopDialog?.showModal();
                        break;
                    case ModalType.PlaybackSpeed:
                        audioPlaybackSpeed?.showModal();
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

    let textAppearanceSelector: TextAppearanceSelector | undefined = $state();
    let collectionSelector: CollectionSelector | undefined = $state();
    let fontSelector: FontSelector | undefined = $state();
    let noteDialog: NoteDialog | undefined = $state();
    let planStopDialog: PlanStopDialog | undefined = $state(undefined);
    let planStopId: string = $state('');
    let audioPlaybackSpeed: AudioPlaybackSpeed | undefined = $state();
</script>

<svelte:head>
    <!-- app.html (with cache-busting) -->
    <link rel="icon" href={faviconHref} />
    <link rel="apple-touch-icon" href={appleIconHref} />
    <link rel="manifest" href={manifestHref.url} />
    <!-- +layout.svelte -->
    <meta name="theme-color" content={$s?.['ui.bar.action']?.['background-color']} />
    <link rel="stylesheet" href={styles[`./${config.programType.toLowerCase()}-app.css`]} />
    {#if isSAB}
        {#if $refs.initialized}
            <link rel="stylesheet" href={styles[`./sab-bc-${$refs.collection}.css`]} />
        {/if}
    {/if}
    <link
        rel="stylesheet"
        href={overrideStyles[`./override-${config.programType.toLowerCase()}.css`]}
    />
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
