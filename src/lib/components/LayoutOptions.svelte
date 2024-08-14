<!--
@component
Displays the three different layout option menus.  
-->
<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import Dropdown from './Dropdown.svelte';
    import CollectionList from './CollectionList.svelte';
    import { DropdownIcon } from '$lib/icons';
    import config from '$lib/data/config';
    import { themeColors, s, t, convertStyle, selectedLayouts } from '$lib/data/stores';
    import { LAYOUT_SINGLE, LAYOUT_TWO, LAYOUT_VERSE_BY_VERSE } from '$lib/data/stores';

    const dispatch = createEventDispatcher();

    export let layoutOption;

    const blank = {
        id: '',
        name: '--------',
        singlePane: false,
        description: ''
    };

    const allDocSets = config.bookCollections.map((ds) => ({
        id: ds.languageCode + '_' + ds.id,
        name: ds.collectionName,
        singlePane:
            ds?.features['bc-allow-single-pane'] ?? ds?.features['bc-layout-allow-single-pane'],
        description: ds?.collectionDescription,
        image: ds?.collectionImage
    }));

    function handleClick(opt: any, index: number) {
        const docSet = opt.detail.collection;
        switch (layoutOption) {
            case LAYOUT_SINGLE:
                $selectedLayouts.singlePane = docSet;
                break;
            case LAYOUT_TWO:
                $selectedLayouts.sideBySide[index] = docSet;
                for (let i = 0; i < $selectedLayouts.sideBySide.length; i++) {
                    if (i === index) {
                        // if found self
                        continue;
                    } else if ($selectedLayouts.sideBySide[i].id === docSet.id) {
                        // if this is a repeat value of self
                        $selectedLayouts.sideBySide[i] = allDocSets.filter(
                            (x) => $selectedLayouts.sideBySide.includes(x) === false
                        )[0];
                    }
                }
                break;
            case LAYOUT_VERSE_BY_VERSE:
                $selectedLayouts.verseByVerse[index] = docSet;
                for (let i = 0; i < $selectedLayouts.verseByVerse.length; i++) {
                    if (i === index) {
                        // if found self
                        continue;
                    } else if ($selectedLayouts.verseByVerse[i].id === docSet.id) {
                        // if this is a repeat value of self
                        $selectedLayouts.verseByVerse[i] = allDocSets.filter(
                            (x) => $selectedLayouts.verseByVerse.includes(x) === false
                        )[0];
                    }
                }
                break;
        }
        dispatch('menuaction', {
            collection: opt
        });
        (document.activeElement as HTMLElement).blur();
        // TODO: when implementing LAYOUT_TWO, do something for Dropdown.close instead of blur??
    }
</script>

<div>
    <!-- Single Pane -->
    {#if layoutOption === LAYOUT_SINGLE}
        <p class="py-2" style:color={$themeColors['LayoutTitleColor']}>
            {$t['Layout_Single_Pane']}
        </p>
        <CollectionList
            docSets={allDocSets.filter((x) => x.singlePane === true)}
            selectedLayouts={$selectedLayouts.singlePane}
            on:menuaction={(event) => handleClick(event, 0)}
        />
        <!-- Two Pane -->
    {:else if layoutOption === LAYOUT_TWO}
        <p class="py-2" style:color={$themeColors['LayoutTitleColor']}>
            {$t['Layout_Two_Pane']}
        </p>
        <div class="flex flex-col">
            {#each $selectedLayouts.sideBySide as collection, i}
                <div>
                    <Dropdown>
                        <svelte:fragment slot="label">
                            <div class="px-3" style={convertStyle($s['ui.layouts.number'])}>
                                {i + 1}.
                            </div>
                            <div class="dy-relative font-normal normal-case text-left">
                                <div style={convertStyle($s['ui.layouts.title'])}>
                                    {collection.name}
                                </div>
                                {#if collection.description}
                                    <div
                                        class="text-sm"
                                        style={convertStyle($s['ui.layouts.selector'])}
                                    >
                                        {collection.description}
                                    </div>
                                {/if}
                            </div>
                            <div class="px-3">
                                <DropdownIcon color={$s['ui.layouts.selector'].color} />
                            </div>
                        </svelte:fragment>
                        <svelte:fragment slot="content">
                            <CollectionList
                                docSets={allDocSets}
                                selectedLayouts={collection}
                                on:menuaction={(event) => {
                                    handleClick(event, i);
                                }}
                            />
                        </svelte:fragment>
                    </Dropdown>
                </div>
            {/each}
        </div>
        <!-- Verse By Verse -->
    {:else if layoutOption === LAYOUT_VERSE_BY_VERSE}
        <p class="py-2" style:color={$themeColors['LayoutTitleColor']}>
            {$t['Layout_Interlinear']}
        </p>
        {#each $selectedLayouts.verseByVerse as collection, i}
            <div>
                <Dropdown>
                    <svelte:fragment slot="label">
                        <div class="px-3" style={convertStyle($s['ui.layouts.number'])}>
                            {i + 1}.
                        </div>
                        <div class="dy-relative font-normal normal-case text-left">
                            <div style={convertStyle($s['ui.layouts.title'])}>
                                {collection.name}
                            </div>
                            {#if collection.description}
                                <div
                                    class="text-sm"
                                    style={convertStyle($s['ui.layouts.selector'])}
                                >
                                    {collection.description}
                                </div>
                            {/if}
                        </div>
                        <div class="px-3">
                            <DropdownIcon color={$s['ui.layouts.selector'].color} />
                        </div>
                    </svelte:fragment>
                    <svelte:fragment slot="content">
                        <CollectionList
                            docSets={i === 2 ? [blank, ...allDocSets] : allDocSets}
                            selectedLayouts={collection}
                            on:menuaction={(event) => handleClick(event, i)}
                        />
                    </svelte:fragment>
                </Dropdown>
            </div>
        {/each}
    {/if}
</div>
