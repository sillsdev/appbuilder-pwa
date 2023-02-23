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
    import { clickOutside } from '$lib/scripts/click_outside';

    /**reference to chapter selector so code can use TabsMenu.setActive*/
    let chapterSelector;

    // Needs testing, does updating the book correctly effect what chapters or verses are availible in the next tab?
    $: book = $nextRef.book === '' ? $refs.book : $nextRef.book;
    $: chapter = $nextRef.chapter === '' ? $refs.chapter : $nextRef.chapter;

    $: c = $t.Selector_Chapter;
    $: v = $t.Selector_Verse;

    /**
     * Pushes reference changes to refs['next']. Pushes final change to default reference.
     */
    function navigateReference(e) {
        switch (e.detail.tab) {
            case c:
                chapterSelector.setActive(v);
                $nextRef.chapter = e.detail.text;
                break;
            case v:
                chapterSelector.setActive(c);
                $refs.chapter = chapter;
                // force closes active dropdown elements
                document.activeElement.blur();
                break;
            default:
                console.log('Chapter navigateReference: Default');
                break;
        }
    }

    /**list of books in current docSet*/
    $: books = catalog.find((d) => d.id === $refs.docSet).documents;
    /**list of chapters in current book*/
    $: chapters = books.find((d) => d.bookCode === book).versesByChapters;
    const showSelector = config.mainFeatures['show-chapter-number-on-app-bar'];
    const canSelect = config.mainFeatures['show-chapter-selector'];
</script>

<!-- Chapter Selector -->
{#if showSelector}
    <Dropdown>
        <svelte:fragment slot="label">
            <div style={convertStyle($s['ui.selector.chapter'])}>
                {chapter}
            </div>
            {#if canSelect}
                <DropdownIcon color="white" />
            {/if}
        </svelte:fragment>
        <svelte:fragment slot="content">
            {#if canSelect}
                <!--The on:outclick function overwrites chapter and book, setting them black before navigation.-->
                <div
                    use:clickOutside
                    on:outclick|self={() => {
                        chapterSelector.setActive(c);
                        // $nextRef.chapter = "";
                    }}
                    style:background-color="white"
                >
                    <TabsMenu
                        bind:this={chapterSelector}
                        options={{
                            [c]: {
                                component: SelectGrid,
                                props: {
                                    options: [
                                        {
                                            cells: Object.keys(chapters).map((x) => ({
                                                label: x,
                                                id: x
                                            }))
                                        }
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
                        active={c}
                        on:menuaction={navigateReference}
                    />
                </div>
            {/if}
        </svelte:fragment>
    </Dropdown>
{/if}
