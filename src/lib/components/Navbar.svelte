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
    import { audioActive, refs } from '$lib/data/stores';
    import { onDestroy } from 'svelte';
    import { globalConfig } from '$lib/data/stores';

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
        <slot name="drawer-button" />
        <!-- Translation/View Selector -->
        <Dropdown>
            <svelte:fragment slot="label">{nextRef.docSet} <DropdownIcon /></svelte:fragment>
            <svelte:fragment slot="content">
                <TabsMenu
                    options={{
                        'Single Pane': {
                            tab: { component: SinglePaneIcon },
                            component: LayoutOptions,
                            props: { layoutOption: 'Single Pane' }
                        },
                        'Side By Side': {
                            tab: { component: SideBySideIcon },
                            component: LayoutOptions,
                            props: { layoutOption: 'Side By Side' }
                        },
                        'Verse By Verse': {
                            tab: { component: VerseByVerseIcon },
                            component: LayoutOptions,
                            props: { layoutOption: 'Verse By Verse' }
                        }
                    }}
                    active="Single Pane"
                />
            </svelte:fragment>
        </Dropdown>
        <!-- Book Selector -->
        {#if $globalConfig.mainFeatures["book-select"] == "grid" || $globalConfig.mainFeatures["book-select"] =="list" }
            <Dropdown>
                <svelte:fragment slot="label">
                    {nextRef.book}
                    <DropdownIcon />
                </svelte:fragment>
                <svelte:fragment slot="content">
                    <TabsMenu
                        bind:this={bookSelector}
                        options={{
                            Book: {
                                component: SelectGrid,
                                /**
                                 * TODO:
                                 * - add book abbreviations to catalog to be used in UI instead of bookCode
                                 */
                                props: { options: books.map((b) => b.bookCode) /*bookAbbreviations*/ }
                            },
                            Chapter: {
                                component: SelectGrid,
                                props: { options: Object.keys(chapters) }
                            },
                            Verse: {
                                component: SelectGrid,
                                props: { options: Object.keys(chapters[nextRef.chapter]) }
                            }
                        }}
                        active="Book"
                        on:menuaction={navigateReference}
                    />
                </svelte:fragment>
            </Dropdown>
        {/if}
        <!-- Chapter Selector -->
        {#if $globalConfig.mainFeatures["show-chapter-numbers"]}
            <Dropdown>
                <svelte:fragment slot="label">
                    {nextRef.chapter}
                    <DropdownIcon />
                </svelte:fragment>
                <svelte:fragment slot="content">
                    <TabsMenu
                        bind:this={chapterSelector}
                        options={{
                            Chapter: {
                                component: SelectGrid,
                                props: { options: Object.keys(chapters) }
                            },
                            Verse: {
                                component: SelectGrid,
                                props: { options: Object.keys(chapters[nextRef.chapter]) }
                            }
                        }}
                        active="Chapter"
                        on:menuaction={navigateReference}
                    />
                </svelte:fragment>
            </Dropdown>
        {/if}
    </div>
    <div class="dy-navbar-end fill-base-content">
        <!-- Mute/Volume Button -->
        {#if $globalConfig.mainFeatures["audio-turn-on-at-startup"]} 
            <button class="dy-btn dy-btn-ghost dy-btn-circle">
                <label class="dy-swap">
                    <!-- this hidden checkbox controls the state -->
                    <input type="checkbox" bind:checked={$audioActive} />

                    <!-- volume on icon -->
                    <AudioIcon.Volume _class="dy-swap-on fill-black-100" />

                    <!-- volume off icon -->
                    <AudioIcon.Mute _class="dy-swap-off fill-black-100" />
                </label>
                
            </button>
        {/if}
        <!-- Search Button -->
        {#if $globalConfig.mainFeatures['search']} 
            <a href="/search" class="dy-btn dy-btn-ghost dy-btn-circle">
                <SearchIcon />
            </a>
        {/if}
        <!-- Text Appearance Options Menu -->
        {#if $globalConfig.mainFeatures["text-font-size-slider"] && $globalConfig.mainFeatures[ "text-line-height-slider"] }
            <Dropdown>
                <svelte:fragment slot="label">
                    <TextAppearanceIcon />
                </svelte:fragment>
                <!-- TODO: implement text appearance options -->
            </Dropdown>
        {/if}
    </div>
</div>
