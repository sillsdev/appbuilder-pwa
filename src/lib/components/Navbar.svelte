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
    import { playingAudio, refs } from '$lib/data/stores';
    import { onDestroy } from 'svelte';

    let nextRef;
    const unsub = refs.subscribe((v) => { nextRef = v; }, 'next');

    let bookSelector;
    let chapterSelector;

    function navigateReference(e) {
        console.log(e.detail);
        if(e.detail.tab === 'Book') {
            bookSelector.setActive('Chapter');
            refs.set({ book: e.detail.text }, 'next');
        }
        else if(e.detail.tab === 'Chapter') {
            bookSelector.setActive('Verse');
            chapterSelector.setActive('Verse');
            refs.set({ chapter: e.detail.text }, 'next');
        }
        else if(e.detail.tab === 'Verse') {
            bookSelector.setActive('Book');
            chapterSelector.setActive('Chapter');
            $refs = { book: nextRef.book, chapter: nextRef.chapter };
            document.activeElement.blur();
        }
    }

    const docSets = catalog.map((ds) => ds.id);
    let ds = docSets[0];
    $: books = catalog.find((d) => d.id === ds).documents;
    $: b = books[0].bookCode;
    $: chapters = books.find((d) => d.bookCode === b).versesByChapters;
    $: c = Object.keys(chapters)[0];

    onDestroy(unsub);
</script>

<div class="dy-navbar bg-primary h-full">
    <div class="dy-navbar-start">
        <slot name="drawer-button" />
        <!-- Translation/View Selector -->
        <Dropdown>
            <svelte:fragment slot="label">{ds} <DropdownIcon /></svelte:fragment>
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
                <TabsMenu bind:this={bookSelector}
                    options={{
                        Book: {
                            component: SelectGrid,
                            props: { options: books.map((b) => b.bookCode) /*bookAbbreviations*/ }
                        },
                        Chapter: {
                            component: SelectGrid,
                            props: { options: Object.keys(chapters) }
                        },
                        Verse: {
                            component: SelectGrid,
                            props: { options: Object.keys(chapters[c]) }
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
                <TabsMenu bind:this={chapterSelector}
                    options={{
                        Chapter: {
                            component: SelectGrid,
                            props: { options: Object.keys(chapters) }
                        },
                        Verse: {
                            component: SelectGrid,
                            props: { options: Object.keys(chapters[c]) }
                        }
                    }}
                    active="Chapter"
                    on:menuaction={navigateReference}
                />
            </svelte:fragment>
        </Dropdown>
    </div>
    <div class="dy-navbar-end fill-base-content">
        <button class="dy-btn dy-btn-ghost dy-btn-circle">
            <label class="dy-swap">
                <!-- this hidden checkbox controls the state -->
                <input type="checkbox" bind:checked={$playingAudio} />

                <!-- volume on icon -->
                <AudioIcon.Volume _class="dy-swap-on fill-black-100" />

                <!-- volume off icon -->
                <AudioIcon.Mute _class="dy-swap-off fill-black-100" />
            </label>
        </button>
        <a href="/search" class="dy-btn dy-btn-ghost dy-btn-circle">
            <SearchIcon />
        </a>
        <Dropdown>
            <svelte:fragment slot="label">
                <TextAppearanceIcon />
            </svelte:fragment>
        </Dropdown>
    </div>
</div>
