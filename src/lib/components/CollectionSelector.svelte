<!--
@component
The navbar component.
-->
<script>
    import Dropdown from './Dropdown.svelte';
    import LayoutOptions from './LayoutOptions.svelte';
    import TabsMenu from './TabsMenu.svelte';
    import { refs } from '$lib/data/stores';
    import { onDestroy } from 'svelte';
    import { DropdownIcon, SinglePaneIcon, SideBySideIcon, VerseByVerseIcon } from '$lib/icons';

    let nextRef;
    const unsub = refs.subscribe((v) => {
        nextRef = v;
    }, 'next');
     /**
     * Pushes reference changes to refs['next']. Pushes final change to default reference.
     */
    function navigateReference(e) {
        switch( e.detail.tab ) {
            case ('Single Pane'):
                $refs = { docSet: e.detail.text };
                // force closes active dropdown elements
                document.activeElement.blur();
                break;
            default:
                console.log("Collection navigateReference: Default");
                break;
        }
    }

    onDestroy(unsub);
</script>
<Dropdown>
    <svelte:fragment slot="label">{nextRef.docSet} <DropdownIcon /></svelte:fragment>
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
    </svelte:fragment>
</Dropdown>