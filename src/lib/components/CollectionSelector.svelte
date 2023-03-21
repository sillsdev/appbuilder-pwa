<!--
@component
Book Collection Selector component.
-->
<script>
    import Modal from './Modal.svelte';
    import LayoutOptions from './LayoutOptions.svelte';
    import TabsMenu from './TabsMenu.svelte';
    import { refs } from '$lib/data/stores';
    import { onDestroy } from 'svelte';
    import { BibleIcon, SinglePaneIcon, SideBySideIcon, VerseByVerseIcon } from '$lib/icons';

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
        <p>Isn't this cool?</p>
        <div class="dy-modal-action">
            <label for={modalId} class="dy-btn dy-btn-ghost">Very cool</label>
        </div>
    </svelte:fragment>
</Modal>
