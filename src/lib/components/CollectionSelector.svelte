<!--
@component
Book Collection Selector component.
-->
<script>
    import Modal from './Modal.svelte';
    import LayoutOptions from './LayoutOptions.svelte';
    import TabsMenu from './TabsMenu.svelte';
    import config from '$lib/data/config';
    import { convertStyle, refs, layout, selectedLayouts, s, t } from '$lib/data/stores';
    import { SinglePaneIcon, SideBySideIcon, VerseByVerseIcon } from '$lib/icons';
    import { LAYOUT_SINGLE, LAYOUT_TWO, LAYOUT_VERSE_BY_VERSE } from '$lib/data/stores';

    const modalId = 'collectionSelector';
    let modal;
    let tabMenu;

    // values of selectedLayouts before user makes changes
    const restoreDocSets = JSON.stringify($selectedLayouts);

    // ToDo: If showSinglePane false, provide first availible visible option instead
    $: showSinglePane = config.layouts.find((x) => x.mode === LAYOUT_SINGLE).enabled;
    $: showSideBySide = config.layouts.find((x) => x.mode === LAYOUT_TWO).enabled;
    $: showVerseByVerse = config.layouts.find((x) => x.mode === LAYOUT_VERSE_BY_VERSE).enabled;

    export function showModal() {
        modal.showModal();
    }

    function getSelectedLayout() {
        const collections = selectedLayouts.collections(tabMenu.active);
        return {
            mode: tabMenu.active,
            primaryDocSet: collections[0].id,
            auxDocSets: collections.slice(1).map((x) => x.id)
        };
    }

    export let vertOffset = '1rem'; //Prop that will have the navbar's height (in rem) passed in
    //The positioningCSS positions the modal 1rem below the navbar and 1rem from the right edge of the screen (on mobile it will be centered)
    $: positioningCSS =
        'position:absolute; top:' +
        (Number(vertOffset.replace('rem', '')) + 1) +
        'rem; inset-inline-end:1rem;';

    function handleOk() {
        const selectedLayout = getSelectedLayout();
        $refs.docSet = selectedLayout.primaryDocSet;
        $layout = selectedLayout;
    }

    function handleCancel() {
        $selectedLayouts = JSON.parse(restoreDocSets);
    }
</script>

<!--addCSS is a prop for injecting CSS into the modal-->
<Modal bind:this={modal} id={modalId} useLabel={false}>
    <svelte:fragment slot="content">
        <TabsMenu
            bind:this={tabMenu}
            options={{
                [LAYOUT_SINGLE]: {
                    tab: { component: SinglePaneIcon },
                    component: LayoutOptions,
                    props: { layoutOption: LAYOUT_SINGLE },
                    visible: showSinglePane
                },
                [LAYOUT_TWO]: {
                    tab: { component: SideBySideIcon },
                    component: LayoutOptions,
                    props: { layoutOption: LAYOUT_TWO },
                    visible: showSideBySide
                },
                [LAYOUT_VERSE_BY_VERSE]: {
                    tab: { component: VerseByVerseIcon },
                    component: LayoutOptions,
                    props: { layoutOption: LAYOUT_VERSE_BY_VERSE },
                    visible: showVerseByVerse
                }
            }}
            scroll={true}
        />
        <div class="flex w-full justify-between dy-modal-action">
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <button
                style={convertStyle($s['ui.dialog.button'])}
                class="dy-btn dy-btn-sm dy-btn-ghost no-animation"
                on:click={() => handleCancel()}>{$t['Button_Cancel']}</button
            >
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <button
                style={convertStyle($s['ui.dialog.button'])}
                class="dy-btn dy-btn-sm dy-btn-ghost no-animation"
                on:click={() => handleOk()}>{$t['Button_OK']}</button
            >
        </div>
    </svelte:fragment>
</Modal>
