<script lang="ts">
    import { goto } from '$app/navigation';
    import { resolve } from '$app/paths';
    import { scriptureConfig } from '$assets/config';
    import LayoutOptions from '$lib/components/LayoutOptions.svelte';
    import Navbar from '$lib/components/Navbar.svelte';
    import TabsMenu from '$lib/components/TabsMenu.svelte';
    import {
        actionBarColor,
        layout,
        Layout,
        monoIconColor,
        refs,
        selectedLayouts,
        t,
        testLayouts
    } from '$lib/data/stores';
    import { CheckIcon, SideBySideIcon, SinglePaneIcon, VerseByVerseIcon } from '$lib/icons';

    const matchingDocSets =
        scriptureConfig.bookCollections
            ?.map((ds) => ({
                id: ds.languageCode + '_' + ds.id,
                name: ds.collectionName,
                singlePane: (ds?.features['bc-allow-single-pane'] ??
                    ds?.features['bc-layout-allow-single-pane']) as boolean,
                description: ds?.collectionDescription,
                image: ds?.collectionImage
            }))
            .filter((x) => x.id === $refs.docSet) ?? [];

    if (matchingDocSets[0]) {
        $selectedLayouts.singlePane = matchingDocSets[0];
    }

    let tabMenuActive = $state(Layout.Single);

    // values of selectedLayouts before user makes changes
    const restoreDocSets = JSON.stringify($selectedLayouts);

    // ToDo: If showSinglePane false, provide first availible visible option instead
    const showSinglePane = !!scriptureConfig.layouts?.find((x) => x.mode === Layout.Single)
        ?.enabled;
    const showSideBySide =
        testLayouts || !!scriptureConfig.layouts?.find((x) => x.mode === Layout.Two)?.enabled; //Not yet implemented
    const showVerseByVerse =
        testLayouts ||
        !!scriptureConfig.layouts?.find((x) => x.mode === Layout.VerseByVerse)?.enabled; //Not yet implemented

    // In the native app, if only showing the single pane, then don't show the title.
    // If showing one of the other two, then show the title.
    const showTitle = showSideBySide || showVerseByVerse;
    function getSelectedLayout() {
        const collections = selectedLayouts.collections(tabMenuActive);
        return {
            mode: tabMenuActive,
            primaryDocSet: collections?.[0]?.id ?? '',
            auxDocSets: collections
                ?.slice(1)
                .map((x) => x?.id)
                .filter((x) => !!x) as string[] | undefined
        };
    }
    function handleOk() {
        const selectedLayout = getSelectedLayout();
        $refs.docSet = selectedLayout.primaryDocSet;
        $layout = selectedLayout;
        goto(resolve(`/`));
    }

    function backNavigation() {
        $selectedLayouts = JSON.parse(restoreDocSets);
        goto(resolve(`/`));
    }
</script>

{#snippet layoutOptions(layoutOption: Layout, menuaction: App.MenuActionHandler)}
    <LayoutOptions {layoutOption} {menuaction} {showTitle} />
{/snippet}
<!--The background color of the icons should be the DialogBackgroundColor color.-->
{#snippet icon(mode: Layout)}
    {#if mode === Layout.Single}
        <SinglePaneIcon color={$monoIconColor} />
    {:else if mode === Layout.Two}
        <SideBySideIcon color={$monoIconColor} />
    {:else}
        <VerseByVerseIcon color={$monoIconColor} />
    {/if}
{/snippet}
<div class="flex flex-col h-screen">
    <div class="navbar h-16">
        <Navbar {backNavigation}>
            {#snippet center()}
                <label for="sidebar">
                    <div class="btn btn-ghost normal-case text-xl">{$t['Layout_Screen_Title']}</div>
                </label>
            {/snippet}
            {#snippet end()}
                <div>
                    <button class="dy-btn-sm dy-btn-ghost" onclick={handleOk}>
                        <CheckIcon color={$actionBarColor} />
                    </button>
                </div>
            {/snippet}
        </Navbar>
    </div>
    <div class="overflow-y-auto p-2 max-w-screen-md mx-auto w-full">
        <TabsMenu
            bind:active={tabMenuActive}
            options={{
                [Layout.Single]: {
                    tab: { icon },
                    snippet: layoutOptions,
                    visible: showSinglePane
                },
                [Layout.Two]: {
                    tab: { icon },
                    snippet: layoutOptions,
                    visible: showSideBySide
                },
                [Layout.VerseByVerse]: {
                    tab: { icon },
                    snippet: layoutOptions,
                    visible: showVerseByVerse
                }
            }}
            scroll={false}
            styleType="ui.dialog"
        />
    </div>
</div>
