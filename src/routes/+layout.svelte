<script lang="ts">
    import Sidebar from '$lib/components/Sidebar.svelte';
    let drawerName = 'sidebar';
</script>

<Sidebar drawerId={drawerName}>
    <slot />
</Sidebar>


