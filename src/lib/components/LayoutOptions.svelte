<!--
@component
Displays the three different layout option menus.
-->
<script lang="ts">
    import { scriptureConfig } from '$assets/config';
    import { Layout, modal, ModalType, s, selectedLayouts, t, themeColors } from '$lib/data/stores';
    import { DropdownIcon } from '$lib/icons';
    import CollectionList from './CollectionList.svelte';

    const illustrations = import.meta.glob('./*', {
        import: 'default',
        eager: true,
        query: '?url',
        base: '/src/gen-assets/illustrations'
    }) as Record<string, string>;

    let { layoutOption, menuaction, showTitle = true } = $props();

    const allDocSets =
        scriptureConfig.bookCollections?.map((ds) => ({
            id: ds.languageCode + '_' + ds.id,
            name: ds.collectionName,
            singlePane: (ds?.features['bc-allow-single-pane'] ??
                ds?.features['bc-layout-allow-single-pane']) as boolean,
            description: ds?.collectionDescription,
            image: ds?.collectionImage
        })) ?? [];

    function handleClick(opt: any, index: number) {
        const docSet = opt.collection;
        switch (layoutOption) {
            case Layout.Single:
                $selectedLayouts.singlePane = docSet;
                break;
            case Layout.Two:
                if ($selectedLayouts.sideBySide) {
                    $selectedLayouts.sideBySide[index] = docSet;
                    for (let i = 0; i < $selectedLayouts.sideBySide.length; i++) {
                        if (i === index) {
                            // if found self
                            continue;
                        } else if ($selectedLayouts.sideBySide[i].id === docSet.id) {
                            // if this is a repeat value of self
                            $selectedLayouts.sideBySide[i] = allDocSets.filter(
                                (x) => $selectedLayouts.sideBySide?.includes(x) === false
                            )[0];
                        }
                    }
                }
                break;
            case Layout.VerseByVerse:
                if ($selectedLayouts.verseByVerse) {
                    $selectedLayouts.verseByVerse[index] = docSet;
                    for (let i = 0; i < $selectedLayouts.verseByVerse.length; i++) {
                        if (i === index) {
                            // if found self
                            continue;
                        } else if ($selectedLayouts.verseByVerse[i].id === docSet.id) {
                            // if this is a repeat value of self
                            $selectedLayouts.verseByVerse[i] = allDocSets.filter(
                                (x) => $selectedLayouts.verseByVerse?.includes(x) === false
                            )[0];
                        }
                    }
                }
                break;
        }
        menuaction({
            collection: opt
        });
        (document.activeElement as HTMLElement).blur();
        // TODO: when implementing Layout.TWO, do something for Dropdown.close instead of blur??
    }
</script>

<div>
    <!-- Single Pane -->
    {#if layoutOption === Layout.Single}
        {#if showTitle}
            <p class="py-2 font-bold" style:color={$themeColors['LayoutTitleColor']}>
                {$t['Layout_Single_Pane']}
            </p>
        {/if}
        <CollectionList
            docSets={allDocSets.filter((x) => x.singlePane === true)}
            selectedLayouts={$selectedLayouts.singlePane}
            menuaction={(event) => handleClick(event, 0)}
        />
        <!-- Two Pane -->
    {:else if layoutOption === Layout.Two}
        {#if showTitle}
            <p class="py-2 font-bold" style:color={$themeColors['LayoutTitleColor']}>
                {$t['Layout_Two_Pane']}
            </p>
        {/if}
        {#each $selectedLayouts.sideBySide as collection, i}
            <div class="px-3 layout-subtitle">
                {i + 1}
            </div>
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <div
                class="flex justify-between layout-item-block rounded-none cursor-pointer"
                onclick={() => {
                    modal.open(ModalType.Collection, {
                        type: 'double-pane',
                        showBlank: false,
                        number: i
                    });
                }}
            >
                {#if collection.image}
                    <div class="layout-image-block self-start">
                        <!-- svelte-ignore a11y_missing_attribute -->
                        <img class="layout-image" src={illustrations['./' + collection.image]} />
                    </div>
                {/if}
                <div class="layout-text-block">
                    <div class="layout-item-name">
                        {collection.name}
                    </div>
                    {#if collection.description}
                        <div class="layout-item-description">
                            {collection.description}
                        </div>
                    {/if}
                </div>
                <div class="px-3">
                    <DropdownIcon color={$s?.['ui.layouts.selector'].color} />
                </div>
            </div>
        {/each}
        <!-- Verse By Verse -->
    {:else if layoutOption === Layout.VerseByVerse}
        {#if showTitle}
            <p class="py-2 font-bold" style:color={$themeColors['LayoutTitleColor']}>
                {$t['Layout_Interlinear']}
            </p>
        {/if}
        {#each $selectedLayouts.verseByVerse as collection, i}
            <div class="px-3 layout-subtitle">
                {i + 1}
            </div>
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <!-- svelte-ignore a11y_no_static_element_interactions -->
            <div
                class="flex justify-between layout-item-block rounded-none cursor-pointer"
                onclick={() => {
                    modal.open(ModalType.Collection, {
                        type: 'verse-by-verse',
                        showBlank: i === 2,
                        number: i
                    });
                }}
            >
                {#if collection.image}
                    <div class="layout-image-block self-start">
                        <!-- svelte-ignore a11y_missing_attribute -->
                        <img class="layout-image" src={illustrations['./' + collection.image]} />
                    </div>
                {/if}
                <div class="layout-text-block">
                    <div class="layout-item-name">
                        {collection.name}
                    </div>
                    {#if collection.description}
                        <div class="layout-item-description">
                            {collection.description}
                        </div>
                    {/if}
                </div>
                <div class="px-3">
                    <DropdownIcon color={$s?.['ui.layouts.selector'].color} />
                </div>
            </div>
        {/each}
    {/if}
</div>
