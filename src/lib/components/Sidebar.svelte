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
                <li><a href="/account"><AccountIcon />My Account</a></li>
                <div class="dy-divider m-1" />
            {/if}
            {#if showSearch}
                <li><a href="/search"><SearchIcon />Search</a></li>
                <div class="dy-divider m-1" />
            {/if}
            {#if showHistory}
                <li><a href="/history"><HistoryIcon />History</a></li>
            {/if}
            {#if showBookmarks}
                <li><a href="/bookmarks"><BookmarkIcon />Bookmarks</a></li>
            {/if}
            {#if showNotes}
                <li><a href="/notes"><NoteIcon />Notes</a></li>
            {/if}
            {#if showHighlights}
                <li><a href="/highlights"><HighlightIcon />Highlights</a></li>
            {/if}
            {#if showHistory || showBookmarks || showNotes || showHighlights}
                <div class="dy-divider m-1" />
            {/if}
            {#if showShare}
                <li><a href="/share"><ShareIcon />Share App</a></li>
                <div class="dy-divider m-1" />
            {/if}
            <li><a href="/settings"><SettingsIcon />Settings</a></li>
            <!-- svelte-ignore a11y-missing-attribute -->
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <li><a on:click={closeDrawer}><TextAppearanceIcon />Text Appearance</a></li>
            <div class="dy-divider m-1" />
            <!--TODO update based on language-->
            {#if menuItems}
                {#each menuItems as item}
                    <li>
                        <a href={item.link['default']}>
                            <picture>
                                <source
                                    srcset="icons/menu-items/{item.images[1]
                                        .file} 2x, icons/menu-items/{item.images[2].file} 3x"
                                />
                                <img
                                    src="icons/menu-items/{item.images[0].file}"
                                    height="20"
                                    width="20"
                                    alt={item.title['en']}
                                />
                            </picture>{item.title['en']}
                        </a>
                    </li>
                {/each}
            {/if}
            <li><a href="/about"><AboutIcon />About</a></li>
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
