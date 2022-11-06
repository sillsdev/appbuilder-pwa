<script lang="ts">
    import ColorCard from '$lib/components/ColorCard.svelte';
    import '../../tailwind.css';
    import Navbar from '$lib/components/Navbar.svelte';
    import { HamburgerIcon } from '$lib/icons';
    import { viewMode } from '$lib/data/stores';
    import ScrolledContent from '$lib/components/ScrolledContent.svelte';

    let drawerName = 'sidebar';
    let highlights: App.Highlight[] = [
        {
            id: '7',
            reference: 'John 1:7',
            text: 'The same came as a witness, that he might testify about the light, that all might believe through him.',
            date: '24 May 2022',
            actions: ['View', 'Share', 'Delete'],
            highlight_color: '1'
        },
        {
            id: '6',
            reference: 'John 1:3',
            text: 'All things were made through him. Without him, nothing was made that has been made.',
            date: '22 May 2022',
            actions: ['View', 'Share', 'Delete'],
            highlight_color: '2'
        },
        {
            id: '5',
            reference: 'John 1:7',
            text: 'The same came as a witness, that he might testify about the light, that all might believe through him.',
            date: '24 May 2022',
            actions: ['View', 'Share', 'Delete'],
            highlight_color: '1'
        },
        {
            id: '4',
            reference: 'John 1:3',
            text: 'All things were made through him. Without him, nothing was made that has been made.',
            date: '22 May 2022',
            actions: ['View', 'Share', 'Delete'],
            highlight_color: '2'
        },
        {
            id: '3',
            reference: 'John 1:7',
            text: 'The same came as a witness, that he might testify about the light, that all might believe through him.',
            date: '24 May 2022',
            actions: ['View', 'Share', 'Delete'],
            highlight_color: '1'
        },
        {
            id: '2',
            reference: 'John 1:3',
            text: 'All things were made through him. Without him, nothing was made that has been made.',
            date: '22 May 2022',
            actions: ['View', 'Share', 'Delete'],
            highlight_color: '2'
        },
        {
            id: '1',
            reference: 'John 1:7',
            text: 'The same came as a witness, that he might testify about the light, that all might believe through him.',
            date: '24 May 2022',
            actions: ['View', 'Share', 'Delete'],
            highlight_color: '1'
        },
        {
            id: '0',
            reference: 'John 1:3',
            text: 'All things were made through him. Without him, nothing was made that has been made.',
            date: '22 May 2022',
            actions: ['View', 'Share', 'Delete'],
            highlight_color: '2'
        }
    ];

    function handleMenuaction(event: CustomEvent, id: string) {
        console.log(event.detail.text + '-' + id);
    }
</script>

<div class="navbar">
    <Navbar>
        <!-- Button to close the drawer/sidebar -->
        <label
            for={drawerName}
            slot="drawer-button"
            class="dy-btn dy-btn-ghost p-1 dy-drawer-button {$viewMode === 'Side By Side'
                ? ''
                : 'lg:hidden'}"
        >
            <HamburgerIcon />
        </label>
        <label for={drawerName} slot="left-buttons" />
        <label for={drawerName} slot="center">
            <div class="btn btn-ghost normal-case text-xl">Highlights</div>
        </label>
        <label for={drawerName} slot="right-buttons" />
    </Navbar>
</div>

<ScrolledContent>
    <div class="larger" slot="scrolled-content">
        {#each highlights as h}
            {@const colorCard = {
                reference: h.reference,
                text: h.text,
                date: h.date,
                actions: h.actions,
                highlight_color: h.highlight_color
            }}
            <ColorCard on:menuaction={(e) => handleMenuaction(e, h.id)} {...colorCard} />
        {/each}
    </div>
</ScrolledContent>

<style>
    .navbar {
        height: 10vh;
    }
    .larger {
        height: 90vh;
    }
</style>
