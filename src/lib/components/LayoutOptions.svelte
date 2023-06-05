<!--
@component
Displays the three different layout options.  
TODO:
- functionality...
-->
<script lang="ts">
    import { onDestroy, createEventDispatcher } from 'svelte';
    import Dropdown from './Dropdown.svelte';
    import { DropdownIcon } from '$lib/icons';
    import config from '$lib/data/config';
    import { refs, themeColors, s, t, convertStyle } from '$lib/data/stores';
    import CollectionList from './CollectionList.svelte';

    export let layoutOption = '';
    const dispatch = createEventDispatcher();

    let nextDocSet;

    let allDocSets = config.bookCollections.map((ds) => ({
        id: ds.languageCode + '_' + ds.id,
        name: ds.collectionName,
        singlePane: ds.features['bc-allow-single-pane'],
        description: ds?.collectionDescription
    }));

    function handleClick(opt) {
        refs.set({ docSet: opt, book: $refs.book, chapter: $refs.chapter });
        nextDocSet = opt;
        dispatch('menuaction', {
            text: opt.id
        });
    }

    function handleLeft(opt) {
        leftSide = opt.detail.collection;
        if (rightSide === leftSide) {
            rightSide = allDocSets.filter((x) => x.id != leftSide.id)[0];
        }
        (document.activeElement as HTMLElement).blur();
    }

    function handleRight(opt) {
        rightSide = opt.detail.collection;
        if (leftSide === rightSide) {
            leftSide = allDocSets.filter((x) => x.id != rightSide.id)[0];
        }
        (document.activeElement as HTMLElement).blur();
    }
</script>

<div>
    <!-- Single Pane -->
    {#if layoutOption === 'Single Pane'}
        <p style:color={$themeColors['LayoutTitleColor']}>
            <strong>{$t['Layout_Single_Pane']}</strong>
        </p>
        <CollectionList
            docSets={allDocSets.filter((x) => x.singlePane === true)}
            {nextDocSet}
            on:menuaction={handleSinglePane}
        />
        <!-- Side by Side -->
    {:else if layoutOption === 'Side By Side'}
        <p style:color={$themeColors['LayoutTitleColor']}>
            <strong>{$t['Layout_Two_Pane']}</strong>
        </p>
        <ul class="dy-menu-compact mx-auto">
            <!-- svelte-ignore a11y-missing-attribute -->
            <li>
                <!-- svelte-ignore a11y-click-events-have-key-events -->
                <Dropdown>
                    <svelte:fragment slot="label">
                        <div class="px-3">1.</div>
                        <div class="normal-case">{leftSide.name}</div>
                        <DropdownIcon />
                    </svelte:fragment>
                    <svelte:fragment slot="content">
                        <CollectionList
                            docSets={allDocSets}
                            nextDocSet={leftSide}
                            on:menuaction={handleLeft}
                        />
                    </svelte:fragment>
                </Dropdown>
            </li>
            <li>
                <!-- svelte-ignore a11y-click-events-have-key-events -->
                <Dropdown>
                    <svelte:fragment slot="label">
                        <div class="px-3">2.</div>
                        <div class="normal-case">{rightSide.name}</div>
                        <DropdownIcon />
                    </svelte:fragment>
                    <svelte:fragment slot="content">
                        <CollectionList
                            docSets={allDocSets}
                            nextDocSet={rightSide}
                            on:menuaction={handleRight}
                        />
                    </svelte:fragment>
                </Dropdown>
            </li>
        </ul>
        <!-- Verse By Verse -->
    {:else if layoutOption === 'Verse By Verse'}
        <p style:color={$themeColors['LayoutTitleColor']}>
            <strong>{$t['Layout_Interlinear']}</strong>
        </p>
        <ul class="dy-menu mx-auto" />
    {/if}
</div>
