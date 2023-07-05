<!--
@component
The sidebar/drawer.
-->
<script>
    import {
        AccountIcon,
        SearchIcon,
        BibleIcon,
        HistoryIcon,
        BookmarkIcon,
        NoteIcon,
        HighlightIcon,
        ShareIcon,
        SettingsIcon,
        TextAppearanceIcon,
        AboutIcon
    } from '$lib/icons';
    import { base } from '$app/paths';
    import config from '$lib/data/config';
    import { firebaseConfig } from '$lib/data/firebase-config';
    import {
        s,
        t,
        themeColors,
        language,
        languageDefault,
        showDesktopSidebar,
        direction
    } from '$lib/data/stores';
    const drawerId = 'sidebar';
    let menuToggle = false;

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
    const showSearch = config.mainFeatures['search'];
    const showHistory = config.mainFeatures['history'];
    const showBookmarks = config.mainFeatures['annotation-bookmarks'];
    const showNotes = config.mainFeatures['annotation-notes'];
    const showHighlights = config.mainFeatures['annotation-highlights'];
    const showShare =
        config.mainFeatures['share-app-link'] ||
        config.mainFeatures['share-download-app-link'] ||
        config.mainFeatures['share-apk-file'] ||
        config.mainFeatures['share-apple-app-link'];
    const showAccount = firebaseConfig && config.mainFeatures['user-accounts'];

    $: textColor = $s['ui.drawer.item.text']['color'];
    $: iconColor = $s['ui.drawer.item.icon']['color'];
    $: contentBackgroundColor = $s['ui.background']['background-color'];
    $: drawerBackgroundColor = $s['ui.drawer']['background-color'];
    $: contentTextColor = $themeColors['TextColor'];
</script>

<svelte:window on:keydown={closeOnEscape} />

<div
    class="dy-drawer"
    class:dy-drawer-mobile={$showDesktopSidebar}
    class:dy-drawer-end={$direction === 'rtl'}
>
    <input id={drawerId} type="checkbox" class="dy-drawer-toggle" bind:checked={menuToggle} />
    <div class="dy-drawer-content flex flex-col" style:background-color={contentBackgroundColor}>
        <!-- Page content here -->
        <slot />
    </div>
    <div class="dy-drawer-side" on:click={closeDrawer} on:keydown={closeDrawer}>
        <div class="dy-drawer-overlay" />
        <ul
            class="dy-menu p-1 w-3/4 sm:w-80 text-base-content"
            style:background-color={drawerBackgroundColor}
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
            {#if showLayouts}
                <li>
                    <!-- svelte-ignore a11y-missing-attribute -->
                    <button
                        style:color={textColor}
                        style:direction={$direction}
                        class="btn"
                        onclick="collectionSelector.showModal()"
                    >
                        <BibleIcon color={iconColor} />{$t['Menu_Layout']}
                    </button>
                </li>
                <div class="dy-divider m-1" />
            {/if}
            {#if showAccount}
                <li>
                    <a href="{base}/account" style:color={textColor} style:direction={$direction}>
                        <AccountIcon color={iconColor} />{$t['Account_Page_Title']}
                    </a>
                </li>
                <div class="dy-divider m-1" />
            {/if}
            {#if showSearch}
                <li>
                    <a href="{base}/search" style:color={textColor} style:direction={$direction}>
                        <SearchIcon color={iconColor} />{$t['Menu_Search']}
                    </a>
                </li>
                <div class="dy-divider m-1" />
            {/if}
            {#if showHistory}
                <li>
                    <a href="{base}/history" style:color={textColor} style:direction={$direction}>
                        <HistoryIcon color={iconColor} />{$t['Menu_History']}
                    </a>
                </li>
            {/if}
            {#if showBookmarks}
                <li>
                    <a href="{base}/bookmarks" style:color={textColor} style:direction={$direction}>
                        <BookmarkIcon color={iconColor} />{$t['Annotation_Bookmarks']}
                    </a>
                </li>
            {/if}
            {#if showNotes}
                <li>
                    <a href="{base}/notes" style:color={textColor} style:direction={$direction}>
                        <NoteIcon color={iconColor} />{$t['Annotation_Notes']}
                    </a>
                </li>
            {/if}
            {#if showHighlights}
                <li>
                    <a
                        href="{base}/highlights"
                        style:color={textColor}
                        style:direction={$direction}
                    >
                        <HighlightIcon color={iconColor} />{$t['Annotation_Highlights']}
                    </a>
                </li>
            {/if}
            {#if showHistory || showBookmarks || showNotes || showHighlights}
                <div class="dy-divider m-1" />
            {/if}
            {#if showShare}
                <li>
                    <a href="{base}/share" style:color={textColor} style:direction={$direction}>
                        <ShareIcon color={iconColor} />{$t['Menu_Share_App']}
                    </a>
                </li>
                <div class="dy-divider m-1" />
            {/if}
            <li>
                <a href="{base}/settings" style:color={textColor} style:direction={$direction}>
                    <SettingsIcon color={iconColor} />{$t['Menu_Settings']}
                </a>
            </li>
            <!-- svelte-ignore a11y-missing-attribute -->
            <li>
                <a style:color={textColor} style:direction={$direction}>
                    <TextAppearanceIcon color={iconColor} />{$t['Menu_Text_Appearance']}
                </a>
            </li>
            <div class="dy-divider m-1" />
            {#if menuItems}
                {#each menuItems as item}
                    <li>
                        <a
                            href={item.link['default']}
                            style:color={textColor}
                            target="_blank"
                            rel="noreferrer"
                            style:direction={$direction}
                        >
                            <picture>
                                <source
                                    srcset="{base}/icons/menu-items/{item.images[1]
                                        .file} 2x, {base}/icons/menu-items/{item.images[2].file} 3x"
                                />
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
                <a href="{base}/about" style:color={textColor} style:direction={$direction}>
                    <AboutIcon color={iconColor} />{$t['Menu_About']}
                </a>
            </li>
        </ul>
    </div>
</div>

<style>
    .dy-menu {
        position: absolute;
        top: 4rem;
        min-height: calc(100vh - 4rem);
        min-height: calc(100dvh - 4rem);
    }
    a {
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
