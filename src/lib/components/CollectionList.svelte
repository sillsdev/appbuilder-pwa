<!--
@component
Custom list of collections for the LayoutOptions menu
-->
<script lang="ts">
    import { base } from '$app/paths';
    import { convertStyle, s, themeColors } from '$lib/data/stores';

    //docSets is the array of all selectable docsets. selectedLayouts is the selected docset to highlight
    let {
        docSets = [],
        selectedLayouts,
        menuaction
    }: {
        docSets: App.CollectionEntry[];
        selectedLayouts: App.CollectionEntry;
        menuaction;
    } = $props();

    function handleClick(opt: App.CollectionEntry) {
        menuaction({
            collection: opt
        });
    }
</script>

<ul class="dy-menu dy-menu-compact">
    {#each docSets as d}
        <!-- svelte-ignore a11y_missing_attribute -->
        <li>
            <!-- svelte-ignore a11y_click_events_have_key_events -->
            <!-- svelte-ignore a11y_interactive_supports_focus -->
            <a
                onclick={() => handleClick(d)}
                style:background-color={selectedLayouts.id === d.id
                    ? $themeColors['LayoutItemSelectedBackgroundColor']
                    : ''}
                class="flex justify-between"
                role="button"
            >
                <div class="layout-item-block">
                    {#if d.image}
                        <div class="layout-image-block" style="width:15%">
                            <img class="layout-image" src="{base}/illustrations/{d.image}" />
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
            </a>
        </li>
    {/each}
</ul>
