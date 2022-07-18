<script lang="ts">
    import Dropdown from './Dropdown.svelte';
    import SelectGrid from './SelectGrid.svelte';
    import TabsMenu from './TabsMenu.svelte';
    import {
        MuteIcon,
        SearchIcon,
        DropdownIcon,
        TextAppearanceIcon,
        SinglePaneIcon,
        SideBySideIcon,
        VerseByVerseIcon
    } from '$lib/icons';
    import { activeBook, globalConfig } from '$lib/data/stores';
    export let book = '';
    export let chapter = '';
    // let books = [
    //     "Genesis","Exodus","Leviticus","Numbers","Deuteronomy","Joshua",
    //     "Judges","Ruth","1 Samuel","2 Samuel","1 Kings","2 Kings",
    //     "1 Chronicles","2 Chronicles","Ezra","Nehemiah","Esther","Job",
    //     "Psalm","Proverbs","Ecclesiastes","Song of Songs","Isaiah","Jeremiah",
    //     "Lamentations","Ezekiel","Daniel","Hosea","Joel","Amos",
    //     "Obadiah","Jonah","Micah","Nahum","Habakkuk","Zephaniah",
    //     "Haggai","Zechariah","Malachi","Matthew","Mark","Luke",
    //     "John","Acts","Romans","1 Corinthians","2 Corinthians","Galatians",
    //     "Ephesians","Philippians","Colossians","1 Thessalonians","2 Thessalonians","1 Timothy",
    //     "2 Timothy","Titus","Philemon","Hebrews","James","1 Peter",
    //     "2 Peter","1 John","2 John","3 John","Jude","Revelation",
    // ];
    // let chapters = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21];

    // TODO: Number of verses is in the book files, data-drive this once the proskomma store is created
    let verses = [
        1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25,
        26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48,
        49, 50, 51
    ];

    // FIXME: Doesn't account for missing chapters. Shoud parse chaptersN for included chapters
    $: chapters = Array.from(Array($activeBook?.chapters), (_, i) => i + 1); // Creates an array [1, 2, 3] from an input 3
    $: bookAbbreviations = $globalConfig.bookCollections[0 /*currentCollection*/].books.map(
        (book) => (book.abbreviation || book.id).substring(0, 4)
    );
    function navigateReference(e: CustomEvent) {
        console.log(
            `Navigated to ${e.detail.tab} ${e.detail.text}. New reference: ${book} ${chapter}:_`
        );
        // TODO: after proskomma store is finished, update the scripture view to the new reference
    }
</script>

<div class="dy-navbar bg-primary">
    <div class="dy-navbar-start">
        <slot name="drawer-button" />
        <!-- Book Selector -->
        <Dropdown>
            <svelte:fragment slot="label">
                {book}
                <DropdownIcon />
            </svelte:fragment>
            <svelte:fragment slot="content">
                <TabsMenu
                    options={{
                        Book: { component: SelectGrid, props: { options: bookAbbreviations } },
                        Chapter: { component: SelectGrid, props: { options: chapters } },
                        Verse: { component: SelectGrid, props: { options: verses } }
                    }}
                    active="Book"
                    on:menuaction={navigateReference}
                />
            </svelte:fragment>
        </Dropdown>
        <!-- Chapter Selector -->
        <Dropdown>
            <svelte:fragment slot="label">
                {chapter}
                <DropdownIcon />
            </svelte:fragment>
            <svelte:fragment slot="content">
                <TabsMenu
                    options={{
                        Chapter: { component: SelectGrid, props: { options: chapters } },
                        Verse: { component: SelectGrid, props: { options: verses } }
                    }}
                    active="Chapter"
                />
            </svelte:fragment>
        </Dropdown>
    </div>
    <div class="dy-navbar-end fill-base-content">
        <button class="dy-btn dy-btn-ghost dy-btn-circle">
            <MuteIcon />
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
