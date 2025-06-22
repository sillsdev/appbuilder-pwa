<!--
@component
The sidebar/drawer.
-->
<script>
    import { base } from '$app/paths';
    import config from '$lib/data/config';
    import contents from '$lib/data/contents';
    import {
        direction,
        language,
        languageDefault,
        modal,
        MODAL_COLLECTION,
        MODAL_TEXT_APPEARANCE,
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
    import { gotoRoute } from '$lib/navigate';

    let { children } = $props();

    const drawerId = 'sidebar';
    let menuToggle = $state(false);

    function closeDrawer() {
        menuToggle = false;
    }
    function closeOnEscape(event) {
        event.key === 'Escape' && closeDrawer();
    }

    const menuItems = config?.menuItems;
    const showLayouts =
        config.mainFeatures['layout-config-change-nav-drawer-menu'] &&
        config.bookCollections.length > 1;
    const showContents = contents.screens?.length > 0;
    const showSearch = config.mainFeatures['search'];
    const showHistory = config.mainFeatures['history'];
    const showSettings = userPreferenceSettings.length;
    const showBookmarks = config.mainFeatures['annotation-bookmarks'];
    const showNotes = config.mainFeatures['annotation-notes'];
    const showHighlights = config.mainFeatures['annotation-highlights'];
    const showPlans = config.plans?.plans.length > 0;
    const showShare =
        config.mainFeatures['share-app-link'] ||
        config.mainFeatures['share-download-app-link'] ||
        config.mainFeatures['share-apk-file'] ||
        config.mainFeatures['share-apple-app-link'];
    const showAccount =
        config.firebase.features['firebase-database'] && config.mainFeatures['user-accounts'];

    function imageSrcSet(base, images) {
        const baseSize = Number(images[0].width);
        return images
            .map((image) => {
                const size = Number(image.width);
                const multiplier = size / baseSize;
                const multiplierString =
                    multiplier === 1
                        ? ''
                        : ' ' +
                          (multiplier % 1 === 0 ? multiplier.toFixed(0) : multiplier.toFixed(1)) +
                          'x';
                return `${base}/${image.file}${multiplierString}`;
            })
            .join(', ');
    }
    async function goToSearch() {
        if (config.programType === 'DAB') {
            await gotoRoute(`/lexicon/search`);
        } else {
            await gotoRoute(`/search/${$refs.collection}`);
        }
    }

    const textColor = $derived($s['ui.drawer.item.text']['color']);
    const iconColor = $derived(
        $s['ui.drawer.item.icon']?.['color'] || $themeColors['DrawItemIconColor']
    );
    const contentBackgroundColor = $derived($s['ui.background']['background-color']);
    const drawerBackgroundColor = $derived($s['ui.drawer']['background-color']);
</script>

<svelte:window onkeydown={closeOnEscape} />

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
        >
            <!-- Sidebar content here -->
            <a class="fill" href="{base}/">
                <picture>
                    <source srcset="{base}/images/nav_drawer@2x.png 2x" />
                    <img
                        src="{base}/images/nav_drawer.png"
                        alt="Drawer Header"
                        style="width:auto;"
                    />
                </picture>
            </a>
            {#if showAccount}
                <li>
                    <button
                        class="btn"
                        style:color={textColor}
                        onclick={() => gotoRoute('/account')}
                    >
                        <AccountIcon color={iconColor} />{$t['Account_Page_Title']}
                    </button>
                </li>
            {/if}
            {#if showContents}
                <li>
                    <button
                        class="btn"
                        style:color={textColor}
                        onclick={() => gotoRoute('/contents/1')}
                    >
                        <HomeIcon color={iconColor} />{$t['Menu_Contents']}
                    </button>
                </li>
            {/if}
            {#if showSearch}
                <li>
                    <button class="btn" style:color={textColor} onclick={goToSearch}>
                        <SearchIcon color={iconColor} />{$t['Menu_Search']}
                    </button>
                </li>
            {/if}
            {#if showLayouts}
                <li>
                    <!-- svelte-ignore a11y_missing_attribute -->
                    <button
                        style:color={textColor}
                        class="btn"
                        onclick={() => modal.open(MODAL_COLLECTION)}
                    >
                        <BibleIcon color={iconColor} />{$t['Menu_Layout']}
                    </button>
                </li>
            {/if}
            {#if showAccount || showSearch || showLayouts}
                <div class="dy-divider m-1"></div>
            {/if}
            {#if showHistory}
                <li>
                    <button
                        class="btn"
                        style:color={textColor}
                        onclick={() => gotoRoute('/history')}
                    >
                        <HistoryIcon color={iconColor} />{$t['Menu_History']}
                    </button>
                </li>
            {/if}
            {#if showBookmarks}
                <li>
                    <button
                        class="btn"
                        style:color={textColor}
                        onclick={() => gotoRoute('/bookmarks')}
                    >
                        <BookmarkIcon color={iconColor} />{$t['Annotation_Bookmarks']}
                    </button>
                </li>
            {/if}
            {#if showNotes}
                <li>
                    <button class="btn" style:color={textColor} onclick={() => gotoRoute('/notes')}>
                        <NoteIcon color={iconColor} />{$t['Annotation_Notes']}
                    </button>
                </li>
            {/if}
            {#if showHighlights}
                <li>
                    <button
                        class="btn"
                        style:color={textColor}
                        onclick={() => gotoRoute('/highlights')}
                    >
                        <HighlightIcon color={iconColor} />{$t['Annotation_Highlights']}
                    </button>
                </li>
            {/if}
            {#if showHistory || showBookmarks || showNotes || showHighlights}
                <div class="dy-divider m-1"></div>
            {/if}
            {#if showShare}
                <li>
                    <button class="btn" style:color={textColor} onclick={() => gotoRoute('/share')}>
                        <ShareIcon color={iconColor} />{$t['Menu_Share_App']}
                    </button>
                </li>
                <div class="dy-divider m-1"></div>
            {/if}
            {#if showPlans}
                <li>
                    <button class="btn" style:color={textColor} onclick={() => gotoRoute('/plans')}>
                        <CalendarMonthIcon color={iconColor} />{$t['Menu_Plans']}
                    </button>
                </li>
            {/if}
            {#if showSettings}
                <li>
                    <button
                        class="btn"
                        style:color={textColor}
                        onclick={() => gotoRoute('/settings')}
                    >
                        <SettingsIcon color={iconColor} />{$t['Menu_Settings']}
                    </button>
                </li>
            {/if}
            <!-- svelte-ignore a11y_missing_attribute -->
            <li>
                <button
                    style:color={textColor}
                    class="btn"
                    onclick={() => modal.open(MODAL_TEXT_APPEARANCE)}
                >
                    <TextAppearanceIcon color={iconColor} />{$t['Menu_Text_Appearance']}
                </button>
            </li>
            <div class="dy-divider m-1"></div>
            {#if menuItems}
                {#each menuItems as item}
                    <li>
                        <a
                            href={item.link['default']}
                            style:color={textColor}
                            target="_blank"
                            rel="noreferrer"
                        >
                            <picture class:invert={$theme === 'Dark'}>
                                {#if item.images.length > 1}
                                    <source
                                        srcset={imageSrcSet(
                                            `${base}/icons/menu-items`,
                                            item.images
                                        )}
                                    />
                                {/if}
                                <img
                                    src="{base}/icons/menu-items/{item.images[0].file}"
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
                <button class="btn" style:color={textColor} onclick={() => gotoRoute('/about')}>
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
