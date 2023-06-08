<!--
@component
Displays the three different layout options.  
TODO:
- functionality...
-->
<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import Dropdown from './Dropdown.svelte';
    import { DropdownIcon } from '$lib/icons';
    import config from '$lib/data/config';
    import { refs, themeColors, s, t, convertStyle } from '$lib/data/stores';
    import CollectionList from './CollectionList.svelte';

    export let layoutOption = '';
    const dispatch = createEventDispatcher();

    let allDocSets = config.bookCollections.map((ds) => ({
        id: ds.languageCode + '_' + ds.id,
        name: ds.collectionName,
        singlePane: ds.features['bc-allow-single-pane'],
        description: ds?.collectionDescription
    }));

    function handleClick(opt) {
        refs.set({ docSet: opt, book: $refs.book, chapter: $refs.chapter });
        nextDocSet = opt;
        dispatch('menuaction', {
            text: selectedDocSets[0].id
        });
    }

    function handleLeft(opt) {
        selectedDocSets[0] = opt.detail.collection;
        if (selectedDocSets[1] === selectedDocSets[0]) {
            selectedDocSets[1] = allDocSets.filter((x) => x.id != selectedDocSets[0].id)[0];
        }
        (document.activeElement as HTMLElement).blur();
    }

    function handleRight(opt) {
        selectedDocSets[1] = opt.detail.collection;
        if (selectedDocSets[0] === selectedDocSets[1]) {
            selectedDocSets[0] = allDocSets.filter((x) => x.id != selectedDocSets[1].id)[0];
        }
        (document.activeElement as HTMLElement).blur();
    }
</script>

