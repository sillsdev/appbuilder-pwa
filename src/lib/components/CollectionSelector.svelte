<!--
@component
Book Collection Selector component.
-->
<script>
    import Modal from './Modal.svelte';
    import LayoutOptions from './LayoutOptions.svelte';
    import TabsMenu from './TabsMenu.svelte';
    import { convertStyle, refs, s } from '$lib/data/stores';
    import { BibleIcon, SinglePaneIcon, SideBySideIcon, VerseByVerseIcon } from '$lib/icons';

    let modalId = 'collectionSelector';
    let docSet = $refs.docSet;
    let modal;
    export function showModal() {
        modal.showModal();
    }
    export let vertOffset = '0px';
    $: positioningCSS =
        'position:absolute; top:' +
        (vertOffset + parseFloat(getComputedStyle(document.documentElement).fontSize)) +
        'px; right:1rem;';

    function navigateReference(e) {
        switch (e.detail.tab) {
            case 'Single Pane':
                docSet = e.detail.text;
                // force closes active dropdown elements
                document.activeElement.blur();
                break;
            default:
                console.log('Collection navigateReference: Default');
                break;
        }
    }
</script>

<Modal bind:this={modal} id={modalId} useLabel={false} addCSS={positioningCSS}>
    <svelte:fragment slot="content">
        <!-- TODO: Include other layout options -->
        <TabsMenu
            options={{
                'Single Pane': {
                    tab: { component: SinglePaneIcon },
                    component: LayoutOptions,
                    props: { layoutOption: 'Single Pane' }
                }
            }}
            active="Single Pane"
            on:menuaction={navigateReference}
        />
        <div style:justify-content="space-between" class="flex w-full dy-modal-action">
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <button
                style={convertStyle($s['ui.dialog.button'])}
                class="dy-btn dy-btn-sm dy-btn-ghost dy-no-animation"
                on:click={() => (docSet = $refs.docSet)}
            >
                Cancel
            </button>
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <button
                style={convertStyle($s['ui.dialog.button'])}
                class="dy-btn dy-btn-sm dy-btn-ghost dy-no-animation"
                on:click={() => ($refs.docSet = docSet)}
            >
                Ok
            </button>
        </div>
    </svelte:fragment>
</Modal>
