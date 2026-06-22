<!--
@component
The navbar component.
-->
<script lang="ts">
    import config, { scriptureConfig } from '$assets/config';
    import type { BookConfig } from '$config';
    import {
        actionBarColor,
        convertStyle,
        nextRef,
        refs,
        s,
        t,
        userSettingsOrDefault
    } from '$lib/data/stores';
    import { DropdownIcon } from '$lib/icons';
    import { navigateToText, navigateToUrl } from '$lib/navigate';
    import * as numerals from '$lib/scripts/numeralSystem';
    import { resolve } from '$lib/utils/paths';
    import Dropdown from './Dropdown.svelte';
    import SelectGrid from './SelectGrid.svelte';
    import SelectList from './SelectList.svelte';
    import TabsMenu from './TabsMenu.svelte';

    let { displayLabel = undefined } = $props();

    /**list of books, quizzes, and quiz groups in current docSet*/
    const books = $derived($refs.catalog.documents);
    /**list of chapters in current book*/
    const chapters = $derived(books.find((d) => d.bookCode === book)?.versesByChapters ?? {});

    const book = $derived($nextRef.book === '' ? $refs.book : $nextRef.book);
    const chapter = $derived($nextRef.chapter === '' ? $refs.chapter : $nextRef.chapter);
    const verseCount = $derived(getVerseCount(chapter, chapters));
    const numeralSystem = $derived(numerals.systemForBook(config, $refs.collection, book));
    const chaptersLabels = $derived(
        scriptureConfig.bookCollections
            ?.find((x) => $refs.collection === x.id)
            ?.books.find((x) => book === x.id)?.chaptersLabels ?? {}
    );

    const showChapterSelector = config.mainFeatures['show-chapter-selector-after-book'] as boolean;
    const listView = $derived($userSettingsOrDefault['book-selection'] === 'list');
    const showVerseSelector = $derived.by(() => {
        const bookType = scriptureConfig.bookCollections
            ?.find((x) => $refs.collection === x.id)
            ?.books.find((x) => book === x.id)?.type;
        return $userSettingsOrDefault['verse-selection'] && (!bookType || bookType !== 'songs');
    }) as boolean;
    const showSelectors = $derived(config.mainFeatures['book-select'] !== 'none');
    const hideEmptyChapters = $derived.by(() => {
        const bookType = scriptureConfig.bookCollections
            ?.find((x) => $refs.collection === x.id)
            ?.books.find((x) => book === x.id)?.type;
        return $userSettingsOrDefault['hide-empty-chapters'] && (!bookType || bookType !== 'songs');
    }) as boolean;

    // Translated book, chapter, and verse tab labels
    const b = $derived($t.Selector_Book);
    const c = $derived($t.Selector_Chapter);
    const v = $derived($t.Selector_Verse);

    let bookSelector: TabsMenu | undefined = $state();
    const labelDisplayed = $derived(
        displayLabel ??
            scriptureConfig.bookCollections
                ?.find((x) => x.id === $refs.collection)
                ?.books.find((x) => x.id === book)?.name
    );

    function isHtmlBook(bookId: string) {
        const book = scriptureConfig.bookCollections
            ?.find((x) => x.id === $refs.collection)
            ?.books.find((x) => x.id === bookId);

        return book?.format === 'html';
    }
    function chapterCount(book: string) {
        let count = Object.keys(
            books.find((x) => x.bookCode === book)?.versesByChapters ?? {}
        ).length;
        return count;
    }
    function firstChapter(book: string) {
        let first = '1';
        const currBook = books.find((x) => x.bookCode === book);
        if (currBook?.versesByChapters) {
            // If the book has versesByChapters, we can get the first chapter directly
            first = Object.keys(currBook.versesByChapters)[0];
        }
        return first;
    }
    function getVerseCount(chapter: string, chapters?: Record<string, Record<string, unknown>>) {
        if (!chapter || chapter === 'i' || !chapters || Object.keys(chapters).length === 0) {
            return 0;
        }
        let count = Object.keys(chapters[chapter]).length;
        return count;
    }
    /**
     * Pushes reference changes to nextRef. Pushes final change to default reference.
     */

    async function navigateReference({
        text,
        url,
        tab
    }: {
        text: string;
        url: string;
        tab: string;
    }) {
        // Handle special book navigation first
        if (tab === b && url) {
            $nextRef.book = text;
            $nextRef.chapter = '1';
            $nextRef.verse = '';
            await navigateToText({
                docSet: $refs.docSet,
                collection: $refs.collection,
                book: $nextRef.book,
                chapter: $nextRef.chapter,
                verse: $nextRef.verse
            });
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
                    bookSelector?.setActive(c);
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
                        bookSelector?.setActive(v);
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

    let dropdown: Dropdown | undefined = $state();
    function close() {
        dropdown?.close();
        //resetNavigation();
        //document.activeElement.blur();
    }
    async function completeNavigation() {
        await navigateToText({
            docSet: $refs.docSet,
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

    function getBookUrl(book: BookConfig) {
        let url;
        if (book.type === 'quiz') {
            url = resolve(`/quiz/${$refs.collection}/${book.id}`);
        }
        if (book.type === 'songs') {
            url = resolve(`/songs/${$refs.collection}/${book.id}`);
        }
        return url;
    }

    function getChapterLabel(chapter: string) {
        if (chapter === 'i') {
            return $t['Chapter_Introduction_Symbol'];
        }

        if (chaptersLabels[Number(chapter)] !== undefined) {
            return chaptersLabels[Number(chapter)];
        }

        return numerals.formatNumber(numeralSystem, chapter);
    }

    type BookLabel = {
        [K in keyof BookConfig]: BookConfig[K] extends string ? K : never;
    }[keyof BookConfig];

    let bookGridGroup = ({
        colId,
        bookLabel = 'abbreviation'
    }: {
        colId: string;
        bookLabel?: BookLabel;
    }) => {
        let groups: { header?: string; cells: { label: string; id: string; url?: string }[] }[] =
            [];
        let lastGroup: string | null = null;

        scriptureConfig.bookCollections
            ?.find((x) => x.id === colId)
            ?.books.forEach((book) => {
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
                            let cells = groups.at(-1)?.cells ?? [];
                            groups[groups.length - 1].cells = [...cells, cell];
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

    let chapterGridGroup = () => {
        let hasIntroduction = books.find((x) => x.bookCode === book)?.hasIntroduction;
        if (hideEmptyChapters) {
            return [
                {
                    rows: hasIntroduction
                        ? [{ label: $t['Chapter_Introduction_Title'], id: 'i' }]
                        : null,
                    cells: Object.keys(chapters)
                        .filter((y) => Object.keys(chapters[y]).length > 0)
                        .map((x) => ({
                            label: getChapterLabel(x),
                            id: x
                        }))
                }
            ];
        } else {
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
        }
    };
    let verseGridGroup = (chapter: string) => {
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
            value = [] as { cells: { label: string; id: string }[] }[];
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
            snippet: listView ? selectList : selectGrid,
            visible: true
        },
        [c]: {
            snippet: selectGrid,
            visible: showChapterSelector
        },
        [v]: {
            snippet: selectGrid,
            visible: showChapterSelector && showVerseSelector
        }
    } satisfies App.TabMenuOptions);
    let tabColor = $derived($s?.['ui.selector.tabs']['color']);
</script>

{#snippet selectList(bcv: string, menuaction: App.MenuActionHandler)}
    <SelectList
        options={bookGridGroup({
            colId: $refs.collection,
            bookLabel: 'name'
        })}
        {menuaction}
    />
{/snippet}

{#snippet selectGrid(bcv: string, menuaction: App.MenuActionHandler)}
    <SelectGrid
        options={bcv === b
            ? bookGridGroup({
                  colId: $refs.collection,
                  bookLabel: 'abbreviation'
              })
            : bcv === c
              ? chapterGridGroup()
              : verseGridGroup(chapter)}
        {menuaction}
    />
{/snippet}

{#if showSelectors}
    <!-- Book Selector -->
    <Dropdown bind:this={dropdown} navEnd={resetNavigation}>
        {#snippet label()}
            <div
                class="normal-case whitespace-nowrap"
                style:color={$actionBarColor}
                style={convertStyle($s?.['ui.selector.book'])}
            >
                {labelDisplayed}
            </div>
            <DropdownIcon color={$actionBarColor} />
        {/snippet}
        {#snippet content()}
            <div>
                <TabsMenu
                    bind:this={bookSelector}
                    {options}
                    menuaction={navigateReference}
                    color={tabColor}
                />
            </div>
        {/snippet}
    </Dropdown>
{:else}
    <!-- Book Label -->
    <div
        class="normal-case whitespace-nowrap"
        style:color={$actionBarColor}
        style={convertStyle($s?.['ui.selector.book'])}
    >
        {labelDisplayed}
    </div>
{/if}
