<!--
@component
The sidebar/drawer.
-->
<script>
    import {
        BibleIcon,
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
    import ScrolledContent from '$lib/components/ScrolledContent.svelte';
    import { globalConfig } from '$lib/data/stores';
    import { beforeNavigate } from '$app/navigation';
    let drawerId = 'sidebar';
    const closeDrawer = () => {
        document.activeElement.blur();
    };
    beforeNavigate(closeDrawer);

    let menuItems = $globalConfig?.menuItems;
    let showSearch = $globalConfig.mainFeatures['search'];
    let showHistory = $globalConfig.mainFeatures['history'];
    let showBookmarks = $globalConfig.mainFeatures['annotation-bookmarks'];
    let showNotes = $globalConfig.mainFeatures['annotation-notes'];
    let showHighlights = $globalConfig.mainFeatures['annotation-highlights'];
    let showShare =
        $globalConfig.mainFeatures['share-app-link'] ||
        $globalConfig.mainFeatures['share-download-app-link'] ||
        $globalConfig.mainFeatures['share-apk-file'] ||
        $globalConfig.mainFeatures['share-apple-app-link'];
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
            <li><a href="/"><BibleIcon /><span>{$globalConfig.name}</span></a></li>
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
            <!--TODO Update -->
            {#if menuItems}
                {#each menuItems as item}
                    <li>
                        <a href={item.link['default']}>
                          <picture>
                            <source srcset="icons/{item.images[1].file} 2x, icons/{item.images[2].file} 3x" />
                              <img src="icons/{item.images[0].file}" height="20" width="20" alt={item.title['en']}/>
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
</style>
