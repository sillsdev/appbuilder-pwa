<!-- Icon Gallery for Development -->
<script lang="ts">
    import { dev } from '$app/environment';
    import { goto } from '$app/navigation';
    import { onMount } from 'svelte';

    // Redirect to home if not in development mode
    if (!dev) {
        goto('/');
    }

    // Automatically import all icon components using Vite's import.meta.glob
    const iconModules = import.meta.glob('$lib/icons/**/*.svelte', { eager: true });

    let icons: Array<{ name: string; path: string; component: any }> = [];
    let groupedIcons: { [folder: string]: Array<{ name: string; path: string; component: any }> } =
        {};

    onMount(() => {
        // Process the imported modules
        icons = Object.entries(iconModules)
            .map(([path, module]) => {
                // Extract the icon name from the file path
                const pathParts = path.split('/');
                const fileName = pathParts[pathParts.length - 1];
                const name = fileName.replace('.svelte', '');

                // Get relative path for display (remove the $lib/icons/ part)
                const relativePath = path.replace(/.*\/icons\//, '');

                return {
                    name,
                    path: relativePath,
                    component: (module as any).default
                };
            })
            .sort((a, b) => a.name.localeCompare(b.name));

        // Group icons by folder
        groupedIcons = {};
        icons.forEach((icon) => {
            const folder = icon.path.includes('/') ? icon.path.split('/')[0] : 'Root Icons';
            if (!groupedIcons[folder]) {
                groupedIcons[folder] = [];
            }
            groupedIcons[folder].push(icon);
        });
    });

    let selectedSize = '24';
    let selectedColor = '#000000';
    const sizes = ['16', '20', '24', '32', '48', '64'];
    const colors = ['#000000', '#ffffff', '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'];
</script>

<svelte:head>
    <title>Icon Gallery - Development</title>
</svelte:head>

{#if dev}
    <div class="p-6 max-w-screen-lg mx-auto">
        <h1 class="text-3xl font-bold mb-6">SVG Icon Gallery</h1>

        <div class="mb-6 flex gap-4 items-center flex-wrap">
            <div class="flex items-center gap-2">
                <label for="size-select" class="font-medium">Size:</label>
                <select id="size-select" bind:value={selectedSize} class="border rounded px-2 py-1">
                    {#each sizes as size}
                        <option value={size}>{size}px</option>
                    {/each}
                </select>
            </div>

            <div class="flex items-center gap-2">
                <label for="color-input" class="font-medium">Color:</label>
                <input
                    id="color-input"
                    type="color"
                    bind:value={selectedColor}
                    class="w-8 h-8 border rounded cursor-pointer"
                />
                <span class="text-sm text-gray-600">{selectedColor}</span>
            </div>
        </div>

        {#each Object.entries(groupedIcons) as [folder, folderIcons]}
            <div class="mb-8">
                <h2 class="text-xl font-semibold mb-4 pb-2 border-b border-gray-300">
                    {folder}
                    <span class="text-sm text-gray-500 font-normal ml-2"
                        >({folderIcons.length} icons)</span
                    >
                </h2>

                <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {#each folderIcons as icon}
                        <div
                            class="flex flex-col items-center p-4 border rounded-lg hover:bg-gray-50 transition-colors min-w-[250]"
                        >
                            <div
                                class="flex items-center justify-center w-16 h-16 mb-2 bg-white border rounded"
                            >
                                <svelte:component
                                    this={icon.component}
                                    size={selectedSize}
                                    color={selectedColor}
                                />
                            </div>
                            <span class="text-sm text-center font-mono break-all">{icon.name}</span>
                            <span class="text-xs text-gray-500 text-center mt-1">{icon.path}</span>
                        </div>
                    {/each}
                </div>
            </div>
        {/each}

        <div class="mt-8 p-4 bg-gray-100 rounded-lg">
            <h3 class="font-bold mb-2">Usage Example:</h3>
            <pre class="text-sm bg-white p-2 rounded border"><code
                    >&lt;PlayIcon size="{selectedSize}" color="{selectedColor}" /&gt;</code
                ></pre>
            <div class="mt-2 text-sm text-gray-600">
                <strong>Total Icons:</strong>
                {icons.length}
            </div>
        </div>
    </div>
{:else}
    <div class="flex items-center justify-center min-h-screen">
        <div class="text-center">
            <h1 class="text-2xl font-bold text-gray-600">Development Tool</h1>
            <p class="text-gray-500 mt-2">This page is only available in development mode.</p>
        </div>
    </div>
{/if}

<style>
    :global(body) {
        background-color: #f9fafb;
    }
</style>
