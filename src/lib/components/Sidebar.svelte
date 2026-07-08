<!--
@component
The sidebar/drawer.
-->
<script lang="ts">
    import { goto } from '$app/navigation';
    import config, { scriptureConfig } from '$assets/config';
    import contents from '$assets/contents';
    import nav_drawer_image from '$assets/images/nav_drawer.png';
    import nav_drawer_2x from '$assets/images/nav_drawer@2x.png';
    import type { MenuItemConfig } from '$config';
    import {
        direction,
        fontChoices,
        language,
        languageDefault,
        modal,
        ModalType,
        refs,
        s,
        showDesktopSidebar,
        t,
        theme,
        themeColors,
        userPreferenceSettings
    } from '$lib/data/stores';
    import {
        AboutIcon,
        AccountIcon,
        BibleIcon,
        BookmarkIcon,
        CalendarMonthIcon,
        HighlightIcon,
        HistoryIcon,
        HomeIcon,
        NoteIcon,
        SearchIcon,
        SettingsIcon,
        ShareIcon,
        TextAppearanceIcon
    } from '$lib/icons';
    import { isDAB, isSAB } from '$lib/scripts/configUtils';
    import { resolve } from '$lib/utils/paths';
    import { showTextAppearance } from './TextAppearanceSelector.svelte';

    const menuIcons = import.meta.glob('./*', {
        import: 'default',
        eager: true,
        query: '?url',
        base: '/src/gen-assets/icons/menu-items'
    }) as Record<string, string>;

    let { children } = $props();

    const drawerId = 'sidebar';
    let menuToggle = $state(false);

    function closeDrawer() {
        menuToggle = false;
    }
    function closeOnEscape(key: string) {
        if (key === 'Escape') {
            closeDrawer();
        }
    }

    const menuItems = config?.menuItems;
    const showLayouts =
        !!config.mainFeatures['layout-config-change-nav-drawer-menu'] &&
        (scriptureConfig.bookCollections?.length ?? 0) > 1;
    const showContents = !!contents.screens?.length;
    const showSearch = !!config.mainFeatures['search'];
    const showHistory = !!config.mainFeatures['history'];
    const showSettings = !!userPreferenceSettings.length;
    const showBookmarks = !!config.mainFeatures['annotation-bookmarks'];
    const showNotes = !!config.mainFeatures['annotation-notes'];
    const showHighlights = !!config.mainFeatures['annotation-highlights'];
    const showPlans = scriptureConfig.plans?.plans.length;
    const showShare = !!(
        config.mainFeatures['share-app-link'] ||
        config.mainFeatures['share-download-app-link'] ||
        config.mainFeatures['share-apk-file'] ||
        config.mainFeatures['share-apple-app-link']
    );
    const showAccount = !!(
        config.firebase?.features['firebase-database'] && config.mainFeatures['user-accounts']
    );
    const fontRelativeSize = $derived(
        config.interfaceLanguages?.writingSystems[$language]?.fontRelativeSize
    );
    const fontSize = $derived(fontRelativeSize ? fontRelativeSize : '100');

    function imageSrcSet(images: MenuItemConfig['images']) {
        const baseSize = Number(images?.[0]?.width);
        return images
            ?.map((image) => {
                const size = Number(image.width);
                const multiplier = size / baseSize;
                const multiplierString =
                    multiplier === 1
                        ? ''
                        : ' ' + multiplier.toFixed(multiplier % 1 === 0 ? 0 : 1) + 'x';
                const url = menuIcons[`./${image.file}`];
                return url ? `${url}${multiplierString}` : '';
            })
            .filter((i) => !!i)
            .join(', ');
    }

    async function goToSearch() {
        if (isDAB(config)) {
            await goto(resolve(`/lexicon/search`));
        } else {
            await goto(resolve(`/search/${$refs.collection}`));
        }
    }

    const textColor = $derived($s?.['ui.drawer.item.text']['color']);
    const iconColor = $derived(
        $s?.['ui.drawer.item.icon']?.['color'] || $themeColors['DrawItemIconColor']
    );
    const contentBackgroundColor = $derived($s?.['ui.background']['background-color']);
    const drawerBackgroundColor = $derived($s?.['ui.drawer']['background-color']);
</script>

<svelte:window onkeydown={(e) => closeOnEscape(e.key)} />

