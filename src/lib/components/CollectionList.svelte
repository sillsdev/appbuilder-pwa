<!--
@component
Custom list of collections for the LayoutOptions menu
-->
<script lang="ts">
    import { themeColors } from '$lib/data/stores';

    const illustrations = import.meta.glob('./*', {
        import: 'default',
        eager: true,
        query: '?url',
        base: '/src/gen-assets/illustrations'
    }) as Record<string, string>;

    //docSets is the array of all selectable docsets. selectedLayouts is the selected docset to highlight
    let {
        docSets = [],
        selectedLayouts,
        menuaction
    }: {
        docSets: App.CollectionEntry[];
        selectedLayouts?: App.CollectionEntry;
        menuaction: ({ collection }: { collection: App.CollectionEntry }) => void;
    } = $props();

    function handleClick(opt: App.CollectionEntry) {
        menuaction({
            collection: opt
        });
    }
</script>

<ul class="max-w-screen-md mx-auto">
    {#each docSets as d}
        <!-- svelte-ignore a11y_missing_attribute -->
        <li>
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <!-- svelte-ignore a11y_interactive_supports_focus -->

            <div
                onclick={() => handleClick(d)}
                style:background-color={selectedLayouts?.id === d.id
                    ? $themeColors['LayoutItemSelectedBackgroundColor']
                    : ''}
                class="flex justify-between layout-item-block rounded-none"
                role="button"
            >
                {#if d.image}
                    <div class="layout-image-block self-start">
                        <img class="layout-image" src={illustrations['./' + d.image]} />
                    </div>
                {/if}
                <div class="layout-text-block">
                    <div class="layout-item-name">
                        {d.name}
                    </div>
                    {#if d.description}
                        <div class="layout-item-description">
                            {d.description}
                        </div>
                    {/if}
                </div>
            </div>
        </li>
    {/each}
</ul>
