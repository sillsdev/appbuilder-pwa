<script lang="ts">
    import Sidebar from '$lib/components/Sidebar.svelte';
    import { s } from '$lib/data/stores';
    import { base } from '$app/paths';
    import '$lib/app.css';
</script>

<svelte:head>
    <meta name="theme-color" content={$s['ui.bar.action']['background-color']} />
    <link rel="apple-touch-icon" href="{base}/icons/apple-touch-icon.png" />
</svelte:head>

<Sidebar>
    <slot />
</Sidebar>
