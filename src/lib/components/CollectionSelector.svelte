<!--
@component
Book Collection Selector component.
-->
<script>
    import Modal from './Modal.svelte';
    import LayoutOptions from './LayoutOptions.svelte';
    import TabsMenu from './TabsMenu.svelte';
    import { convertStyle, refs, s } from '$lib/data/stores';
    import config from '$lib/data/config';
    import { BibleIcon, SinglePaneIcon, SideBySideIcon, VerseByVerseIcon } from '$lib/icons';

    const modalId = 'collectionSelector';
    let docSet = $refs.docSet;

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

<Modal id={modalId}>
    <svelte:fragment slot="label">
        <BibleIcon color="white" />
    </svelte:fragment>
    <svelte:fragment slot="content">
        <div class="min-h-[20rem]">
            <!-- TODO: Include other layout options -->
            {#if config.bookCollections.length === 1}
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
            {:else}
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
                        }
                    }}
                    active="Single Pane"
                    on:menuaction={navigateReference}
                />
            {/if}
            <div
                style:justify-content="space-between"
                class="flex left-0 right-0 bottom-2 absolute px-12"
            >
                <!-- svelte-ignore a11y-click-events-have-key-events -->
                <label
                    for={modalId}
                    style={convertStyle($s['ui.dialog.button'])}
                    class="dy-btn dy-btn-sm dy-btn-ghost dy-no-animation"
                    on:click={() => (docSet = $refs.docSet)}>Cancel</label
                >
                <!-- svelte-ignore a11y-click-events-have-key-events -->
                <label
                    for={modalId}
                    style={convertStyle($s['ui.dialog.button'])}
                    class="dy-btn dy-btn-sm dy-btn-ghost dy-no-animation"
                    on:click={() => ($refs.docSet = docSet)}>Ok</label
                >
            </div>
        </div>
    </svelte:fragment>
</Modal>
