<!--
@component
The navbar component.
-->
<script>
    import Dropdown from './Dropdown.svelte';
    import SelectGrid from './SelectGrid.svelte';
    import TabsMenu from './TabsMenu.svelte';
    import { refs, nextRef, s, t, convertStyle, userSettingsOrDefault } from '$lib/data/stores';
    import { DropdownIcon } from '$lib/icons';
    import config from '$lib/data/config';
    import * as numerals from '$lib/scripts/numeralSystem';
    import { navigateToText } from '$lib/navigate';

    /**reference to chapter selector so code can use TabsMenu.setActive*/
    let chapterSelector;

    // Needs testing, does updating the book correctly effect what chapters or verses are availible in the next tab?
    $: book = $nextRef.book === '' ? $refs.book : $nextRef.book;
    $: chapter = $nextRef.chapter === '' ? $refs.chapter : $nextRef.chapter;
    $: showVerseSelector = $userSettingsOrDefault['verse-selection'];
    $: verseCount = getVerseCount(book, chapter);
    $: numeralSystem = numerals.systemForBook(config, $refs.collection, book);

    $: c = $t.Selector_Chapter;
    $: v = $t.Selector_Verse;

    /**
     * Pushes reference changes to refs['next']. Pushes final change to default reference.
     */
    async function navigateReference(e) {
        switch (e.detail.tab) {
            case c:
                $nextRef.chapter = e.detail.text;
                if (!showVerseSelector) {
                    await completeNavigation();
                } else {
                    chapterSelector.setActive(v);
                }
                break;
            case v:
                if (e.detail.text === 'i') {
                    // Chapter getting set because if you just select verse
                    // from introduction, both blank goes to chapter 1
                    $nextRef.chapter = 'i';
                    $nextRef.verse = '';
                } else {
                    $nextRef.verse = e.detail.text;
                }
                await completeNavigation();
                break;
            default:
                console.log('Chapter navigateReference: Default');
                break;
        }
    }

    async function completeNavigation() {
        await navigateToText({
            collection: $refs.collection,
            book: $refs.book,
            chapter: $nextRef.chapter,
            verse: $nextRef.verse
        });
        close();
    }

    let dropdown;
    function close() {
        dropdown.close();
    }

    function resetNavigation() {
        chapterSelector.setActive(c);
        nextRef.reset();
    }

    function getChapterCount(book) {
        let books = $refs.catalog.documents;
        let count = Object.keys(books.find((x) => x.bookCode === book).versesByChapters).length;
        return count;
    }

    function getVerseCount(book, chapter) {
        if (!chapter || chapter === 'i') {
            return 0;
        }
        let books = $refs.catalog.documents;
        let chapters = books.find((d) => d.bookCode === book).versesByChapters;
        if (!chapters || Object.keys(chapters).length === 0) {
            return 0;
        }
        let count = Object.keys(chapters[chapter]).length;
        return count;
    }
    let verseGridGroup = (chapter) => {
        let value = [];
        let selectedChapter = chapters[chapter];
        if (chapter === 'i') {
            value = [
                {
                    cells: [
                        {
                            label: $t['Chapter_Introduction_Symbol'],
                            id: 'i'
                        }
                    ]
                }
            ];
        } else if (verseCount === 0) {
            value = [];
        } else {
            value = [
                {
                    cells: Object.keys(selectedChapter).map((x) => ({
                        label: numerals.formatNumber(numeralSystem, x),
                        id: x
                    }))
                }
            ];
        }
        return value;
    };
    /**list of books in current docSet*/
    $: books = $refs.catalog.documents;
    /**list of chapters in current book*/
    $: chapters = books.find((d) => d.bookCode === book).versesByChapters;
    $: showSelector =
        config.mainFeatures['show-chapter-number-on-app-bar'] && getChapterCount($refs.book) > 0;
    const canSelect = config.mainFeatures['show-chapter-selector'];
</script>

<!-- Chapter Selector -->
{#if showSelector && ($nextRef.book === '' || $nextRef.chapter !== '')}
    <Dropdown bind:this={dropdown} on:nav-end={resetNavigation} cols="5">
        <svelte:fragment slot="label">
            <div class="normal-case" style={convertStyle($s['ui.selector.chapter'])}>
                {numerals.formatNumber(numeralSystem, chapter)}
            </div>
            {#if canSelect}
                <DropdownIcon color="white" />
            {/if}
        </svelte:fragment>
        <svelte:fragment slot="content">
            {#if canSelect}
                <div>
                    <TabsMenu
                        bind:this={chapterSelector}
                        options={{
                            [c]: {
                                component: SelectGrid,
                                props: {
                                    cols: 5,
                                    options: [
                                        {
                                            rows: books.find((x) => x.bookCode === book)
                                                .hasIntroduction
                                                ? [
                                                      {
                                                          label: $t['Chapter_Introduction_Title'],
                                                          id: 'i'
                                                      }
                                                  ]
                                                : null,
                                            cells: Object.keys(chapters).map((x) => ({
                                                label: numerals.formatNumber(numeralSystem, x),
                                                id: x
                                            }))
                                        }
                                    ]
                                },
                                visible: true
                            },
                            [v]: {
                                component: SelectGrid,
                                props: {
                                    cols: 5,
                                    options: verseGridGroup(chapter)
                                },
                                visible: showVerseSelector
                            }
                        }}
                        on:menuaction={navigateReference}
                    />
                </div>
            {/if}
        </svelte:fragment>
    </Dropdown>
{/if}
