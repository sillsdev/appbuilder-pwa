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
    import { clickOutside } from '$lib/scripts/click_outside';
    $: console.log($nextRef);

    const listView = config.mainFeatures['book-select'] === 'list'; 

    $: b = $t.Selector_Book;
    $: c = $t.Selector_Chapter;
    $: v = $t.Selector_Verse;

    let bookSelector;
    $: label = config.bookCollections
                .find((x) => x.id === $refs.docSet.split('_')[1])
                .books.find((x) => x.id == ($nextRef.book)).name;
 
    /**
     * Pushes reference changes to refs['next']. Pushes final change to default reference.
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
                $refs = { book: $nextRef.book, chapter: $nextRef.chapter };
                // force closes active dropdown elements
                document.activeElement.blur();
                break;
            default:
                console.log('Book navigateReference: Default');
                break;
        }
    }

    /**list of books in current docSet*/
    $: books = catalog.find((d) => d.id === $nextRef.docSet).documents;
    /**list of chapters in current book*/
    $: chapters = books.find((d) => d.bookCode === $nextRef.book).versesByChapters;

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
</script>

<!-- Book Selector -->
<Dropdown>
    <svelte:fragment slot="label">
        <div class="normal-case" style={convertStyle($s['ui.selector.book'])}>
            {label}
        </div>
        <DropdownIcon color="white" />
    </svelte:fragment>
    <svelte:fragment slot="content">
        <div
            use:clickOutside
            on:outclick={() => {
                bookSelector.setActive(b);
                nextRef.set({book: $refs.book, chapter: $refs.chapter})
            }}
            style:background-color="white"
        >
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
                                    cells: Object.keys(chapters[$nextRef.chapter]).map((x) => ({
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
