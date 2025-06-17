<!--
@component
The navbar component.
-->
<script>
    import config from '$lib/data/config';
    import { convertStyle, nextRef, refs, s, t, userSettingsOrDefault } from '$lib/data/stores';
    import { DropdownIcon } from '$lib/icons';
    import { navigateToText } from '$lib/navigate';
    import * as numerals from '$lib/scripts/numeralSystem';
    import Dropdown from './Dropdown.svelte';
    import SelectGrid from './SelectGrid.svelte';
    import TabsMenu from './TabsMenu.svelte';

    /**reference to chapter selector so code can use TabsMenu.setActive*/
    let chapterSelector = $state();

    // Needs testing, does updating the book correctly effect what chapters or verses are availible in the next tab?
    const book = $derived($nextRef.book === '' ? $refs.book : $nextRef.book);
    const chapter = $derived($nextRef.chapter === '' ? $refs.chapter : $nextRef.chapter);
    const showVerseSelector = $derived($userSettingsOrDefault['verse-selection']);
    const verseCount = $derived(getVerseCount(book, chapter));
    const numeralSystem = $derived(numerals.systemForBook(config, $refs.collection, book));
    const chaptersLabels = $derived(
        config.bookCollections
            .find((x) => $refs.collection === x.id)
            .books.find((x) => book === x.id).chaptersLabels ?? {}
    );

    const c = $derived($t.Selector_Chapter);
    const v = $derived($t.Selector_Verse);

    /**
     * Pushes reference changes to refs['next']. Pushes final change to default reference.
     */
    async function navigateReference({ text, url, tab }) {
        switch (tab) {
            case c:
                $nextRef.chapter = text;
                if (!showVerseSelector || $nextRef.chapter === 'i' || verseCount === 0) {
                    await completeNavigation();
                } else {
                    chapterSelector.setActive(v);
                }
                break;
            case v:
                if (text === 'i') {
                    // Chapter getting set because if you just select verse
                    // from introduction, both blank goes to chapter 1
                    $nextRef.chapter = 'i';
                    $nextRef.verse = '';
                } else {
                    $nextRef.verse = text;
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

    let dropdown = $state();
    function close() {
        dropdown.close();
    }

    function resetNavigation() {
        chapterSelector.setActive(c);
        nextRef.reset();
    }

    function getChapterCount(bookId) {
        const book = $refs.catalog.documents.find((x) => x.bookCode === bookId);
        if (book) {
            return Object.keys(book.versesByChapters).length;
        }
        return 0;
    }

    function getChapterLabel(chapter) {
        if (chapter === 'i') {
            return $t['Chapter_Introduction_Symbol'];
        }

        if (chaptersLabels[Number(chapter)] !== undefined) {
            return chaptersLabels[Number(chapter)];
        }

        return numerals.formatNumber(numeralSystem, chapter);
    }

    function getVerseCount(book, chapter) {
        if (!chapter || chapter === 'i') {
            return 0;
        }
        let books = $refs.catalog.documents;
        let chapters = books.find((d) => d.bookCode === book)?.versesByChapters;
        if (!chapters || Object.keys(chapters).length === 0) {
            return 0;
        }
        let count = Object.keys(chapters[chapter]).length;
        return count;
    }

    // Needs to be reactive when the chapter changes if there is a nextRef.book
    let chapterIndicator = (book, chapter) => {
        let value = '';
        if (chapter === 'i') {
            value = $t['Chapter_Introduction_Symbol'];
        } else if (chaptersLabels[chapter] !== undefined) {
            value = chaptersLabels[chapter];
        } else {
            value = numerals.formatNumber(numeralSystem, chapter);
        }
        return value;
    };

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
    const books = $derived($refs.catalog.documents);
    /**list of chapters in current book*/
    const chapters = $derived(books.find((d) => d.bookCode === book)?.versesByChapters || {});
    const showSelector = $derived(
        config.mainFeatures['show-chapter-number-on-app-bar'] && getChapterCount($refs.book) > 0
    );
    const canSelect = config.mainFeatures['show-chapter-selector'];
</script>

<!-- Chapter Selector -->
{#if showSelector && ($nextRef.book === '' || $nextRef.chapter !== '')}
    <Dropdown bind:this={dropdown} navEnd={resetNavigation} cols="5">
        {#snippet label()}
            <div class="normal-case" style={convertStyle($s['ui.selector.chapter'])}>
                {chapterIndicator(book, chapter)}
            </div>
            {#if canSelect}
                <DropdownIcon color="white" />
            {/if}
        {/snippet}
        {#snippet content()}
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
                                                ?.hasIntroduction
                                                ? [
                                                      {
                                                          label: $t['Chapter_Introduction_Title'],
                                                          id: 'i'
                                                      }
                                                  ]
                                                : null,
                                            cells: Object.keys(chapters).map((x) => ({
                                                label: getChapterLabel(x),
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
                        menuaction={navigateReference}
                    />
                </div>
            {/if}
        {/snippet}
    </Dropdown>
{/if}
