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
    import { themeColors, s, t, convertStyle, nextDocSet } from '$lib/data/stores';
    import CollectionList from './CollectionList.svelte';

    export let layoutOption = '';
    const dispatch = createEventDispatcher();

    const blank = {
        id: '',
        name: '--------',
        singlePane: false,
        description: ''
    };

    const allDocSets = config.bookCollections.map((ds) => ({
        id: ds.languageCode + '_' + ds.id,
        name: ds.collectionName,
        singlePane: ds.features['bc-allow-single-pane'],
        description: ds?.collectionDescription
    }));

    // An array of three selected docSets
    // ToDo: Assign these to default values provided by scripture app builder
    $nextDocSet.singlePane = allDocSets[0];
    $nextDocSet.sideBySide = allDocSets.slice(0, 2);
    $nextDocSet.verseByVerse = [...allDocSets.slice(0, 2), blank];

    function handleClick(opt: any, index: number) {
        const docSet = opt.detail.collection;
        console.log('Setting index', index, 'of', layoutOption);
        switch (layoutOption) {
            case 'Single Pane':
                $nextDocSet.singlePane = docSet;
                break;
            case 'Side By Side':
                $nextDocSet.sideBySide[index] = docSet;
                console.log('Length', $nextDocSet.sideBySide.length);
                for (let i = 0; i < $nextDocSet.sideBySide.length; i++) {
                    if (i === index) {
                        // if found self
                        continue;
                    } else if ($nextDocSet.sideBySide[i] === docSet) {
                        // if this is a repeat value of self
                        $nextDocSet.sideBySide[i] = allDocSets.filter(
                            (x) => $nextDocSet.sideBySide.includes(x) === false
                        )[0];
                    }
                }
                break;
            case 'Verse By Verse':
                $nextDocSet.verseByVerse[index] = docSet;
                console.log('Length', $nextDocSet.verseByVerse.length);
                for (let i = 0; i < $nextDocSet.verseByVerse.length; i++) {
                    if (i === index) {
                        // if found self
                        continue;
                    } else if ($nextDocSet.verseByVerse[i] === docSet) {
                        // if this is a repeat value of self
                        $nextDocSet.verseByVerse[i] = allDocSets.filter(
                            (x) => $nextDocSet.verseByVerse.includes(x) === false
                        )[0];
                    }
                }
                break;
        }
        (document.activeElement as HTMLElement).blur();
    }

    // function handleLeft(opt) {
    //     $nextDocSet.singlePane = opt.detail.collection;
    //     if ($nextDocSet.sideBySide[0] === $nextDocSet.singlePane) {
    //         $nextDocSet.sideBySide[0] = allDocSets.filter(
    //             (x) =>
    //                 x.id != $nextDocSet.singlePane.id &&
    //                 x.id != $nextDocSet.sideBySide[1].id
    //         )[0];
    //     }
    //     (document.activeElement as HTMLElement).blur();
    // }

    // function handleRight(opt) {
    //     $nextDocSet.sideBySide[0] = opt.detail.collection;
    //     if ($nextDocSet.singlePane === $nextDocSet.sideBySide[0]) {
    //         $nextDocSet.singlePane = allDocSets.filter(
    //             (x) =>
    //                 x.id != $nextDocSet.sideBySide[0].id &&
    //                 x.id != $nextDocSet.sideBySide[1].id
    //         )[0];
    //     }
    //     (document.activeElement as HTMLElement).blur();
    // }
</script>

<div>
    <!-- Single Pane -->
    {#if layoutOption === 'Single Pane'}
        <p class="py-2" style={convertStyle($s['ui.layouts.selector'])}>
            {$t['Layout_Single_Pane']}
        </p>
        <CollectionList
            docSets={allDocSets.filter((x) => x.singlePane === true)}
            nextDocSet={$nextDocSet.singlePane}
            on:menuaction={(event) => handleClick(event, 0)}
        />
        <!-- Side by Side -->
    {:else if layoutOption === 'Side By Side'}
        <p class="py-2" style:color={$themeColors['LayoutTitleColor']}>
            {$t['Layout_Two_Pane']}
        </p>
        <div class="flex flex-col">
            {#each $nextDocSet.sideBySide as collection, i}
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
                                nextDocSet={collection}
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
    {:else if layoutOption === 'Verse By Verse'}
        <p class="py-2" style:color={$themeColors['LayoutTitleColor']}>
            {$t['Layout_Interlinear']}
        </p>
        {#each $nextDocSet.verseByVerse as collection, i}
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
                            nextDocSet={collection}
                            on:menuaction={(event) => handleClick(event, i)}
                        />
                    </svelte:fragment>
                </Dropdown>
            </div>
        {/each}
    {/if}
</div>
