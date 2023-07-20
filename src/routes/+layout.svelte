<script lang="ts">
    import Sidebar from '$lib/components/Sidebar.svelte';
    import {
        direction,
        s,
        refs,
        theme,
        modal,
        MODAL_COLLECTION,
        MODAL_NOTE,
        MODAL_TEXT_APPERANCE,
        NAVBAR_HEIGHT
    } from '$lib/data/stores';
    import { base } from '$app/paths';
    import '$lib/app.css';
    import TextAppearanceSelector from '$lib/components/TextAppearanceSelector.svelte';
    import CollectionSelector from '$lib/components/CollectionSelector.svelte';
    import NoteMenu from '$lib/components/NoteMenu.svelte';

    $: $modal, showModal();

    function showModal() {
        if ($modal.length > 0) {
            $modal.forEach((modalType) => {
                switch (modalType) {
                    case MODAL_COLLECTION:
                        collectionSelector.showModal();
                        break;
                    case MODAL_NOTE:
                        noteMenu.showModal();
                        break;
                    case MODAL_TEXT_APPERANCE:
                        textAppearanceSelector.showModal();
                        break;
                }
            });
            modal.clear();
        }
    }

    let textAppearanceSelector;
    let collectionSelector;
    let noteMenu;
</script>

<svelte:head>
    <meta name="theme-color" content={$s['ui.bar.action']['background-color']} />
    <link rel="stylesheet" href="{base}/styles/sab-app.css" />
    <link rel="stylesheet" href="{base}/styles/sab-bc-{$refs.collection}.css" />
    <link rel="stylesheet" href="{base}/override-sab.css" />
</svelte:head>

<div>
    <!--Div containing the popup modals triggered by the navBar buttons and SideBar entries -->

    <!-- Add Note Menu -->
    <NoteMenu bind:this={noteMenu} />
    <!-- Text Appearance Options Menu -->
    <TextAppearanceSelector bind:this={textAppearanceSelector} vertOffset={NAVBAR_HEIGHT} />

    <!-- Collection Selector Menu -->
    <CollectionSelector bind:this={collectionSelector} vertOffset={NAVBAR_HEIGHT} />
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
