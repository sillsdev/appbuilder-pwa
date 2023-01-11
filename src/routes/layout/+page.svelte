<script lang="ts">
    import Navbar from '$lib/components/Navbar.svelte';
    import LayoutOptions from '$lib/components/LayoutOptions.svelte';
    import TabsMenu from '$lib/components/TabsMenu.svelte';
    import { t, refs } from '$lib/data/stores';
    import { SinglePaneIcon, SideBySideIcon, VerseByVerseIcon } from '$lib/icons';

    function navigateReference(e) {
        switch (e.detail.tab) {
            case 'Single Pane':
                $refs = { docSet: e.detail.text };
                break;
            default:
                console.log('Collection navigateReference: Default');
                break;
        }
    }
</script>

<div class="navbar">
    <Navbar>
        <!-- Button to close the drawer/sidebar -->
        <!-- <div slot="left-buttons" /> -->
        <label for="sidebar" slot="center">
            <div class="btn btn-ghost normal-case text-xl">{$t['Menu_Layout']}</div>
        </label>
        <!-- <div slot="right-buttons" /> -->
    </Navbar>
</div>

<div style:margin-left="auto" style:margin-right="auto">
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
</div>
