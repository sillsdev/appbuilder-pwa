<script lang="ts">
    import '../tailwind.css';
    import Navbar from '$lib/components/Navbar.svelte';
    import Sidebar from '$lib/components/Sidebar.svelte';
    import { HamburgerIcon } from '$lib/icons';
    let reference = { book: 'John', chapter: '1', verse: '1' };
    let drawerName = 'sidebar';
</script>

<Sidebar drawerId={drawerName}>
    <div class="flex flex-col justify-center">
        <Navbar {...reference}>
            <label
                for={drawerName}
                slot="drawer-button"
                class="dy-btn dy-btn-ghost p-1 dy-drawer-button lg:hidden"
            >
                <HamburgerIcon />
            </label>
        </Navbar>
        <main class="p-2 flex-grow container mx-auto overflow-y-auto">
            <slot />
        </main>
    </div>
</Sidebar>
