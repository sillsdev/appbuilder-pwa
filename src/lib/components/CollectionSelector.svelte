<!--
@component
Book Collection Selector component.
-->
<script>
    import Modal from './Modal.svelte';
    import LayoutOptions from './LayoutOptions.svelte';
    import TabsMenu from './TabsMenu.svelte';
    import { convertStyle, refs, s } from '$lib/data/stores';
    import { onDestroy } from 'svelte';
    import { BibleIcon, SinglePaneIcon, SideBySideIcon, VerseByVerseIcon } from '$lib/icons';

    $: console.log($s);

    let modalId = 'collectionSelector';

    let nextRef;
    const unsub = refs.subscribe((v) => {
        nextRef = v;
    }, 'next');
    /**
     * Pushes reference changes to refs['next']. Pushes final change to default reference.
     */
    function navigateReference(e) {
        switch (e.detail.tab) {
            case 'Single Pane':
                $refs = { docSet: e.detail.text };
                // force closes active dropdown elements
                document.activeElement.blur();
                break;
            default:
                console.log('Collection navigateReference: Default');
                break;
        }
    }
    onDestroy(unsub);
</script>

<Modal id={modalId}>
    <svelte:fragment slot="label">
        <BibleIcon color="white" />
    </svelte:fragment>
    <svelte:fragment slot="content">
        <TabsMenu
            options={{
                'Single Pane': {
                    tab: { component: SinglePaneIcon },
                    component: LayoutOptions,
                    props: { layoutOption: 'Single Pane' }
                },
                'Side By Side': {
                    tab: { component: SideBySideIcon },
                    component: LayoutOptions,
                    props: { layoutOption: 'Side By Side' }
                },
                'Verse By Verse': {
                    tab: { component: VerseByVerseIcon },
                    component: LayoutOptions,
                    props: { layoutOption: 'Verse By Verse' }
                }
            }}
            active="Single Pane"
            on:menuaction={navigateReference}
        />
        <label
            for={modalId}
            style={convertStyle($s['ui.dialog.button'])}
            class="dy-btn dy-btn-sm dy-btn-ghost dy-no-animation">Cancel</label
        >
        <label
            for={modalId}
            style={convertStyle($s['ui.dialog.button'])}
            class="dy-btn dy-btn-sm dy-btn-ghost dy-no-animation">Ok</label
        >
    </svelte:fragment>
</Modal>
