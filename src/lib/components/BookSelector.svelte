<!--
@component
The navbar component.
-->
<script>
    import Dropdown from './Dropdown.svelte';
    import SelectGrid from './SelectGrid.svelte';
    import TabsMenu from './TabsMenu.svelte';
    import { refs, nextRef, s, t, convertStyle, userSettings } from '$lib/data/stores';
    import { DropdownIcon } from '$lib/icons';
    import { catalog } from '$lib/data/catalog';
    import config from '$lib/data/config';
    import SelectList from './SelectList.svelte';

    // Needs testing, does updating the book correctly effect what chapters or verses are availible in the next tab?
    $: book = $nextRef.book === '' ? $refs.book : $nextRef.book;
    $: chapter = $nextRef.chapter === '' ? $refs.chapter : $nextRef.chapter;

    const listView = $userSettings['book-selection'] === 'list';
    const showBookOnly = !config.mainFeatures['show-chapter-selector-after-book'];
    const showVerseSelector = $userSettings['verse-selection'];

    // Translated book, chapter, and verse tab labels
    $: b = $t.Selector_Book;
    $: c = $t.Selector_Chapter;
    $: v = $t.Selector_Verse;

    let bookSelector;
    $: label = config.bookCollections
        .find((x) => x.id === $refs.docSet.split('_')[1])
        .books.find((x) => x.id == book).name;

    /**
     * Pushes reference changes to nextRef. Pushes final change to default reference.
     */
    function navigateReference(e) {
        if (showBookOnly) {
            $nextRef.book = e.detail.text;
            $refs = { book: $nextRef.book, chapter: 1 };
            document.activeElement.blur();
        } else {
            switch (e.detail.tab) {
                case b:
                    bookSelector.setActive(c);
                    $nextRef.book = e.detail.text;
                    break;
                case c:
                    $nextRef.chapter = e.detail.text;
                    if (showVerseSelector) {
                        bookSelector.setActive(v);
                    } else {
                        completeNavigation();
                    }
                    break;
                case v:
                    completeNavigation();
                    break;
                default:
                    console.log('Book navigateReference: Default');
                    break;
            }
        }
    }

    function completeNavigation() {
        $refs = { book: $nextRef.book, chapter: $nextRef.chapter };
        document.activeElement.blur();
    }

    function resetNavigation() {
        if (bookSelector) {
            bookSelector.setActive(b);
        }
        nextRef.reset();
    }

    /**list of books in current docSet*/
    $: books = catalog.find((d) => d.id === $refs.docSet).documents;
    /**list of chapters in current book*/
    $: chapters = books.find((d) => d.bookCode === book).versesByChapters;

    let bookGridGroup = ({ bookLabel = 'abbreviation' }) => {
        const colId = $refs.collection;
        let groups = config.bookCollections
            .find((x) => x.id === colId)
            .books.map((x) => x.testament)
            .reduce((acc, curr) => {
                if (!acc.includes(curr)) acc.push(curr);
                return acc;
            }, []);
        return groups.map((_, i) => ({
            header: $t['Book_Group_' + groups[i]],
            cells: config.bookCollections
                .find((x) => x.id === colId)
                .books.filter((x) => x.testament === groups[i])
                .map((x) => ({ label: x[bookLabel], id: x.id }))
        }));
    };

    const bookContent = {
        component: listView ? SelectList : SelectGrid,
        props: {
            options: bookGridGroup({
                bookLabel: listView ? 'name' : 'abbreviation'
            })
        }
    };

    function chaptersContent(chapters) {
        return {
            component: SelectGrid,
            props: {
                options: [{ cells: Object.keys(chapters).map((x) => ({ label: x, id: x })) }]
            }
        };
    }

    function versesContent(chapters, chapter) {
        return {
            component: SelectGrid,
            props: {
                options: [
                    {
                        cells: Object.keys(chapters[chapter]).map((x) => ({
                            label: x,
                            id: x
                        }))
                    }
                ]
            }
        };
    }
</script>

<!-- Book Selector -->
<Dropdown on:nav-end={resetNavigation}>
    <svelte:fragment slot="label">
        <div class="normal-case" style={convertStyle($s['ui.selector.book'])}>
            {label}
        </div>
        <DropdownIcon color="white" />
    </svelte:fragment>
    <svelte:fragment slot="content">
        <div>
            {#if showBookOnly}
                <TabsMenu
                    bind:this={bookSelector}
                    options={{
                        [b]: bookContent
                    }}
                    active={b}
                    on:menuaction={navigateReference}
                />
            {:else if showVerseSelector}
                <TabsMenu
                    bind:this={bookSelector}
                    options={{
                        [b]: bookContent,
                        [c]: chaptersContent(chapters),
                        [v]: versesContent(chapters, chapter)
                    }}
                    active={b}
                    on:menuaction={navigateReference}
                />
            {:else}
                <TabsMenu
                    bind:this={bookSelector}
                    options={{
                        [b]: bookContent,
                        [c]: chaptersContent(chapters)
                    }}
                    active={b}
                    on:menuaction={navigateReference}
                />
            {/if}
        </div>
    </svelte:fragment>
</Dropdown>
