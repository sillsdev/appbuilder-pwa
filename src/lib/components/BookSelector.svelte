<!--
@component
The navbar component.
-->
<script>
    import Dropdown from './Dropdown.svelte';
    import SelectGrid from './SelectGrid.svelte';
    import TabsMenu from './TabsMenu.svelte';
    import { refs, nextRef, s, t, convertStyle } from '$lib/data/stores';
    import { DropdownIcon } from '$lib/icons';
    import { catalog } from '$lib/data/catalog';
    import config from '$lib/data/config';
    import SelectList from './SelectList.svelte';

    $: console.log('Next reference:', $nextRef);

    // Needs testing, does updating the book correctly effect what chapters or verses are availible in the next tab?
    $: book = $nextRef.book === '' ? $refs.book : $nextRef.book;
    $: chapter = $nextRef.chapter === '' ? $refs.chapter : $nextRef.chapter;

    const listView = config.mainFeatures['book-select'] === 'list';

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
        switch (e.detail.tab) {
            case b:
                bookSelector.setActive(c);
                $nextRef.book = e.detail.text;
                // TODO: hide chapter
                break;
            case c:
                bookSelector.setActive(v);
                $nextRef.chapter = e.detail.text;
                // TODO: show chapter
                break;
            case v:
                bookSelector.setActive(b);
                $refs.book = book;
                $refs.chapter = chapter;
                // force closes active dropdown elements
                document.activeElement.blur();
                break;
            default:
                console.log('Book navigateReference: Default');
                break;
        }
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

    function resetNavigation() {
        bookSelector.setActive(b);
        $nextRef.book = '';
        $nextRef.chapter = '';
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
        <!--The on:outclick function overwrites chapter and book, setting them black before navigation.-->
        <div style:background-color="white">
            <TabsMenu
                bind:this={bookSelector}
                options={{
                    [b]: {
                        component: listView ? SelectList : SelectGrid,
                        props: {
                            options: bookGridGroup({
                                bookLabel: listView ? 'name' : 'abbreviation'
                            })
                        }
                    },
                    [c]: {
                        component: SelectGrid,
                        props: {
                            options: [
                                { cells: Object.keys(chapters).map((x) => ({ label: x, id: x })) }
                            ]
                        }
                    },
                    [v]: {
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
                    }
                }}
                active={b}
                on:menuaction={navigateReference}
            />
        </div>
    </svelte:fragment>
</Dropdown>
