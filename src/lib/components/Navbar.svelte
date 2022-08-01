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
    import { globalConfig, playingAudio } from '$lib/data/stores';

    function navigateReference(e) {
        console.log(e.detail);
        
    }

    const docSets = catalog.map((ds) => ds.id);
    let ds = docSets[0];
    $: books = catalog.find((d) => d.id === ds).documents;
    $: b = books[0].bookCode;
    $: chapters = books.find((d) => d.bookCode === b).versesByChapters;
    $: c = Object.keys(chapters)[0];
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
                {b}
                <DropdownIcon />
            </svelte:fragment>
            <svelte:fragment slot="content">
                <TabsMenu
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
                {c}
                <DropdownIcon />
            </svelte:fragment>
            <svelte:fragment slot="content">
                <TabsMenu
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
