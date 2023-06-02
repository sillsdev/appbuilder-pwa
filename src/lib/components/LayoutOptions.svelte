<!--
@component
Displays the three different layout options.  
TODO:
- functionality...
-->
<script lang="ts">
    import { onDestroy, createEventDispatcher } from 'svelte';
    import SelectList from './SelectList.svelte';
    import Dropdown from './Dropdown.svelte';
    import { DropdownIcon } from '$lib/icons';
    import { catalog } from '$lib/data/catalog';
    import config from '$lib/data/config';
    import { refs, themeColors, s, t, convertStyle } from '$lib/data/stores';

    export let layoutOption = '';
    const dispatch = createEventDispatcher();

    let nextDocSet;

    //const allDocSets = catalog.map((ds) => ds.id);
    const allDocSets = config.bookCollections.map((ds) => ({
        id: ds.languageCode + '_' + ds.id,
        name: ds.collectionName,
        singlePane: ds.features['bc-allow-single-pane'],
        description: ds?.collectionDescription
    }));

    function handleClick(opt) {
        refs.set({ docSet: opt, book: $refs.book, chapter: $refs.chapter });
        nextDocSet = opt;
        dispatch('menuaction', {
            text: opt
        });
    }
</script>

<div class="p-2">
    <!-- Single Pane -->
    {#if layoutOption === 'Single Pane'}
        <p style:color={$themeColors['LayoutTitleColor']}>
            <strong>{$t['Layout_Single_Pane']}</strong>
        </p>
        <ul class="dy-menu dy-menu-compact mx-auto">
            {#each allDocSets.filter((x) => x.singlePane === true) as d}
                <!-- svelte-ignore a11y-missing-attribute -->
                <li>
                    <!-- svelte-ignore a11y-click-events-have-key-events -->
                    <a
                        on:click={() => handleClick(d.id)}
                        style={convertStyle($s['ui.layouts.selector'])}
                        style:background-color={nextDocSet === d.id
                            ? $themeColors['LayoutItemSelectedBackgroundColor']
                            : $themeColors['LayoutBackgroundColor']}
                    >
                        <div class="dy-relative">
                            <div class={convertStyle($s['ui.layouts.title'])}>
                                {d.name}
                            </div>
                            {#if d.description}
                                <div class="text-sm">{d.description}</div>
                            {/if}
                        </div>
                    </a>
                </li>
            {/each}
        </ul>
        <!-- Side by Side -->
        <!-- TODO: Handle clicking and set a ref store to have left and right docset assignments.-->
    {:else if layoutOption === 'Side By Side'}
        <p style:color={$themeColors['LayoutTitleColor']}>
            <strong>{$t['Layout_Two_Pane']}</strong>
        </p>
        <ul class="dy-menu-compact mx-auto">
            <!-- svelte-ignore a11y-missing-attribute -->
            <li>
                <!-- svelte-ignore a11y-click-events-have-key-events -->
                <Dropdown>
                    <svelte:fragment slot="label">
                        <div class="px-3">1.</div>
                        <div class="normal-case">{leftSide.name}</div>
                        <DropdownIcon />
                    </svelte:fragment>
                    <svelte:fragment slot="content">
                      <ul>
                        {#each allDocSets.filter((x) => x.singlePane === true) as d}
                            <!-- svelte-ignore a11y-missing-attribute -->
                            <li>
                                <!-- svelte-ignore a11y-click-events-have-key-events -->
                                <a
                                    on:click={() => handleClick(d.id)}
                                    class={nextDocSet === leftSide.id ? 'dy-active' : ''}
                                    style={convertStyle($s['ui.layouts.selector'])}
                                    style:background-color={nextDocSet === d.id
                                        ? $themeColors['LayoutItemSelectedBackgroundColor']
                                        : $themeColors['LayoutBackgroundColor']}
                                >
                                    <div class="dy-relative">
                                        <div class={convertStyle($s['ui.layouts.title'])}>
                                            {d.name}
                                        </div>
                                        {#if d.description}
                                            <div class="text-sm">{d.description}</div>
                                        {/if}
                                    </div>
                                </a>
                            </li>
                        {/each}
                    </ul>
                    </svelte:fragment>
                </Dropdown>
            </li>
            <li>
                <!-- svelte-ignore a11y-click-events-have-key-events -->
                <Dropdown>
                    <svelte:fragment slot="label">
                        <div class="px-3">2.</div>
                        <div class="normal-case">{rightSide.name}</div>
                        <DropdownIcon />
                    </svelte:fragment>
                    <svelte:fragment slot="content">
                        <ul>
                          {#each allDocSets.filter((x) => x.singlePane === true) as d}
                              <!-- svelte-ignore a11y-missing-attribute -->
                              <li>
                                  <!-- svelte-ignore a11y-click-events-have-key-events -->
                                  <a
                                      on:click={() => handleClick(d.id)}
                                      class={nextDocSet === rightSide.id ? 'dy-active' : ''}
                                      style={convertStyle($s['ui.layouts.selector'])}
                                      style:background-color={nextDocSet === d.id
                                          ? $themeColors['LayoutItemSelectedBackgroundColor']
                                          : $themeColors['LayoutBackgroundColor']}
                                  >
                                      <div class="dy-relative">
                                          <div class={convertStyle($s['ui.layouts.title'])}>
                                              {d.name}
                                          </div>
                                          {#if d.description}
                                              <div class="text-sm">{d.description}</div>
                                          {/if}
                                      </div>
                                  </a>
                              </li>
                          {/each}
                      </ul>
                    </svelte:fragment>
                </Dropdown>
            </li>
        </ul>
        <!-- Verse By Verse -->
    {:else if layoutOption === 'Verse By Verse'}
        <p style:color={$themeColors['LayoutTitleColor']}>
            <strong>{$t['Layout_Interlinear']}</strong>
        </p>
        <ul class="dy-menu mx-auto" />
    {/if}
</div>

<style>
    a {
        display: flex;
        justify-content: space-between;
    }
</style>
