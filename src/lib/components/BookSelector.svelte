<!--
@component
The navbar component.
-->
<script>
    import Dropdown from './Dropdown.svelte';
    import SelectGrid from './SelectGrid.svelte';
    import TabsMenu from './TabsMenu.svelte';
    import { refs, s, t, convertStyle } from '$lib/data/stores';
    import { onDestroy } from 'svelte';
    import { DropdownIcon } from '$lib/icons';
    import { catalog } from '$lib/data/catalog';
    import config from '$lib/data/config';
    import SelectList from './SelectList.svelte';

    const selectionPopupNone = config.mainFeatures['book-select'] === 'none';
    const selectionGrid = config.mainFeatures['book-select'] === 'grid';
    const selectionList = config.mainFeatures['book-select'] === 'list';

    $: b = $t.Selector_Book;
    $: c = $t.Selector_Chapter;
    $: v = $t.Selector_Verse;

    let bookSelector;
    let nextRef;
    const unsub = refs.subscribe((v) => {
        nextRef = v;
    }, 'next');
    /**
     * Pushes reference changes to refs['next']. Pushes final change to default reference.
     */
    function navigateReference(e) {
        switch (e.detail.tab) {
            case b:
                bookSelector.setActive(c);
                refs.set({ book: e.detail.text }, 'next');
                break;
            case c:
                bookSelector.setActive(v);
                refs.set({ chapter: e.detail.text }, 'next');
                break;
            case v:
                bookSelector.setActive(b);
                $refs = { book: nextRef.book, chapter: nextRef.chapter };
                // force closes active dropdown elements
                document.activeElement.blur();
                break;
            default:
                console.log('Book navigateReference: Default');
                break;
        }
    }

    /**list of books in current docSet*/
    $: books = catalog.find((d) => d.id === nextRef.docSet).documents;
    /**list of chapters in current book*/
    $: chapters = books.find((d) => d.bookCode === nextRef.book).versesByChapters;

    let bookGridGroup = () => {
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
                .map((x) => ({ label: x.abbreviation, id: x.id }))
        }));
    };
    onDestroy(unsub);
    console.log($s);
</script>

<!-- Book Selector -->
{#if selectionGrid}
    <Dropdown>
        <svelte:fragment slot="label">
            <div class="normal-case" style={convertStyle($s['ui.selector.book'])}>
                {config.bookCollections
                    .find((x) => x.id === $refs.collection)
                    .books.find((x) => (x) => x.id == $refs.book).name}
            </div>
            <DropdownIcon color="white" />
        </svelte:fragment>
        <svelte:fragment slot="content">
            <TabsMenu
                bind:this={bookSelector}
                options={{
                    [b]: {
                        component: SelectGrid,
                        props: { options: bookGridGroup() }
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
                                    cells: Object.keys(chapters[nextRef.chapter]).map((x) => ({
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
        </svelte:fragment>
    </Dropdown>
{:else if selectionList}
    <Dropdown>
        <svelte:fragment slot="label">
            {$refs.book}
            <DropdownIcon _class="fill-white" />
        </svelte:fragment>
        <svelte:fragment slot="content">
            <TabsMenu
                bind:this={bookSelector}
                options={{
                    Book: {
                        component: SelectList,
                        /**
                         * TODO:
                         * - add book abbreviations to catalog to be used in UI instead of bookCode
                         */
                        props: { options: books.map((b) => b.bookCode) }
                    },
                    Chapter: {
                        component: SelectList,
                        props: { options: Object.keys(chapters) }
                    },
                    Verse: {
                        component: SelectList,
                        props: { options: Object.keys(chapters[nextRef.chapter]) }
                    }
                }}
                active="Book"
                on:menuaction={navigateReference}
            />
        </svelte:fragment>
    </Dropdown>
{/if}
