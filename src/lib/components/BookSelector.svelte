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
        const colId = nextRef.docSet.split('_')[1];
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
</script>

<!-- Book Selector -->
{#if config.mainFeatures['book-select'] === 'grid'}
    <Dropdown>
        <svelte:fragment slot="label">
            <div style={convertStyle($s['ui.selector.book'])}>
                {$refs.book}
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
{:else if config.mainFeatures['book-select'] === 'list'}
    <!--TODO: Add List selector -->
{/if}
