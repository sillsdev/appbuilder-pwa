<!--
@component
The navbar component.
-->
<script>
    import Dropdown from './Dropdown.svelte';
    import SelectGrid from './SelectGrid.svelte';
    import TabsMenu from './TabsMenu.svelte';
    import LayoutOptions from './LayoutOptions.svelte';
    import {
        AudioIcon,
        SearchIcon,
        DropdownIcon,
        TextAppearanceIcon,
        SinglePaneIcon,
        SideBySideIcon,
        VerseByVerseIcon
    } from '$lib/icons';
    import { catalog } from '$lib/data/catalog';
    import { globalConfig } from '$lib/data/stores';
    import { audioActive, refs } from '$lib/data/stores';
    import { onDestroy } from 'svelte';

    let nextRef;
    const unsub = refs.subscribe((v) => {
        nextRef = v;
    }, 'next');

    /**reference to book selector so code can use TabsMenu.setActive*/
    let bookSelector;
    /**reference to chapter selector so code can use TabsMenu.setActive*/
    let chapterSelector;

    // Show chapter number on app bar
    let showChapterNum = $globalConfig.mainFeatures['show-chapter-number-on-app-bar'];
    // Show chapter menu when the user interacts with the chapter number on the app bar
    let showChapterMenu = $globalConfig.mainFeatures['show-chapter-selector'];
    // Show chapter menu after selecting a book from the book menu
    let showChapterMenuAfterBook = $globalConfig.mainFeatures['show-chapter-selector-after-book'];
    // Show verse menu after selecting a chapter from the chapter menu
    let showVerseMenuAfterChapter = $globalConfig.mainFeatures['show-verse-selector'];

    /**
     * Pushes reference changes to refs['next']. Pushes final change to default reference.
     */
    function navigateReference(e) {
        if (e.detail.tab === 'Book') {
            refs.set({ book: e.detail.text }, 'next');
            if (showChapterMenuAfterBook) {
                bookSelector.setActive('Chapter');
            } else {
                $refs = { book: nextRef.book, chapter: 1 };
                document.activeElement.blur();
                bookSelector.setActive('Book');
            }
        } else if (e.detail.tab === 'Chapter') {
            refs.set({ chapter: e.detail.text }, 'next');
            if (showVerseMenuAfterChapter) {
                bookSelector.setActive('Verse');
                chapterSelector.setActive('Verse');
            } else {
                $refs = { book: nextRef.book, chapter: nextRef.chapter };
                document.activeElement.blur();
                bookSelector.setActive('Book');
                chapterSelector.setActive('Chapter');
            }
        } else if (e.detail.tab === 'Verse') {
            $refs = { book: nextRef.book, chapter: nextRef.chapter };
            // force closes active dropdown elements
            document.activeElement.blur();
            bookSelector.setActive('Book');
            chapterSelector.setActive('Chapter');
        }
    }

    /**list of books in current docSet*/
    $: books = catalog.find((d) => d.id === nextRef.docSet).documents;
    /**list of chapters in current book*/
    $: chapters = books.find((d) => d.bookCode === nextRef.book).versesByChapters;
    onDestroy(unsub);
</script>

<div class="dy-navbar bg-primary h-full">
    <div class="dy-navbar-start">
        <label
            for="sidebar"
            class="dy-btn dy-btn-ghost p-1 dy-drawer-button {$viewMode === 'Side By Side'
                ? ''
                : 'lg:hidden'}"
        >
            <HamburgerIcon />
        </label>
        <slot name="left-buttons" />
    </div>
    <div class="dy-navbar-center">
        <slot name="center" />
    </div>
    <div class="dy-navbar-end fill-base-content">
        <slot name="right-buttons" />
    </div>
</div>
