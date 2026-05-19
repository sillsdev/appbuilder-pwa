<!--
@component
Book Collection Selector component.
-->
<script lang="ts">
    import { scriptureConfig } from '$assets/config';
    import { convertStyle, layout, Layout, refs, s, selectedLayouts, t } from '$lib/data/stores';
    import { SideBySideIcon, SinglePaneIcon, VerseByVerseIcon } from '$lib/icons';
    import LayoutOptions from './LayoutOptions.svelte';
    import Modal from './Modal.svelte';
    import TabsMenu from './TabsMenu.svelte';

    let { vertOffset = '1rem' } = $props();

    const modalId = 'collectionSelector';
    let modal: Modal;
    let tabMenu;
    let tabMenuActive = $state(Layout.Single);

    // values of selectedLayouts before user makes changes
    const restoreDocSets = JSON.stringify($selectedLayouts);

    // ToDo: If showSinglePane false, provide first availible visible option instead
    const showSinglePane = !!scriptureConfig.layouts?.find((x) => x.mode === Layout.Single)
        ?.enabled;
    const showSideBySide = !!scriptureConfig.layouts?.find((x) => x.mode === Layout.Two)?.enabled;
    const showVerseByVerse = !!scriptureConfig.layouts?.find((x) => x.mode === Layout.VerseByVerse)
        ?.enabled;
    export function showModal() {
        modal.showModal();
    }

    function getSelectedLayout() {
        const collections = selectedLayouts.collections(tabMenuActive);
        return {
            mode: tabMenuActive,
            primaryDocSet: collections?.[0]?.id ?? '',
            auxDocSets: collections
                ?.slice(1)
                .map((x) => x?.id)
                .filter((x) => !!x) as string[] | undefined
        };
    }

    //The positioningCSS positions the modal 1rem below the navbar and 1rem from the right edge of the screen (on mobile it will be centered)
    const positioningCSS = $derived(
        'position:absolute; top:' +
            (Number(vertOffset.replace('rem', '')) + 1) +
            'rem; inset-inline-end:1rem;'
    );

    function handleOk() {
        const selectedLayout = getSelectedLayout();
        $refs.docSet = selectedLayout.primaryDocSet;
        $layout = selectedLayout;
    }

    function handleCancel() {
        $selectedLayouts = JSON.parse(restoreDocSets);
    }
</script>

<Modal bind:this={modal} id={modalId}>
    <TabsMenu
        bind:this={tabMenu}
        bind:active={tabMenuActive}
        options={{
            [Layout.Single]: {
                tab: { component: SinglePaneIcon },
                component: LayoutOptions,
                props: { layoutOption: Layout.Single },
                visible: showSinglePane
            },
            [Layout.Two]: {
                tab: { component: SideBySideIcon },
                component: LayoutOptions,
                props: { layoutOption: Layout.Two },
                visible: showSideBySide
            },
            [Layout.VerseByVerse]: {
                tab: { component: VerseByVerseIcon },
                component: LayoutOptions,
                props: { layoutOption: Layout.VerseByVerse },
                visible: showVerseByVerse
            }
        }}
        scroll={true}
    />
    <div class="flex w-full justify-between dy-modal-action">
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <button
            style={convertStyle($s?.['ui.dialog.button'])}
            class="dy-btn dy-btn-sm dy-btn-ghost no-animation"
            onclick={() => handleCancel()}>{$t['Button_Cancel']}</button
        >
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <button
            style={convertStyle($s?.['ui.dialog.button'])}
            class="dy-btn dy-btn-sm dy-btn-ghost no-animation"
            onclick={() => handleOk()}>{$t['Button_OK']}</button
        >
    </div>
</Modal>
