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
    import { audioActive, refs, globalConfig } from '$lib/data/stores';
    import { onDestroy } from 'svelte';

    let nextRef;
    const unsub = refs.subscribe((v) => {
        nextRef = v;
    }, 'next');

    /**reference to book selector so code can use TabsMenu.setActive*/
    let bookSelector;
    /**reference to chapter selector so code can use TabsMenu.setActive*/
    let chapterSelector;

    /**
     * Pushes reference changes to refs['next']. Pushes final change to default reference.
     */
    function navigateReference(e) {
        if (e.detail.tab === 'Book') {
            bookSelector.setActive('Chapter');
            refs.set({ book: e.detail.text }, 'next');
        } else if (e.detail.tab === 'Chapter') {
            bookSelector.setActive('Verse');
            chapterSelector.setActive('Verse');
            refs.set({ chapter: e.detail.text }, 'next');
        } else if (e.detail.tab === 'Verse') {
            bookSelector.setActive('Book');
            chapterSelector.setActive('Chapter');
            $refs = { book: nextRef.book, chapter: nextRef.chapter };
            // force closes active dropdown elements
            document.activeElement.blur();
        }
    }

    $: actionBarColor = $globalConfig.themes
        .find((x) => x.name === 'Normal') // TODO: change to fetch the current theme
        .colorSets.find((x) => x.type === 'main').colors['PrimaryColor'];

    /**list of books in current docSet*/
    $: books = catalog.find((d) => d.id === nextRef.docSet).documents;
    /**list of chapters in current book*/
    $: chapters = books.find((d) => d.bookCode === nextRef.book).versesByChapters;
    onDestroy(unsub);
</script>

<!--
  see Dynamic values in https://v2.tailwindcss.com/docs/just-in-time-mode#arbitrary-value-support
-->

<div class="dy-navbar text-white fill-white stroke-white" style:background-color={actionBarColor}>
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
                        // Should remove?
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
        <!-- Chapter Selector -->
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
    </div>
    <div class="dy-navbar-end fill-base-content">
        <!-- Mute/Volume Button -->
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
        <!-- Search Button -->
        <a href="/search" class="dy-btn dy-btn-ghost dy-btn-circle">
            <SearchIcon />
        </a>
        <!-- Text Appearance Options Menu -->
        <Dropdown>
            <svelte:fragment slot="label">
                <TextAppearanceIcon />
            </svelte:fragment>
            <!-- TODO: implement text appearance options -->
            <svelte:fragment slot="content">
                <TabsMenu />
            </svelte:fragment>
        </Dropdown>
    </div>
</div>
