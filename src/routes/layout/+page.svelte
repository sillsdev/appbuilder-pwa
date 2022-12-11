<script>
    import LayoutOptions from '../../lib/components/LayoutOptions.svelte';
    import TabsMenu from '../../lib/components/TabsMenu.svelte';
    import { refs } from '$lib/data/stores';
    import { onDestroy } from 'svelte';
    import { SinglePaneIcon, SideBySideIcon, VerseByVerseIcon } from '$lib/icons';

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
