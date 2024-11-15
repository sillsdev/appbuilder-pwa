<script lang="ts">
    import { base } from '$app/paths';
    import '$lib/app.css';
    import FontSelector from '$lib/components/FontSelector.svelte';
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
        MODAL_TEXT_APPERANCE,
        NAVBAR_HEIGHT,
        refs,
        s,
        theme
    } from '$lib/data/stores';

    const isSAB = config.programType == 'SAB';

    // Delay import components only used in SAB
    let NoteDialog;
    let CollectionSelector;
    if (isSAB) {
        import('$lib/components/NoteDialog.svelte').then((module) => {
            NoteDialog = module;
        });
        import('$lib/components/CollectionSelector.svelte').then((module) => {
            CollectionSelector = module;
        });
    }

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
                    case MODAL_TEXT_APPERANCE:
                        textAppearanceSelector.options = data;
                        textAppearanceSelector.showModal();
                        break;
                    case MODAL_FONT:
                        fontSelector.showModal();
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
            {#if NoteDialog}
                <!-- Add Note Menu -->
                <svelte:component this={NoteDialog} bind:this={noteDialog} />
            {/if}

            {#if CollectionSelector}
                <!-- Collection Selector Menu -->
                <svelte:component
                    this={CollectionSelector}
                    bind:this={collectionSelector}
                    vertOffset={NAVBAR_HEIGHT}
                />
            {/if}
        {/if}

        <!-- Text Appearance Options Menu -->
        <TextAppearanceSelector bind:this={textAppearanceSelector} vertOffset={NAVBAR_HEIGHT} />

        <FontSelector bind:this={fontSelector} />
    </div>

    <Sidebar on:showModal={showModal}>
        <div
            id="container"
            data-color-theme={$theme}
            style="height:100vh;height:100dvh;"
            style:direction={$direction}
        >
            <slot />
        </div>
    </Sidebar>
{/if}