<div class="dy-drawer" class:dy-drawer-mobile={$showDesktopSidebar} dir={$direction}>
    <input id={drawerId} type="checkbox" class="dy-drawer-toggle" bind:checked={menuToggle} />
    <div class="dy-drawer-content flex flex-col" style:background-color={contentBackgroundColor}>
        <!-- Page content here -->
        {@render children()}
    </div>
    <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
    <div class="dy-drawer-side" onclick={closeDrawer} onkeydown={closeDrawer} role="navigation">
        <div class="dy-drawer-overlay"></div>
        <ul
            class="dy-menu p-1 w-3/4 sm:w-80 text-base-content min-h-full"
            style:background-color={drawerBackgroundColor}
            style:direction={$direction}
            style:font-size="{fontSize}%"
        >
            <!-- Sidebar content here -->
            <a class="fill" href={resolve('/')}>
                <picture>
                    <source srcset="{nav_drawer_2x} 2x" />
                    <img src={nav_drawer_image} alt="Drawer Header" style="width:auto;" />
                </picture>
            </a>
            {#if showAccount}
                <li>
                    <button style:color={textColor} onclick={() => goto(resolve('/account'))}>
                        <AccountIcon color={iconColor} />{$t['Account_Page_Title']}
                    </button>
                </li>
            {/if}
            <li>
                <button
                    style:color={textColor}
                    onclick={() =>
                        showContents
                            ? goto(resolve('/contents/1'))
                            : isSAB(config)
                              ? goto(resolve('/text'))
                              : goto(resolve('/lexicon'))}
                >
                    <HomeIcon color={iconColor} />{$t[showContents ? 'Menu_Contents' : 'Menu_Home']}
                </button>
            </li>
            {#if showSearch}
                <li>
                    <button style:color={textColor} onclick={goToSearch}>
                        <SearchIcon color={iconColor} />{$t['Menu_Search']}
                    </button>
                </li>
            {/if}
            {#if showLayouts}
                <li>
                    <!-- svelte-ignore a11y_missing_attribute -->
                    <button style:color={textColor} onclick={() => goto(resolve(`/layout`))}>
                        <BibleIcon color={iconColor} />{$t['Menu_Layout']}
                    </button>
                </li>
            {/if}
            {#if showAccount || showSearch || showLayouts}
                <div class="dy-divider m-1"></div>
            {/if}
            {#if showHistory}
                <li>
                    <button style:color={textColor} onclick={() => goto(resolve('/history'))}>
                        <HistoryIcon color={iconColor} />{$t['Menu_History']}
                    </button>
                </li>
            {/if}
            {#if showBookmarks}
                <li>
                    <button style:color={textColor} onclick={() => goto(resolve('/bookmarks'))}>
                        <BookmarkIcon color={iconColor} />{$t['Annotation_Bookmarks']}
                    </button>
                </li>
            {/if}
            {#if showNotes}
                <li>
                    <button style:color={textColor} onclick={() => goto(resolve('/notes'))}>
                        <NoteIcon color={iconColor} />{$t['Annotation_Notes']}
                    </button>
                </li>
            {/if}
            {#if showHighlights}
                <li>
                    <button style:color={textColor} onclick={() => goto(resolve('/highlights'))}>
                        <HighlightIcon color={iconColor} />{$t['Annotation_Highlights']}
                    </button>
                </li>
            {/if}
            {#if showHistory || showBookmarks || showNotes || showHighlights}
                <div class="dy-divider m-1"></div>
            {/if}
            {#if showShare}
                <li>
                    <button style:color={textColor} onclick={() => goto(resolve('/share'))}>
                        <ShareIcon color={iconColor} />{$t['Menu_Share_App']}
                    </button>
                </li>
                <div class="dy-divider m-1"></div>
            {/if}
            {#if showPlans}
                <li>
                    <button style:color={textColor} onclick={() => goto(resolve('/plans'))}>
                        <CalendarMonthIcon color={iconColor} />{$t['Menu_Plans']}
                    </button>
                </li>
            {/if}
            {#if showSettings}
                <li>
                    <button style:color={textColor} onclick={() => goto(resolve('/settings'))}>
                        <SettingsIcon color={iconColor} />{$t['Menu_Settings']}
                    </button>
                </li>
            {/if}
            {#if showTextAppearance($fontChoices)}
                <!-- svelte-ignore a11y_missing_attribute -->
                <li>
                    <button
                        style:color={textColor}
                        onclick={() => modal.open(ModalType.TextAppearance)}
                    >
                        <TextAppearanceIcon color={iconColor} />{$t['Menu_Text_Appearance']}
                    </button>
                </li>
            {/if}
            <div class="dy-divider m-1"></div>
            {#if menuItems}
                {#each menuItems as item}
                    <li>
                        <!-- eslint-disable svelte/no-navigation-without-resolve (this route should be external) -->
                        <a
                            href={item.link?.['default']}
                            style:color={textColor}
                            target="_blank"
                            rel="noreferrer"
                        >
                            <picture class:invert={$theme === 'Dark'}>
                                {#if (item.images?.length ?? 0) > 1}
                                    <source srcset={imageSrcSet(item.images)} />
                                {/if}
                                <img
                                    src={menuIcons[`./${item.images?.[0]?.file}`] ?? ''}
                                    height="24"
                                    width="24"
                                    alt={item.title[$language] || item.title[languageDefault]}
                                />
                            </picture>{item.title[$language] || item.title[languageDefault]}
                        </a>
                    </li>
                {/each}
            {/if}
            <li>
                <button style:color={textColor} onclick={() => goto(resolve('/about'))}>
                    <AboutIcon color={iconColor} />{$t['Menu_About']}
                </button>
            </li>
        </ul>
    </div>
</div>

<style>
    .dy-menu li a {
        text-decoration: none;
    }
    .fill {
        display: flex;
        justify-content: center;
        align-items: center;
        overflow: hidden;
    }
    .fill img {
        flex-shrink: 0;
        min-width: 100%;
        min-height: 100%;
    }
</style>
