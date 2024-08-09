<script lang="ts">
    import catalog from '$lib/data/catalogData';
    import Sidebar from '$lib/components/Sidebar.svelte';
    import {
        analytics,
        direction,
        s,
        refs,
        theme,
        modal,
        MODAL_COLLECTION,
        MODAL_NOTE,
        MODAL_TEXT_APPERANCE,
        NAVBAR_HEIGHT,
        MODAL_FONT
    } from '$lib/data/stores';
    import { base } from '$app/paths';
    import '$lib/app.css';
    import TextAppearanceSelector from '$lib/components/TextAppearanceSelector.svelte';
    import CollectionSelector from '$lib/components/CollectionSelector.svelte';
    import NoteDialog from '$lib/components/NoteDialog.svelte';
    import FontSelector from '$lib/components/FontSelector.svelte';

    if (!$refs.initialized) {
        catalog.setFetch(fetch);
        // When this async function completes, $refs.intialized will be true.
        refs.init();
    }

    if (!$analytics.initialized) {
        analytics.init();
    }

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
    <meta name="theme-color" content={$s['ui.bar.action']['background-color']} />
    <link rel="stylesheet" href="{base}/styles/sab-app.css" />
    {#if $refs.initialized}
        <link rel="stylesheet" href="{base}/styles/sab-bc-{$refs.collection}.css" />
    {/if}
    <link rel="stylesheet" href="{base}/override-sab.css" />
</svelte:head>

{#if $refs.initialized}
    <div>
        <!--Div containing the popup modals triggered by the navBar buttons and SideBar entries -->

        <!-- Add Note Menu -->
        <NoteDialog bind:this={noteDialog} />

        <!-- Text Appearance Options Menu -->
        <TextAppearanceSelector bind:this={textAppearanceSelector} vertOffset={NAVBAR_HEIGHT} />

        <!-- Collection Selector Menu -->
        <CollectionSelector bind:this={collectionSelector} vertOffset={NAVBAR_HEIGHT} />

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
