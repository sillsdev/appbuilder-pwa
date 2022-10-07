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
    import { globalConfig } from '$lib/data/stores';
    import { beforeNavigate } from '$app/navigation';
    export let drawerId = 'drawer';
    const closeDrawer = () => {
        document.activeElement.blur();
    };
    beforeNavigate(closeDrawer);
</script>

<div class="dy-drawer dy-drawer-mobile">
    <input id={drawerId} type="checkbox" class="dy-drawer-toggle" />
    <div class="dy-drawer-content bg-gray-200">
        <!-- Page content here -->
        <slot />
    </div>
    <div class="dy-drawer-side">
        <label for={drawerId} class="dy-drawer-overlay" />
        <ul class="dy-menu p-1 overflow-y-auto w-3/4 sm:w-80 bg-base-100 text-base-content">
            <!-- Sidebar content here -->
            <li><a href="/"><BibleIcon /><span>{$globalConfig.name}</span></a></li>
            <li><a href="/search"><SearchIcon />Search</a></li>
            <div class="dy-divider m-1" />
            <li><a href="/history"><HistoryIcon />History</a></li>
            <li><a href="/bookmarks"><BookmarkIcon />Bookmarks</a></li>
            <li><a href="/notes"><NoteIcon />Notes</a></li>
            <li><a href="/highlights"><HighlightIcon />Highlights</a></li>
            <div class="dy-divider m-1" />
            <li><a href="#share-modal" class="btn"><ShareIcon />Share App</a></li>
            <div class="dy-divider m-1" />
            <li><a href="/settings"><SettingsIcon />Settings</a></li>
            <!-- svelte-ignore a11y-missing-attribute -->
            <li><a on:click={closeDrawer}><TextAppearanceIcon />Text Appearance</a></li>
            <div class="dy-divider m-1" />
            <li><a href="/about"><AboutIcon />About</a></li>
        </ul>
    </div>
</div>

<style>
    a {
        text-decoration: none;
    }
</style>
