<!--
@component
The navbar component.
-->
<script>
    import config from '$lib/data/config';
    import { convertStyle, nextRef, refs, s, t, userSettingsOrDefault } from '$lib/data/stores';
    import { DropdownIcon } from '$lib/icons';
    import { getRoute, navigateToText, navigateToUrl } from '$lib/navigate';
    import * as numerals from '$lib/scripts/numeralSystem';
    import Dropdown from './Dropdown.svelte';
    import SelectGrid from './SelectGrid.svelte';
    import SelectList from './SelectList.svelte';
    import TabsMenu from './TabsMenu.svelte';

    let { displayLabel = undefined } = $props();
    const book = $derived($nextRef.book === '' ? $refs.book : $nextRef.book);
    const chapter = $derived($nextRef.chapter === '' ? $refs.chapter : $nextRef.chapter);
    const verseCount = $derived(getVerseCount(chapter, chapters));
    const numeralSystem = $derived(numerals.systemForBook(config, $refs.collection, book));
    const chaptersLabels = $derived(
        config.bookCollections
            .find((x) => $refs.collection === x.id)
            .books.find((x) => book === x.id).chaptersLabels ?? {}
    );

    const showChapterSelector = config.mainFeatures['show-chapter-selector-after-book'];
    const listView = $derived($userSettingsOrDefault['book-selection'] === 'list');
    const showVerseSelector = $derived($userSettingsOrDefault['verse-selection']);
    const showSelectors = $derived(config.mainFeatures['book-select'] !== 'none');

    // Translated book, chapter, and verse tab labels
    const b = $derived($t.Selector_Book);
    const c = $derived($t.Selector_Chapter);
    const v = $derived($t.Selector_Verse);

    let bookSelector = $state();
    const labelDisplayed = $derived(
        displayLabel ??
            config.bookCollections
                .find((x) => x.id === $refs.collection)
                .books.find((x) => x.id === book)?.name
    );

    function isHtmlBook(bookId) {
        const book = config.bookCollections
            .find((x) => x.id === $refs.collection)
            .books.find((x) => x.id === bookId);

        return book && book.format === 'html';
    }
    function chapterCount(book) {
        let count = Object.keys(books.find((x) => x.bookCode === book).versesByChapters).length;
        return count;
    }
    function firstChapter(book) {
        let first = '1';
        const currBook = books.find((x) => x.bookCode === book);
        if (currBook?.versesByChapters) {
            // If the book has versesByChapters, we can get the first chapter directly
            first = Object.keys(currBook.versesByChapters)[0];
        }
        return first;
    }
    function getVerseCount(chapter, chapters) {
        if (!chapter || chapter === 'i' || !chapters || Object.keys(chapters).length === 0) {
            return 0;
        }
        let count = Object.keys(chapters[chapter]).length;
        return count;
    }
    /**
     * Pushes reference changes to nextRef. Pushes final change to default reference.
     */

    async function navigateReference({ text, url, tab }) {
        // Handle special book navigation first
        if (tab === b && url) {
            navigateToUrl({
                collection: $refs.collection,
                book: text,
                url: url
            });
            return;
        }
        if (!showChapterSelector || isHtmlBook(text)) {
            $nextRef.book = text;
            $nextRef.chapter = firstChapter(text);
            await completeNavigation();
        } else {
            switch (tab) {
                case b: {
                    bookSelector.setActive(c);
                    $nextRef.book = text;
                    const count = chapterCount($nextRef.book);
                    if (count === 0) {
                        $nextRef.chapter = 'i';
                        await completeNavigation();
                        break;
                    }
                    $nextRef.chapter = firstChapter($nextRef.book);
                    if (count === 1) {
                        await completeNavigation();
                    }
                    break;
                }
                case c:
                    $nextRef.chapter = text;
                    if (!showVerseSelector || $nextRef.chapter === 'i' || verseCount === 0) {
                        await completeNavigation();
                    } else {
                        bookSelector.setActive(v);
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
                    console.log('Book navigateReference: Default');
                    break;
            }
        }
    }

    let dropdown = $state();
    function close() {
        dropdown.close();
        //resetNavigation();
        //document.activeElement.blur();
    }
    async function completeNavigation() {
        await navigateToText({
            collection: $refs.collection,
            book: $nextRef.book,
            chapter: $nextRef.chapter,
            verse: $nextRef.verse
        });
        close();
    }

    function resetNavigation() {
        if (bookSelector) {
            bookSelector.setActive(b);
        }
        nextRef.reset();
    }

    /**list of books, quizzes, and quiz groups in current docSet*/
    const books = $derived($refs.catalog.documents);
    /**list of chapters in current book*/
    const chapters = $derived(books.find((d) => d.bookCode === book)?.versesByChapters ?? []);

    function getBookUrl(book) {
        let url;
        if (book.type === 'quiz') {
            url = getRoute(`/quiz/${$refs.collection}/${book.id}`);
        }
        return url;
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

    let bookGridGroup = ({ colId, bookLabel = 'abbreviation' }) => {
        let groups = [];
        var lastGroup = null;

        config.bookCollections
            .find((x) => x.id === colId)
            .books.forEach((book) => {
                const url = getBookUrl(book);
                if ($refs.allBookIds.find((x) => x === book.id) || url) {
                    let label = book[bookLabel] || book.name;
                    let cell = { label, id: book.id, url };
                    let group = book.testament || '';
                    if (
                        (lastGroup == null || group !== lastGroup) &&
                        config.mainFeatures['book-group-titles']
                    ) {
                        // Create new group
                        groups.push({
                            header: book.testament
                                ? $t['Book_Group_' + book.testament]
                                : lastGroup == null
                                  ? '' // use empty string so that first group doesn't have header (e.g. INT)
                                  : '\u00A0', // use &nbsp; so we have a blank space for additional books at the end
                            cells: [cell]
                        });
                        lastGroup = group;
                    } else {
                        if (groups.length > 0) {
                            // Add Book to last group
                            let cells = groups.at(-1).cells;
                            groups.at(-1).cells = [...cells, cell];
                        } else {
                            // Create a group with no header (likely if 'book-group-titles' === fase)
                            groups.push({
                                cells: [cell]
                            });
                        }
                    }
                }
            });

        return groups;
    };

    let chapterGridGroup = (chapters) => {
        let hasIntroduction = books.find((x) => x.bookCode === book)?.hasIntroduction;
        return [
            {
                rows: hasIntroduction
                    ? [{ label: $t['Chapter_Introduction_Title'], id: 'i' }]
                    : null,
                cells: Object.keys(chapters).map((x) => ({
                    label: getChapterLabel(x),
                    id: x
                }))
            }
        ];
    };
    let verseGridGroup = (chapter) => {
        let value;
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
    const options = $derived({
        [b]: {
            component: listView ? SelectList : SelectGrid,
            props: {
                options: bookGridGroup({
                    colId: $refs.collection,
                    bookLabel: listView ? 'name' : 'abbreviation'
                })
            },
            visible: true
        },
        [c]: {
            component: SelectGrid,
            props: {
                options: chapterGridGroup(chapters)
            },
            visible: showChapterSelector
        },
        [v]: {
            component: SelectGrid,
            props: {
                options: verseGridGroup(chapter)
            },
            visible: showChapterSelector && showVerseSelector
        }
    });
</script>

{#if showSelectors}
    <!-- Book Selector -->
    <Dropdown bind:this={dropdown} navEnd={resetNavigation}>
        {#snippet label()}
            <div class="normal-case whitespace-nowrap" style={convertStyle($s['ui.selector.book'])}>
                {labelDisplayed}
            </div>
            <DropdownIcon color="white" />
        {/snippet}
        {#snippet content()}
            <div>
                <TabsMenu bind:this={bookSelector} {options} menuaction={navigateReference} />
            </div>
        {/snippet}
    </Dropdown>
{:else}
    <!-- Book Label -->
    <div class="normal-case whitespace-nowrap" style={convertStyle($s['ui.selector.book'])}>
        {labelDisplayed}
    </div>
{/if}
