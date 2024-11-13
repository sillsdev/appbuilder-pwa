<script lang="ts">
    import { t } from '$lib/data/stores';
    import Navbar from '$lib/components/Navbar.svelte';
    import LexiconReversalView from '$lib/components/LexiconReversalView.svelte';
    import { page } from '$app/stores';

    const { alphabet, initialReversalData } = $page.data;
    let activeTab = 'main';
</script>

<div class="grid grid-rows-[auto,auto,1fr]" style="height:100vh;height:100dvh;">
    <Navbar>
        <label for="sidebar" slot="center">
            <div class="btn btn-ghost normal-case text-xl">{$t['Menu_Dictionary']}</div>
        </label>
    </Navbar>

    <div class="tabs w-full">
        <button
            class="tab tab-bordered flex-1 {activeTab === 'main' ? 'tab-active' : ''}"
            on:click={() => (activeTab = 'main')}
        >
            {$t['Dictionary_Main']}
        </button>
        <button
            class="tab tab-bordered flex-1 {activeTab === 'reversal' ? 'tab-active' : ''}"
            on:click={() => (activeTab = 'reversal')}
        >
            {$t['Dictionary_Reversal']}
        </button>
    </div>

    <div class="overflow-y-auto">
        {#if activeTab === 'main'}
            <!-- Your existing lexicon view here -->
        {:else}
            <LexiconReversalView {alphabet} initialData={initialReversalData} />
        {/if}
    </div>
</div>
