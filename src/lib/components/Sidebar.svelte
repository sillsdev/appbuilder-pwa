<!--
@component
The sidebar/drawer.
-->
<script>
    import {
        BibleIcon,
        AccountIcon,
        SearchIcon,
        HistoryIcon,
        BookmarkIcon,
        NoteIcon,
        HighlightIcon,
        ShareIcon,
        SettingsIcon,
        TextAppearanceIcon,
        AboutIcon
    } from '$lib/icons';
    import config from '$lib/data/config';
    import { beforeNavigate } from '$app/navigation';
    import { firebaseConfig } from '$lib/data/firebase-config';
    import { t, language, languageDefault, languages } from '$lib/data/stores';
    const drawerId = 'sidebar';
    const closeDrawer = () => {
        document.activeElement.blur();
    };
    beforeNavigate(closeDrawer);

    const menuItems = config?.menuItems;
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
    $: console.log('LANGUAGES:', languages);
    $: console.log('LANGUAGE DEFAULT:', languageDefault);
    $: console.log('LANGUAGE:', $language);
</script>

<div class="dy-drawer dy-drawer-mobile">
    <input id={drawerId} type="checkbox" class="dy-drawer-toggle" />
    <div class="dy-drawer-content flex flex-col bg-gray-200">
        <!-- Page content here -->
        <slot />
    </div>
    <div class="dy-drawer-side">
        <label for={drawerId} class="dy-drawer-overlay" />
        <ul class="dy-menu p-1 overflow-y-auto w-3/4 sm:w-80 bg-base-100 text-base-content">
            <!-- Sidebar content here -->
            <a class="fill" href="/">
                <picture>
                    <source srcset="images/nav_drawer@2x.png 2x" />
                    <img src="images/nav_drawer.png" alt="Drawer Header" style="width:auto;" />
                </picture>
            </a>
            {#if showAccount}
                <li><a href="/account"><AccountIcon />{$t['Account_Page_Title']}</a></li>
                <div class="dy-divider m-1" />
            {/if}
            {#if showSearch}
                <li><a href="/search"><SearchIcon />{$t['Menu_Search']}</a></li>
                <div class="dy-divider m-1" />
            {/if}
            {#if showHistory}
                <li><a href="/history"><HistoryIcon />{$t['Menu_History']}</a></li>
            {/if}
            {#if showBookmarks}
                <li><a href="/bookmarks"><BookmarkIcon />{$t['Annotation_Bookmarks']}</a></li>
            {/if}
            {#if showNotes}
                <li><a href="/notes"><NoteIcon />{$t['Annotation_Notes']}</a></li>
            {/if}
            {#if showHighlights}
                <li><a href="/highlights"><HighlightIcon />{$t['Annotation_Highlights']}</a></li>
            {/if}
            {#if showHistory || showBookmarks || showNotes || showHighlights}
                <div class="dy-divider m-1" />
            {/if}
            {#if showShare}
                <li><a href="/share"><ShareIcon />{$t['Menu_Share_App']}</a></li>
                <div class="dy-divider m-1" />
            {/if}
            <li><a href="/settings"><SettingsIcon />{$t['Menu_Settings']}</a></li>
            <!-- svelte-ignore a11y-missing-attribute -->
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <li>
                <a on:click={closeDrawer}><TextAppearanceIcon />{$t['Menu_Text_Appearance']}</a>
            </li>
            <div class="dy-divider m-1" />
            {#if menuItems}
                {#each menuItems as item}
                    <li>
                        <a href={item.link['default']} target="_blank" rel="noreferrer">
                            <picture>
                                <source
                                    srcset="icons/menu-items/{item.images[1]
                                        .file} 2x, icons/menu-items/{item.images[2].file} 3x"
                                />
                                <img
                                    src="icons/menu-items/{item.images[0].file}"
                                    height="24"
                                    width="24"
                                    alt={item.title[$language] || item.title[languageDefault]}
                                />
                            </picture>{item.title[$language] || item.title[languageDefault]}
                        </a>
                    </li>
                {/each}
            {/if}
            <li><a href="/about"><AboutIcon />{$t['Menu_About']}</a></li>
        </ul>
    </div>
</div>

<style>
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
