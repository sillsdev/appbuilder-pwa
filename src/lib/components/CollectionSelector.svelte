<!--
@component
Book Collection Selector component.
-->
<script>
    import Modal from './Modal.svelte';
    import LayoutOptions from './LayoutOptions.svelte';
    import TabsMenu from './TabsMenu.svelte';
    import { convertStyle, refs, nextDocSet, s, t } from '$lib/data/stores';
    import { BibleIcon, SinglePaneIcon, SideBySideIcon, VerseByVerseIcon } from '$lib/icons';

    const modalId = 'collectionSelector';
    let docSet = $refs.docSet;
    let modal;
    export function showModal() {
        modal.showModal();
    }

    export let vertOffset = '1rem'; //Prop that will have the navbar's height (in rem) passed in
    //The positioningCSS positions the modal 1rem below the navbar and 1rem from the right edge of the screen (on mobile it will be centered)
    $: positioningCSS =
        'position:absolute; top:' +
        (Number(vertOffset.replace('rem', '')) + 1) +
        'rem; right:1rem;';

    // ToDo: Set the $refs store to have the docSet using a nextCollection store
    function navigateReference(e) {
        switch (e.detail.tab) {
            case 'Single Pane':
                console.log(e.detail.tab);
                docSet = $nextDocSet.singlePane;
                break;
            case 'Side By Side':
                break;
            case 'Verse By Verse':
                break;
            default:
                console.log('CollectionSelector navigateReference: Default');
                break;
        }
    }

    // Not running because its not catching a menuaction.
    // ToDo
    function handleOk() {
        console.log('Navigating to', docSet);
        $refs.docSet = docSet;
    }
    // ToDo
    function handleCancel() {
        docSet = $refs.docSet;
    }
</script>

<Modal bind:this={modal} id={modalId} useLabel={false} addCSS={positioningCSS}
    ><!--addCSS is a prop for injecting CSS into the modal-->

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
            scroll={false}
            on:menuaction={navigateReference}
        />
        <div class="flex w-full justify-between dy-modal-action">
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <label
                for={modalId}
                style={convertStyle($s['ui.dialog.button'])}
                class="dy-btn dy-btn-sm dy-btn-ghost no-animation"
                on:click={() => handleCancel()}>{$t['Button_Cancel']}</label
            >
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <label
                for={modalId}
                style={convertStyle($s['ui.dialog.button'])}
                class="dy-btn dy-btn-sm dy-btn-ghost no-animation"
                on:click={() => handleOk()}>{$t['Button_OK']}</label
            >
        </div>
    </svelte:fragment>
</Modal>