<div>
    <!-- Single Pane -->
    {#if layoutOption === 'Single Pane'}
        <p class="py-2" style={convertStyle($s['ui.layouts.selector'])}>
            {$t['Layout_Single_Pane']}
        </p>
        <CollectionList
            docSets={allDocSets.filter((x) => x.singlePane === true)}
            nextDocSet={selectedDocSets[0]}
            on:menuaction={handleSinglePane}
        />
        <!-- Side by Side -->
    {:else if layoutOption === 'Side By Side'}
        <p class="py-2" style:color={$themeColors['LayoutTitleColor']}>
            {$t['Layout_Two_Pane']}
        </p>
        <ul class="dy-menu-compact mx-auto">
            <!-- svelte-ignore a11y-missing-attribute -->
            <li>
                <!-- svelte-ignore a11y-click-events-have-key-events -->
                <Dropdown>
                    <svelte:fragment slot="label">
                        <div class="px-3" style={convertStyle($s['ui.layouts.number'])}>1.</div>
                        <div class="dy-relative font-normal normal-case text-left">
                            <div style={convertStyle($s['ui.layouts.title'])}>
                                {selectedDocSets[0].name}
                            </div>
                            {#if selectedDocSets[0].description}
                                <div
                                    class="text-sm"
                                    style={convertStyle($s['ui.layouts.selector'])}
                                >
                                    {selectedDocSets[0].description}
                                </div>
                            {/if}
                        </div>
                        <div class="px-3">
                            <DropdownIcon color={$s['ui.layouts.selector'].color} />
                        </div>
                    </svelte:fragment>
                    <svelte:fragment slot="content">
                        <CollectionList
                            docSets={allDocSets}
                            nextDocSet={selectedDocSets[0]}
                            on:menuaction={handleLeft}
                        />
                    </svelte:fragment>
                </Dropdown>
            </li>
            <li>
                <!-- svelte-ignore a11y-click-events-have-key-events -->
                <Dropdown>
                    <svelte:fragment slot="label">
                        <div class="px-3" style={convertStyle($s['ui.layouts.number'])}>2.</div>
                        <div
                            class="dy-relative font-normal normal-case text-left"
                            style={$s['ui.layouts.selector']}
                        >
                            <div style={convertStyle($s['ui.layouts.title'])}>
                                {selectedDocSets[1].name}
                            </div>
                            {#if selectedDocSets[1].description}
                                <div
                                    class="text-sm"
                                    style={convertStyle($s['ui.layouts.selector'])}
                                >
                                    {selectedDocSets[1].description}
                                </div>
                            {/if}
                        </div>
                        <div class="px-3">
                            <DropdownIcon color={$s['ui.layouts.selector'].color} />
                        </div>
                    </svelte:fragment>
                    <svelte:fragment slot="content">
                        <CollectionList
                            docSets={allDocSets}
                            nextDocSet={selectedDocSets[1]}
                            on:menuaction={handleRight}
                        />
                    </svelte:fragment>
                </Dropdown>
            </li>
        </ul>
        <!-- Verse By Verse -->
    {:else if layoutOption === 'Verse By Verse'}
        <p class="py-2" style:color={$themeColors['LayoutTitleColor']}>
            {$t['Layout_Interlinear']}
        </p>
        <ul class="dy-menu-compact mx-auto">
          <!-- svelte-ignore a11y-missing-attribute -->
          <li>
              <!-- svelte-ignore a11y-click-events-have-key-events -->
              <Dropdown>
                  <svelte:fragment slot="label">
                      <div class="px-3" style={convertStyle($s['ui.layouts.number'])}>1.</div>
                      <div class="dy-relative font-normal normal-case text-left">
                          <div style={convertStyle($s['ui.layouts.title'])}>
                              {selectedDocSets[0].name}
                          </div>
                          {#if selectedDocSets[0].description}
                              <div
                                  class="text-sm"
                                  style={convertStyle($s['ui.layouts.selector'])}
                              >
                                  {selectedDocSets[0].description}
                              </div>
                          {/if}
                      </div>
                      <div class="px-3">
                          <DropdownIcon color={$s['ui.layouts.selector'].color} />
                      </div>
                  </svelte:fragment>
                  <svelte:fragment slot="content">
                      <CollectionList
                          docSets={allDocSets}
                          nextDocSet={selectedDocSets[0]}
                          on:menuaction={handleLeft}
                      />
                  </svelte:fragment>
              </Dropdown>
          </li>
          <li>
              <!-- svelte-ignore a11y-click-events-have-key-events -->
              <Dropdown>
                  <svelte:fragment slot="label">
                      <div class="px-3" style={convertStyle($s['ui.layouts.number'])}>2.</div>
                      <div
                          class="dy-relative font-normal normal-case text-left"
                          style={$s['ui.layouts.selector']}
                      >
                          <div style={convertStyle($s['ui.layouts.title'])}>
                              {selectedDocSets[1].name}
                          </div>
                          {#if selectedDocSets[1].description}
                              <div
                                  class="text-sm"
                                  style={convertStyle($s['ui.layouts.selector'])}
                              >
                                  {selectedDocSets[1].description}
                              </div>
                          {/if}
                      </div>
                      <div class="px-3">
                          <DropdownIcon color={$s['ui.layouts.selector'].color} />
                      </div>
                  </svelte:fragment>
                  <svelte:fragment slot="content">
                      <CollectionList
                          docSets={allDocSets}
                          nextDocSet={selectedDocSets[1]}
                          on:menuaction={handleRight}
                      />
                  </svelte:fragment>
              </Dropdown>
          </li>
          <li>
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <Dropdown>
                <svelte:fragment slot="label">
                    <div class="px-3" style={convertStyle($s['ui.layouts.number'])}>3.</div>
                    <div
                        class="dy-relative font-normal normal-case text-left"
                        style={$s['ui.layouts.selector']}
                    >
                        <div style={convertStyle($s['ui.layouts.title'])}>
                            {selectedDocSets[1].name}
                        </div>
                        {#if selectedDocSets[1].description}
                            <div
                                class="text-sm"
                                style={convertStyle($s['ui.layouts.selector'])}
                            >
                                {selectedDocSets[1].description}
                            </div>
                        {/if}
                    </div>
                    <div class="px-3">
                        <DropdownIcon color={$s['ui.layouts.selector'].color} />
                    </div>
                </svelte:fragment>
                <svelte:fragment slot="content">
                    <CollectionList
                        docSets={allDocSets}
                        nextDocSet={selectedDocSets[1]}
                        on:menuaction={handleRight}
                    />
                </svelte:fragment>
            </Dropdown>
        </li>
      </ul>
    {/if}
</div>
