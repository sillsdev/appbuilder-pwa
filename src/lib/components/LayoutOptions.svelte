<!--
@component
Displays the three different layout options.  
TODO:
- functionality...
-->
<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import Dropdown from './Dropdown.svelte';
    import { DropdownIcon } from '$lib/icons';
    import config from '$lib/data/config';
    import { themeColors, s, t, convertStyle } from '$lib/data/stores';
    import CollectionList from './CollectionList.svelte';

    export let layoutOption = '';
    const dispatch = createEventDispatcher();

    $: allDocSets = config.bookCollections.map((ds) => ({
        id: ds.languageCode + '_' + ds.id,
        name: ds.collectionName,
        singlePane: ds.features['bc-allow-single-pane'],
        description: ds?.collectionDescription
    }));

    function handleClick(opt) {
        switch (layoutOption) {
            case 'Single Pane':
                selectedDocSets[0] = opt.detail.collection;
                dispatch('menuaction', {
                    text: selectedDocSets[0].id
                });
            //case 'Side By Side':
        }
    }

    function handleLeft(opt) {
        selectedDocSets.singlePane = opt.detail.collection;
        if (selectedDocSets.sideBySide[0] === selectedDocSets.singlePane) {
            selectedDocSets.sideBySide[0] = allDocSets.filter(
                (x) => x.id != selectedDocSets.singlePane.id && x.id != selectedDocSets.sideBySide[1].id
            )[0];
        }
        (document.activeElement as HTMLElement).blur();
    }

    function handleRight(opt) {
        selectedDocSets.sideBySide[0] = opt.detail.collection;
        if (selectedDocSets.singlePane === selectedDocSets.sideBySide[0]) {
            selectedDocSets.singlePane = allDocSets.filter(
                (x) => x.id != selectedDocSets.sideBySide[0].id && x.id != selectedDocSets.sideBySide[1].id
            )[0];
        }
        (document.activeElement as HTMLElement).blur();
    }
</script>

<div>
    <!-- Single Pane -->
    {#if layoutOption === 'Single Pane'}
        <p class="py-2" style={convertStyle($s['ui.layouts.selector'])}>
            {$t['Layout_Single_Pane']}
        </p>
        <CollectionList
            docSets={allDocSets.filter((x) => x.singlePane === true)}
            nextDocSet={selectedDocSets.singlePane}
            on:menuaction={(event) => handleClick(event, selectedDocSets.singlePane)}
        />
        <!-- Side by Side -->
    {:else if layoutOption === 'Side By Side'}
        <p class="py-2" style:color={$themeColors['LayoutTitleColor']}>
            {$t['Layout_Two_Pane']}
        </p>
        <div class="flex flex-col">
            {#each selectedDocSets.sideBySide as collection, i}
            <div>
                <Dropdown>
                    <svelte:fragment slot="label">
                        <div class="px-3" style={convertStyle($s['ui.layouts.number'])}>{i+1}.</div>
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
                            nextDocSet={collection}
                            on:menuaction={(event) => handleClick(event, collection)}
                        />
                    </svelte:fragment>
                </Dropdown>
            </div>
            {/each}
        </div>

        <!-- Verse By Verse -->
    {:else if layoutOption === 'Verse By Verse'}
        <p class="py-2" style:color={$themeColors['LayoutTitleColor']}>
            {$t['Layout_Interlinear']}
        </p>
        <div class="flex flex-col">
            <div>
                <Dropdown>
                    <svelte:fragment slot="label">
                        <div class="px-3" style={convertStyle($s['ui.layouts.number'])}>1.</div>
                        <div class="dy-relative font-normal normal-case text-left">
                            <div style={convertStyle($s['ui.layouts.title'])}>
                                {selectedDocSets.singlePane.name}
                            </div>
                            {#if selectedDocSets.singlePane.description}
                                <div
                                    class="text-sm"
                                    style={convertStyle($s['ui.layouts.selector'])}
                                >
                                    {selectedDocSets.singlePane.description}
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
                            nextDocSet={selectedDocSets.singlePane}
                            on:menuaction={handleLeft}
                        />
                    </svelte:fragment>
                </Dropdown>
            </div>
            <div>
                <!-- svelte-ignore a11y-click-events-have-key-events -->
                <Dropdown>
                    <svelte:fragment slot="label">
                        <div class="px-3" style={convertStyle($s['ui.layouts.number'])}>2.</div>
                        <div
                            class="dy-relative font-normal normal-case text-left"
                            style={$s['ui.layouts.selector']}
                        >
                            <div style={convertStyle($s['ui.layouts.title'])}>
                                {selectedDocSets.sideBySide[0].name}
                            </div>
                            {#if selectedDocSets.sideBySide[0].description}
                                <div
                                    class="text-sm"
                                    style={convertStyle($s['ui.layouts.selector'])}
                                >
                                    {selectedDocSets.sideBySide[0].description}
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
                            nextDocSet={selectedDocSets.sideBySide[0]}
                            on:menuaction={handleRight}
                        />
                    </svelte:fragment>
                </Dropdown>
            </div>
            <div>
                <!-- svelte-ignore a11y-click-events-have-key-events -->
                <Dropdown>
                    <svelte:fragment slot="label">
                        <div class="px-3" style={convertStyle($s['ui.layouts.number'])}>3.</div>
                        <div
                            class="dy-relative font-normal normal-case text-left"
                            style={$s['ui.layouts.selector']}
                        >
                            <div style={convertStyle($s['ui.layouts.title'])}>
                                {selectedDocSets.sideBySide[1].name}
                            </div>
                            {#if selectedDocSets.sideBySide[1].description}
                                <div
                                    class="text-sm"
                                    style={convertStyle($s['ui.layouts.selector'])}
                                >
                                    {selectedDocSets.sideBySide[1].description}
                                </div>
                            {/if}
                        </div>
                        <div class="px-3">
                            <DropdownIcon color={$s['ui.layouts.selector'].color} />
                        </div>
                    </svelte:fragment>
                    <svelte:fragment slot="content">
                        <CollectionList
                            docSets={[selectedDocSets.sideBySide[1], ...allDocSets]}
                            nextDocSet={selectedDocSets.sideBySide[1]}
                            on:menuaction={handleLeft}
                        />
                    </svelte:fragment>
                </Dropdown>
            </div>
        </div>
    {/if}
</div>
