<script lang="ts">
    import Sidebar from '$lib/components/Sidebar.svelte';
    import { s, refs, theme } from '$lib/data/stores';
    import { base } from '$app/paths';
    import '$lib/app.css';
    function updateBodyTheme(theme) {
        document.querySelector('body').setAttribute('data-color-theme', theme);
    }
    $: updateBodyTheme($theme);
</script>

<svelte:head>
    <meta name="theme-color" content={$s['ui.bar.action']['background-color']} />
    <link rel="stylesheet" href="{base}/styles/sab-app.css" />
    <link rel="stylesheet" href="{base}/styles/sab-bc-{$refs.collection}.css" />
    <link rel="stylesheet" href="{base}/override-sab.css" />
</svelte:head>
<Sidebar>
    <slot />
</Sidebar>
