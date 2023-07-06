<script lang="ts">
    import Sidebar from '$lib/components/Sidebar.svelte';
    import {
        s,
        refs,
        theme,
        modal,
        MODAL_COLLECTION,
        MODAL_TEXT_APPERANCE
    } from '$lib/data/stores';
    import { base } from '$app/paths';
    import '$lib/app.css';
    import TextAppearanceSelector from '$lib/components/TextAppearanceSelector.svelte';
    import CollectionSelector from '$lib/components/CollectionSelector.svelte';

    $: $modal, showModal();

    function showModal() {
        if ($modal.length > 0) {
            $modal.forEach((modalType) => {
                switch (modalType) {
                    case MODAL_COLLECTION:
                        collectionSelector.showModal();
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
    let navBarHeight = '4rem';
</script>

<svelte:head>
    <meta name="theme-color" content={$s['ui.bar.action']['background-color']} />
    <link rel="stylesheet" href="{base}/styles/sab-app.css" />
    <link rel="stylesheet" href="{base}/styles/sab-bc-{$refs.collection}.css" />
    <link rel="stylesheet" href="{base}/override-sab.css" />
</svelte:head>

<div>
    <!--Div containing the popup modals triggered by the navBar buttons and SideBar entries -->

    <!-- Text Appearance Options Menu -->
    <TextAppearanceSelector bind:this={textAppearanceSelector} vertOffset={navBarHeight} />

    <!-- Collection Selector Menu -->
    <CollectionSelector bind:this={collectionSelector} vertOffset={navBarHeight} />
</div>

<Sidebar on:showModal={showModal}>
    <div id="container" data-color-theme={$theme} style="height:100vh;height:100dvh;">
        <slot {navBarHeight} />
    </div>
</Sidebar>
